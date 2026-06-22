# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
# Patch any outstanding OS-package CVEs in the base image, then add the
# build deps. libc6-compat helps native deps run on Alpine; build tools
# allow better-sqlite3 to compile if no musl prebuilt binary is available.
RUN apk upgrade --no-cache \
  && apk add --no-cache libc6-compat python3 make g++
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
ARG NEXT_PUBLIC_COFFEE_URL=
ARG NEXT_PUBLIC_SUPPORT_URL=
ARG NEXT_PUBLIC_ENABLE_ADS=false
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
ARG NEXT_PUBLIC_BING_SITE_VERIFICATION=
ARG NEXT_PUBLIC_YANDEX_SITE_VERIFICATION=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ANALYTICS_DOMAIN=$NEXT_PUBLIC_ANALYTICS_DOMAIN \
    NEXT_PUBLIC_ANALYTICS_SRC=$NEXT_PUBLIC_ANALYTICS_SRC \
    NEXT_PUBLIC_DONATE_URL=$NEXT_PUBLIC_DONATE_URL \
    NEXT_PUBLIC_COFFEE_URL=$NEXT_PUBLIC_COFFEE_URL \
    NEXT_PUBLIC_SUPPORT_URL=$NEXT_PUBLIC_SUPPORT_URL \
    NEXT_PUBLIC_ENABLE_ADS=$NEXT_PUBLIC_ENABLE_ADS \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    NEXT_PUBLIC_BING_SITE_VERIFICATION=$NEXT_PUBLIC_BING_SITE_VERIFICATION \
    NEXT_PUBLIC_YANDEX_SITE_VERIFICATION=$NEXT_PUBLIC_YANDEX_SITE_VERIFICATION \
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

# Patch OS-package CVEs in the runtime base image. libstdc++ is required at
# runtime by the better-sqlite3 native addon.
RUN apk upgrade --no-cache \
  && apk add --no-cache libstdc++

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output bundles only what is needed to run the server.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Admin/maintenance scripts (e.g. create-admin, import-content).
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
# Curriculum source: lessons are imported into the CMS on startup (no manual
# uploads). The importer reads from /app/content/curriculum.
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

# Persistent data directory (SQLite database + uploaded images).
RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data

USER nextjs
VOLUME ["/app/data"]
EXPOSE 3000

# Lightweight container healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/robots.txt || exit 1

# Import the curriculum into the CMS database (idempotent, non-destructive),
# then start the server. The importer prunes lessons whose source file was
# removed so the catalogue always matches the repository.
CMD ["sh", "-c", "node scripts/import-content.mjs --prune; node server.js"]
