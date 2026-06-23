---
title: "Docker — Images & Dockerfiles"
slug: "docker-images-and-dockerfiles"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Container Foundations"
order: 1102
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, dockerfile, images, layers, build, cache]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 60
status: "published"
summary: "Build your own images: the Dockerfile instructions (FROM, RUN, COPY, WORKDIR, ENV, EXPOSE, CMD vs ENTRYPOINT), how the layer cache works and how to order instructions for fast rebuilds, .dockerignore, tagging, and writing a Dockerfile for a real application."
seoTitle: "Docker 2: Images & Dockerfiles (layers, cache, CMD vs ENTRYPOINT)"
seoDescription: "Build Docker images: Dockerfile instructions, layer caching and instruction order, .dockerignore, tagging, CMD vs ENTRYPOINT, and a real app Dockerfile. Lab + assessment."
---

Running other people's images is useful; **building your own** is where Docker becomes
powerful. A **Dockerfile** is a recipe that produces a reproducible image — and writing
good ones is mostly about understanding the **layer cache**, which decides whether your
builds take 2 seconds or 2 minutes. This lesson covers the core **Dockerfile
instructions**, how layers and caching work (and how to order instructions to exploit
them), **`.dockerignore`**, **tagging**, the often-confused **`CMD` vs `ENTRYPOINT`**, and
building a real app image.

## Learning objectives

By the end of this lesson you will be able to:

- Write a **Dockerfile** with the core instructions and `docker build` it.
- Explain how **layers and the build cache** work, and order instructions for fast
  rebuilds.
- Use **`.dockerignore`** and meaningful **tags**.
- Distinguish **`CMD`** from **`ENTRYPOINT`** and shell vs exec form.
- Build and run an image for a real application.

## Part 1 — A first Dockerfile

```dockerfile
# Dockerfile
FROM python:3.12-slim                 # base image (the starting filesystem)
WORKDIR /app                          # set working dir (created if missing)
COPY requirements.txt .               # copy a file from build context into the image
RUN pip install --no-cache-dir -r requirements.txt   # run a build command -> new layer
COPY . .                              # copy the rest of the app
EXPOSE 8000                           # document the port (metadata; doesn't publish)
ENV APP_ENV=production                # default environment variable
CMD ["python", "app.py"]              # default command when a container starts
```

```bash
docker build -t myapp:1.0 .           # build from the Dockerfile in "." (the build context)
docker run --rm -p 8000:8000 myapp:1.0
```

Each instruction in roughly its own **layer**. The build sends the **build context** (the
`.` directory) to the engine, then executes instructions top-to-bottom.

Common instructions: **`FROM`** (base), **`WORKDIR`**, **`COPY`**/**`ADD`**, **`RUN`**
(execute at build time), **`ENV`**, **`ARG`** (build-time variable), **`EXPOSE`**
(documentation), **`USER`** (drop root), **`CMD`**/**`ENTRYPOINT`** (what runs at start).

## Part 2 — Layers and the build cache

Every `FROM/RUN/COPY/ADD` creates a **layer**. Docker **caches** layers: on rebuild, if an
instruction and its inputs are unchanged, it **reuses** the cached layer and skips the
work. The catch: **once a layer changes, every layer after it is rebuilt** (cache is
invalidated downstream).

```text
FROM python:3.12-slim     ← cached
WORKDIR /app              ← cached
COPY requirements.txt .   ← cached IF requirements.txt unchanged
RUN pip install ...       ← cached IF the COPY above was cached  (the expensive step!)
COPY . .                  ← invalidated whenever ANY source file changes
CMD [...]
```

This is why instruction **order matters enormously**: copy and install **dependencies
first** (they change rarely), then copy your **source code** (changes constantly). That way
editing a source file doesn't re-run `pip install`/`npm install`.

> [!IMPORTANT]
> **Order Dockerfile instructions from least-to-most frequently changing.** Copy dependency
> manifests (`requirements.txt`/`package.json`) and install **before** copying the rest of
> the source. Then a code edit invalidates only the cheap final `COPY` layer, not the
> expensive dependency install. Getting this order right is the difference between
> sub-second and multi-minute rebuilds.

## Part 3 — .dockerignore and the build context

The build sends the whole context directory to the daemon — don't ship junk:

```text
# .dockerignore  (same idea as .gitignore)
.git
node_modules
__pycache__
*.log
.env
dist
```

A `.dockerignore` **speeds builds** (smaller context), keeps images clean, and prevents
**leaking secrets** (`.env`, keys) or huge folders (`node_modules`, `.git`) into the image.
Always add one.

## Part 4 — CMD vs ENTRYPOINT

Both define what runs when a container starts — but differently:

- **`CMD`** — the **default** command/args, **easily overridden** by `docker run … <cmd>`.
- **`ENTRYPOINT`** — the **fixed** executable; `docker run` args are **appended** to it.
- Used **together**: `ENTRYPOINT` = the program, `CMD` = default arguments.

```dockerfile
ENTRYPOINT ["python", "app.py"]     # always runs python app.py
CMD ["--port", "8000"]              # default args (overridable: docker run img --port 9000)
```

Prefer the **exec form** (JSON array `["exe","arg"]`) over **shell form** (`CMD python
app.py`): exec form makes your app **PID 1** so it receives signals (graceful
`SIGTERM`/`Ctrl-C`) — shell form wraps it in `/bin/sh -c`, which can swallow signals.

> [!TIP]
> Rule of thumb: use **`ENTRYPOINT`** for the thing the image *is* (the binary), and
> **`CMD`** for **default arguments** you might override. Always use **exec form**
> (`["...","..."]`) so signals reach your process and it shuts down cleanly — important for
> graceful restarts and orchestration. If you only need a simple default, `CMD ["app"]`
> alone is fine.

## Part 5 — Tagging and inspecting

```bash
docker build -t myapp:1.0 -t myapp:latest .   # multiple tags at once
docker tag myapp:1.0 registry.example.com/team/myapp:1.0   # retag for a registry
docker history myapp:1.0                        # see each layer and its size
docker image inspect myapp:1.0 | less           # config, env, entrypoint, layers
docker build --no-cache -t myapp:1.0 .          # force a clean rebuild (ignore cache)
```

Tag with **meaningful versions** (`1.4.2`, a git SHA, a date) — not just `latest`, which
moves and breaks reproducibility. `docker history` reveals bloated layers to optimize
(next lesson covers slim production images).

## Hands-on lab

```bash
mkdir docker-build-lab && cd docker-build-lab

# 1. A tiny Flask app
cat > app.py <<'EOF'
from flask import Flask
app = Flask(__name__)
@app.get("/")
def home(): return "Hello from a container image!\n"
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
EOF
echo "flask" > requirements.txt
printf '.git\n__pycache__\n*.log\n.env\n' > .dockerignore

# 2. A cache-friendly Dockerfile (deps before source)
cat > Dockerfile <<'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
EOF

# 3. Build and run
docker build -t flaskapp:1.0 .
docker run -d --name flask -p 8000:8000 flaskapp:1.0
curl -s localhost:8000

# 4. Prove the cache: edit ONLY app.py and rebuild — pip install should be CACHED
sed -i 's/Hello/Hi/' app.py
docker build -t flaskapp:1.1 .          # note "CACHED" on the pip layer; fast rebuild

# 5. Now edit requirements.txt and rebuild — pip install RE-RUNS (cache invalidated)
echo "requests" >> requirements.txt
docker build -t flaskapp:1.2 .          # pip layer rebuilds

# 6. Inspect layers and clean up
docker history flaskapp:1.2
docker rm -f flask
```

## Exercises

1. Write a Dockerfile for a small app in a language you know, ordered for good caching;
   build and run it.
2. Explain the layer cache and demonstrate a code-only change reusing the dependency layer.
3. Reorder a Dockerfile badly (source before deps) and show how it hurts rebuild time.
4. Add a `.dockerignore`; show it shrinks the build context and excludes a secret.
5. Write a Dockerfile using `ENTRYPOINT` + `CMD` and demonstrate overriding the args at
   `docker run`.
6. Use `docker history` to find your image's largest layer and propose a reduction.

## Troubleshooting

- **Every build re-runs install** — source copied before deps. *Fix:* `COPY` manifests +
  install **before** `COPY . .`.
- **Secret/`.git`/`node_modules` in the image** — no `.dockerignore`. *Fix:* add one.
- **App doesn't stop on Ctrl-C/SIGTERM** — shell-form CMD. *Fix:* use exec form (JSON
  array) so the app is PID 1.
- **`docker run` ignores my args** — `CMD` only, or wrong form. *Fix:* understand
  ENTRYPOINT appends args; CMD is overridden.
- **Build context huge/slow** — sending big dirs. *Fix:* `.dockerignore`; build from a
  clean subdir.
- **Stale cache hides a change** — *Fix:* `--no-cache` to force a clean rebuild when needed.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a Dockerfile, and what does `docker build .` send to the engine?
2. Which instructions create layers?
3. How does the build cache decide to reuse a layer, and what invalidates downstream layers?
4. Why copy dependency files before source code?
5. What does `.dockerignore` do and why does it matter for security?
6. Difference between `CMD` and `ENTRYPOINT`?
7. Why prefer exec form over shell form?
8. Why tag images with versions instead of only `latest`?
9. **Practical:** build an image and show a code-only change hitting the cache.
10. **Practical:** use ENTRYPOINT+CMD and override the args at run time.

## Solutions & validation

1. A build recipe; `build` sends the **build context** (the directory) to the daemon.
2. `FROM`, `RUN`, `COPY`, `ADD` (each ≈ a layer).
3. Reuses if the instruction + inputs are unchanged; **any** changed layer invalidates **all
   layers after it**.
4. Deps change rarely; copying them first keeps the expensive install layer **cached** when
   only code changes.
5. Excludes files from the build context — faster builds, cleaner images, no leaked
   secrets/`.git`.
6. `CMD` = overridable default; `ENTRYPOINT` = fixed executable (run args appended).
7. Exec form makes the app **PID 1**, so it receives signals (graceful shutdown).
8. `latest` moves over time — version tags are reproducible/pinnable.
9. **Validation:** rebuild shows "CACHED" on the pip/npm layer after a code edit.
10. **Validation:** `docker run img --port 9000` overrides the CMD args (see lab).

> [!TIP]
> A good Dockerfile is **cache-aware**: stable layers first (base, dependencies), volatile
> layers last (your source). Add a `.dockerignore`, tag with real versions, use exec-form
> `ENTRYPOINT`/`CMD`, and your builds stay fast and your images clean. The cache rules you
> learned here are the foundation of the slim, secure production images in the next lesson.

## What's next

Next: **Lesson 1103 — Data, Volumes & Persistence.** Containers are ephemeral — so where
does the data go? Bind mounts vs named volumes vs tmpfs, persisting databases, sharing
files between host and container, and the patterns for stateful workloads.
