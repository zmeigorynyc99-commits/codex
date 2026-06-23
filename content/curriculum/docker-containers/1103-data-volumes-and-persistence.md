---
title: "Docker — Data, Volumes & Persistence"
slug: "docker-data-volumes-and-persistence"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Container Foundations"
order: 1103
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, volumes, bind-mounts, persistence, data, storage]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 50
status: "published"
summary: "Containers are ephemeral — so where does data live? The writable layer vs persistent storage, named volumes vs bind mounts vs tmpfs, persisting a database, sharing source code into a container for development, backups, and the patterns for stateful workloads."
seoTitle: "Docker 3: Data, Volumes & Persistence (named volumes vs bind mounts)"
seoDescription: "Docker storage: ephemeral writable layer, named volumes vs bind mounts vs tmpfs, persisting databases, dev bind mounts, and volume backups. Hands-on lab and assessment."
---

You saw in Lesson 1101 that a container's filesystem changes **vanish when it's removed**.
That's by design — containers are **ephemeral** — but real apps have **data** that must
survive: databases, uploads, logs. The answer is **volumes** and **mounts**, which connect
durable storage from outside the container into it. This lesson covers the three mount
types (**named volumes, bind mounts, tmpfs**), when to use each, persisting a database,
the dev workflow of mounting source code, and backing up volume data.

## Learning objectives

By the end of this lesson you will be able to:

- Explain why the **writable layer is ephemeral** and what persists data.
- Use **named volumes**, **bind mounts**, and **tmpfs**, and choose between them.
- Persist a **database** across container restarts and removals.
- Mount **source code** for a fast development loop.
- **Back up** and restore volume data.

## Part 1 — Why data needs a home outside the container

Each container has a thin **writable layer** on top of the image's read-only layers.
Anything the app writes goes there — and is **deleted with the container** (`docker rm`).
That's fine for temporary state, fatal for a database. To persist, you mount storage that
lives **outside** the container's lifecycle:

```text
  ┌─────────── container ───────────┐
  │  app writes to /var/lib/postgres │──┐
  └──────────────────────────────────┘  │ mounted from...
                                          ▼
   named volume (docker-managed)  OR  bind mount (a host path)  → survives rm
```

## Part 2 — Named volumes

**Named volumes** are storage **managed by Docker** (under `/var/lib/docker/volumes/`).
They're the **preferred** way to persist application data — portable, backed up as a unit,
and decoupled from host paths:

```bash
docker volume create appdata
docker volume ls
docker run -d --name db \
  -v appdata:/var/lib/postgresql/data \      # volume:container-path
  -e POSTGRES_PASSWORD=secret postgres:16
docker volume inspect appdata
docker volume rm appdata                      # (only when no container uses it)
```

Because Docker manages them, you don't worry about host paths or permissions as much, and
they work the same across machines. Use named volumes for **databases and app state**.

## Part 3 — Bind mounts

A **bind mount** maps a **specific host directory** into the container. The container sees
the host's actual files (read-write by default), and changes flow **both ways**:

```bash
docker run -d --name web \
  -v "$(pwd)/site:/usr/share/nginx/html:ro" \   # host path : container path : read-only
  -p 8080:80 nginx
```

Bind mounts are ideal for **development** (edit code on the host, see it live in the
container) and for injecting **config files**. Downsides: tied to a host path (less
portable), and they can clash with container file ownership/permissions.

> [!IMPORTANT]
> **Named volumes for app data; bind mounts for development and config.** Volumes are
> Docker-managed, portable, and the right home for databases/state. Bind mounts expose a
> real host path — perfect for live-editing source during development, but tied to that
> machine's layout. Add **`:ro`** to mount read-only when the container shouldn't modify the
> files (config, static assets) — a simple, valuable safeguard.

## Part 4 — tmpfs and mount syntax

- **tmpfs mount** — stored in **memory only**, never written to disk; gone when the
  container stops. Use for **secrets/scratch** data you don't want persisted.

```bash
docker run --rm --tmpfs /tmp:rw,size=64m alpine sh -c 'df -h /tmp'
```

Two equivalent syntaxes — the older `-v` and the explicit `--mount` (clearer, preferred in
scripts):

```bash
# -v shorthand
-v appdata:/data
-v "$(pwd)/src:/app:ro"
# --mount (explicit; harder to get wrong)
--mount type=volume,source=appdata,target=/data
--mount type=bind,source="$(pwd)/src",target=/app,readonly
--mount type=tmpfs,target=/tmp
```

A gotcha: with `-v`, if you reference a host path that **doesn't exist**, Docker creates an
empty directory; `--mount` **errors** instead — safer.

## Part 5 — Persistence patterns and backups

```bash
# Prove a DB survives container removal
docker run -d --name pg -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=x postgres:16
docker exec -it pg psql -U postgres -c "CREATE TABLE t(id int); INSERT INTO t VALUES (1);"
docker rm -f pg                                 # container gone...
docker run -d --name pg2 -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=x postgres:16
docker exec -it pg2 psql -U postgres -c "SELECT * FROM t;"   # data is STILL THERE

# Back up a named volume to a tarball (run a throwaway container that mounts it)
docker run --rm -v pgdata:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/pgdata-backup.tgz -C /data .
# Restore into a fresh volume
docker run --rm -v pgdata_new:/data -v "$(pwd)":/backup alpine \
  sh -c 'cd /data && tar xzf /backup/pgdata-backup.tgz'
```

> [!TIP]
> A named volume **outlives any container** — that's the whole point — so you back it up by
> mounting it into a small throwaway container (often `alpine`) and `tar`-ing the contents.
> Volumes are **not** automatically backed up by Docker; treat your database volume like any
> production data and put it in your backup/DR plan (recall the backup track principles).

## Hands-on lab

```bash
# 1. Ephemeral proof (no volume) — data lost on rm
docker run -d --name e1 alpine sh -c 'echo hi > /data.txt; sleep 600'
docker exec e1 cat /data.txt
docker rm -f e1                         # data.txt is gone with the container

# 2. Named volume — data persists across containers
docker volume create demo
docker run --rm -v demo:/data alpine sh -c 'echo persisted > /data/file.txt'
docker run --rm -v demo:/data alpine cat /data/file.txt   # still there

# 3. Bind mount for dev — edit on host, see in container
mkdir -p site && echo "<h1>v1</h1>" > site/index.html
docker run -d --name web -v "$(pwd)/site:/usr/share/nginx/html:ro" -p 8080:80 nginx
curl -s localhost:8080
echo "<h1>v2 edited live</h1>" > site/index.html
curl -s localhost:8080                  # reflects the host edit immediately

# 4. tmpfs — memory-only scratch
docker run --rm --tmpfs /scratch:size=16m alpine sh -c 'echo x > /scratch/a; ls -la /scratch'

# 5. Backup the named volume
docker run --rm -v demo:/data -v "$(pwd)":/backup alpine tar czf /backup/demo.tgz -C /data .
ls -la demo.tgz
docker rm -f web; docker volume rm demo
```

## Exercises

1. Explain why container writes are ephemeral and the two main ways to make data persist.
2. Persist a database in a named volume; remove and recreate the container and show the data
   survives.
3. Use a read-only bind mount to serve static files, edit a file on the host, and show the
   change live.
4. Use a tmpfs mount and explain a use case (e.g. secrets/scratch).
5. Contrast `-v` and `--mount`, including the missing-host-path gotcha.
6. Back up a named volume to a tarball and restore it into a new volume.

## Troubleshooting

- **Data gone after `docker rm`** — no volume. *Fix:* mount a named volume for stateful
  paths.
- **Bind-mount permission denied / wrong owner** — host vs container UID mismatch. *Fix:*
  align user/`--user`, fix host perms, or use a named volume.
- **`-v ./typo:/app` created an empty dir** — `-v` auto-creates missing host paths. *Fix:*
  use `--mount` (it errors) and check the path.
- **Edits not reflected** — wrong path, or copied into image instead of mounted. *Fix:*
  verify the mount target; for dev use a bind mount.
- **Can't remove a volume ("in use")** — a container references it. *Fix:* remove the
  container first; `docker volume rm`.
- **Volume not backed up** — Docker doesn't auto-backup. *Fix:* tar it via a helper
  container; include in DR.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why is a container's writable layer ephemeral?
2. Name the three mount types and one use for each.
3. Named volume vs bind mount — which for a database, which for dev, and why?
4. What does adding `:ro` to a mount do?
5. Where does tmpfs store data, and when use it?
6. What's the difference between `-v` and `--mount` for a missing host path?
7. Do volumes survive `docker rm` of the container? `docker volume rm`?
8. How do you back up a named volume?
9. **Practical:** show data persisting across container removal via a named volume.
10. **Practical:** serve files via a read-only bind mount and edit them live.

## Solutions & validation

1. It's deleted with the container; only the image layers (read-only) and external mounts
   persist.
2. **Named volume** (app data/DB), **bind mount** (dev/config), **tmpfs** (in-memory
   secrets/scratch).
3. Volume for the **database** (managed, portable); bind mount for **dev** (live host
   edits).
4. Mounts it **read-only** — the container can't modify those files.
5. In **memory** only (not on disk); for sensitive/temporary data.
6. `-v` **auto-creates** a missing host path (empty dir); `--mount` **errors** — safer.
7. Volumes survive container `rm`; `docker volume rm` deletes the volume (and its data).
8. Mount it into a throwaway container and `tar` the contents to the host.
9. **Validation:** new container on the same volume still sees the data (see lab).
10. **Validation:** host edit to the bind-mounted file appears via `curl` immediately.

> [!TIP]
> The mental model: **containers are cattle, data is precious.** Keep containers disposable
> and put anything you care about in a **named volume** (or external store). Use **bind
> mounts** for the developer inner loop and config, **`:ro`** wherever the container
> shouldn't write, and remember volumes are **yours to back up**. Stateless containers +
> deliberately managed state is the pattern that scales to Kubernetes.

## What's next

Next: **Lesson 1104 — Container Networking.** How containers talk: the default bridge,
user-defined networks and DNS-based service discovery, publishing ports, connecting
multiple containers, and the networking model that Compose and Kubernetes build upon.
