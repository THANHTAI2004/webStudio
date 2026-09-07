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
