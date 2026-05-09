# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-placeholder
ENV SUPABASE_SERVICE_ROLE_KEY=service-role-placeholder
ENV NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/nexus_harbor
ENV ADMIN_EMAILS=admin@example.com
ENV ADMIN_USER_IDS=00000000-0000-0000-0000-000000000000
ENV ALLOW_UNRESTRICTED_ADMIN=false
ENV ALLOWED_DEV_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RUN pnpm build

FROM base AS poller
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "poller:start"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
