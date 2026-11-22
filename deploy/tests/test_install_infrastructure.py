import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


DEPLOY = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("installer", DEPLOY / "install-infrastructure.py")
INSTALLER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALLER)


class InstallInfrastructureTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.source, self.library, self.systemd = (
            self.root / part for part in ("source", "library", "systemd")
        )
        for directory in (self.source, self.library, self.systemd):
            directory.mkdir()
        self.git("init", "--quiet", "--initial-branch=main")
        self.git("config", "user.name", "Test")
        self.git("config", "user.email", "test@example.test")
        self.git("config", "gpg.format", "ssh")
        self.scripts = (
            "backup.sh", "deploy-gateway.sh", "extract-release.py", "maintenance.sh",
            "receive-release.sh", "update.sh",
        )
        for name in self.scripts:
            self.copy_fixture(DEPLOY / name, self.source / "deploy" / name, self.library / name, 0o755)
        for file in (DEPLOY / "systemd").iterdir():
            self.copy_fixture(file, self.source / "deploy/systemd" / file.name, self.systemd / file.name, 0o644)
        self.key = self.generate_key("author")
        signers = self.root / "signers"
        signers.write_text('maintainer namespaces="git" ' + self.key.with_suffix(".pub").read_text())
        paths = patch.multiple(
            INSTALLER,
            REPOSITORY=self.source.as_uri(),
            ALLOWED_SIGNERS=signers,
            LIBRARY=self.library,
            SYSTEMD=self.systemd,
        )
        paths.start()
        self.addCleanup(paths.stop)
        self.systemd_calls = []
        self.reload_failure = False
        original_run = INSTALLER.run

        def run(*args, **kwargs):
            if args[0] in ("systemctl", "systemd-analyze"):
                self.systemd_calls.append(args[:2])
                if args[0] == "systemctl" and self.reload_failure:
                    self.reload_failure = False
                    raise subprocess.CalledProcessError(1, args)
                return None
            return original_run(*args, **kwargs)

        runner = patch.object(INSTALLER, "run", side_effect=run)
        runner.start()
        self.addCleanup(runner.stop)
        self.initial = self.commit()

    def copy_fixture(self, template, source, installed, mode):
        source.parent.mkdir(parents=True, exist_ok=True)
        data = template.read_bytes()
        source.write_bytes(data)
        installed.write_bytes(data)
        installed.chmod(mode)

    def git(self, *args):
        # Use the system Git, which also runs inside the installer.
        return subprocess.check_output(["/usr/bin/git", "-C", self.source, *args], text=True).strip()

    def generate_key(self, name):
        key = self.root / name
        subprocess.run(["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-f", key], check=True)
        return key

    def commit(self, key=None):
        self.git("add", "deploy")
        options = ("-c", f"user.signingkey={key}", "commit", "-S") if key else ("commit", "--no-gpg-sign")
        self.git(*options, "--quiet", "-m", "Fixture change")
        return self.git("rev-parse", "HEAD")

    def apply(self, revision):
        with tempfile.TemporaryDirectory(dir=self.root) as folder:
            stage = Path(folder)
            git = INSTALLER.stage_commit(stage, revision)
            INSTALLER.apply_revision(stage, git, revision)

    def edit(self, relative):
        file = self.source / "deploy" / relative
        before = file.read_bytes()
        after = before + b"\n# changed\n"
        file.write_bytes(after)
        return before, after

    def test_signed_scripts_and_units_install_and_reload_once(self):
        _, script = self.edit("backup.sh")
        _, unit = self.edit("systemd/promformatech-backup.timer")
        revision = self.commit(self.key)
        self.apply(revision)
        self.apply(revision)
        self.assertEqual((self.library / "backup.sh").read_bytes(), script)
        self.assertEqual((self.systemd / "promformatech-backup.timer").read_bytes(), unit)
        self.assertEqual(self.systemd_calls, [("systemd-analyze", "verify"), ("systemctl", "daemon-reload")])

    def test_unsigned_unchanged_files_require_no_installation(self):
        self.apply(self.initial)
        self.assertEqual(self.systemd_calls, [])

    def test_unsigned_or_untrusted_changes_keep_installed_script(self):
        before, _ = self.edit("update.sh")
        for key in (None, self.generate_key("stranger")):
            if key:
                self.edit("update.sh")
            with self.subTest(key=key), self.assertRaises(subprocess.CalledProcessError):
                self.apply(self.commit(key))
            self.assertEqual((self.library / "update.sh").read_bytes(), before)

    def test_stale_revision_and_symlink_are_rejected(self):
        script = self.source / "deploy/update.sh"
        installed = (self.library / script.name).read_bytes()
        script.unlink()
        script.symlink_to("backup.sh")
        revision = self.commit(self.key)
        with self.assertRaisesRegex(ValueError, "tip of main"):
            self.apply(self.initial)
        with self.assertRaisesRegex(ValueError, "regular Git file"):
            self.apply(revision)
        self.assertEqual((self.library / script.name).read_bytes(), installed)

    def test_failed_unit_reload_restores_script_and_unit(self):
        before, _ = self.edit("update.sh")
        unit_before, _ = self.edit("systemd/promformatech-backup.timer")
        self.reload_failure = True
        with self.assertRaises(subprocess.CalledProcessError):
            self.apply(self.commit(self.key))
        self.assertEqual((self.library / "update.sh").read_bytes(), before)
        self.assertEqual((self.systemd / "promformatech-backup.timer").read_bytes(), unit_before)
        self.assertEqual(self.systemd_calls.count(("systemctl", "daemon-reload")), 2)


if __name__ == "__main__":
    unittest.main()
