---
title: "Docker — Container Networking"
slug: "docker-container-networking"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Container Operations"
order: 1104
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, networking, bridge, dns, ports, service-discovery]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 55
status: "published"
summary: "How containers talk to each other and the world: the default bridge vs user-defined bridge networks, DNS-based service discovery by container name, publishing ports (and the difference from EXPOSE), connecting a multi-container app, and network isolation as a security control."
seoTitle: "Docker 4: Container Networking (bridge, DNS, port publishing)"
seoDescription: "Docker networking: default vs user-defined bridge, DNS service discovery by name, publish vs EXPOSE, connecting multi-container apps, and network isolation. Lab + assessment."
---

A single container is rarely the whole app — a web service talks to a database, a cache, an
API. **Container networking** is how they find and reach each other, and how the outside
world reaches them. The good news: once you understand **user-defined bridge networks** and
**DNS-based service discovery**, multi-container apps become simple. This lesson covers
Docker's network types, **publishing ports** (and how it differs from `EXPOSE`), connecting
containers by **name**, and using networks for **isolation**.

## Learning objectives

By the end of this lesson you will be able to:

- Explain Docker's **bridge** network and the host's role.
- Create **user-defined networks** and use **DNS service discovery** by container name.
- **Publish ports** to the host and explain how it differs from `EXPOSE`.
- Connect a **multi-container** app (web + db) over a shared network.
- Use networks for **isolation** and know the main network drivers.

## Part 1 — How container networking works

By default Docker creates a **bridge** network (`docker0`): each container gets a private IP
on an internal virtual network, and the host **NATs** their traffic to the outside. So
containers can reach the internet, and you reach containers via **published ports**.

```text
   host (has a real IP) ── NAT ── docker bridge (172.17.x.x) ── container1, container2
        ▲ published port 8080→80                                  (private IPs)
   outside world
```

```bash
docker network ls                  # bridge, host, none, + user-defined
docker network inspect bridge      # subnet, gateway, connected containers
```

Network **drivers**: **bridge** (default, single host), **host** (share the host's network
stack directly — no isolation, no port mapping), **none** (no networking), **overlay**
(multi-host, for Swarm/clusters), **macvlan** (give a container a real LAN IP).

## Part 2 — The default bridge vs user-defined bridges

There are two kinds of bridge, and the difference is the **#1 networking gotcha**:

- **Default bridge** (`bridge`) — containers can reach each other **only by IP**, *not* by
  name (no automatic DNS). Legacy behavior.
- **User-defined bridge** (one you create) — containers on it get **automatic DNS**: they
  reach each other by **container name**. This is what you should use.

```bash
docker network create appnet
docker run -d --name db  --network appnet -e POSTGRES_PASSWORD=x postgres:16
docker run -d --name web --network appnet -p 8080:80 nginx
docker exec web ping -c1 db        # resolves "db" by name -> works on a user-defined net!
```

> [!IMPORTANT]
> **Always create a user-defined bridge network for multi-container apps.** On it, Docker
> provides **automatic DNS**: containers reach each other by **name** (`db`, `redis`,
> `api`) — no hardcoded IPs (which change on restart). On the *default* bridge there's no
> name resolution, which is why beginners' containers "can't find the database." One
> `docker network create` + `--network` fixes it. (Compose, next lesson, does this for you.)

## Part 3 — Publishing ports vs EXPOSE

These are constantly confused:

- **`EXPOSE 80`** (Dockerfile) — **documentation/metadata** only. It does **not** open
  anything; it just records which port the app listens on.
- **`-p 8080:80`** (`--publish`) — actually maps **host port 8080 → container port 80**,
  making the service reachable from outside the host.

```bash
docker run -d -p 8080:80 nginx          # host:container — reachable at localhost:8080
docker run -d -p 127.0.0.1:8080:80 nginx # bind to localhost only (not all interfaces)
docker run -d -P nginx                   # publish ALL EXPOSEd ports to random host ports
docker port <container>                  # show the actual mappings
```

Containers on the **same user-defined network** talk to each other on the container's
**internal** port directly (e.g. `db:5432`) — you only need `-p` to expose something to the
**host/outside world** (typically just the web front end).

> [!TIP]
> Only **publish** the ports that truly need outside access — usually just your web/API
> front end. Backend services (database, cache) should be reachable **only on the internal
> network** by name (`db:5432`), **not** published to the host. Publishing a database port
> to `0.0.0.0` is a common, dangerous mistake (recall default-deny from the security
> track). Bind to `127.0.0.1` if you need host-local access for debugging.

## Part 4 — A multi-container app

```bash
docker network create shop

# Database — NOT published; only reachable inside 'shop'
docker run -d --name db --network shop \
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=shop postgres:16

# Cache — also internal only
docker run -d --name cache --network shop redis:7

# Web app — published to the host; finds db/cache BY NAME
docker run -d --name web --network shop -p 8080:8080 \
  -e DATABASE_URL=postgres://postgres:secret@db:5432/shop \   # "db" resolves via DNS
  -e REDIS_URL=redis://cache:6379 \
  myorg/shop-web:1.0
```

The web container connects to `db:5432` and `cache:6379` by **name**; only `web` is exposed
to the host. This is exactly the topology Compose and Kubernetes formalize.

## Part 5 — Isolation and inspection

Networks are also a **security boundary** — containers can only talk to others on a network
they **share**:

```bash
docker network create frontend
docker network create backend
docker run -d --name web   --network frontend ...
docker run -d --name api   --network frontend ...   # web<->api
docker network connect backend api                  # api also joins backend
docker run -d --name db    --network backend  ...    # db reachable by api, NOT by web
```

Putting the database on a **separate backend network** that the web tier can't reach limits
blast radius — segmentation, container-style. Inspect and debug with:

```bash
docker network inspect shop        # who's connected, IPs, subnet
docker exec web getent hosts db    # confirm name resolution
docker exec web nc -zv db 5432     # test connectivity to a service
```

## Hands-on lab

```bash
# 1. Show default-bridge has NO name resolution
docker run -d --name a alpine sleep 600
docker run -d --name b alpine sleep 600
docker exec a ping -c1 b 2>&1 | head -1     # fails to resolve "b" (default bridge)
docker rm -f a b

# 2. User-defined network -> DNS by name works
docker network create lab
docker run -d --name a --network lab alpine sleep 600
docker run -d --name b --network lab alpine sleep 600
docker exec a ping -c1 b                     # resolves "b" -> success

# 3. Multi-container: web reaches db by name, only web is published
docker run -d --name db --network lab -e POSTGRES_PASSWORD=x postgres:16
docker run -d --name web --network lab -p 8080:80 nginx
docker exec web getent hosts db              # db resolves
docker exec web sh -c 'nc -zv db 5432'       # reachable internally
curl -s localhost:8080 | head -1             # web reachable from host

# 4. Isolation: a container NOT on 'lab' cannot reach db
docker run --rm alpine sh -c 'ping -c1 db' 2>&1 | head -1   # cannot resolve

# 5. Inspect + cleanup
docker network inspect lab | head -40
docker rm -f a b db web; docker network rm lab
```

## Exercises

1. Show that two containers on the **default** bridge can't resolve each other by name, but
   two on a **user-defined** bridge can.
2. Explain the difference between `EXPOSE` and `-p`, with an example of each.
3. Stand up a web+db pair on a user-defined network where the web connects to the db **by
   name** and only the web is published.
4. Bind a published port to `127.0.0.1` only and explain why you might.
5. Use two networks to isolate a database from the web tier; prove the web tier can't reach
   the db.
6. Inspect a network and confirm DNS resolution and connectivity to a service.

## Troubleshooting

- **"Could not resolve host: db"** — on the default bridge. *Fix:* use a user-defined
  network; connect both containers to it.
- **Can't reach a service from the host** — not published. *Fix:* `-p host:container` (EXPOSE
  alone does nothing).
- **Database exposed to the internet** — published a backend port. *Fix:* don't `-p` it;
  keep it internal/by-name; bind to `127.0.0.1` if needed.
- **Port already allocated** — host port in use. *Fix:* change the host side of `-p`.
- **Containers on different networks can't talk** — by design. *Fix:* `docker network
  connect` to share a network intentionally.
- **Name resolves to stale IP after restart** — relying on IPs. *Fix:* always use names on a
  user-defined network.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does the default bridge network provide, and how does the host reach containers?
2. Key difference between the default bridge and a user-defined bridge?
3. How do containers find each other on a user-defined network?
4. What does `EXPOSE` actually do?
5. What does `-p 8080:80` do, and how is it different from `EXPOSE`?
6. Why avoid publishing database ports to the host?
7. How do two containers on the same network reach each other's services?
8. How can networks act as an isolation/security boundary?
9. **Practical:** demonstrate DNS-by-name on a user-defined network.
10. **Practical:** stand up web+db where only web is published and web reaches db by name.

## Solutions & validation

1. Private IPs on a virtual bridge with **NAT** to the outside; the host reaches containers
   via **published ports**.
2. User-defined bridges give **automatic DNS** (name resolution); the default bridge does
   not.
3. By **container name** (Docker's embedded DNS).
4. Nothing functional — it's **documentation** of the listening port.
5. Maps **host port → container port** (actually exposes it); `EXPOSE` is metadata only.
6. It exposes a sensitive backend to the network/internet; keep it internal by name.
7. Directly on the container's **internal port** by **name** (e.g. `db:5432`) — no publish
   needed.
8. Containers only communicate if they **share a network**; separate networks segment tiers.
9. **Validation:** `docker exec a ping b` succeeds on a user-defined net (see lab).
10. **Validation:** `web` resolves `db` and serves on `localhost:8080`; `db` not published.

> [!TIP]
> Two rules cover 90% of container networking: **put related containers on a user-defined
> network and address them by name**, and **publish only the ports that need outside
> access** (keep databases internal). That's exactly what Docker Compose automates for you —
> which is where we go next.

## What's next

Next: **Lesson 1105 — Docker Compose.** Stop typing long `docker run` commands: declare your
whole multi-container app (services, networks, volumes, env) in one `docker-compose.yml` and
bring it up with a single command — the standard way to run multi-service apps locally and
in many production setups.
