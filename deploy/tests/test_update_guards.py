import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


DEPLOY = Path(__file__).resolve().parents[1]
NODE = shutil.which("node")


@unittest.skipUnless(NODE, "Node.js is required")
class UpdateGuardTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.addCleanup(self.temporary.cleanup)
        self.release = self.root / "releases/new"
        self.release.mkdir(parents=True)
        (self.root / "shared").mkdir()
        runtime = json.loads(subprocess.check_output([
            NODE, "-p", "JSON.stringify({platform:process.platform,arch:process.arch,nodeMajor:process.versions.node.split('.')[0]})",
        ], text=True))
        (self.release / "release.json").write_text(json.dumps(runtime))
        (self.root / "shared/app.env").write_text(
            "DATABASE_URL=file:/srv/promformatech/shared/database/site.sqlite\n"
            "MEDIA_ROOT=/srv/promformatech/shared/media\n"
        )
        update = (DEPLOY / "update.sh").read_text()
        update = update.replace(
            "source /usr/local/lib/promformatech/maintenance.sh",
            f'source "{DEPLOY / "maintenance.sh"}"\n'
            f'ROOT="{self.root}"\nSHARED="$ROOT/shared"\n'
            'ENV_FILE="$SHARED/app.env"\nrequire_root() { :; }',
        ).replace("/usr/bin/node", NODE)
        if os.uname().sysname == "Darwin":
            update = update.replace("realpath -e", "realpath")
        self.script = self.root / "update.sh"
        self.script.write_text(update)

    def run_update(self):
        return subprocess.run(
            ["bash", str(self.script), str(self.release)],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_missing_database_fails_before_services_are_stopped(self):
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Database is missing", result.stderr)

    def test_stale_next_link_fails_before_migration(self):
        os.symlink("missing", self.root / "current.next")
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("left current.next", result.stderr)

    def test_broken_current_link_fails_closed(self):
        os.symlink("missing", self.root / "current")
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("current release link is broken", result.stderr)


if __name__ == "__main__":
    unittest.main()
