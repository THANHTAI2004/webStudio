#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/backups}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/uploads}"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_AUTH_SOURCE="${MONGO_AUTH_SOURCE:-${MONGO_DATABASE:-}}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

if [[ "$BACKUP_ROOT" != "/backups" ]]; then
  echo "BACKUP_ROOT must be /backups inside the backup container." >&2
  exit 1
fi

if [[ "$UPLOAD_ROOT" != "/uploads" ]]; then
  echo "UPLOAD_ROOT must be /uploads inside the backup container." >&2
  exit 1
fi

: "${MONGO_DATABASE:?MONGO_DATABASE is required}"
: "${MONGO_APP_USERNAME:?MONGO_APP_USERNAME is required}"
: "${MONGO_APP_PASSWORD:?MONGO_APP_PASSWORD is required}"

if ! [[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
  exit 1
fi

timestamp="$(date -u +%Y-%m-%d_%H-%M-%S)"
tmp_dir="${BACKUP_ROOT}/.tmp-${timestamp}-$$"
final_dir="${BACKUP_ROOT}/${timestamp}"

cleanup() {
  if [[ -n "${tmp_dir:-}" && -d "$tmp_dir" ]]; then
    rm -rf -- "$tmp_dir"
  fi
}

trap cleanup EXIT INT TERM

mkdir -p "$tmp_dir"

mongodump \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --username "$MONGO_APP_USERNAME" \
  --password "$MONGO_APP_PASSWORD" \
  --authenticationDatabase "$MONGO_AUTH_SOURCE" \
  --db "$MONGO_DATABASE" \
  --archive="${tmp_dir}/mongodb.archive.gz" \
  --gzip

if [[ -d "$UPLOAD_ROOT" ]]; then
  tar --exclude='./.tmp' -czf "${tmp_dir}/uploads.tar.gz" -C "$UPLOAD_ROOT" .
else
  mkdir -p "${tmp_dir}/empty-uploads"
  tar -czf "${tmp_dir}/uploads.tar.gz" -C "${tmp_dir}/empty-uploads" .
fi

mv "$tmp_dir" "$final_dir"
tmp_dir=""

find "$BACKUP_ROOT" \
  -mindepth 1 \
  -maxdepth 1 \
  -type d \
  -name '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]_*' \
  -mtime +"$BACKUP_RETENTION_DAYS" \
  -exec rm -rf -- {} +

echo "Backup completed: ${final_dir}"
