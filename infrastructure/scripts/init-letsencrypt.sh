#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "${ENV_FILE} was not found." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${STUDIO_DOMAIN:?STUDIO_DOMAIN is required}"
: "${ADMIN_DOMAIN:?ADMIN_DOMAIN is required}"
: "${CERTBOT_EMAIL:?CERTBOT_EMAIL is required}"
CERTBOT_IMAGE="${CERTBOT_IMAGE:-certbot/certbot:v2.11.0}"

case "$STUDIO_DOMAIN" in
  studio.example.com|example.com|localhost|*.localhost)
    echo "STUDIO_DOMAIN still looks like a placeholder." >&2
    exit 1
    ;;
esac

case "$ADMIN_DOMAIN" in
  admin.studio.example.com|example.com|localhost|*.localhost)
    echo "ADMIN_DOMAIN still looks like a placeholder." >&2
    exit 1
    ;;
esac

if [[ "$CERTBOT_EMAIL" == "admin@example.com" ]]; then
  echo "CERTBOT_EMAIL still looks like a placeholder." >&2
  exit 1
fi

mkdir -p data/certbot/www infrastructure/nginx/ssl

if [[ -d "infrastructure/nginx/ssl/live/${STUDIO_DOMAIN}" || -d "infrastructure/nginx/ssl/live/${ADMIN_DOMAIN}" ]]; then
  echo "Existing certificate directory found. Refusing to overwrite automatically." >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d nginx

docker run --rm \
  -v "${PWD}/data/certbot/www:/var/www/certbot" \
  -v "${PWD}/infrastructure/nginx/ssl:/etc/letsencrypt" \
  "$CERTBOT_IMAGE" certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$STUDIO_DOMAIN" \
    -d "$ADMIN_DOMAIN"

echo "Certificates requested. Review docs/DEPLOYMENT.md before enabling the HTTPS template."
