#!/usr/bin/env bash
# Builds a new release from git and switches to it with PM2, rolling back if
# the health check fails. Run on the server as the app user:
#   /var/www/mora/current/deploy/deploy.sh [branch]      (default: main)
# First deploy: see deploy/README.md (the script lives in the repo clone too).
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/var/www/mora}"
BRANCH="${1:-main}"
KEEP="${KEEP_RELEASES:-3}"
PORT="${PORT:-3000}"
# Corepack would otherwise ask "download pnpm? [Y/n]" and block the script.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

log() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

cd "$APP_ROOT/repo"
log "Actualizando repo ($BRANCH)"
git fetch --prune origin
SHA="$(git rev-parse "origin/$BRANCH")"
REL="$APP_ROOT/releases/$(date +%Y%m%d-%H%M%S)-${SHA:0:7}"
PREV="$(readlink -f "$APP_ROOT/current" 2>/dev/null || true)"

# A worktree (not an export) keeps git history available: the seed reads the
# legacy images from commit 39b8b90.
git worktree add --detach "$REL" "$SHA"
cd "$REL"
ln -s "$APP_ROOT/shared/.env" .env
set -a; . ./.env; set +a

log "Instalando dependencias"
pnpm install --frozen-lockfile

log "Migraciones"
# Before the build: prerendering reads the database with the new schema.
# Keep migrations additive so the running release keeps working meanwhile.
pnpm prisma migrate deploy

log "Contenido base"
# Idempotent: full seed only on an empty database; otherwise it just adds
# missing content blocks/fields and the brand assets (never overwrites edits).
pnpm db:seed

log "Build"
pnpm build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

log "Activando release ${SHA:0:7}"
ln -sfn "$REL" "$APP_ROOT/current"
pm2 startOrReload "$REL/deploy/ecosystem.config.cjs" --update-env

log "Chequeo de salud"
ok=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null; then ok=1; break; fi
  sleep 2
done
if [ "$ok" -ne 1 ]; then
  echo "✗ /healthz no responde."
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    echo "  Volviendo a $(basename "$PREV")"
    ln -sfn "$PREV" "$APP_ROOT/current"
    pm2 startOrReload "$PREV/deploy/ecosystem.config.cjs" --update-env
  fi
  exit 1
fi
pm2 save >/dev/null

log "Limpiando releases viejas (quedan $KEEP)"
cd "$APP_ROOT/repo"
ls -1dt "$APP_ROOT"/releases/*/ | tail -n +"$((KEEP + 1))" | while read -r old; do
  [ "$(readlink -f "$APP_ROOT/current")/" = "$old" ] && continue
  git worktree remove --force "$old"
done
git worktree prune

echo "✓ Deploy ${SHA:0:7} listo."
