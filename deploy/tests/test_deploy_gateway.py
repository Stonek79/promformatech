import os
import subprocess
import tempfile
import unittest
from pathlib import Path


GATEWAY = Path(__file__).resolve().parents[1] / "deploy-gateway.sh"


class DeployGatewayTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.addCleanup(self.temporary.cleanup)
        sudo = self.root / "sudo"
        sudo.write_text('#!/usr/bin/env bash\nprintf "%s\\n" "$@"\ncat\n')
        sudo.chmod(0o755)

    def run_gateway(self, command):
        environment = {
            **os.environ,
            "SSH_ORIGINAL_COMMAND": command,
            "PATH": f"{self.root}:{os.environ['PATH']}",
        }
        return subprocess.run(
            ["bash", str(GATEWAY)],
            input="archive contents",
            capture_output=True,
            text=True,
            env=environment,
            check=False,
        )

    def test_valid_command_passes_archive_and_arguments(self):
        revision, digest = "a" * 40, "b" * 64
        result = self.run_gateway(f"deploy {revision} 123 1 {digest}")
        self.assertEqual(result.returncode, 0)
        self.assertIn(f"{revision}\n123\n1\n{digest}\n", result.stdout)
        self.assertTrue(result.stdout.endswith("archive contents"))

    def test_rejects_shell_commands_and_invalid_revision(self):
        digest = "b" * 64
        for command in (
            f"deploy {'a' * 40} 123 1 {digest}; id",
            f"install-infrastructure {'a' * 40}; id",
            f"install-infrastructure {'a' * 40} extra",
            "echo hello",
        ):
            with self.subTest(command=command):
                result = self.run_gateway(command)
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn("archive contents", result.stdout)

    def test_install_command_passes_only_sha_to_the_installer(self):
        revision = "a" * 40
        result = self.run_gateway(f"install-infrastructure {revision}")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.splitlines()[:3], [
            "-n", "/usr/local/lib/promformatech/install-infrastructure.py", revision,
        ])


if __name__ == "__main__":
    unittest.main()
