#!/usr/bin/env bash
# Usage: sudo /usr/local/lib/promformatech/update.sh /srv/promformatech/releases/<sha>
source /usr/local/lib/promformatech/maintenance.sh
require_root
release=$(realpath -e "${1:?Provide an extracted release directory}")
if [[ $release != "$ROOT/releases/"* || ! -f "$release/release.json" ]]; then
    echo 'Expected a verified release under /srv/promformatech/releases.' >&2
    exit 1
fi
if [[ -e "$ROOT/current.next" || -L "$ROOT/current.next" ]]; then
    echo 'A previous deployment left current.next; inspect it before retrying.' >&2
    exit 1
fi
if [[ -L "$ROOT/current" && ! -e "$ROOT/current" ]]; then
    echo 'The current release link is broken; inspect it before deployment.' >&2
    exit 1
fi
previous_release=$(readlink -f "$ROOT/current" 2>/dev/null || true)
/usr/bin/node --input-type=module - "$release/release.json" <<'JS'
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(manifest.platform,process.platform);
assert.equal(manifest.arch,process.arch);
assert.equal(manifest.nodeMajor,process.versions.node.split('.')[0]);
JS
# Fixed data layout is shared by services, snapshots and restoration.
/usr/bin/node --env-file="$ENV_FILE" --input-type=module <<'JS'
import assert from 'node:assert/strict';
assert.equal(process.env.DATABASE_URL,'file:/srv/promformatech/shared/database/site.sqlite');
assert.equal(process.env.MEDIA_ROOT,'/srv/promformatech/shared/media');
JS
[[ -f "$SHARED/database/site.sqlite" ]] || {
    echo 'Database is missing. Initialize it explicitly before deployment.' >&2; exit 1;
}
backup_ready
mkdir -p "$release/.next/cache" "$ROOT/backups"
chown -R promformatech:promformatech "$release/.next/cache"
web_active=false
timer_active=false
systemctl is-active --quiet "$WEB" && web_active=true
systemctl is-active --quiet "$TIMER" && timer_active=true
resume_previous() {
    if $web_active; then
        systemctl start "$WEB" && check_ready || return 1
    fi
    if $timer_active; then systemctl start "$TIMER" || return 1; fi
}
if ! stop_writers; then
    echo 'Failed to stop services; restoring their prior state.' >&2
    resume_previous || echo 'Could not restore the previous service state.' >&2
    exit 1
fi
if ! snapshot; then
    echo 'Backup failed before migration; restarting the previous release.' >&2
    resume_previous || echo 'Could not restore the previous service state.' >&2
    exit 1
fi
# Restarting old code after a partial schema change is unsafe.
trap 'echo "Update failed after the migration stage began; inspect service status, backup and journal." >&2' ERR
cd "$release"
runuser -u promformatech -- env APP_PROCESS_ROLE=migrator NODE_ENV=production \
    /usr/bin/node --env-file="$ENV_FILE" ops/migrate.mjs
ln -s "$release" "$ROOT/current.next"
mv -Tf "$ROOT/current.next" "$ROOT/current"
systemctl start "$WEB"
if ! check_ready; then
    systemctl stop "$WEB"
    echo 'Readiness failed; worker stays stopped. Inspect journalctl.' >&2
    exit 1
fi
systemctl start "$TIMER"
echo 'Release activated. Check the public HTTPS site and admin before ending maintenance.'
trap - ERR
if ! prune_snapshots; then
    echo 'Release is active, but backup retention failed. Inspect the restic repository.' >&2
    exit 1
fi
# Remove only older automatically named releases, keeping the active and previous one.
for old_release in "$ROOT"/releases/*; do
    [[ -d $old_release && ! -L $old_release ]] || continue
    [[ $(basename "$old_release") =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] || continue
    [[ $old_release != "$release" && $old_release != "$previous_release" ]] || continue
    rm -rf --one-file-system -- "$old_release"
done
