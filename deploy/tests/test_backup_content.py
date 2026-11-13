import os
import shutil
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path


MAINTENANCE = Path(__file__).resolve().parents[1] / "maintenance.sh"


@unittest.skipUnless(shutil.which("sqlite3"), "sqlite3 CLI is required")
class BackupContentTests(unittest.TestCase):
    def test_snapshot_contains_database_and_media_at_backup_time(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "shared/database").mkdir(parents=True)
            (root / "shared/media").mkdir()
            (root / "shared/media/photo.txt").write_text("photograph")
            (root / "backups/restic").mkdir(parents=True)
            (root / "backups/restic/config").write_text("test")
            (root / "password").write_text("test")
            (root / "bin").mkdir()
            stub = root / "bin/restic"
            stub.write_text(
                '#!/usr/bin/env bash\nset -e\n'
                'test "$(sqlite3 -readonly "$TEST_ROOT/backup-staging/site.sqlite" '
                "'SELECT title FROM content')\" = 'saved'\n"
                'test "$(cat "$TEST_ROOT/shared/media/photo.txt")" = photograph\n'
            )
            stub.chmod(0o755)
            database = sqlite3.connect(root / "shared/database/site.sqlite")
            database.execute("CREATE TABLE content (title TEXT)")
            database.execute("INSERT INTO content VALUES ('saved')")
            database.commit()
            database.close()
            environment = {
                **os.environ,
                "TEST_ROOT": str(root),
                "PATH": f"{root / 'bin'}:{os.environ['PATH']}",
            }
            result = subprocess.run(
                [
                    "bash", "-c",
                    'source "$1"; ROOT="$2"; SHARED="$ROOT/shared"; '
                    'BACKUP_REPOSITORY="$ROOT/backups/restic"; '
                    'BACKUP_PASSWORD_FILE="$ROOT/password"; '
                    'BACKUP_STAGING="$ROOT/backup-staging"; snapshot',
                    "bash", str(MAINTENANCE), str(root),
                ],
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
