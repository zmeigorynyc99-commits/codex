#!/usr/bin/env bash
#
# One-command production setup for botera (Tiny Tools + Linux Tutorials CMS
# + Forum + Comments). Installs Docker if needed (Debian 13.x / Ubuntu),
# configures the domain, builds, issues HTTPS, starts the stack and creates an
# admin account.
#
# Run from the repository root. Use sudo if Docker is not yet installed:
#   sudo EMAIL=you@botera.md ADMIN_EMAIL=admin@botera.md ADMIN_PASSWORD='secret' ./scripts/setup.sh
#
# Variables:
#   DOMAIN          Site domain               (default: botera.md)
#   EMAIL           Let's Encrypt contact     (default: admin@<DOMAIN>)
#   ADMIN_EMAIL     Admin account to create   (optional)
#   ADMIN_PASSWORD  Admin account password    (optional, min 8 chars)
#   SKIP_CERTS=1    Use a self-signed cert instead of Let's Encrypt
#   SKIP_DOCKER_INSTALL=1   Do not attempt to install Docker
#
set -euo pipefail

DOMAIN="${DOMAIN:-botera.md}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
SKIP_CERTS="${SKIP_CERTS:-0}"
SKIP_DOCKER_INSTALL="${SKIP_DOCKER_INSTALL:-0}"

cd "$(dirname "$0")/.."

echo "==> botera setup for domain: ${DOMAIN}"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then SUDO="sudo"; fi
fi

install_docker() {
  echo "==> Installing Docker Engine + Compose (Debian/Ubuntu)"
  # Official convenience script: supports Debian 13 (trixie), Ubuntu, etc.
  if ! command -v curl >/dev/null 2>&1; then
    $SUDO apt-get update -y && $SUDO apt-get install -y curl ca-certificates
  fi
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  $SUDO sh /tmp/get-docker.sh
  $SUDO systemctl enable --now docker 2>/dev/null || true
  if [ -n "${SUDO_USER:-}" ]; then $SUDO usermod -aG docker "${SUDO_USER}" 2>/dev/null || true; fi
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return
  fi
  if [ "$SKIP_DOCKER_INSTALL" = "1" ]; then
    echo "Docker not found and SKIP_DOCKER_INSTALL=1. Install Docker first. See DEPLOYMENT.md."
    exit 1
  fi
  if command -v apt-get >/dev/null 2>&1; then
    install_docker
  else
    echo "Automatic Docker install only supports Debian/Ubuntu. Install Docker manually (DEPLOYMENT.md §2)."
    exit 1
  fi
}

ensure_docker

# Choose how to invoke docker (with sudo if the socket isn't accessible yet).
if docker info >/dev/null 2>&1; then
  DOCKER="docker"
else
  DOCKER="$SUDO docker"
fi
export DOCKER
echo "==> Using docker command: ${DOCKER}"

# 1. Apply the domain to the nginx site config (idempotent).
echo "==> Configuring nginx for ${DOMAIN}"
sed -i "s/tinytools\.example/${DOMAIN}/g" nginx/conf.d/tinytools.conf

# 2. Write the build/runtime environment file.
echo "==> Writing .env"
# Support links default to the project's Ko-fi page; override with env vars.
KOFI_URL="${KOFI_URL:-https://ko-fi.com/zmeigorynyc}"
DONATE_URL="${DONATE_URL:-$KOFI_URL}"
COFFEE_URL="${COFFEE_URL:-$KOFI_URL}"
SUPPORT_URL="${SUPPORT_URL:-$KOFI_URL}"
# A random salt for hashing stored IPs (used for privacy; real IPs are also kept).
IP_SALT="${CMS_IP_SALT:-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n' 2>/dev/null || echo botera-$(date +%s))}"
# A random IndexNow key for instant Bing/Yandex indexing.
INDEXNOW="${INDEXNOW_KEY:-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n' 2>/dev/null || echo $(date +%s)key)}"

cat > .env <<ENV
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_ANALYTICS_DOMAIN=
NEXT_PUBLIC_ANALYTICS_SRC=
NEXT_PUBLIC_DONATE_URL=${DONATE_URL}
NEXT_PUBLIC_COFFEE_URL=${COFFEE_URL}
NEXT_PUBLIC_SUPPORT_URL=${SUPPORT_URL}
NEXT_PUBLIC_ENABLE_ADS=false
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION:-}
NEXT_PUBLIC_BING_SITE_VERIFICATION=${BING_SITE_VERIFICATION:-}
NEXT_PUBLIC_YANDEX_SITE_VERIFICATION=${YANDEX_SITE_VERIFICATION:-}
INDEXNOW_KEY=${INDEXNOW}
CMS_DB_PATH=/app/data/cms.db
CMS_UPLOAD_DIR=/app/data/uploads
CMS_IP_SALT=${IP_SALT}
ENV

# 3. Build the application image.
echo "==> Building the application image (this can take a few minutes)"
$DOCKER compose build

# 4. TLS certificates.
if [ "$SKIP_CERTS" = "1" ]; then
  echo "==> SKIP_CERTS=1: generating a self-signed certificate"
  mkdir -p "nginx/certbot/conf/live/${DOMAIN}" nginx/certbot/www
  $DOCKER compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
      -subj '/CN=${DOMAIN}'" certbot
  $DOCKER compose up -d
else
  echo "==> Requesting Let's Encrypt certificate (DNS for ${DOMAIN} must point here)"
  DOMAIN="${DOMAIN}" EMAIL="${EMAIL}" DOCKER="${DOCKER}" ./scripts/init-letsencrypt.sh
  $DOCKER compose up -d
fi

# 5. Wait for the app to become healthy.
echo "==> Waiting for the app to start"
for _ in $(seq 1 30); do
  if $DOCKER compose exec -T web wget -q --spider http://127.0.0.1:3000/robots.txt 2>/dev/null; then
    echo "    app is up"
    break
  fi
  sleep 2
done

# 6. Create the admin account (the app migrates the database on boot).
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "==> Creating admin account: ${ADMIN_EMAIL}"
  $DOCKER compose exec -T web node scripts/create-admin.mjs "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
else
  echo "==> No ADMIN_EMAIL/ADMIN_PASSWORD provided. Create an admin later with:"
  echo "    ${DOCKER} compose exec web node scripts/create-admin.mjs <email> <password>"
fi

cat <<DONE

============================================================
Setup complete.

  Site:        https://${DOMAIN}
  Tutorials:   https://${DOMAIN}/linux-tutorials
  Forum:       https://${DOMAIN}/forum
  Admin:       https://${DOMAIN}/admin/login

Next steps:
  - Sign in at /admin/login and publish your first tutorial.
  - Moderate comments, forum posts and the contact inbox in the admin area.
  - Data (SQLite DB + uploads) lives on the Docker volume "cms-data".
  - See DEPLOYMENT.md for DNS, backups, rollback and updates.
============================================================
DONE
