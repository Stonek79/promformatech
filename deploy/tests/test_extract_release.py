import io
import importlib.util
import json
import subprocess
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "extract-release.py"
REVISION = "a" * 40


def add_file(archive, name, content):
    data = content.encode()
    entry = tarfile.TarInfo(name)
    entry.size = len(data)
    archive.addfile(entry, io.BytesIO(data))


class ExtractReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.archive = self.root / "release.tar.gz"
        self.output = self.root / "output"
        self.output.mkdir()
        self.addCleanup(self.temporary.cleanup)

    def run_extractor(self):
        return subprocess.run(
            ["python3", str(SCRIPT), str(self.archive), str(self.output), REVISION],
            capture_output=True,
            text=True,
            check=False,
        )

    def create_archive(self, revision=REVISION, extra=None):
        with tarfile.open(self.archive, "w:gz") as archive:
            add_file(archive, "release.json", json.dumps({"revision": revision}))
            add_file(archive, "server.js", "ok")
            if extra is not None:
                add_file(archive, extra, "unsafe")

    def test_extracts_matching_release(self):
        self.create_archive()
        self.assertEqual(self.run_extractor().returncode, 0)
        self.assertEqual((self.output / "server.js").read_text(), "ok")

    def test_rejects_wrong_revision(self):
        self.create_archive(revision="b" * 40)
        result = self.run_extractor()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("revision does not match", result.stderr)

    def test_rejects_path_traversal(self):
        self.create_archive(extra="../escaped")
        self.assertNotEqual(self.run_extractor().returncode, 0)
        self.assertFalse((self.root / "escaped").exists())

    def test_rejects_symlink_outside_release(self):
        with tarfile.open(self.archive, "w:gz") as archive:
            add_file(archive, "release.json", json.dumps({"revision": REVISION}))
            add_file(archive, "server.js", "ok")
            entry = tarfile.TarInfo("dangerous-link")
            entry.type = tarfile.SYMTYPE
            entry.linkname = "../../outside"
            archive.addfile(entry)
        self.assertNotEqual(self.run_extractor().returncode, 0)

    def test_allows_symlink_inside_release(self):
        with tarfile.open(self.archive, "w:gz") as archive:
            add_file(archive, "release.json", json.dumps({"revision": REVISION}))
            add_file(archive, "server.js", "ok")
            entry = tarfile.TarInfo("local-link")
            entry.type = tarfile.SYMTYPE
            entry.linkname = "server.js"
            archive.addfile(entry)
        self.assertEqual(self.run_extractor().returncode, 0)
        self.assertEqual((self.output / "local-link").read_text(), "ok")

    def test_rejects_release_exceeding_extraction_limit(self):
        self.create_archive()
        spec = importlib.util.spec_from_file_location("extract_release", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with patch.object(module, "MAXIMUM_UNPACKED_BYTES", 1):
            with patch.object(sys, "argv", [str(SCRIPT), str(self.archive), str(self.output), REVISION]):
                with self.assertRaisesRegex(ValueError, "exceeds extraction limits"):
                    module.main()
        self.assertFalse((self.output / "server.js").exists())


if __name__ == "__main__":
    unittest.main()
