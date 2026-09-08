#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
stop_requested=0

if ! [[ "$BACKUP_INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [[ "$BACKUP_INTERVAL_SECONDS" -lt 1 ]]; then
  echo "BACKUP_INTERVAL_SECONDS must be a positive integer." >&2
  exit 1
fi

handle_stop() {
  stop_requested=1
}

trap handle_stop INT TERM

if [[ "${1:-}" != "" ]]; then
  exec "$@"
fi

while [[ "$stop_requested" -eq 0 ]]; do
  /backup/run-once.sh || echo "Backup run failed; will retry after interval." >&2

  slept=0
  while [[ "$stop_requested" -eq 0 && "$slept" -lt "$BACKUP_INTERVAL_SECONDS" ]]; do
    sleep_chunk=60
    remaining=$((BACKUP_INTERVAL_SECONDS - slept))

    if [[ "$remaining" -lt "$sleep_chunk" ]]; then
      sleep_chunk="$remaining"
    fi

    sleep "$sleep_chunk" &
    wait "$!" || true
    slept=$((slept + sleep_chunk))
  done
done

echo "Backup service stopped."
