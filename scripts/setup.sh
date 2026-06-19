#!/usr/bin/env bash
#
# One-command production setup for Tiny Tools + Linux Tutorials CMS.
# Domain defaults to botera.md.
#
# Usage (from the repository root):
#   EMAIL=you@botera.md ADMIN_EMAIL=admin@botera.md ADMIN_PASSWORD='secret' ./scripts/setup.sh
#
# Environment variables:
#   DOMAIN          Site domain               (default: botera.md)
#   EMAIL           Let's Encrypt contact     (default: admin@<DOMAIN>)
#   ADMIN_EMAIL     Admin account to create   (optional)
#   ADMIN_PASSWORD  Admin account password    (optional, min 8 chars)
#   SKIP_CERTS=1    Use a self-signed cert instead of Let's Encrypt
#                   (handy before DNS is pointed at the server)
#
set -euo pipefail

DOMAIN="${DOMAIN:-botera.md}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
SKIP_CERTS="${SKIP_CERTS:-0}"

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "==> Tiny Tools setup for domain: ${DOMAIN}"

command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. See DEPLOYMENT.md §2."; exit 1; }

# 1. Apply the domain to the nginx site config (idempotent).
echo "==> Configuring nginx for ${DOMAIN}"
sed -i "s/tinytools\.example/${DOMAIN}/g" nginx/conf.d/tinytools.conf

# 2. Write the build/runtime environment file.
echo "==> Writing .env"
cat > .env <<ENV
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_ANALYTICS_DOMAIN=
NEXT_PUBLIC_ANALYTICS_SRC=
NEXT_PUBLIC_DONATE_URL=
NEXT_PUBLIC_ENABLE_ADS=false
CMS_DB_PATH=/app/data/cms.db
CMS_UPLOAD_DIR=/app/data/uploads
ENV

# 3. Build the application image.
echo "==> Building the application image (this can take a few minutes)"
docker compose build

# 4. TLS certificates.
if [ "$SKIP_CERTS" = "1" ]; then
  echo "==> SKIP_CERTS=1: generating a self-signed certificate"
  mkdir -p "nginx/certbot/conf/live/${DOMAIN}" nginx/certbot/www
  docker compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
      -subj '/CN=${DOMAIN}'" certbot
  docker compose up -d
else
  echo "==> Requesting Let's Encrypt certificate (DNS for ${DOMAIN} must point here)"
  DOMAIN="${DOMAIN}" EMAIL="${EMAIL}" ./scripts/init-letsencrypt.sh
  docker compose up -d
fi

# 5. Wait for the app to become healthy.
echo "==> Waiting for the app to start"
for i in $(seq 1 30); do
  if docker compose exec -T web wget -q --spider http://127.0.0.1:3000/robots.txt 2>/dev/null; then
    echo "    app is up"
    break
  fi
  sleep 2
done

# 6. Create the admin account (the app migrates the database on boot).
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "==> Creating admin account: ${ADMIN_EMAIL}"
  docker compose exec -T web node scripts/create-admin.mjs "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
else
  echo "==> No ADMIN_EMAIL/ADMIN_PASSWORD provided. Create an admin later with:"
  echo "    docker compose exec web node scripts/create-admin.mjs <email> <password>"
fi

cat <<DONE

============================================================
Setup complete.

  Site:        https://${DOMAIN}
  Tutorials:   https://${DOMAIN}/linux-tutorials
  Admin:       https://${DOMAIN}/admin/login

Next steps:
  - Sign in at /admin/login and publish your first tutorial.
  - Data (SQLite DB + uploads) lives on the Docker volume "cms-data".
  - See DEPLOYMENT.md for DNS, backups, rollback and updates.
============================================================
DONE
