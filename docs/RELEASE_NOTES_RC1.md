# Release Notes RC1

Version: `1.0.0-rc.1`

## Scope

This release candidate prepares Studio Platform for a single-server production
deployment. It does not add payment, email/SMS/Zalo notifications, customer
accounts, Redis, Kubernetes, cloud storage, CDN, or remote deployment
automation.

## Included

- Public web app for homepage, about, packages, albums, posts, booking,
  locations, contact, SEO, robots, and sitemap.
- Admin CMS for auth, media, packages, albums, posts, bookings, contacts,
  locations, homepage, about, theme, and settings.
- Production Docker Compose with Nginx, web, admin, API, MongoDB, and backup.
- Next.js standalone images for web and admin.
- NestJS production API image with production-only dependencies.
- Nginx reverse proxy for same-origin `/api` and direct `/uploads` serving.
- Sitemap includes published packages, albums, posts, and active locations.
- HTTPS-ready Nginx template and Let's Encrypt HTTP-01 helper script.
- MongoDB app user initialization with `readWrite` on the app database.
- Local non-root backup and restore scripts for MongoDB and uploaded media.
- GitHub Actions CI for install, lint, API tests, builds, compose validation,
  and production image builds.

## Release Candidate Notes

- Real deployment still requires DNS, `.env.production`, strong secrets, TLS
  certificate issuance, and off-server backup automation.
- Production startup rejects missing placeholder-like API secrets and Mongo
  app credentials.
- The production API disables Swagger and Nest static upload serving by default.
- Browser API calls use same-origin `/api/v1`; Docker hostnames stay internal.
- Admin preview links require `NEXT_PUBLIC_SITE_URL` at build time.

## Known Limitations

- No online payment gateway.
- No email, SMS, or Zalo notification provider.
- No customer account portal.
- Booking/contact rate limiting is in-memory and suited to one API instance.
- Backups are local unless operators copy them to NAS, another server, or
  object storage.
- No formal WCAG audit or full browser automation suite is included yet.

## Manual Release Requirements

- Set GitHub default branch to `main` if the repository still defaults to
  `master`.
- Consider branch protection for `main`, CI required before merge, and no force
  pushes.
- If this is commercial private source, consider making the GitHub repository
  private before adding production operations.
