# Security Notes

## Exposed Ports

Production exposes only Nginx:

- `80`
- `443`

MongoDB, API, Web, and Admin containers do not publish host ports in
`docker-compose.prod.yml`.

## Secrets

Real secrets belong in `.env.production` on the server. Do not commit:

- Mongo passwords
- JWT secrets
- admin seed password
- SSH keys
- TLS private keys
- real production `.env` files

The committed `.env.production.example` contains placeholders only.

Production API startup rejects missing placeholder-like JWT secrets, Mongo app
credentials, Mongo auth source, and CORS origins. Values containing patterns
such as `CHANGE_ME`, `change-this`, `placeholder`, or `example` are considered
unsafe for runtime production config.

## MongoDB

MongoDB is attached only to the internal `studio_db` network. The API and backup
services use `MONGO_APP_USERNAME` with `readWrite` on `MONGO_DATABASE`. Root
credentials are only for database administration and first-volume initialization.

The app user init script is idempotent, but Docker runs init scripts only when a
new Mongo volume is created.

## API

- `ValidationPipe` uses whitelist, transform, and forbid non-whitelisted fields.
- Helmet is enabled and `X-Powered-By` is disabled.
- Swagger is controlled by `SWAGGER_ENABLED`; production example sets it false.
- Static upload serving is controlled by `SERVE_UPLOADS`; production example
  sets it false because Nginx serves uploads.
- `TRUST_PROXY=true` lets Express honor Nginx proxy headers.
- CORS ignores `*` and uses configured origins with credentials.

## Cookies

Admin auth stays in HttpOnly cookies. Production defaults:

- `HttpOnly=true`
- `Secure=true`
- `SameSite=strict`
- `path=/`

Do not move tokens to localStorage. Local HTTP auth smoke tests require an
untracked `COOKIE_SECURE=false` override.

## Uploads

Uploads are stored in `data/uploads` and mounted into the API at `/app/uploads`.
Nginx serves `/uploads` read-only from `/srv/uploads`.

The API limits file count and file size, validates image MIME type, processes
images with Sharp, and resolves paths inside `UPLOAD_DIR` to prevent traversal.

## Rate Limiting

Booking and contact creation use an in-memory rate limiter keyed by client
address. Nginx sends `X-Real-IP` and `X-Forwarded-For`; the API can enable trust
proxy in production.

## HTML Sanitization

Posts and About rich text use the shared sanitizer. Script, iframe, style, img,
and event-handler attributes are not allowed.

## Nginx

Nginx disables directory listing, serves uploads with immutable cache headers,
sets basic security headers, and does not proxy MongoDB or mount the Docker
socket.

No strict CSP is enabled yet because it should be tested against the exact Next
production build before enforcement.

## Backups

Backup files may contain customer data and uploaded images. Restrict access to
`data/backups`, copy backups off-server securely, and rotate old backup copies.
