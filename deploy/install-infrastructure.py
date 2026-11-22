#!/usr/bin/python3 -I
"""Install signed deployment infrastructure from the current main commit."""

import fcntl
import os
import re
import signal
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

REPOSITORY = "https://github.com/Stonek79/promformatech.git"
ALLOWED_SIGNERS = Path("/etc/promformatech/infra-allowed-signers")
LIBRARY = Path("/usr/local/lib/promformatech")
SYSTEMD = Path("/etc/systemd/system")
LOCKS = Path("/run/lock")
SCRIPTS = (
    "backup.sh",
    "deploy-gateway.sh",
    "extract-release.py",
    "maintenance.sh",
    "receive-release.sh",
    "update.sh",
)
UNITS = (
    "promformatech-backup.service",
    "promformatech-backup.timer",
    "promformatech-web.service",
    "promformatech-worker.service",
    "promformatech-worker.timer",
)


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def stage_commit(stage, revision):
    repo = stage / "repository"
    repo.mkdir()
    environment = {
        "PATH": "/usr/bin:/bin",
        "HOME": str(stage),
        "GIT_CONFIG_NOSYSTEM": "1",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_TERMINAL_PROMPT": "0",
    }

    def git(*args):
        return run("git", "-C", repo, *args, env=environment, stdout=subprocess.PIPE).stdout

    git("init", "--quiet", "--template=")
    git("fetch", "--quiet", "--depth=1", "--no-tags", REPOSITORY, "refs/heads/main")
    if git("rev-parse", "FETCH_HEAD").decode().strip() != revision:
        raise ValueError("Infrastructure revision is no longer the tip of main.")
    return git


def candidate(git, stage, relative):
    record = git("ls-tree", "FETCH_HEAD", "--", relative).split(b"\t", 1)[0].split()
    if len(record) != 3 or record[:2] not in ([b"100644", b"blob"], [b"100755", b"blob"]):
        raise ValueError(f"Expected a regular Git file: {relative}")
    file = stage / relative
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_bytes(git("cat-file", "blob", record[2].decode()))
    return file


def verify_signature(git):
    git(
        "-c", "gpg.minTrustLevel=fully",
        "-c", "gpg.ssh.program=/usr/bin/ssh-keygen",
        "-c", f"gpg.ssh.allowedSignersFile={ALLOWED_SIGNERS}",
        "-c", "gpg.openpgp.program=/bin/false",
        "-c", "gpg.x509.program=/bin/false",
        "verify-commit", "FETCH_HEAD",
    )


def installed_file(path):
    try:
        mode = path.lstat().st_mode
    except FileNotFoundError:
        return None
    if not stat.S_ISREG(mode):
        raise ValueError(f"Expected a regular installed file: {path}")
    return path.read_bytes(), stat.S_IMODE(mode)


def replace_file(path, content, mode):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as item:
        staged = Path(item.name)
        try:
            item.write(content)
            item.flush()
            os.fchmod(item.fileno(), mode)
            os.replace(staged, path)
        finally:
            staged.unlink(missing_ok=True)


def install(changes, reload_units):
    applied = []
    try:
        for path, content, mode, previous in changes:
            # Record the previous state before a replacement can be interrupted.
            applied.append((path, previous))
            replace_file(path, content, mode)
        if reload_units:
            run("systemctl", "daemon-reload")
    except BaseException:
        for path, previous in reversed(applied):
            try:
                if previous is None:
                    path.unlink(missing_ok=True)
                else:
                    replace_file(path, *previous)
            except OSError as error:
                print(f"Could not restore {path}: {error}", file=sys.stderr)
        if reload_units:
            try:
                run("systemctl", "daemon-reload")
            except (OSError, subprocess.CalledProcessError) as error:
                print(f"Could not reload restored units: {error}", file=sys.stderr)
        raise


def apply_revision(stage, git, revision):
    files = (
        [(f"deploy/{name}", LIBRARY / name, 0o755) for name in SCRIPTS]
        + [(f"deploy/systemd/{name}", SYSTEMD / name, 0o644) for name in UNITS]
    )
    changes = []
    for relative, destination, mode in files:
        content = candidate(git, stage, relative).read_bytes()
        previous = installed_file(destination)
        if previous != (content, mode):
            changes.append((destination, content, mode, previous))
    if not changes:
        print("Deployment infrastructure is up to date.")
        return

    verify_signature(git)
    for name in SCRIPTS:
        file = stage / "deploy" / name
        if name.endswith(".sh"):
            run("bash", "-n", file)
        else:
            compile(file.read_bytes(), str(file), "exec")
    reload_units = any(path.parent == SYSTEMD for path, *_ in changes)
    if reload_units:
        run("systemd-analyze", "verify", *(stage / "deploy/systemd" / name for name in UNITS))
    head = git("ls-remote", "--exit-code", REPOSITORY, "refs/heads/main").decode().split()[0]
    if head != revision:
        raise ValueError("Infrastructure revision is no longer the tip of main.")
    install(changes, reload_units)
    for path, *_ in changes:
        print(f"Installed signed infrastructure: {path.name}")


def interrupted(number, _frame):
    raise InterruptedError(f"Installation interrupted by signal {number}.")


def main():
    if os.geteuid() != 0 or len(sys.argv) != 2 or not re.fullmatch(r"[a-f0-9]{40}", sys.argv[1]):
        raise ValueError("Expected root and one full Git commit SHA.")
    os.umask(0o077)
    os.environ["PATH"] = "/usr/sbin:/usr/bin:/sbin:/bin"
    for number in (signal.SIGHUP, signal.SIGTERM):
        signal.signal(number, interrupted)
    with tempfile.TemporaryDirectory(prefix="pft-infrastructure-") as directory:
        stage = Path(directory)
        git = stage_commit(stage, sys.argv[1])
        with (LOCKS / "promformatech-infrastructure.lock").open("ab") as infrastructure:
            fcntl.flock(infrastructure, fcntl.LOCK_EX)
            with (LOCKS / "promformatech-operations.lock").open("ab") as operations:
                fcntl.flock(operations, fcntl.LOCK_EX)
                apply_revision(stage, git, sys.argv[1])


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, SyntaxError, subprocess.CalledProcessError) as error:
        sys.exit(f"Infrastructure installation failed: {error}")
