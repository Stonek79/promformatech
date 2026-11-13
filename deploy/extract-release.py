#!/usr/bin/env python3
"""Extract a release without allowing archive paths to escape its directory."""

import json
import shutil
import sys
import tarfile
from pathlib import Path

MINIMUM_FREE_BYTES = 2 * 1024**3
MAXIMUM_UNPACKED_BYTES = 4 * 1024**3
MAXIMUM_MEMBERS = 200_000


def main():
    archive_path, destination_path, revision = sys.argv[1:]
    destination = Path(destination_path)
    with tarfile.open(archive_path, "r:gz") as archive:
        members = []
        unpacked_bytes = 0
        for member in archive:
            members.append(member)
            if member.isfile():
                unpacked_bytes += member.size
            if len(members) > MAXIMUM_MEMBERS or unpacked_bytes > MAXIMUM_UNPACKED_BYTES:
                raise ValueError("Release exceeds extraction limits")
        if unpacked_bytes + MINIMUM_FREE_BYTES > shutil.disk_usage(destination).free:
            raise ValueError("Insufficient free disk space for release extraction")
        archive.extractall(destination, members=members, filter="data")

    manifest = json.loads((destination / "release.json").read_text())
    if manifest.get("revision") != revision:
        raise ValueError("Release revision does not match the requested commit")
    if not (destination / "server.js").is_file():
        raise ValueError("Release is missing server.js")


if __name__ == "__main__":
    main()
