import os
import shutil
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path


MAINTENANCE = Path(__file__).resolve().parents[1] / "maintenance.sh"


@unittest.skipUnless(shutil.which("sqlite3"), "sqlite3 CLI is required")
class BackupSnapshotTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.addCleanup(self.temporary.cleanup)
        (self.root / "shared/database").mkdir(parents=True)
        (self.root / "shared/media").mkdir()
        (self.root / "backups/restic").mkdir(parents=True)
        (self.root / "backups/restic/config").write_text("test")
        (self.root / "password").write_text("test")
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.log = self.root / "restic-arguments"
        stub = self.bin / "restic"
        stub.write_text(
            '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$TEST_LOG"\n'
            'exit "${TEST_RESTIC_STATUS:-0}"\n'
        )
        stub.chmod(0o755)
        database = sqlite3.connect(self.root / "shared/database/site.sqlite")
        database.execute("CREATE TABLE content (title TEXT)")
        database.execute("INSERT INTO content VALUES ('test')")
        database.commit()
        database.close()

    def run_snapshot(self, restic_status="0"):
        environment = {
            **os.environ,
            "PATH": f"{self.bin}:{os.environ['PATH']}",
            "TEST_LOG": str(self.log),
            "TEST_RESTIC_STATUS": restic_status,
        }
        return subprocess.run(
            [
                "bash", "-c",
                'source "$1"; ROOT="$2"; SHARED="$ROOT/shared"; '
                'BACKUP_REPOSITORY="$ROOT/backups/restic"; '
                'BACKUP_PASSWORD_FILE="$ROOT/password"; '
                'BACKUP_STAGING="$ROOT/backup-staging"; snapshot',
                "bash", str(MAINTENANCE), str(self.root),
            ],
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_backs_up_database_and_media_without_code(self):
        result = self.run_snapshot()
        self.assertEqual(result.returncode, 0, result.stderr)
        arguments = self.log.read_text().splitlines()
        self.assertIn(str(self.root / "backup-staging/site.sqlite"), arguments)
        self.assertIn(str(self.root / "shared/media"), arguments)
        self.assertNotIn(str(self.root / "shared/app.env"), arguments)
        self.assertFalse((self.root / "backup-staging/site.sqlite").exists())

    def test_fails_closed_when_backup_fails(self):
        result = self.run_snapshot(restic_status="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / "backup-staging/site.sqlite").exists())
        self.assertTrue((self.root / "shared/database/site.sqlite").exists())


if __name__ == "__main__":
    unittest.main()
