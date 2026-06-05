.PHONY: start stop restart dev build seed test clean logs help \
        prod-up prod-down prod-deploy prod-migrate prod-logs prod-status \
        k8s-apply k8s-secrets k8s-migrate k8s-status docker-build docker-push

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

## Seeder la base de données (données de base)
seed:
	@echo "Seeding données de base..."
	@cd apps/api && node src/database/seeds/rich-seed.js
	@echo "Seed terminé."

## Enrichir la base (follows, réservations, commentaires, loyalty)
seed-enrich:
	@echo "Enrichissement des données..."
	@docker exec -i edp_postgres psql -U edp_user -d edp_db < apps/api/src/database/seeds/enrich.sql
	@echo "Enrichissement terminé."

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

# ───────────────────────────────────────────────────────────────
# Production (docker-compose.prod.yml)
# ───────────────────────────────────────────────────────────────
IMAGE_TAG ?= latest
REGISTRY  := ghcr.io/dngkhadim-tech

## Démarrer la stack de production (VPS/local)
prod-up:
	@docker compose -f docker-compose.prod.yml --env-file .env.production up -d

## Arrêter la stack de production
prod-down:
	@docker compose -f docker-compose.prod.yml down

## Redéployer avec une nouvelle image (IMAGE_TAG=sha)
prod-deploy:
	@IMAGE_TAG=$(IMAGE_TAG) docker compose -f docker-compose.prod.yml --env-file .env.production pull
	@IMAGE_TAG=$(IMAGE_TAG) docker compose -f docker-compose.prod.yml --env-file .env.production up -d --no-build

## Logs de production
prod-logs:
	@docker compose -f docker-compose.prod.yml logs -f --tail=100

## Statut de production
prod-status:
	@docker compose -f docker-compose.prod.yml ps

# ───────────────────────────────────────────────────────────────
# Build & push images Docker
# ───────────────────────────────────────────────────────────────

## Builder les images Docker localement
docker-build:
	@echo "Build API..."
	@docker build -f apps/api/Dockerfile -t $(REGISTRY)/edp-api:$(IMAGE_TAG) .
	@echo "Build Web..."
	@docker build -f apps/web/Dockerfile -t $(REGISTRY)/edp-web:$(IMAGE_TAG) .
	@echo "Images buildées : $(REGISTRY)/edp-api:$(IMAGE_TAG) et $(REGISTRY)/edp-web:$(IMAGE_TAG)"

## Pousser les images vers ghcr.io
docker-push:
	@docker push $(REGISTRY)/edp-api:$(IMAGE_TAG)
	@docker push $(REGISTRY)/edp-web:$(IMAGE_TAG)

# ───────────────────────────────────────────────────────────────
# Kubernetes
# ───────────────────────────────────────────────────────────────

## Appliquer tous les manifests Kubernetes (namespace, configmap, deployments)
k8s-apply:
	@kubectl apply -f infrastructure/kubernetes/namespace.yaml
	@kubectl apply -f infrastructure/kubernetes/configmap.yaml
	@kubectl apply -f infrastructure/kubernetes/postgres.yaml -n edp
	@kubectl apply -f infrastructure/kubernetes/redis.yaml -n edp
	@kubectl apply -f infrastructure/kubernetes/api-deployment.yaml -n edp
	@kubectl apply -f infrastructure/kubernetes/web-deployment.yaml -n edp
	@echo "Manifests appliqués."

## Créer le secret Kubernetes depuis .env.production
k8s-secrets:
	@kubectl create secret generic edp-secrets --from-env-file=.env.production -n edp --dry-run=client -o yaml | kubectl apply -f -
	@echo "Secret edp-secrets mis à jour."

## Lancer la migration DB en Kubernetes
k8s-migrate:
	@kubectl delete job edp-migration -n edp --ignore-not-found
	@sed "s/IMAGE_TAG/$(IMAGE_TAG)/g" infrastructure/kubernetes/migration-job.yaml | kubectl apply -f - -n edp
	@kubectl wait --for=condition=complete job/edp-migration -n edp --timeout=120s
	@echo "Migration terminée."

## Statut des pods Kubernetes
k8s-status:
	@kubectl get pods,svc,ingress -n edp

## Aide
help:
	@echo "EDP – Eat • Drink • Pose"
	@echo ""
	@echo "Commandes disponibles:"
	@grep -E '^##' $(MAKEFILE_LIST) | sed 's/^## /  /'
