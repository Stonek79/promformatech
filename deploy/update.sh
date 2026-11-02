#!/usr/bin/env bash
# Usage: sudo /usr/local/lib/promformatech/update.sh /srv/promformatech/releases/<sha>
source /usr/local/lib/promformatech/maintenance.sh
require_root
release=$(realpath -e "${1:?Provide an extracted release directory}")
if [[ $release != "$ROOT/releases/"* || ! -f "$release/release.json" ]]; then
    echo 'Expected a verified release under /srv/promformatech/releases.' >&2
    exit 1
fi
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
mkdir -p "$release/.next/cache" "$ROOT/backups"
chown -R promformatech:promformatech "$release/.next/cache"
stop_writers
# On failure stay stopped: restarting old code after a partial schema change is unsafe.
trap 'echo "Update failed. Services remain stopped; inspect the backup and journal before recovery." >&2' ERR
snapshot
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
