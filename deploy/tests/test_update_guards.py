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
            'ENV_FILE="$SHARED/app.env"\nrequire_root() { :; }\n'
            'runuser() { shift 3; [[ $3 != */ops/migrate.mjs ]] && "$@"; }\n'
            'backup_ready() { echo "Backup preflight reached" >&2; return 1; }',
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

    def test_unreadable_migrator_fails_before_backup_and_service_changes(self):
        database = self.root / "shared/database/site.sqlite"
        database.parent.mkdir()
        database.touch()
        (self.release / "server.js").touch()
        (self.release / "ops").mkdir()
        (self.release / "ops/migrate.mjs").touch()
        (self.release / "ops/worker.mjs").touch()

        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Release entry is not readable by promformatech: ops/migrate.mjs", result.stderr)
        self.assertNotIn("Backup preflight reached", result.stderr)

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
