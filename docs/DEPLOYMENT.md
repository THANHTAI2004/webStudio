# Production Deployment

This guide targets a single Ubuntu/Debian server with Docker Engine, the Docker
Compose plugin, Git, and DNS records for the public and admin domains.

## Architecture

Production traffic enters through Nginx only.

- `https://$STUDIO_DOMAIN/` -> `web:3000`
- `https://$ADMIN_DOMAIN/` -> `admin:3001`
- `*/api/*` -> `api:4000`
- `*/uploads/*` -> `/srv/uploads` served by Nginx
- MongoDB is private on the `studio_db` network and has no host port.

The existing `docker-compose.yml` remains the development MongoDB compose file.
Production uses `docker-compose.prod.yml`.

## First Server Setup

1. Clone and checkout the deployment branch.

   ```bash
   git clone https://github.com/THANHTAI2004/webStudio.git
   cd webStudio
   git checkout main
   ```

2. Create production env from the committed example.

   ```bash
   cp .env.production.example .env.production
   ```

3. Edit `.env.production`.

   Set real domains, strong Mongo/JWT/admin seed secrets, and `CERTBOT_EMAIL`.
   Do not commit `.env.production`.

4. Prepare persistent directories.

   ```bash
   bash infrastructure/scripts/prepare-server.sh
   ```

   The API image runs as the Node image user, UID/GID `1000:1000`. Override
   `API_UID` or `API_GID` only if the image user changes.

5. Validate compose.

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml config
   ```

6. Build and start HTTP mode.

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml build
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d
   docker compose --env-file .env.production -f docker-compose.prod.yml ps
   ```

7. Seed the first admin if the database is empty.

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml exec api npm run seed:admin:prod
   ```

   `ADMIN_SEED_PASSWORD` must come from `.env.production` or the shell. Do not
   store the real password in tracked files.

8. Verify:

   ```bash
   curl -i http://$STUDIO_DOMAIN/api/v1/health
   curl -i http://$STUDIO_DOMAIN/
   curl -i http://$ADMIN_DOMAIN/
   ```

   Then verify admin login, media upload, packages, albums, posts, bookings,
   contacts, locations, homepage, about, theme, and SEO from the browser.

## HTTPS

The default Nginx template is HTTP-ready and serves ACME challenges at
`/.well-known/acme-challenge/`.

Request Let's Encrypt certificates:

```bash
ENV_FILE=.env.production bash infrastructure/scripts/init-letsencrypt.sh
```

The script refuses placeholder domains/email and refuses to overwrite existing
certificate directories.

After certificates exist, enable the HTTPS template on the server:

```bash
cp infrastructure/nginx/templates/https.conf.template.example infrastructure/nginx/templates/http.conf.template
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build nginx
```

The HTTPS template redirects HTTP to HTTPS except ACME challenges, enables TLS
1.2/1.3, and sets HSTS only on HTTPS responses. It does not enable preload by
default.

## Common Commands

Build:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
```

Start:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Status:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

Stop safely:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop
```

`docker compose down` is usually safe when volumes are not removed. Do not run
`docker compose down -v` in production unless you intentionally want to remove
the MongoDB volume. Do not run `docker system prune --volumes` unless you fully
understand the data impact.

## Update Flow

```bash
git pull origin main
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Do not use `down -v` for normal updates.

## Notes

- `docker-entrypoint-initdb.d` Mongo scripts run only when the Mongo volume is
  first created.
- Production API connects with the application Mongo user, not the root user.
- Browser code uses `/api/v1` same-origin. Server Components use
  `API_INTERNAL_URL=http://api:4000/api/v1`.
- Secure cookies require HTTPS. For local HTTP smoke tests only, use
  `COOKIE_SECURE=false` in an untracked override env.
