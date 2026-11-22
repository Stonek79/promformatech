#!/usr/bin/env bash
set -Eeuo pipefail
command=${SSH_ORIGINAL_COMMAND:-}
if [[ $command =~ ^install-infrastructure\ ([0-9a-f]{40})$ ]]; then
    exec sudo -n /usr/local/lib/promformatech/install-infrastructure.py "${BASH_REMATCH[1]}"
fi
pattern='^deploy ([0-9a-f]{40}) ([0-9]+) ([0-9]+) ([0-9a-f]{64})$'
[[ $command =~ $pattern ]] || { echo 'Invalid deployment command.' >&2; exit 1; }
exec sudo -n /usr/local/lib/promformatech/receive-release.sh \
    "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" "${BASH_REMATCH[4]}"
