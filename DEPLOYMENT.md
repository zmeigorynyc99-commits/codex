# Deployment Guide — Tiny Tools on an Ubuntu VPS

This guide takes you from a fresh Ubuntu server to a live, HTTPS-secured site
running in Docker behind Nginx. Commands assume Ubuntu 22.04/24.04 LTS and a
non-root user with `sudo`.

Throughout, replace `tinytools.example` with your real domain and
`you@example.com` with your real email.

---

## 0. What you need

- A small VPS (1 vCPU / 1 GB RAM is enough; the app is capped at 256 MB).
- A domain name you control.
- SSH access to the server.

---

## 1. DNS

Point your domain at the server's public IP. Create two `A` records (and `AAAA`
records if you have IPv6):

| Type | Name  | Value            | TTL  |
|------|-------|------------------|------|
| A    | `@`   | `YOUR.SERVER.IP` | 3600 |
| A    | `www` | `YOUR.SERVER.IP` | 3600 |

Verify propagation before continuing:

```bash
dig +short tinytools.example
dig +short www.tinytools.example
```

Both must return your server IP.

---

## 2. Server preparation

SSH in and install Docker Engine + the Compose plugin:

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git ufw

# Docker's official repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Run docker without sudo (log out/in afterwards)
sudo usermod -aG docker $USER
```

Configure the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

## 3. Get the code

```bash
sudo mkdir -p /opt/tiny-tools && sudo chown $USER:$USER /opt/tiny-tools
git clone https://github.com/<your-account>/<your-repo>.git /opt/tiny-tools
cd /opt/tiny-tools
```

Create the build-time environment file:

```bash
cp .env.example .env
nano .env   # set NEXT_PUBLIC_SITE_URL=https://tinytools.example
```

`NEXT_PUBLIC_*` values are baked into the static build, so set them **before**
building.

---

## 4. Configure Nginx for your domain

Edit `nginx/conf.d/tinytools.conf` and replace every `tinytools.example` with
your domain.

---

## 5. Issue HTTPS certificates

Run the bootstrap script once. It starts Nginx with a temporary self-signed
certificate, completes the Let's Encrypt HTTP-01 challenge, then swaps in the
real certificate:

```bash
DOMAIN=tinytools.example EMAIL=you@example.com ./scripts/init-letsencrypt.sh
```

> Tip: add `STAGING=1` the first time to avoid hitting rate limits while
> testing, then re-run without it for the real certificate.

The `certbot` service in `docker-compose.yml` automatically renews
certificates every 12 hours.

---

## 6. Build and start everything

```bash
docker compose build web
docker compose up -d
docker compose ps
```

Visit `https://tinytools.example`. You should see the site with a valid
certificate.

Check the security headers:

```bash
curl -sI https://tinytools.example | grep -i -E "content-security|strict-transport|x-frame"
```

---

## 7. Updating (zero-ish downtime)

```bash
cd /opt/tiny-tools
git pull origin main
docker compose build web
docker compose up -d        # recreates only changed containers
docker image prune -f
```

Or let the GitHub Actions **Deploy** workflow do this automatically on every
push to `main` (see below).

---

## 8. Backups

The app is stateless — there is no database. The only state worth backing up is
your TLS certificates and environment file:

```bash
# Back up certs + env to a timestamped tarball
tar czf ~/tinytools-backup-$(date +%F).tar.gz \
  -C /opt/tiny-tools .env nginx/certbot/conf

# Copy it off the server
scp ~/tinytools-backup-*.tar.gz you@backup-host:/backups/
```

To restore, extract the tarball back into `/opt/tiny-tools` before
`docker compose up -d`.

Because the source lives in Git, the application itself is always recoverable by
re-cloning.

---

## 9. Rollback

Every deploy is a Git commit, so rolling back is checking out a known-good
commit and rebuilding:

```bash
cd /opt/tiny-tools
git log --oneline -n 10            # find the last good commit
git checkout <good-commit-sha>
docker compose build web
docker compose up -d
```

To return to the latest:

```bash
git checkout main && git pull origin main
docker compose build web && docker compose up -d
```

If a build is broken and you need the site up immediately, the previous Docker
image is still cached; `docker compose up -d` without rebuilding restarts the
last working image.

---

## 10. Automated deploys (GitHub Actions)

The `.github/workflows/deploy.yml` workflow SSHes into the VPS, pulls `main`,
rebuilds and restarts. Add these repository secrets
(**Settings → Secrets and variables → Actions**):

| Secret            | Example                         |
|-------------------|---------------------------------|
| `VPS_HOST`        | `203.0.113.10`                  |
| `VPS_USER`        | `deploy`                        |
| `VPS_SSH_KEY`     | contents of a private SSH key   |
| `VPS_APP_DIR`     | `/opt/tiny-tools`               |
| `SITE_URL`        | `https://tinytools.example`     |
| `ANALYTICS_DOMAIN`| *(optional)*                    |
| `ANALYTICS_SRC`   | *(optional)*                    |
| `DONATE_URL`      | *(optional)*                    |
| `ENABLE_ADS`      | `false`                         |

Generate a deploy key on the server and add the public half to
`~/.ssh/authorized_keys`:

```bash
ssh-keygen -t ed25519 -f ~/deploy_key -N ""
cat ~/deploy_key.pub >> ~/.ssh/authorized_keys
# Put the contents of ~/deploy_key into the VPS_SSH_KEY secret
```

---

## 11. Troubleshooting

| Symptom | Check |
|---------|-------|
| Nginx won't start | Certificates missing — run the init script (step 5). |
| 502 Bad Gateway | `docker compose logs web` — app container may still be starting. |
| Cert won't issue | DNS not pointing to the server yet, or port 80 blocked. |
| Stale content | Rebuild: `docker compose build web && docker compose up -d`. |

View logs:

```bash
docker compose logs -f web
docker compose logs -f nginx
```
