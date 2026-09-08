# Studio Platform

Foundation for the Studio Platform.

## Apps

- web: Next.js :3000
- admin: Next.js :3001
- api: NestJS :4000
- mongodb: Docker :27017 local only

## Development

```bash
npm run dev:web
npm run dev:admin
npm run dev:api
```

## MongoDB

```bash
npm run mongo:up
npm run mongo:down
```

## Build

```bash
npm run build:web
npm run build:admin
npm run build:api
```

## Health

http://localhost:4000/api/v1/health

## Swagger

http://localhost:4000/api/docs

## Admin Auth

- Admin login: http://localhost:3001/login
- Admin dashboard: http://localhost:3001/dashboard
- Admin album categories: http://localhost:3001/dashboard/album-categories
- Admin albums: http://localhost:3001/dashboard/albums
- Admin package categories: http://localhost:3001/dashboard/package-categories
- Admin packages: http://localhost:3001/dashboard/packages
- Admin post categories: http://localhost:3001/dashboard/post-categories
- Admin posts: http://localhost:3001/dashboard/posts
- Admin bookings: http://localhost:3001/dashboard/bookings
- Admin locations: http://localhost:3001/dashboard/locations
- Admin contacts: http://localhost:3001/dashboard/contacts

Auth endpoints:

- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET /api/v1/auth/me

Seed the initial admin:

```bash
npm --prefix apps/api run seed:admin
```

## Media Library

- Media Library: http://localhost:3001/dashboard/media
- Static media: http://localhost:4000/uploads/...
- Storage: data/uploads/

Media API:

- POST /api/v1/admin/media/upload
- GET /api/v1/admin/media
- GET /api/v1/admin/media/:id
- PATCH /api/v1/admin/media/:id
- DELETE /api/v1/admin/media/:id

## Packages

- Public packages: http://localhost:3000/goi-chup
- Public package detail: http://localhost:3000/goi-chup/:slug

Admin category API:

- GET /api/v1/admin/package-categories
- POST /api/v1/admin/package-categories
- GET /api/v1/admin/package-categories/:id
- PATCH /api/v1/admin/package-categories/:id
- DELETE /api/v1/admin/package-categories/:id

Admin package API:

- GET /api/v1/admin/packages
- POST /api/v1/admin/packages
- GET /api/v1/admin/packages/:id
- PATCH /api/v1/admin/packages/:id
- DELETE /api/v1/admin/packages/:id

Public package API:

- GET /api/v1/package-categories
- GET /api/v1/packages
- GET /api/v1/packages/:slug

## Albums

- Public albums: http://localhost:3000/album
- Public album detail: http://localhost:3000/album/:slug

Admin album category API:

- GET /api/v1/admin/album-categories
- POST /api/v1/admin/album-categories
- GET /api/v1/admin/album-categories/:id
- PATCH /api/v1/admin/album-categories/:id
- DELETE /api/v1/admin/album-categories/:id

Admin album API:

- GET /api/v1/admin/albums
- POST /api/v1/admin/albums
- GET /api/v1/admin/albums/:id
- PATCH /api/v1/admin/albums/:id
- DELETE /api/v1/admin/albums/:id

Public album API:

- GET /api/v1/album-categories
- GET /api/v1/albums
- GET /api/v1/albums/:slug

## Posts / News

- Public news: http://localhost:3000/tin-tuc
- Public article detail: http://localhost:3000/tin-tuc/:slug

Admin post category API:

- GET /api/v1/admin/post-categories
- POST /api/v1/admin/post-categories
- GET /api/v1/admin/post-categories/:id
- PATCH /api/v1/admin/post-categories/:id
- DELETE /api/v1/admin/post-categories/:id

Admin post API:

- GET /api/v1/admin/posts
- POST /api/v1/admin/posts
- GET /api/v1/admin/posts/:id
- PATCH /api/v1/admin/posts/:id
- DELETE /api/v1/admin/posts/:id

Public post API:

- GET /api/v1/post-categories
- GET /api/v1/posts
- GET /api/v1/posts/:slug

## Bookings

- Public booking: http://localhost:3000/dat-lich
- Public booking with package: http://localhost:3000/dat-lich?package=:packageSlug
- Public booking with location: http://localhost:3000/dat-lich?location=:locationSlug
- Admin booking: http://localhost:3001/dashboard/bookings

Public booking API:

- POST /api/v1/bookings

Admin booking API:

- GET /api/v1/admin/bookings
- GET /api/v1/admin/bookings/calendar
- GET /api/v1/admin/bookings/:id
- PATCH /api/v1/admin/bookings/:id
- PATCH /api/v1/admin/bookings/:id/status

Booking status workflow:

- new -> contacted, confirmed, cancelled
- contacted -> new, confirmed, cancelled
- confirmed -> contacted, deposit, shooting, cancelled
- deposit -> confirmed, shooting, cancelled
- shooting -> deposit, completed, cancelled
- completed -> shooting
- cancelled -> new, contacted

Booking public create uses an in-memory 5 requests / 10 minutes / IP limiter.

## Locations

- Public locations: http://localhost:3000/dia-diem
- Public location detail: http://localhost:3000/dia-diem/:slug
- Admin locations: http://localhost:3001/dashboard/locations
- New location: http://localhost:3001/dashboard/locations/new
- Edit location: http://localhost:3001/dashboard/locations/:id/edit

Admin location API:

- GET /api/v1/admin/locations
- POST /api/v1/admin/locations
- GET /api/v1/admin/locations/:id
- PATCH /api/v1/admin/locations/:id
- DELETE /api/v1/admin/locations/:id

Public location API:

- GET /api/v1/locations
- GET /api/v1/locations/:slug

Location media references store only media ids:

- coverMediaId
- galleryMediaIds
- seo.ogImageMediaId

Deleting media used by a location is blocked with MEDIA_IN_USE, matching package,
album, and post protections.

## Contacts

- Public contact: http://localhost:3000/lien-he
- Admin contact inbox: http://localhost:3001/dashboard/contacts
- Admin contact detail: http://localhost:3001/dashboard/contacts/:id

Public contact API:

- POST /api/v1/contacts

Admin contact API:

- GET /api/v1/admin/contacts
- GET /api/v1/admin/contacts/:id
- PATCH /api/v1/admin/contacts/:id

Contact statuses:

- new
- read
- replied
- archived

Public contact create uses the shared in-memory 5 requests / 10 minutes / IP
limiter. This is acceptable for the current single API instance deployment; a
multi-instance production deployment should move this limiter to Redis or an
equivalent shared store.
