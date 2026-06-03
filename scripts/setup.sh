#!/bin/bash
set -e

echo "=========================================="
echo " EDP – Eat • Drink • Pose"
echo " Setup Script"
echo "=========================================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js >= 20 is required. Aborting."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { npm install -g pnpm; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Aborting."; exit 1; }

# Copy environment file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — please configure it!"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Start infrastructure
echo ""
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for postgres
echo "Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U edp_user -d edp_db; do
  sleep 2
done

# Run migrations
echo ""
echo "Running database migrations..."
pnpm --filter @edp/api db:migrate || echo "Migrations will run on first start (synchronize mode)"

# Run seeds
echo ""
echo "Seeding database..."
pnpm --filter @edp/api db:seed || echo "Seeding skipped"

echo ""
echo "=========================================="
echo " Setup complete!"
echo ""
echo " Start the API:  pnpm --filter @edp/api dev"
echo " Start the Web:  pnpm --filter @edp/web dev"
echo " Start mobile:   pnpm --filter @edp/mobile start"
echo " Or run all:     pnpm dev"
echo ""
echo " API:   http://localhost:4000"
echo " Web:   http://localhost:3000"
echo " Docs:  http://localhost:4000/api/docs"
echo "=========================================="
