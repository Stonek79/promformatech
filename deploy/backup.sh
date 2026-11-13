#!/usr/bin/env bash
source /usr/local/lib/promformatech/maintenance.sh
require_root
web_active=false
timer_active=false
systemctl is-active --quiet "$WEB" && web_active=true
systemctl is-active --quiet "$TIMER" && timer_active=true
resume() {
    local status=$?
    trap - EXIT
    if $web_active; then
        systemctl start "$WEB" || status=1
        if check_ready; then
            if $timer_active; then systemctl start "$TIMER" || status=1; fi
        else
            status=1
        fi
    fi
    exit "$status"
}
trap resume EXIT
backup_ready
stop_writers
snapshot
if $web_active; then systemctl start "$WEB"; check_ready; fi
if $timer_active; then systemctl start "$TIMER"; fi
web_active=false
timer_active=false
prune_snapshots
echo 'Local incremental backup completed.'
