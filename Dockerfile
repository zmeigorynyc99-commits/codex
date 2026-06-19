# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
# libc6-compat helps native deps run on Alpine; build tools allow
# better-sqlite3 to compile if no musl prebuilt binary is available.
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so they must be provided here.
ARG NEXT_PUBLIC_SITE_URL=https://tinytools.example
ARG NEXT_PUBLIC_ANALYTICS_DOMAIN=
ARG NEXT_PUBLIC_ANALYTICS_SRC=
ARG NEXT_PUBLIC_DONATE_URL=
ARG NEXT_PUBLIC_ENABLE_ADS=false
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ANALYTICS_DOMAIN=$NEXT_PUBLIC_ANALYTICS_DOMAIN \
    NEXT_PUBLIC_ANALYTICS_SRC=$NEXT_PUBLIC_ANALYTICS_SRC \
    NEXT_PUBLIC_DONATE_URL=$NEXT_PUBLIC_DONATE_URL \
    NEXT_PUBLIC_ENABLE_ADS=$NEXT_PUBLIC_ENABLE_ADS \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CMS_DB_PATH=/app/data/cms.db \
    CMS_UPLOAD_DIR=/app/data/uploads

# libstdc++ is required at runtime by the better-sqlite3 native addon.
RUN apk add --no-cache libstdc++

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output bundles only what is needed to run the server.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Admin/maintenance scripts (e.g. create-admin) for `docker compose exec`.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Persistent data directory (SQLite database + uploaded images).
RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data

USER nextjs
VOLUME ["/app/data"]
EXPOSE 3000

# Lightweight container healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/robots.txt || exit 1

CMD ["node", "server.js"]
