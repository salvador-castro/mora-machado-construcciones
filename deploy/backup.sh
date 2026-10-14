#!/usr/bin/env bash
# Daily backup: database (pg_dump custom format) + uploaded media.
# Keeps BACKUP_KEEP_DAYS days locally; copies off-site when BACKUP_RCLONE_REMOTE
# is set in shared/.env (e.g. "gdrive:mora-backups", configured with `rclone config`).
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/var/www/mora}"
DEST="$APP_ROOT/backups"
set -a; . "$APP_ROOT/shared/.env"; set +a
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%F)"

mkdir -p "$DEST"
# pg_dump rejects Prisma's ?schema=public query parameter.
pg_dump --format=custom --no-owner --file="$DEST/db-$STAMP.dump" "${DATABASE_URL%%\?*}"
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

find "$DEST" -type f -mtime +"$KEEP_DAYS" -delete

if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  rclone copy "$DEST" "$BACKUP_RCLONE_REMOTE" --max-age 48h
fi
echo "[backup] $(date -Is) ok: $(du -sh "$DEST" | cut -f1) en $DEST"
