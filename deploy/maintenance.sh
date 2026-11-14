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
BACKUP_REPOSITORY="$ROOT/backups/restic"
BACKUP_PASSWORD_FILE=/etc/promformatech-restic-password
BACKUP_STAGING="$ROOT/backup-staging"
BACKUP_TAG=promformatech

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo 'Run with sudo.' >&2
        exit 1
    fi
    exec 9>/run/lock/promformatech-operations.lock
    flock -n 9 || { echo 'Another deployment/backup is running.' >&2; exit 1; }
}

stop_writers() {
    systemctl stop "$TIMER" || return
    systemctl stop "$WORKER" || return
    systemctl stop "$WEB" || return
}

backup_ready() {
    command -v restic >/dev/null || { echo 'restic is not installed.' >&2; return 1; }
    [[ -f "$BACKUP_PASSWORD_FILE" && -f "$BACKUP_REPOSITORY/config" ]] || {
        echo 'Initialize the local backup repository and password first.' >&2; return 1;
    }
    install -d -m 700 "$ROOT/backups/restic-cache"
}

snapshot() {
    local database="$BACKUP_STAGING/site.sqlite"
    backup_ready || return
    [[ -f "$SHARED/database/site.sqlite" && -d "$SHARED/media" ]] || {
        echo 'Database or media directory is missing.' >&2; return 1;
    }
    install -d -m 700 "$BACKUP_STAGING" || return
    rm -f -- "$database" || return
    if ! sqlite3 -readonly "$SHARED/database/site.sqlite" ".backup '$database'"; then
        rm -f -- "$database"
        return 1
    fi
    if [[ $(sqlite3 -readonly "$database" 'PRAGMA integrity_check;') != ok ]]; then
        rm -f -- "$database"
        return 1
    fi
    if ! restic --cache-dir "$ROOT/backups/restic-cache" \
        -r "$BACKUP_REPOSITORY" --password-file "$BACKUP_PASSWORD_FILE" \
        backup --tag "$BACKUP_TAG" "$database" "$SHARED/media"; then
        rm -f -- "$database"
        return 1
    fi
    rm -f -- "$database"
}

prune_snapshots() {
    restic --cache-dir "$ROOT/backups/restic-cache" \
        -r "$BACKUP_REPOSITORY" --password-file "$BACKUP_PASSWORD_FILE" \
        forget --tag "$BACKUP_TAG" --keep-daily 7 --keep-weekly 4 --prune
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
