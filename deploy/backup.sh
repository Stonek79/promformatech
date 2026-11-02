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
stop_writers
copy=$(snapshot)
# Resume before network transfer, keeping the maintenance window local.
if $web_active; then systemctl start "$WEB"; check_ready; fi
if $timer_active; then systemctl start "$TIMER"; fi
if [[ -n ${RESTIC_REPOSITORY:-} && -n ${RESTIC_PASSWORD_FILE:-} ]]; then
    restic backup --tag promformatech "$copy"
    restic check
    echo "Offsite backup verified: $copy"
else
    echo "Only local backup created: $copy. Configure offsite restic before production." >&2
    exit 1
fi
