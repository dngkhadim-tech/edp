#!/bin/bash
set -e

# ── Couleurs ──────────────────────────────────────────────────
GREEN='\033[0;32m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

export PATH="/usr/local/bin:$PATH"

log() { echo -e "${GOLD}[EDP]${NC} $1"; }
ok()  { echo -e "${GREEN}✓${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ── Config ─────────────────────────────────────────────────────
API_PORT=4000
WEB_PORT=3000
DB_URL="postgresql://edp_user:edp_password@localhost:5432/edp_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="edp-local-jwt-secret-super-secure-2024"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "  ███████╗██████╗ ██████╗ "
echo "  ██╔════╝██╔══██╗██╔══██╗"
echo "  █████╗  ██║  ██║██████╔╝"
echo "  ██╔══╝  ██║  ██║██╔═══╝ "
echo "  ███████╗██████╔╝██║     "
echo "  ╚══════╝╚═════╝ ╚═╝     "
echo "  Eat • Drink • Pose"
echo ""

# ── Vérifications ──────────────────────────────────────────────
log "Vérification des prérequis..."
command -v node >/dev/null 2>&1 || err "Node.js requis"
command -v pnpm >/dev/null 2>&1 || err "pnpm requis (brew install pnpm)"
command -v colima >/dev/null 2>&1 || { log "Colima non trouvé, Docker requis"; }
ok "Prérequis OK"

# ── Docker ─────────────────────────────────────────────────────
log "Démarrage Docker (Colima)..."
colima start 2>/dev/null || true
ok "Colima démarré"

log "Démarrage PostgreSQL et Redis..."
cd "$ROOT" && docker compose up -d postgres redis 2>/dev/null
until docker compose exec -T postgres pg_isready -U edp_user -d edp_db 2>/dev/null; do
  echo -n "." && sleep 2
done
echo ""
ok "PostgreSQL prêt"

docker compose exec -T redis redis-cli ping >/dev/null 2>&1 && ok "Redis prêt"

# ── Build (si nécessaire) ───────────────────────────────────────
if [ ! -f "$ROOT/apps/api/dist/main.js" ]; then
  log "Build API..."
  cd "$ROOT/packages/shared" && pnpm build 2>/dev/null
  cd "$ROOT/apps/api" && node_modules/.bin/nest build
  ok "API compilée"
fi

if [ ! -f "$ROOT/apps/web/.next/BUILD_ID" ]; then
  log "Build Web..."
  cd "$ROOT/apps/web" && NEXT_PUBLIC_API_URL=http://localhost:$API_PORT node_modules/.bin/next build . 2>/dev/null
  ok "Web compilé"
fi

# ── Seed (si vide) ─────────────────────────────────────────────
COUNT=$(docker compose exec -T postgres psql -U edp_user -d edp_db -t -c "SELECT COUNT(*) FROM users" 2>/dev/null | tr -d ' \n')
if [ "$COUNT" -lt "3" ] 2>/dev/null; then
  log "Seeding de la base de données..."
  cd "$ROOT/apps/api" && node src/database/seeds/rich-seed.js 2>/dev/null
  ok "Base de données seedée"
fi

# ── API ────────────────────────────────────────────────────────
log "Démarrage API (port $API_PORT)..."
pkill -f "node dist/main" 2>/dev/null || true
sleep 1
cd "$ROOT/apps/api"
DATABASE_URL="$DB_URL" REDIS_URL="$REDIS_URL" \
JWT_SECRET="$JWT_SECRET" JWT_REFRESH_SECRET="$JWT_SECRET" \
NODE_ENV="development" PORT="$API_PORT" \
APP_URL="http://localhost:$WEB_PORT" API_URL="http://localhost:$API_PORT" \
AWS_ACCESS_KEY_ID="local" AWS_SECRET_ACCESS_KEY="local" \
AWS_REGION="eu-west-1" AWS_S3_BUCKET="edp-media-local" \
node dist/main.js > /tmp/edp-api.log 2>&1 &
until grep -q "EDP API running" /tmp/edp-api.log 2>/dev/null; do
  echo -n "." && sleep 2
done
echo ""
ok "API démarrée → http://localhost:$API_PORT"

# ── Web ────────────────────────────────────────────────────────
log "Démarrage Web (port $WEB_PORT)..."
pkill -f "next start" 2>/dev/null || true
sleep 1
NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" \
"$ROOT/apps/web/node_modules/.bin/next" start "$ROOT/apps/web" -p "$WEB_PORT" > /tmp/edp-web.log 2>&1 &
until grep -qE "Ready" /tmp/edp-web.log 2>/dev/null; do
  echo -n "." && sleep 2
done
echo ""
ok "Web démarré → http://localhost:$WEB_PORT"

# ── Résumé ─────────────────────────────────────────────────────
echo ""
echo -e "${GOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GOLD}║${NC}  EDP est prêt ! 🎉                          ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  Web    → http://localhost:$WEB_PORT            ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  API    → http://localhost:$API_PORT            ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  Docs   → http://localhost:$API_PORT/api/docs   ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}                                              ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  Admin  → admin@edp.app / Admin@EDP2024!     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  Test   → test@edp.app  / User@EDP2024!      ${GOLD}║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
