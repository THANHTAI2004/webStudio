#!/usr/bin/env bash
set -Eeuo pipefail

API_UID="${API_UID:-1000}"
API_GID="${API_GID:-1000}"
BACKUP_UID="${BACKUP_UID:-0}"
BACKUP_GID="${BACKUP_GID:-0}"

mkdir -p data/uploads data/backups data/certbot/www infrastructure/nginx/ssl

chown -R "${API_UID}:${API_GID}" data/uploads
chown -R "${BACKUP_UID}:${BACKUP_GID}" data/backups

chmod 750 data/uploads
chmod 750 data/backups
chmod 755 data/certbot data/certbot/www
chmod 750 infrastructure/nginx/ssl

echo "Prepared data directories."
echo "API upload owner: ${API_UID}:${API_GID}"
echo "Backup owner: ${BACKUP_UID}:${BACKUP_GID}"
