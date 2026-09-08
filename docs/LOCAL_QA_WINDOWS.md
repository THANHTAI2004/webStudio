# Local QA On Windows

These commands are for PowerShell on a Windows machine with Docker Desktop.

## Install And Build

```powershell
npm --prefix apps/api ci
npm --prefix apps/admin ci
npm --prefix apps/web ci

npm --prefix apps/api run lint
npm --prefix apps/admin run lint
npm --prefix apps/web run lint

npm --prefix apps/api test
npm --prefix apps/api run test:e2e -- --runInBand

npm --prefix apps/api run build
npm --prefix apps/admin run build
npm --prefix apps/web run build
```

## Dev Mongo Regression

```powershell
docker compose config
docker compose up -d mongodb
docker compose ps
```

Stop dev Mongo safely:

```powershell
docker compose stop mongodb
```

## Production RC Smoke

Create an ignored RC env file under `.codex-run\.env.production.test` with
strong fake values. Then run:

```powershell
docker compose -p studio_rc_test --env-file .codex-run/.env.production.test -f docker-compose.prod.yml -f docker-compose.prod.local.yml config
docker compose -p studio_rc_test --env-file .codex-run/.env.production.test -f docker-compose.prod.yml -f docker-compose.prod.local.yml build
docker compose -p studio_rc_test --env-file .codex-run/.env.production.test -f docker-compose.prod.yml -f docker-compose.prod.local.yml up -d
docker compose -p studio_rc_test --env-file .codex-run/.env.production.test -f docker-compose.prod.yml -f docker-compose.prod.local.yml ps
```

Use Host headers when testing the local Nginx route:

```powershell
curl.exe -H "Host: studio-rc.local" http://127.0.0.1:8080/api/v1/health
curl.exe -H "Host: studio-rc.local" http://127.0.0.1:8080/
curl.exe -H "Host: admin.studio-rc.local" http://127.0.0.1:8080/login
```

Cleanup the RC project safely:

```powershell
docker compose -p studio_rc_test --env-file .codex-run/.env.production.test -f docker-compose.prod.yml -f docker-compose.prod.local.yml down
```

Do not add `-v` unless you intentionally want to remove only the disposable RC
volume and have verified the project name.
