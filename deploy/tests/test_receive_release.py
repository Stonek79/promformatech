import os
import subprocess
import tempfile
import unittest
from pathlib import Path


RECEIVER = Path(__file__).resolve().parents[1] / "receive-release.sh"


@unittest.skipUnless(os.uname().sysname == "Linux", "Requires GNU df")
class ReceiveReleaseTests(unittest.TestCase):
    def test_reads_archive_after_checking_disk_space(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            releases = root / "releases"
            releases.mkdir()
            script = RECEIVER.read_text()
            # Use a fixture root and stop at checksum verification, before extracting.
            script = script.replace("$EUID -eq 0 && ", "", 1)
            script = script.replace("root=/srv/promformatech", f"root='{root}'", 1)
            script = script.replace(
                "minimum_free_bytes=$((2 * 1024 * 1024 * 1024))",
                "minimum_free_bytes=1",
                1,
            )
            receiver = root / "receive-release.sh"
            receiver.write_text(script)

            result = subprocess.run(
                ["bash", str(receiver), "a" * 40, "123", "1", "b" * 64],
                input="fixture with intentionally incorrect checksum",
                capture_output=True,
                text=True,
                env={**os.environ, "LC_ALL": "C"},
                check=False,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("archive.tar.gz: FAILED", result.stdout)
            self.assertEqual(list(releases.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
