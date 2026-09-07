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
- Admin package categories: http://localhost:3001/dashboard/package-categories
- Admin packages: http://localhost:3001/dashboard/packages

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
