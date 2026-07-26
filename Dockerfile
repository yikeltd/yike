# Multi-stage Coolify build — keeps peak RSS under typical Hetzner VPS limits.
# Previous single-stage + 8GB heap OOMs after static generation (exit 255).

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cap Node heap so the host is not OOM-killed during "Collecting build traces"
ENV NODE_OPTIONS=--max-old-space-size=4096
# Serialize static generation workers (1235+ pages)
ENV NEXT_BUILD_CPUS=1

# Coolify / BuildKit can inject these as build-args (Inject Build Variables).
ARG COOLIFY_SOURCE_COMMIT
ARG SOURCE_COMMIT
ARG GIT_COMMIT_SHA
ARG APP_VERSION
ENV COOLIFY_SOURCE_COMMIT=$COOLIFY_SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT
ENV GIT_COMMIT_SHA=$GIT_COMMIT_SHA
ENV APP_VERSION=$APP_VERSION

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ARG COOLIFY_SOURCE_COMMIT
ARG SOURCE_COMMIT
ARG GIT_COMMIT_SHA
ARG APP_VERSION
ENV COOLIFY_SOURCE_COMMIT=$COOLIFY_SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT
ENV GIT_COMMIT_SHA=$GIT_COMMIT_SHA
ENV APP_VERSION=$APP_VERSION

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
