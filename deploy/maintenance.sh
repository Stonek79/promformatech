#!/usr/bin/env bash
# Sourced by the root-owned backup/deploy commands.
set -Eeuo pipefail
umask 077
ROOT=/srv/promformatech
SHARED="$ROOT/shared"
WEB=promformatech-web.service
WORKER=promformatech-worker.service
TIMER=promformatech-worker.timer
ENV_FILE="$SHARED/app.env"

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo 'Run with sudo.' >&2
        exit 1
    fi
    exec 9>/run/lock/promformatech-operations.lock
    flock -n 9 || { echo 'Another deployment/backup is running.' >&2; exit 1; }
}

stop_writers() {
    systemctl stop "$TIMER"
    systemctl stop "$WORKER"
    systemctl stop "$WEB"
}

snapshot() {
    local directory
    directory=$(mktemp -d "$ROOT/backups/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX") || return
    if [[ -f "$SHARED/database/site.sqlite" ]]; then
        sqlite3 "$SHARED/database/site.sqlite" ".backup '$directory/site.sqlite'" || return
        [[ $(sqlite3 "$directory/site.sqlite" 'PRAGMA integrity_check;') == ok ]] || return
    fi
    cp -a --reflink=auto "$SHARED/media" "$directory/media" || return
    cp -a "$ENV_FILE" "$directory/app.env" || return
    readlink -f "$ROOT/current" > "$directory/release.txt" || true
    touch "$directory/COMPLETE" || return
    printf '%s\n' "$directory"
}

check_ready() {
    local attempt
    for attempt in $(seq 1 30); do
        if curl --fail --silent --max-time 3 http://127.0.0.1:3001/api/health/ready >/dev/null; then
            return 0
        fi
        sleep 2
    done
    return 1
}
