FROM node:20-alpine AS base
RUN npm install -g pnpm@9.4.0

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @edp/shared build
RUN pnpm --filter @edp/api build
# pnpm deploy crée un répertoire avec node_modules plat (pas de symlinks pnpm)
RUN pnpm --filter @edp/api deploy --prod /app/api-deploy

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/api-deploy/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/shared/dist ./node_modules/@edp/shared/dist
COPY apps/api/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/main"]
