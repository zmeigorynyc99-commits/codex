---
title: "Docker — Containers from First Principles"
slug: "docker-containers-from-first-principles"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Container Foundations"
order: 1101
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, containers, images, namespaces, cgroups, beginner]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 55
status: "published"
summary: "What a container actually is (and isn't): the difference from a VM, the Linux primitives that make it work (namespaces, cgroups, union filesystems), the image-vs-container distinction, and your first hands-on run, exec, logs, and lifecycle with the Docker CLI."
seoTitle: "Docker 1: Containers from First Principles (vs VMs, run, lifecycle)"
seoDescription: "Beginner Docker: containers vs VMs, namespaces/cgroups/union FS, images vs containers, and the core CLI — run, ps, exec, logs, stop, rm. Hands-on lab and assessment."
---

Before you copy Dockerfiles from the internet, understand what a **container** really is.
A container is **not** a small virtual machine — it's an ordinary Linux **process**, given
its own isolated view of the system by kernel features. This lesson builds the mental
model from first principles: how containers differ from **VMs**, the primitives
(**namespaces, cgroups, union filesystems**) that make isolation work, the crucial
**image vs container** distinction, and the everyday CLI to run and manage them. Get this
foundation right and everything later — Dockerfiles, volumes, Compose, Kubernetes — makes
sense.

## Learning objectives

By the end of this lesson you will be able to:

- Explain how a **container differs from a VM** and why it's lightweight.
- Name the Linux primitives behind isolation: **namespaces, cgroups, union FS**.
- Distinguish an **image** (template) from a **container** (running instance).
- Run, inspect, and manage containers: **`run`, `ps`, `exec`, `logs`, `stop`, `rm`**.
- Solve the "works on my machine" problem with portable images.

## Part 1 — Containers vs virtual machines

Both isolate workloads, but at different layers:

```text
   VIRTUAL MACHINES                    CONTAINERS
  ┌──────┐┌──────┐                   ┌──────┐┌──────┐
  │ App  ││ App  │                   │ App  ││ App  │
  │ Bins ││ Bins │                   │ Bins ││ Bins │
  │GuestOS││GuestOS│  full OS each    └──────┘└──────┘  share host kernel
  ├──────┴┴──────┤                   ├──────────────┤
  │  Hypervisor  │                   │ Container eng│
  ├──────────────┤                   ├──────────────┤
  │   Host OS    │                   │   Host OS     │
  └──────────────┘                   └──────────────┘
```

- A **VM** virtualizes **hardware** and runs a **full guest OS** (its own kernel) — strong
  isolation, but heavy (GBs, boots in seconds-to-minutes).
- A **container** virtualizes the **OS**: it shares the **host kernel** and packages only
  the app + its dependencies — lightweight (MBs, starts in **milliseconds**), dense (many
  per host).

The trade-off: VMs isolate more strongly (separate kernels); containers are far more
efficient and portable. They're often used **together** (containers running inside VMs in
the cloud).

## Part 2 — The primitives that make a container

A container is a normal process that the kernel **constrains and isolates** with three
features:

- **Namespaces** — isolate *what a process can see*: its own process tree (PID), network
  stack, mounts/filesystem, hostname (UTS), users, IPC. Inside, the app thinks it's alone
  on the machine.
- **cgroups (control groups)** — isolate *what a process can use*: CPU, memory, I/O limits.
  This is how you cap a container to "0.5 CPU, 256 MB."
- **Union filesystem** (overlayfs) — stacks read-only **image layers** with a thin writable
  layer on top, so images are built and shared **layer by layer** and containers start
  instantly without copying the whole filesystem.

> [!IMPORTANT]
> There is **no "container" object** in the Linux kernel — a container is just a process
> wrapped in **namespaces** (isolation of what it *sees*), **cgroups** (limits on what it
> *uses*), and a **union filesystem** (layered image). Docker is the friendly tool that
> orchestrates these primitives. Because it's a normal process sharing the host kernel,
> it's lightweight — and because it shares the kernel, isolation is weaker than a VM's
> (relevant to the security lessons later).

## Part 3 — Images vs containers

The single most important distinction in Docker:

- An **image** is a **read-only template** — a packaged snapshot of a filesystem + metadata
  (what to run). Built once, stored, shared. Think "class" or "executable."
- A **container** is a **running (or stopped) instance** of an image, with a writable layer
  on top. Think "object" or "process."

```text
  image (template, immutable)  ──docker run──►  container 1 (instance, writable layer)
                                            └─►  container 2 (another instance)
```

One image → many containers. Images are **immutable**; changes a container makes live in
its writable layer and vanish when it's removed (unless you use volumes — next lesson).

## Part 4 — The core lifecycle

```bash
docker run hello-world                 # pull image (if needed) + create + start a container
docker run -d --name web -p 8080:80 nginx   # detached, named, publish host:container port
docker ps                              # running containers
docker ps -a                           # include stopped ones
docker logs web                        # view stdout/stderr
docker logs -f web                     # follow logs live
docker exec -it web bash               # get a shell INSIDE a running container
docker stop web                        # graceful stop (SIGTERM)
docker start web ; docker restart web
docker rm web                          # remove a stopped container
docker rm -f web                       # force-remove a running one
```

Key flags: **`-d`** (detached/background), **`-it`** (interactive terminal), **`-p host:
container`** (publish a port), **`--name`** (stable name), **`-e KEY=val`** (env var),
**`--rm`** (auto-remove on exit).

> [!TIP]
> `docker run` does three things at once: **pull** (if the image is missing), **create**,
> and **start**. Use **`-d`** to background long-running services, **`exec -it … bash`** to
> poke around inside a running container, and **`logs -f`** to watch output. When something
> won't start, `docker logs` is your first stop — just like reading a service's logs on a
> normal host.

## Part 5 — Images, registries, and "works on my machine"

Images come from **registries** (Docker Hub by default; also GHCR, ECR, private ones):

```bash
docker pull python:3.12-slim           # download an image (name:tag)
docker images                          # list local images
docker run -it --rm python:3.12-slim python -c "print('hi')"
docker rmi python:3.12-slim            # remove an image
docker image inspect nginx | less      # metadata, layers, config
```

The payoff: an image bundles the app **and its entire environment** (runtime, libraries,
config). The *same* image runs identically on your laptop, a teammate's machine, CI, and
production — **killing "works on my machine"**. Tags (`:3.12-slim`, `:latest`) identify
versions; pin specific tags for reproducibility (`latest` drifts).

## Hands-on lab

```bash
# 1. Your first container
docker run --rm hello-world
docker version ; docker info | head        # confirm the engine is running

# 2. Run a real service, reach it, inspect it
docker run -d --name web -p 8080:80 nginx
curl -s localhost:8080 | head -1           # served by the container
docker ps
docker logs web                            # access logs appear here
docker exec -it web sh -c 'echo "<h1>hi from container</h1>" > /usr/share/nginx/html/index.html'
curl -s localhost:8080 | head -1           # your edit (lives in the writable layer)

# 3. Prove image vs container: start a SECOND container from the same image
docker run -d --name web2 -p 8081:80 nginx
curl -s localhost:8081 | head -1           # default page — web2 didn't see web's edit
docker ps

# 4. Lifecycle + cleanup (and see the writable layer vanish)
docker stop web web2
docker rm web web2                         # removing 'web' discards its edited file
docker run -d --name web3 -p 8080:80 nginx
curl -s localhost:8080 | head -1           # back to default — proof edits weren't in the image
docker rm -f web3

# 5. Constrain resources (cgroups in action)
docker run --rm --memory=64m --cpus=0.5 alpine sh -c 'echo limited; nproc'
```

## Exercises

1. Explain three differences between a container and a VM, and one scenario favoring each.
2. Match each primitive (namespaces, cgroups, union FS) to what it provides.
3. Demonstrate the image-vs-container distinction by running two containers from one image
   and showing they don't share writable state.
4. Run a detached web server, publish a port, reach it with `curl`, then read its logs.
5. Exec into a running container, make a change, then prove that change is gone after `rm` +
   re-run.
6. Run a container limited to 64 MB and 0.5 CPU; explain which primitive enforces that.

## Troubleshooting

- **"Cannot connect to the Docker daemon"** — engine not running / no permission. *Fix:*
  start Docker; add your user to the `docker` group (or use sudo) — note that's root-
  equivalent.
- **Port already in use** — host port taken. *Fix:* change `-p` host side (`-p 8081:80`) or
  free the port.
- **Container exits immediately** — main process ended/crashed. *Fix:* `docker logs`;
  containers live only as long as their main process (PID 1).
- **My file edits disappeared** — they were in the writable layer. *Fix:* expected; use
  **volumes** (next lesson) for persistence.
- **`exec` "no such file: bash"** — minimal image (e.g. alpine). *Fix:* use `sh` instead of
  `bash`.
- **Out of disk** — accumulated images/containers. *Fix:* `docker system prune` (careful);
  `docker ps -a`, `docker images`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. How does a container differ from a VM regarding the kernel and weight?
2. What do namespaces isolate vs what cgroups limit?
3. What does a union filesystem give Docker?
4. Define image vs container precisely.
5. Why do a container's filesystem changes disappear on `rm`?
6. What three actions does `docker run` perform?
7. What does `-p 8080:80` do?
8. How does an image solve "works on my machine"?
9. **Practical:** run two containers from one image and show isolated writable state.
10. **Practical:** limit a container's memory/CPU and verify it runs.

## Solutions & validation

1. Container **shares the host kernel** (lightweight, ms start); VM runs a **full guest OS/
   kernel** (heavy, stronger isolation).
2. Namespaces isolate **what a process sees** (PID/net/mount/…); cgroups limit **what it
   uses** (CPU/mem/IO).
3. Layered, read-only image layers + a writable top layer → instant starts, shared/cached
   layers.
4. **Image** = read-only template; **container** = a running/stopped instance of it (with a
   writable layer).
5. Changes live only in the **writable layer**, which is deleted with the container.
6. **Pull** (if missing), **create**, **start**.
7. Publishes host port 8080 → container port 80.
8. It bundles the app + its **entire environment**, so it runs identically everywhere.
9. **Validation:** `web2` shows default page despite `web`'s edit (see lab).
10. **Validation:** `docker run --memory=64m --cpus=0.5 …` runs (cgroups enforce limits).

> [!TIP]
> Hold onto two ideas and Docker stops being mysterious: a container is **just an isolated,
> limited process sharing the host kernel**, and an **image is an immutable template** you
> instantiate into containers. Everything else — building images, persisting data,
> networking, orchestration — is layered on these two facts.

## What's next

Next: **Lesson 1102 — Images & Dockerfiles.** Stop using other people's images blindly and
build your own: the `Dockerfile` instructions (`FROM`, `RUN`, `COPY`, `CMD`…), how the
**layer cache** works, tagging and `.dockerignore`, and writing a Dockerfile for a real
application.
