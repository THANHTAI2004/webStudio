#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/backups}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/uploads}"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_AUTH_SOURCE="${MONGO_AUTH_SOURCE:-${MONGO_DATABASE:-}}"

if [[ "${RESTORE_CONFIRM:-}" != "yes" ]]; then
  echo "Set RESTORE_CONFIRM=yes to confirm destructive restore." >&2
  exit 1
fi

if [[ "$BACKUP_ROOT" != "/backups" || "$UPLOAD_ROOT" != "/uploads" ]]; then
  echo "Restore paths must be /backups and /uploads inside the container." >&2
  exit 1
fi

: "${MONGO_DATABASE:?MONGO_DATABASE is required}"
: "${MONGO_APP_USERNAME:?MONGO_APP_USERNAME is required}"
: "${MONGO_APP_PASSWORD:?MONGO_APP_PASSWORD is required}"

backup_dir="${1:-}"

if [[ -z "$backup_dir" ]]; then
  echo "Usage: RESTORE_CONFIRM=yes /backup/restore.sh /backups/YYYY-MM-DD_HH-mm-ss" >&2
  exit 1
fi

case "$backup_dir" in
  /backups/*) ;;
  *)
    echo "Backup directory must be inside /backups." >&2
    exit 1
    ;;
esac

if [[ ! -d "$backup_dir" ]]; then
  echo "Backup directory not found." >&2
  exit 1
fi

mongo_archive="${backup_dir}/mongodb.archive.gz"
uploads_archive="${backup_dir}/uploads.tar.gz"

if [[ ! -f "$mongo_archive" || ! -f "$uploads_archive" ]]; then
  echo "Backup must contain mongodb.archive.gz and uploads.tar.gz." >&2
  exit 1
fi

mongorestore \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --username "$MONGO_APP_USERNAME" \
  --password "$MONGO_APP_PASSWORD" \
  --authenticationDatabase "$MONGO_AUTH_SOURCE" \
  --drop \
  --archive="$mongo_archive" \
  --gzip

mkdir -p "$UPLOAD_ROOT"
find "$UPLOAD_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
tar -xzf "$uploads_archive" -C "$UPLOAD_ROOT"

echo "Restore completed from: ${backup_dir}"
