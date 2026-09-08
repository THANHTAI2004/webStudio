# Backup And Restore

Production includes a `backup` service based on the Mongo 8 image. It runs
`mongodump` and archives uploads into timestamped folders under `data/backups`.
The image runs as UID/GID `1000:1000`; run
`infrastructure/scripts/prepare-server.sh` so `data/backups` is writable.

## Automatic Backups

The backup container loops forever:

- run a backup
- sleep `BACKUP_INTERVAL_SECONDS`
- repeat

Defaults:

- interval: `86400` seconds
- retention: `14` days
- timestamp format: UTC `YYYY-MM-DD_HH-mm-ss`

Each successful backup contains:

- `mongodb.archive.gz`
- `uploads.tar.gz`

Backups are created in a temp directory and renamed only after Mongo and upload
archives succeed.

## Manual Backup

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backup /backup/run-once.sh
```

## List Backups

```bash
ls -lah data/backups
```

## Restore

Restore is never automatic. It can overwrite MongoDB data and uploads.

Run restore only after stopping write traffic and confirming the backup folder:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop web admin api nginx

docker compose --env-file .env.production -f docker-compose.prod.yml run --rm \
  -e RESTORE_CONFIRM=yes \
  -v ./data/uploads:/uploads \
  backup /backup/restore.sh /backups/YYYY-MM-DD_HH-mm-ss

docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

The restore script checks that the backup directory is inside `/backups` and
that both archive files exist before it starts.

## Off-Server Copies

Backups stored in `data/backups` are on the same server. That is useful for
operator mistakes, but not enough for disaster recovery. Copy backups to a NAS,
another server, or object storage using your own server automation.

## Restore Testing

Test restore on a disposable server or local compose project before trusting a
backup process. Never test destructive restore against the live database first.
