.PHONY: start stop restart dev build seed test clean logs help

# ───────────────────────────────────────────────────────────────
# Variables
# ───────────────────────────────────────────────────────────────
SHELL := /bin/bash
export PATH := /usr/local/bin:$(PATH)

API_PORT    ?= 4000
WEB_PORT    ?= 3000
DB_URL      ?= postgresql://edp_user:edp_password@localhost:5432/edp_db
REDIS_URL   ?= redis://localhost:6379
JWT_SECRET  ?= edp-local-jwt-secret-super-secure-2024

# ───────────────────────────────────────────────────────────────
# Commandes principales
# ───────────────────────────────────────────────────────────────

## Démarrer tous les services (Docker + API + Web)
start: docker-up api-start web-start
	@echo ""
	@echo "╔══════════════════════════════════════════╗"
	@echo "║  EDP est démarré !                       ║"
	@echo "║  Web  → http://localhost:$(WEB_PORT)           ║"
	@echo "║  API  → http://localhost:$(API_PORT)           ║"
	@echo "║  Docs → http://localhost:$(API_PORT)/api/docs  ║"
	@echo "╚══════════════════════════════════════════╝"

## Arrêter tous les services
stop:
	@echo "Arrêt des services..."
	@pkill -f "node dist/main" 2>/dev/null || true
	@pkill -f "next start" 2>/dev/null || true
	@docker compose stop 2>/dev/null || true
	@echo "Services arrêtés."

## Redémarrer
restart: stop start

## Mode développement (hot-reload)
dev: docker-up
	@echo "Mode développement..."
	@DATABASE_URL=$(DB_URL) REDIS_URL=$(REDIS_URL) \
	  JWT_SECRET=$(JWT_SECRET) JWT_REFRESH_SECRET=$(JWT_SECRET) \
	  NODE_ENV=development PORT=$(API_PORT) \
	  pnpm --filter @edp/api dev &
	@cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:$(API_PORT) \
	  node_modules/.bin/next dev -p $(WEB_PORT) &
	@echo "Dev servers démarrés."

## Construire les applications
build: build-shared build-api build-web
	@echo "Build complet."

build-shared:
	@echo "Build shared..."
	@pnpm --filter @edp/shared build

build-api: build-shared
	@echo "Build API..."
	@cd apps/api && node_modules/.bin/nest build

build-web: build-shared
	@echo "Build Web..."
	@cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:$(API_PORT) \
	  node_modules/.bin/next build $(shell pwd)/apps/web

## Seeder la base de données
seed:
	@echo "Seeding..."
	@cd apps/api && node src/database/seeds/rich-seed.js
	@echo "Seed terminé."

## Lancer les tests unitaires
test:
	@pnpm --filter @edp/api test

## Lancer les tests E2E
test-e2e:
	@pnpm --filter @edp/web exec playwright test

## Nettoyage
clean:
	@find . -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	@echo "Nettoyage effectué."

## Afficher les logs
logs:
	@echo "=== API ===" && tail -50 /tmp/edp-api.log 2>/dev/null || echo "API non démarrée"
	@echo "=== Web ===" && tail -20 /tmp/edp-web.log 2>/dev/null || echo "Web non démarré"

## Statut des services
status:
	@echo "Docker containers:"
	@docker compose ps 2>/dev/null || echo "Docker non disponible"
	@echo ""
	@echo "API (port $(API_PORT)):"
	@curl -sf http://localhost:$(API_PORT)/api/v1/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "API non disponible"
	@echo ""
	@echo "Web (port $(WEB_PORT)):"
	@curl -sf http://localhost:$(WEB_PORT) -o /dev/null && echo "OK" || echo "Web non disponible"

# ───────────────────────────────────────────────────────────────
# Internes
# ───────────────────────────────────────────────────────────────
docker-up:
	@echo "Démarrage Docker..."
	@colima start 2>/dev/null || true
	@docker compose up -d postgres redis 2>/dev/null || true
	@until docker compose exec -T postgres pg_isready -U edp_user -d edp_db 2>/dev/null; do sleep 2; done
	@echo "PostgreSQL et Redis prêts."

api-start:
	@echo "Démarrage API..."
	@pkill -f "node dist/main" 2>/dev/null || true
	@DATABASE_URL=$(DB_URL) REDIS_URL=$(REDIS_URL) \
	  JWT_SECRET=$(JWT_SECRET) JWT_REFRESH_SECRET=$(JWT_SECRET) \
	  NODE_ENV=development PORT=$(API_PORT) \
	  APP_URL=http://localhost:$(WEB_PORT) API_URL=http://localhost:$(API_PORT) \
	  AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local AWS_REGION=eu-west-1 \
	  node apps/api/dist/main.js > /tmp/edp-api.log 2>&1 &
	@until grep -q "EDP API running" /tmp/edp-api.log 2>/dev/null; do sleep 2; done
	@echo "API démarrée sur http://localhost:$(API_PORT)"

web-start:
	@echo "Démarrage Web..."
	@pkill -f "next start" 2>/dev/null || true
	@NEXT_PUBLIC_API_URL=http://localhost:$(API_PORT) \
	  apps/web/node_modules/.bin/next start $(shell pwd)/apps/web -p $(WEB_PORT) > /tmp/edp-web.log 2>&1 &
	@until grep -qE "Ready" /tmp/edp-web.log 2>/dev/null; do sleep 2; done
	@echo "Web démarré sur http://localhost:$(WEB_PORT)"

## Aide
help:
	@echo "EDP – Eat • Drink • Pose"
	@echo ""
	@echo "Commandes disponibles:"
	@grep -E '^##' $(MAKEFILE_LIST) | sed 's/^## /  /'
