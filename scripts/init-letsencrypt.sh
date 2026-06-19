#!/usr/bin/env bash
# Bootstrap Let's Encrypt certificates for first-time HTTPS setup.
#
# Usage:
#   DOMAIN=tinytools.example EMAIL=you@example.com ./scripts/init-letsencrypt.sh
#
# This solves the chicken-and-egg problem where nginx won't start without a
# certificate, but certbot needs nginx running to complete the HTTP challenge.
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=tinytools.example}"
EMAIL="${EMAIL:?Set EMAIL, e.g. EMAIL=you@example.com}"
STAGING="${STAGING:-0}" # set STAGING=1 to test against Let's Encrypt staging

CERT_DIR="./nginx/certbot/conf"
WWW_DIR="./nginx/certbot/www"
LIVE="$CERT_DIR/live/$DOMAIN"

mkdir -p "$WWW_DIR" "$LIVE"

echo "==> Creating a temporary self-signed certificate so nginx can start"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'" certbot

echo "==> Starting nginx + app"
docker compose up -d nginx web

echo "==> Deleting the temporary certificate"
docker compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

STAGING_ARG=""
if [ "$STAGING" != "0" ]; then STAGING_ARG="--staging"; fi

echo "==> Requesting the real certificate from Let's Encrypt"
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL --agree-tos --no-eff-email \
    -d $DOMAIN -d www.$DOMAIN" certbot

echo "==> Reloading nginx with the new certificate"
docker compose exec nginx nginx -s reload

echo "==> Done. HTTPS should now be live at https://$DOMAIN"
