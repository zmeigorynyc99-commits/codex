---
title: "Docker — Production Image Hygiene & Security"
slug: "docker-production-image-hygiene-and-security"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Production Containers"
order: 1107
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, multi-stage, security, distroless, non-root, scanning, hygiene]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 65
status: "published"
summary: "Make images small, fast, and safe for production: multi-stage builds, choosing slim/distroless bases, running as non-root, minimizing layers and attack surface, pinning versions, keeping secrets out of images, and scanning for vulnerabilities with Trivy/Scout."
seoTitle: "Docker 7: Production Image Hygiene & Security (multi-stage, non-root)"
seoDescription: "Production Docker images: multi-stage builds, slim/distroless bases, non-root USER, minimizing layers/attack surface, secret hygiene, and vulnerability scanning. Lab + assessment."
---

A working image and a **production-grade** image are very different things. The naive image
is often hundreds of MB of build tools, runs as **root**, ships known CVEs, and sometimes
**leaks secrets** baked into a layer. This lesson turns out lean, fast, secure images:
**multi-stage builds**, choosing **slim/distroless** bases, running as **non-root**,
shrinking **attack surface and layers**, **secret hygiene**, and **vulnerability
scanning**. These habits matter even more in Kubernetes, where images run at scale.

## Learning objectives

By the end of this lesson you will be able to:

- Use **multi-stage builds** to ship runtime-only images.
- Choose appropriate **base images** (slim, alpine, distroless) and pin versions.
- Run containers as a **non-root user**.
- Minimize **layers and attack surface**; keep **secrets out** of images.
- **Scan** images for vulnerabilities and read the results.

## Part 1 — Multi-stage builds

The biggest win: build in one stage with all the toolchain, then copy **only the
artifacts** into a clean final stage. The compilers, dev headers, and caches stay behind.

```dockerfile
# ---- build stage: has the full toolchain ----
FROM golang:1.22 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app ./cmd/server

# ---- final stage: tiny, runtime-only ----
FROM gcr.io/distroless/static:nonroot
COPY --from=build /app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]
```

The final image contains **just the binary** — no Go toolchain, no shell — often a few MB
instead of ~1 GB. The same pattern applies to Node (build with dev deps, copy `dist` +
prod deps), Python, Java, etc.

> [!IMPORTANT]
> **Multi-stage builds are the single biggest lever** for small, secure images: do the
> heavy build in a throwaway stage and `COPY --from=build` only the runtime artifacts into a
> minimal final image. This slashes size (faster pulls, less storage) **and** attack surface
> (no compilers, package managers, or build secrets in the shipped image). Use it for
> essentially every compiled or bundled app.

## Part 2 — Choosing a base image

Smaller base = less to patch, fewer CVEs, faster pulls:

| Base | Size | Trade-off |
|---|---|---|
| `ubuntu` / `debian` | large | full distro, easy but big |
| `*-slim` (e.g. `python:3.12-slim`) | medium | trimmed; good default for most apps |
| `alpine` | tiny | musl libc (occasional compat issues), minimal |
| **distroless** (`gcr.io/distroless/*`) | tiny | **no shell/package manager** — very secure, harder to debug |
| `scratch` | empty | only your static binary — smallest possible |

**Pin versions** (`python:3.12.4-slim`, not `python:latest`) for reproducibility, and
prefer the **smallest base that runs your app**. Distroless/scratch have no shell — great
for security (nothing for an attacker to use), but you debug via ephemeral containers, not
`exec sh`.

## Part 3 — Run as non-root

By default containers run as **root** — and container root is largely host root if the
container is breached. Drop privileges:

```dockerfile
FROM python:3.12-slim
RUN useradd --create-home --uid 10001 appuser   # create an unprivileged user
WORKDIR /app
COPY --chown=appuser:appuser . .
RUN pip install --no-cache-dir -r requirements.txt
USER appuser                                     # everything after runs as appuser
EXPOSE 8000
CMD ["python","app.py"]
```

```bash
# Enforce at runtime too (defense in depth):
docker run --user 10001 --read-only --cap-drop ALL \
  --security-opt no-new-privileges myapp:1.0
```

> [!IMPORTANT]
> **Don't run containers as root.** If an attacker escapes the app, root inside the
> container is a dangerous starting point for host compromise (the kernel is shared).
> Create a dedicated **non-root `USER`** in the Dockerfile, and at runtime add
> **`--read-only`**, **`--cap-drop ALL`**, and **`--no-new-privileges`**. These are cheap,
> high-value hardening steps straight from the security track's least-privilege principle.

## Part 4 — Minimize layers, surface, and secrets

```dockerfile
# Combine related RUN steps; clean up in the SAME layer (or apt won't shrink the image)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

- **Fewer, well-ordered layers**; clean caches **in the same `RUN`** (deleting in a later
  layer doesn't reduce size — the data persists in the earlier layer).
- **Install only what you need** (`--no-install-recommends`, no dev tools in the final
  stage).
- **`.dockerignore`** so build context junk and secrets never enter the image.

**Secrets must never be baked into an image** — every layer is stored and extractable, even
if you `rm` the file in a later step:

```dockerfile
# WRONG: secret is permanently in the layer history, even if deleted later
# COPY secret.key /tmp/ && RUN use-it && rm /tmp/secret.key   # STILL recoverable

# RIGHT: build-time secret that is NOT persisted (BuildKit)
RUN --mount=type=secret,id=npmtoken \
    NPM_TOKEN=$(cat /run/secrets/npmtoken) npm ci
```

Provide runtime secrets via **env vars/secrets managers/orchestrator secrets**, never `COPY`
them in.

> [!TIP]
> A secret added in **any** layer is recoverable from the image even if a later layer
> deletes it — image history is append-only. Use **BuildKit `--mount=type=secret`** for
> build-time credentials (it never lands in a layer), and inject **runtime** secrets via the
> environment or your orchestrator's secret store. Scan your own images to confirm nothing
> sensitive leaked in.

## Part 5 — Scanning and verification

```bash
# Scan for known CVEs in the image's packages (recall vuln management)
trivy image myapp:1.0
docker scout cves myapp:1.0           # Docker's built-in scanner
trivy image --severity HIGH,CRITICAL --exit-code 1 myapp:1.0   # fail CI on serious CVEs

# See what bloats the image and verify the final user
docker history myapp:1.0
docker image inspect myapp:1.0 --format '{{.Config.User}}'     # should NOT be empty/root

# Add a healthcheck so orchestrators know if it's alive
# (Dockerfile)  HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/health || exit 1
```

Integrate scanning into **CI** (fail builds on HIGH/CRITICAL), rebuild regularly to pick up
base-image patches, and pin/track your base so you know when to update. This is the
container instance of the vulnerability-management lifecycle.

## Hands-on lab

```bash
mkdir img-hygiene && cd img-hygiene
cat > app.py <<'EOF'
print("hello from a lean, non-root container")
EOF

# 1. A "naive" image (large base, runs as root) — baseline
cat > Dockerfile.naive <<'EOF'
FROM python:3.12
COPY app.py /app.py
CMD ["python","/app.py"]
EOF
docker build -f Dockerfile.naive -t demo:naive .

# 2. A hardened image (slim base, non-root user, minimal)
cat > Dockerfile <<'EOF'
FROM python:3.12-slim
RUN useradd --uid 10001 appuser
COPY app.py /app.py
USER appuser
CMD ["python","/app.py"]
EOF
docker build -t demo:slim .

# 3. Compare size and the runtime user
docker images | grep demo
docker image inspect demo:naive --format 'naive user=[{{.Config.User}}]'
docker image inspect demo:slim  --format 'slim  user=[{{.Config.User}}]'   # appuser

# 4. Prove non-root at runtime
docker run --rm demo:slim id        # uid=10001, not root

# 5. Scan both (install trivy if needed) and compare findings
trivy image --severity HIGH,CRITICAL demo:naive | tail -5
trivy image --severity HIGH,CRITICAL demo:slim  | tail -5

# 6. Extra runtime hardening
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges demo:slim
```

## Exercises

1. Convert a single-stage Dockerfile for a compiled or bundled app into a **multi-stage**
   build; compare final image sizes.
2. Rebuild an image on three bases (full, slim, distroless/alpine) and compare size and scan
   results.
3. Add a non-root `USER` to a Dockerfile and prove at runtime the process isn't root.
4. Demonstrate that a secret `COPY`'d then deleted in a later layer is still recoverable from
   history; then do it correctly with a BuildKit secret mount.
5. Combine and clean up `apt-get` layers; show the image shrank.
6. Scan an image, fail on HIGH/CRITICAL, and describe how you'd remediate a finding.

## Troubleshooting

- **Image is huge** — single-stage with toolchain / full base. *Fix:* multi-stage + slim/
  distroless base; copy only artifacts.
- **`rm`'d a secret but it's still in the image** — layer history. *Fix:* never COPY
  secrets; use BuildKit `--mount=type=secret` / runtime injection; rebuild clean.
- **App breaks on alpine** — musl libc differences. *Fix:* use `-slim` (glibc) or build the
  right wheels/binaries.
- **Can't `exec sh` into distroless** — no shell by design. *Fix:* debug via
  `docker debug`/ephemeral container; or use a slim image in dev.
- **Container runs as root despite `USER`** — overridden by `--user`/compose. *Fix:* check
  runtime user; set it consistently.
- **CVEs keep appearing** — stale base. *Fix:* rebuild regularly; pin + update base; scan in
  CI.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What problem do multi-stage builds solve, and how?
2. Compare slim, alpine, and distroless bases.
3. Why pin base image versions?
4. Why run containers as non-root, and how do you do it?
5. Name two runtime hardening flags and what they do.
6. Why doesn't deleting a secret in a later layer remove it from the image?
7. How do you supply build-time secrets safely?
8. How does scanning fit the vulnerability-management lifecycle?
9. **Practical:** build a multi-stage, non-root image and prove the runtime user.
10. **Practical:** scan an image and fail on HIGH/CRITICAL findings.

## Solutions & validation

1. They keep build tools out of the final image — build in one stage, `COPY --from` only
   artifacts → small, secure.
2. slim = trimmed glibc (good default); alpine = tiny musl (compat caveats); distroless = no
   shell/pkg mgr (most secure, harder to debug).
3. Reproducibility — `latest` drifts; pinned bases give consistent, auditable builds.
4. Container root ≈ host risk if breached; create a non-root `USER` (and enforce `--user`).
5. e.g. `--read-only`, `--cap-drop ALL`, `--no-new-privileges` (least privilege at runtime).
6. Image layers are **append-only**; the secret persists in the earlier layer's history.
7. **BuildKit `--mount=type=secret`** (not persisted) or runtime env/secrets manager.
8. It detects known CVEs in image packages; gate CI and rebuild to patch — continuous risk
   reduction.
9. **Validation:** `docker run --rm img id` shows a non-root uid (see lab).
10. **Validation:** `trivy image --severity HIGH,CRITICAL --exit-code 1` fails on findings.

> [!TIP]
> Production image hygiene is the security track applied to containers: **least privilege**
> (non-root, dropped caps, read-only), **minimal attack surface** (multi-stage + tiny base),
> **no secrets in artifacts**, and **continuous scanning**. Small, non-root, scanned images
> pull faster, patch easier, and give attackers almost nothing to work with — and these
> exact habits carry straight into Kubernetes.

## What's next

Next: **Lesson 1108 — Troubleshooting & Best Practices.** Operate containers confidently:
debugging crashes and exit codes, `inspect`/`stats`/`events`, logging and the 12-factor
config approach, resource limits and restart policies, `docker system prune`, and a
production-readiness checklist that ties the whole track together.
