---
title: "Docker — Troubleshooting & Best Practices"
slug: "docker-troubleshooting-and-best-practices"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Production Containers"
order: 1108
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, troubleshooting, logging, restart-policy, 12-factor, best-practices]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 60
status: "published"
summary: "Operate containers with confidence: debugging crashes and exit codes, inspect/stats/events, logging strategy and the 12-factor config approach, resource limits and restart policies, the one-process rule, disk cleanup with prune, and a production-readiness checklist that ties the track together."
seoTitle: "Docker 8: Troubleshooting & Best Practices (debug, 12-factor, limits)"
seoDescription: "Docker operations: debugging crashes/exit codes, inspect/stats/events, logging, 12-factor config, restart policies, resource limits, prune, and a prod-readiness checklist. Capstone lab + assessment."
---

This capstone turns you from "can run a container" into "can **operate** containers in
production." When a container crash-loops, won't start, or eats all the memory, you need a
diagnostic method — and you need to have built the image and runtime config to avoid those
problems in the first place. We'll cover **debugging** (exit codes, `logs`, `inspect`,
`stats`, `events`), a sound **logging and configuration** approach (12-factor), **restart
policies** and **resource limits**, **disk cleanup**, and a **production-readiness
checklist** that ties the whole Docker track together.

## Learning objectives

By the end of this lesson you will be able to:

- Debug containers methodically using **logs, exit codes, inspect, stats, events**.
- Apply a **logging** strategy and **12-factor config** (env vars, not baked config).
- Set **restart policies** and **resource limits** for resilience.
- Follow the **one-process-per-container** rule and handle signals/PID 1.
- Clean up with **prune** and run a **production-readiness** check.

## Part 1 — A debugging method

When a container misbehaves, work top-down:

```bash
docker ps -a                      # is it running, restarting, or exited? note STATUS
docker logs <c>                   # 1st stop: app output / stack trace
docker logs --tail=100 -f <c>     # follow recent logs
docker inspect <c>                # full config: env, mounts, network, RestartCount
docker inspect -f '{{.State.ExitCode}} {{.State.Error}}' <c>   # why it exited
docker stats <c>                  # live CPU/mem/IO (is it OOMing?)
docker events &                   # stream daemon events (oom, die, kill, health_status)
```

**Exit codes** tell a story:

```text
0    clean exit (the main process simply finished — containers stop when PID 1 exits)
1/2  application error (read the logs)
125  docker run itself failed (bad flag/option)
126  command found but not executable (permissions)
127  command not found (typo / missing binary / wrong base)
137  SIGKILL — usually OOM-killed (exceeded memory) or `docker kill`
139  SIGSEGV (segfault)
143  SIGTERM (graceful stop)
```

> [!TIP]
> Two exit codes you'll see constantly: **137** means the kernel **OOM-killed** the
> container (it hit its memory limit — raise the limit or fix the leak; confirm with
> `docker inspect -f '{{.State.OOMKilled}}'`), and **127** means **command not found**
> (typo in `CMD`, missing binary, or wrong base image). Pair the exit code with
> `docker logs` and you've diagnosed most failures in seconds.

## Part 2 — Logging strategy

Containers should log to **stdout/stderr** — the engine captures it and you read it with
`docker logs`. **Don't** write logs to files inside the container (they vanish and bloat the
writable layer):

```bash
docker logs <c>                                  # default json-file driver
# Configure log rotation so disk doesn't fill (per-container or daemon-wide):
docker run --log-opt max-size=10m --log-opt max-file=3 myapp
# Ship to a central system with a logging driver (recall the SIEM lesson):
docker run --log-driver=syslog --log-opt syslog-address=udp://logs:514 myapp
```

In production, a log shipper/agent forwards container stdout to centralized logging
(Elastic/Loki/cloud). The **12-factor** principle: treat logs as an **event stream** to
stdout; let the platform handle routing/storage.

## Part 3 — 12-factor configuration

Don't bake environment-specific config into the image — **configure via the environment**
so one image runs in dev, staging, and prod:

```bash
docker run -e DATABASE_URL=... -e LOG_LEVEL=info -e FEATURE_X=on myapp:1.0
docker run --env-file ./prod.env myapp:1.0       # bulk env from a file (gitignored)
```

```text
Relevant 12-factor habits for containers:
- Config in the ENVIRONMENT (not in code/image)        -> same image everywhere
- Treat backing services (db, cache) as attached resources via URLs
- Logs to stdout as an event stream
- Processes are stateless & disposable (state in volumes/external stores)
- Fast startup / graceful shutdown (handle SIGTERM)
```

> [!IMPORTANT]
> **Build one image; configure it per environment via env vars.** Baking
> prod-vs-dev settings (or secrets) into the image means rebuilding for each environment and
> breaks the "test the exact artifact you ship" guarantee. Inject config (and secrets) at
> **runtime** through the environment/secrets manager. Your image should be an immutable
> binary; its behavior is parameterized by the environment it runs in.

## Part 4 — Restart policies, limits, and the one-process rule

```bash
# Restart policies — resilience against crashes/reboots
docker run -d --restart=unless-stopped myapp     # restart on crash/boot, but not if you stopped it
#   options: no (default), on-failure[:N], always, unless-stopped

# Resource limits — protect the host from a runaway container (cgroups)
docker run -d --memory=512m --memory-swap=512m --cpus=1.5 \
  --pids-limit=200 myapp                          # cap memory, CPU, process count

# Healthcheck (in Dockerfile or compose) lets the platform detect/replace unhealthy ones
# HEALTHCHECK --interval=30s --timeout=3s CMD curl -fs localhost:8000/health || exit 1
```

**One concern per container.** Run a **single main process** (the web server *or* the
worker, not both via a shell script) — it makes logging, scaling, restarts, and healthchecks
work correctly. Need multiple processes? Use **multiple containers** (Compose/K8s). And
ensure your process is **PID 1** (exec-form CMD) so it receives `SIGTERM` and shuts down
gracefully (use an init like `--init`/tini if you spawn children).

> [!TIP]
> Set a **memory limit** on every production container (an unbounded leak can take down the
> whole host), a **restart policy** for resilience, and a **healthcheck** so the orchestrator
> can replace sick instances. Keep it **one process per container** — that single rule
> prevents a surprising number of logging, signal, and scaling problems and is mandatory
> once you reach Kubernetes.

## Part 5 — Cleanup and production readiness

Docker accumulates stopped containers, dangling images, unused volumes/networks — and fills
disks:

```bash
docker system df                  # how much space images/containers/volumes/cache use
docker container prune            # remove stopped containers
docker image prune                # remove dangling images
docker image prune -a             # remove ALL unused images (aggressive)
docker volume prune               # remove unused volumes (careful — data!)
docker system prune               # containers + networks + dangling images + build cache
docker system prune -a --volumes  # everything unused (DANGEROUS — review first)
```

```text
PRODUCTION-READINESS CHECKLIST (the whole track):
□ Small, multi-stage image on a pinned slim/distroless base
□ Runs as NON-ROOT; --read-only, --cap-drop ALL, --no-new-privileges where possible
□ No secrets in the image; config + secrets injected at runtime
□ One main process; PID 1 handles SIGTERM (graceful shutdown)
□ HEALTHCHECK defined; logs go to stdout/stderr (with rotation)
□ Resource limits (memory/CPU/pids) + a restart policy
□ Image scanned (no HIGH/CRITICAL) and tagged immutably (version/SHA or digest)
□ Data in named volumes (backed up); container itself is disposable
```

## Hands-on lab

```bash
# 1. Diagnose a crash by exit code + logs
docker run --name boom alpine sh -c 'echo starting; exit 1'
docker inspect -f 'exit={{.State.ExitCode}}' boom    # exit=1
docker logs boom
docker rm boom

# 2. Reproduce an OOM kill (137)
docker run --name oom --memory=16m --memory-swap=16m alpine \
  sh -c 'a=""; while true; do a="$a$a x"; done' ; echo "rc=$?"
docker inspect -f 'oom={{.State.OOMKilled}} code={{.State.ExitCode}}' oom   # oom=true code=137
docker rm oom

# 3. "command not found" -> 127
docker run --rm alpine nosuchcmd ; echo "rc=$?"      # rc=127

# 4. Resilience: restart policy + limits + healthcheck-ish probe
docker run -d --name web --restart=unless-stopped --memory=128m --cpus=0.5 -p 8080:80 nginx
docker stats --no-stream web
docker kill web ; sleep 1 ; docker ps --filter name=web   # restarted by policy

# 5. 12-factor config — same image, different env
docker run --rm -e GREETING=dev    alpine sh -c 'echo "$GREETING"'
docker run --rm -e GREETING=prod   alpine sh -c 'echo "$GREETING"'

# 6. Cleanup
docker rm -f web
docker system df
docker system prune -f               # remove stopped containers, dangling images, cache
```

## Exercises

1. Make a container exit with codes 1, 127, and 137 on purpose, and explain each.
2. Diagnose a crash-looping container using `ps -a`, `logs`, and `inspect` (exit code +
   error).
3. Show that the same image behaves differently via two different env-var configurations
   (12-factor).
4. Run a container with a memory limit, restart policy, and verify it restarts after a kill.
5. Explain the one-process-per-container rule and how you'd run a web + worker app instead.
6. Use `docker system df`/`prune` to reclaim space; explain what each prune removes and the
   risks.

## Troubleshooting

- **Crash-loops immediately** — read `docker logs` + exit code. *Fix:* per the code (config,
  missing binary, OOM, app bug).
- **Exit 137 / `OOMKilled: true`** — hit the memory limit. *Fix:* raise `--memory` or fix the
  leak.
- **Exit 127** — command not found. *Fix:* typo in CMD / wrong base / missing binary.
- **Logs empty** — app logs to a file inside the container. *Fix:* log to stdout/stderr.
- **Won't stop gracefully** — not PID 1 / ignores SIGTERM. *Fix:* exec-form CMD, `--init`,
  handle signals.
- **Disk full** — accumulated images/volumes/cache. *Fix:* `docker system df` then targeted
  `prune` (review `-a --volumes` carefully).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's your first command when a container misbehaves, and your second?
2. What do exit codes 137 and 127 indicate?
3. How do you confirm a container was OOM-killed?
4. Where should containers send logs, and why not to files inside?
5. State the 12-factor config principle for containers.
6. What does `--restart=unless-stopped` do?
7. Why one process per container, and how do you run multi-process apps?
8. What does `docker system prune -a --volumes` remove, and the risk?
9. **Practical:** trigger and diagnose an OOM kill (exit 137).
10. **Practical:** run an image with two different env configs to show 12-factor behavior.

## Solutions & validation

1. `docker logs` (app output), then `docker inspect` (exit code/error/config) — also `ps
   -a`.
2. **137** = SIGKILL, usually **OOM** (over memory limit); **127** = **command not found**.
3. `docker inspect -f '{{.State.OOMKilled}}'` → `true` (and exit 137).
4. **stdout/stderr** — captured by the engine/`docker logs`; files vanish and bloat the
   writable layer.
5. **Config in the environment**, not the image — one image, many environments.
6. Restarts on crash/reboot, but **not** if you manually stopped it.
7. Correct logging/signals/scaling/healthchecks; run web + worker as **separate containers**.
8. All unused images, stopped containers, networks, build cache, **and unused volumes** —
   risk: deletes data/volumes you may need.
9. **Validation:** `OOMKilled=true`, exit 137 under a low `--memory` (see lab).
10. **Validation:** same image prints different `$GREETING` per `-e` value.

> [!TIP]
> Operating containers is a method: **read the exit code + logs first**, then `inspect`/
> `stats`/`events`. Build for operability up front — **one process, PID-1 signal handling,
> stdout logs, env-based config, resource limits, restart policy, and a healthcheck** — and
> most incidents become quick fixes. Run the **production-readiness checklist** before
> shipping, and your containers are ready for the orchestration world next.

## What's next

You've completed the **Docker & Containers** track — from first principles through images,
volumes, networking, Compose, registries, production hygiene, and operations. You can now
package any application into a small, secure, portable image and run it reliably. Next in
the roadmap: **Kubernetes** — orchestrating these containers across a cluster at scale, with
self-healing, scaling, service discovery, and declarative deployments built on exactly the
concepts you've just mastered.
