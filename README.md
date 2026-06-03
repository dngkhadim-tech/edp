# EDP – Eat • Drink • Pose

> *Partagez vos expériences, réservez vos moments.*

EDP est un réseau social nouvelle génération dédié à l'univers de la restauration, de l'hôtellerie, des bars et des lieux touristiques. Il fusionne les meilleurs aspects d'Instagram, TikTok, TripAdvisor, Booking et TheFork dans une seule plateforme.

---

## Architecture

```
edp/
├── apps/
│   ├── api/          # Backend NestJS (TypeScript)
│   ├── web/          # Frontend Next.js 15 (TypeScript)
│   └── mobile/       # App React Native / Expo
├── packages/
│   └── shared/       # Types, constantes partagés
├── infrastructure/
│   ├── docker/       # Configs Docker
│   ├── kubernetes/   # Manifests K8s
│   └── terraform/    # IaC AWS
├── .github/
│   └── workflows/    # CI/CD GitHub Actions
├── docker-compose.yml
└── scripts/
    └── setup.sh
```

## Stack Technologique

| Couche | Technologies |
|--------|-------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI |
| Mobile | React Native, Expo, expo-router |
| Backend | NestJS, TypeScript, REST API + WebSocket |
| Base de données | PostgreSQL 16 |
| Cache | Redis 7 |
| Médias | AWS S3 |
| Auth | JWT, OAuth (Google, Facebook, Apple) |
| Paiement | Stripe |
| Notifications | Firebase Cloud Messaging |
| Temps réel | Socket.io |
| Déploiement | Docker, Kubernetes, AWS EKS |
| CI/CD | GitHub Actions |

---

## Démarrage rapide

### Prérequis
- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-org/edp.git
cd edp

# Lancer le script d'installation automatique
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Démarrage manuel

```bash
# 1. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 2. Installer les dépendances
pnpm install

# 3. Démarrer les services (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 4. Démarrer le backend
pnpm --filter @edp/api dev

# 5. Démarrer le frontend
pnpm --filter @edp/web dev

# 6. Démarrer l'app mobile
pnpm --filter @edp/mobile start
```

### Avec Docker Compose (tout en un)

```bash
docker-compose up -d
```

---

## Fonctionnalités

### Authentification
- [x] Inscription email/mot de passe
- [x] Connexion email/mot de passe
- [x] OAuth Google
- [x] OAuth Facebook
- [x] OAuth Apple
- [x] Refresh token (JWT)
- [x] Double authentification (2FA)

### Réseau Social
- [x] Feed personnalisé (algorithme inspiré de TikTok/Instagram)
- [x] Stories (24h)
- [x] Reels (vidéos courtes verticales)
- [x] Publications (photos/vidéos)
- [x] Likes, commentaires, partages, sauvegardes
- [x] Hashtags et recherche
- [x] Abonnements (utilisateurs & établissements)
- [x] Chat en temps réel (Socket.io)
- [x] Notifications push (Firebase)

### Établissements
- [x] Profil restaurant (menu, horaires, carte)
- [x] Profil hôtel (chambres, équipements)
- [x] Galerie photo/vidéo
- [x] Système d'avis et de notes (1-5 étoiles)
- [x] Réponse aux avis
- [x] Géolocalisation et carte interactive (Google Maps)
- [x] Établissements à proximité

### Réservations
- [x] Réservation restaurant (date, heure, couverts)
- [x] Réservation hôtel (check-in, check-out, chambres)
- [x] Gestion des statuts (en attente, confirmé, annulé)
- [x] Notifications de confirmation

### Programme de Fidélité EDP
| Grade | Points | Avantages |
|-------|--------|-----------|
| Bronze | 0 | Badge |
| Silver | 500 | Badge + Réductions |
| Gold | 2 000 | Badge + Priorité |
| Platinum | 10 000 | Badge + Offres exclusives |
| Diamond | 50 000 | Badge + VIP |

### Administration
- [x] Dashboard avec analytics
- [x] Gestion utilisateurs
- [x] Gestion établissements (vérification)
- [x] Modération des avis signalés
- [x] Statistiques de croissance

### Monétisation
- [x] Abonnement Premium établissement (Stripe)
- [x] Checkout Stripe
- [x] Webhooks Stripe

---

## API Documentation

La documentation Swagger est disponible à : `http://localhost:4000/api/docs`

### Endpoints principaux

| Module | Préfixe |
|--------|---------|
| Auth | `POST /api/v1/auth/*` |
| Users | `GET/PATCH /api/v1/users/*` |
| Establishments | `GET/POST /api/v1/establishments/*` |
| Feed | `GET /api/v1/feed/*` |
| Posts | `GET/POST /api/v1/posts/*` |
| Reviews | `GET/POST /api/v1/reviews/*` |
| Reservations | `GET/POST /api/v1/reservations/*` |
| Loyalty | `GET /api/v1/loyalty/*` |
| Messages | `GET /api/v1/messages/*` |
| Search | `GET /api/v1/search/*` |
| Admin | `GET/PATCH /api/v1/admin/*` |

---

## Base de Données

### Extensions PostgreSQL utilisées
- `uuid-ossp` : génération UUID
- `earthdistance` + `cube` : calcul de distances géographiques
- `pg_trgm` : recherche full-text fuzzy

### Migration

```bash
# Lancer les migrations
pnpm --filter @edp/api db:migrate

# Seeder la base de données
pnpm --filter @edp/api db:seed
```

---

## Déploiement

### Production AWS (EKS)

```bash
# Build & push images
docker build -t ghcr.io/your-org/edp-api:latest -f apps/api/Dockerfile .
docker push ghcr.io/your-org/edp-api:latest

# Déploiement K8s
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/postgres.yaml
kubectl apply -f infrastructure/kubernetes/redis.yaml
kubectl apply -f infrastructure/kubernetes/api-deployment.yaml
kubectl apply -f infrastructure/kubernetes/web-deployment.yaml
```

### CI/CD GitHub Actions

Le pipeline CI/CD se déclenche automatiquement :
- **Pull Request** → Lint + Tests
- **Push sur `develop`** → Build + Deploy staging
- **Push sur `main`** → Build + Deploy production

---

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète.

---

## Tests

```bash
# Tests unitaires
pnpm test

# Tests avec couverture
pnpm test -- --coverage
```

---

## Comptes de test

Après le seeding :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@edp.app | Admin@EDP2024! |
| User | test@edp.app | User@EDP2024! |

---

## License

Copyright © 2024 EDP. Tous droits réservés.
