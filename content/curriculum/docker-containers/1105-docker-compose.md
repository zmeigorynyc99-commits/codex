---
title: "Docker — Compose for Multi-Service Apps"
slug: "docker-compose-for-multi-service-apps"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Container Operations"
order: 1105
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, compose, multi-container, yaml, depends-on, healthcheck]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 60
status: "published"
summary: "Declare your whole multi-container app in one file: the compose.yaml structure (services, networks, volumes, env), build vs image, ports and dependencies, healthchecks and depends_on, environment and .env, profiles and overrides, and the everyday up/down/logs/exec workflow."
seoTitle: "Docker 5: Docker Compose for Multi-Service Apps"
seoDescription: "Docker Compose: compose.yaml services/networks/volumes, build vs image, depends_on + healthchecks, env and .env, up/down/logs/exec, and overrides. Hands-on lab + assessment."
---

Typing long `docker run` commands for every service — with the right networks, volumes,
ports, and env — gets old fast and isn't reproducible. **Docker Compose** solves this:
declare your **entire multi-container application** in one YAML file (`compose.yaml`) and
manage it with single commands. Compose automatically creates a **shared network** (so
services find each other by name), wires up volumes, and brings everything up or down
together. It's the standard tool for local development and many production deployments.

## Learning objectives

By the end of this lesson you will be able to:

- Write a **`compose.yaml`** with services, networks, volumes, ports, and env.
- Use **`build`** vs **`image`** and the everyday **`up`/`down`/`logs`/`exec`** workflow.
- Express dependencies with **`depends_on`** + **healthchecks** (and their limits).
- Manage configuration with **environment** and **`.env`**.
- Use **overrides/profiles** for dev vs prod differences.

## Part 1 — Your first compose.yaml

```yaml
# compose.yaml
services:
  web:
    build: .                      # build from the Dockerfile in this directory
    ports:
      - "8080:8000"               # host:container
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
    depends_on:
      - db
  db:
    image: postgres:16            # use a prebuilt image
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - dbdata:/var/lib/postgresql/data   # named volume for persistence

volumes:
  dbdata:                          # declare the named volume
```

```bash
docker compose up -d              # build (if needed) + create network + start everything
docker compose ps                 # status of services
docker compose logs -f web        # follow one service's logs
docker compose down               # stop + remove containers/network (keeps named volumes)
docker compose down -v            # also remove named volumes (deletes data!)
```

Compose creates a **default network** for the project, so `web` reaches `db` **by service
name** (`db:5432`) automatically — the user-defined network pattern from Lesson 1104, done
for you.

## Part 2 — build vs image, and the workflow

- **`image:`** — use a prebuilt image from a registry (e.g. `postgres:16`, `redis:7`).
- **`build:`** — build from a local Dockerfile (a path, or `build: { context: ., dockerfile:
  Dockerfile.dev }`). You can have both (`build` + `image:` names the result).

```bash
docker compose up -d --build       # force a rebuild of build: services
docker compose exec web sh         # shell into the running 'web' service
docker compose run --rm web pytest # one-off command in a fresh container
docker compose restart web
docker compose stop ; docker compose start
docker compose config              # validate + render the final, merged config
```

`docker compose` (v2, the plugin) replaces the old `docker-compose` (v1, hyphenated). The
file may be named `compose.yaml` (current) or `docker-compose.yml` (still supported).

## Part 3 — Dependencies, healthchecks, and startup order

**`depends_on`** controls **start order** — but by default only waits for the container to
**start**, not to be **ready** (Postgres takes a few seconds to accept connections). For
real readiness, add a **healthcheck** and depend on the **healthy** condition:

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: secret }
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy   # wait until db's healthcheck passes
```

> [!IMPORTANT]
> Plain **`depends_on` waits for *start*, not *readiness*** — your app may try to connect to
> a database that isn't accepting connections yet and crash. Add a **healthcheck** to the
> dependency and use **`condition: service_healthy`**. Even so, a robust app should
> **retry** its connections on startup, because in production (and Kubernetes) dependencies
> can restart at any time — never assume a dependency is permanently up.

## Part 4 — Configuration: environment and .env

```yaml
services:
  web:
    image: myorg/web:${TAG:-latest}     # variable substitution with a default
    environment:
      - APP_ENV=${APP_ENV:-development}
    env_file:
      - .env                            # load many vars from a file
```

```bash
# .env  (auto-loaded by compose; DO NOT commit secrets — add to .gitignore)
TAG=1.4.0
APP_ENV=production
POSTGRES_PASSWORD=secret
```

Compose substitutes `${VAR}` from your shell and the project `.env` file. Keep **secrets out
of the compose file and out of Git** — reference them via `.env` (gitignored) or a real
secrets manager. `env_file` loads bulk config; `environment` sets/overrides individual
values.

## Part 5 — Overrides and profiles

Real projects differ between dev and prod. Two mechanisms:

- **Override files** — `compose.override.yaml` is **auto-merged** on top of `compose.yaml`
  (great for dev-only settings like bind-mounting source). Use `-f` to pick files
  explicitly for prod.
- **Profiles** — tag services so they only start when their profile is enabled (e.g. a
  `tools`/`debug` profile not run by default).

```bash
docker compose up -d                                   # compose.yaml + compose.override.yaml (dev)
docker compose -f compose.yaml -f compose.prod.yaml up -d   # prod combination
docker compose --profile debug up -d                   # also start profiled services
```

```yaml
# compose.override.yaml (dev): live-reload by mounting source, expose a debug port
services:
  web:
    volumes:
      - ./:/app          # bind mount for live editing (dev only)
    environment:
      APP_ENV: development
```

> [!TIP]
> Keep a clean base **`compose.yaml`** (works everywhere) and put environment-specific
> tweaks in **override files**: `compose.override.yaml` auto-applies for local dev (bind
> mounts, debug ports), while an explicit `-f compose.prod.yaml` layers production settings.
> This avoids `if-prod` clutter in one file and keeps dev fast and prod safe.

## Hands-on lab

```bash
mkdir compose-lab && cd compose-lab

# 1. App + Dockerfile (reuse the Flask app idea)
cat > app.py <<'EOF'
import os, time, redis
from flask import Flask
app = Flask(__name__)
r = redis.from_url(os.environ.get("REDIS_URL","redis://cache:6379"))
@app.get("/")
def home():
    n = r.incr("hits")
    return f"Hello! This page has been viewed {n} times.\n"
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
EOF
printf 'flask\nredis\n' > requirements.txt
cat > Dockerfile <<'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python","app.py"]
EOF

# 2. Compose file: web + redis with a healthcheck
cat > compose.yaml <<'EOF'
services:
  web:
    build: .
    ports: ["8080:8000"]
    environment:
      REDIS_URL: redis://cache:6379
    depends_on:
      cache:
        condition: service_healthy
  cache:
    image: redis:7
    healthcheck:
      test: ["CMD","redis-cli","ping"]
      interval: 3s
      timeout: 2s
      retries: 5
    volumes:
      - cachedata:/data
volumes:
  cachedata:
EOF

# 3. Up, hit it, watch the counter persist across restarts
docker compose up -d --build
docker compose ps
curl -s localhost:8080 ; curl -s localhost:8080      # counter increments (redis-backed)
docker compose restart web
curl -s localhost:8080                                # counter persists (volume)

# 4. Inspect, exec, validate config
docker compose logs --tail=20
docker compose exec cache redis-cli get hits
docker compose config                                 # rendered config

# 5. Tear down (keep data, then remove all)
docker compose down                                   # containers gone, volume kept
docker compose down -v                                # remove volume too
```

## Exercises

1. Write a `compose.yaml` for a web service (built from a Dockerfile) + a database (image)
   with a named volume; bring it up and reach the web service.
2. Show that the web service reaches the database **by service name** without publishing the
   db port.
3. Add a healthcheck to the database and make the web service wait for `service_healthy`;
   explain why `depends_on` alone is insufficient.
4. Move secrets/config into a `.env` file and reference them with `${VAR}`; confirm with
   `docker compose config`.
5. Add a `compose.override.yaml` that bind-mounts source for dev; show it auto-merges.
6. Use `docker compose run --rm` to execute a one-off task (e.g. a test or migration).

## Troubleshooting

- **Web crashes connecting to db on startup** — depended on start, not readiness. *Fix:*
  healthcheck + `condition: service_healthy`, and retry in the app.
- **Service can't resolve another by name** — different/missing network. *Fix:* let Compose's
  default network handle it; check service names.
- **Changes to Dockerfile not picked up** — used cached image. *Fix:* `up -d --build` (or
  `build --no-cache`).
- **`down` deleted my data** — used `-v`. *Fix:* plain `down` keeps named volumes; only `-v`
  removes them.
- **Secrets committed in compose.yaml** — *Fix:* move to `.env` (gitignored) or a secrets
  manager; use `${VAR}`.
- **`docker-compose: command not found`** — v1 vs v2. *Fix:* use `docker compose` (space),
  the v2 plugin.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does a `compose.yaml` declare, and what does `docker compose up` create?
2. How do services find each other in Compose?
3. Difference between `build:` and `image:`?
4. What does `depends_on` guarantee — and what does it NOT?
5. How do you make a service wait until a dependency is actually ready?
6. How do you keep secrets out of the compose file?
7. What's the difference between `down` and `down -v`?
8. What are override files and profiles for?
9. **Practical:** bring up a multi-service app and show inter-service comms by name.
10. **Practical:** add a healthcheck + `service_healthy` dependency and verify ordering.

## Solutions & validation

1. The whole app (services/networks/volumes/env); `up` creates a project network + starts
   all services.
2. By **service name** on Compose's automatically created network.
3. `build:` builds from a local Dockerfile; `image:` pulls a prebuilt image.
4. Start **order** only — **not** that the dependency is **ready/healthy**.
5. Add a **healthcheck** and `depends_on: { dep: { condition: service_healthy } }` (+ app
   retries).
6. Put them in a gitignored **`.env`** (or secrets manager) and reference `${VAR}`.
7. `down` removes containers/network (keeps named volumes); `-v` also deletes volumes/data.
8. Override files auto-merge env-specific settings (dev vs prod); profiles gate optional
   services.
9. **Validation:** counter increments via redis reached by name (see lab).
10. **Validation:** web starts only after `cache` reports healthy.

> [!TIP]
> Compose turns "a pile of `docker run` commands" into a **single declarative file** you
> commit to the repo — reproducible for every teammate and CI. Lean on its automatic
> network (name-based discovery), use **healthchecks for real readiness**, keep secrets in
> `.env`, and split dev/prod with overrides. The service model you write here maps almost
> directly onto Kubernetes later.

## What's next

Next: **Lesson 1106 — Registries & Image Distribution.** Share your images: pushing/pulling
to Docker Hub and private registries (GHCR/ECR), tagging and versioning strategy,
authentication, image digests vs tags, and how images move from your build to production.
