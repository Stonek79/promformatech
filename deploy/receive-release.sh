#!/usr/bin/env bash
# Installed by the server owner; the deploy account may invoke only this entry point.
set -Eeuo pipefail
umask 077

[[ $EUID -eq 0 && $# -eq 4 ]] || { echo 'Expected root and four arguments.' >&2; exit 1; }
revision=$1
run_id=$2
attempt=$3
digest=$4
[[ $revision =~ ^[0-9a-f]{40}$ && $run_id =~ ^[0-9]+$ && $attempt =~ ^[0-9]+$ && $digest =~ ^[0-9a-f]{64}$ ]] || {
    echo 'Invalid release identifier.' >&2; exit 1;
}

root=/srv/promformatech
minimum_free_bytes=$((2 * 1024 * 1024 * 1024))
maximum_archive_bytes=$((1024 * 1024 * 1024))
name="$revision-$run_id-$attempt"
destination="$root/releases/$name"
[[ ! -e $destination && ! -L $destination ]] || { echo 'Release already exists.' >&2; exit 1; }
stage=$(mktemp -d "$root/releases/.incoming.XXXXXXXX")
trap 'rm -rf -- "$stage"' EXIT

free_bytes=$(df -PB1 --output=avail "$stage" | tail -n 1 | tr -d ' ')
[[ $free_bytes =~ ^[0-9]+$ && $free_bytes -gt $minimum_free_bytes ]] || {
    echo 'Insufficient free disk space for release delivery.' >&2; exit 1;
}
allowed_bytes=$((free_bytes - minimum_free_bytes))
if (( allowed_bytes > maximum_archive_bytes )); then allowed_bytes=$maximum_archive_bytes; fi
head -c "$((allowed_bytes + 1))" > "$stage/archive.tar.gz"
archive_bytes=$(stat -c '%s' "$stage/archive.tar.gz")
(( archive_bytes <= allowed_bytes )) || { echo 'Release archive exceeds the safe size.' >&2; exit 1; }
printf '%s  %s\n' "$digest" "$stage/archive.tar.gz" | sha256sum -c -
mkdir "$stage/release"
python3 /usr/local/lib/promformatech/extract-release.py "$stage/archive.tar.gz" "$stage/release" "$revision"

# Server-owned deployment infrastructure must be reviewed and installed separately.
for script in maintenance.sh update.sh receive-release.sh deploy-gateway.sh extract-release.py; do
    cmp -s "$stage/release/deploy/$script" "/usr/local/lib/promformatech/$script" || {
        echo "Server script differs: $script. Install infrastructure changes manually." >&2; exit 1;
    }
done
for unit in "$stage/release"/deploy/systemd/*; do
    cmp -s "$unit" "/etc/systemd/system/$(basename "$unit")" || {
        echo "Server unit differs: $(basename "$unit"). Install infrastructure changes manually." >&2; exit 1;
    }
done

chmod 755 "$stage/release"
mv -- "$stage/release" "$destination"
unit="promformatech-deploy-$run_id-$attempt"
if ! systemd-run --unit "$unit" --wait --collect --service-type=exec \
    /usr/local/lib/promformatech/update.sh "$destination"; then
    echo "Deployment failed or its SSH session ended. Check: journalctl -u $unit" >&2
    exit 1
fi
echo "Deployed $revision ($run_id/$attempt)."
