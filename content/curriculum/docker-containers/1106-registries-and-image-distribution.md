---
title: "Docker — Registries & Image Distribution"
slug: "docker-registries-and-image-distribution"
track: "docker-containers"
trackName: "Docker & Containers"
module: "Container Operations"
order: 1106
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [docker, registry, push, pull, tags, digest, ghcr]
cover: "/covers/curriculum/docker-containers.svg"
estMinutes: 50
status: "published"
summary: "How images travel from your build to production: registries (Docker Hub, GHCR, ECR, private), authenticating and pushing/pulling, naming and a sane tagging strategy, the crucial tag-vs-digest distinction for immutable deploys, and multi-arch images."
seoTitle: "Docker 6: Registries & Image Distribution (push, tags, digests)"
seoDescription: "Docker registries: Docker Hub/GHCR/ECR, login/push/pull, image naming and tagging strategy, tags vs immutable digests, and multi-arch images. Hands-on lab and assessment."
---

You can build images — now you need to **distribute** them so CI, teammates, and production
can run the *exact same* artifact. That's what **registries** do: they store and serve
images. This lesson covers the major registries (Docker Hub, GHCR, ECR), how to
**authenticate**, **push** and **pull**, the **naming and tagging** strategy that keeps
deployments sane, and the critical **tag-vs-digest** distinction that makes deploys truly
**immutable** and reproducible.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what a **registry** is and name the common ones.
- **Authenticate**, **tag**, **push**, and **pull** images.
- Decode the **image name** format (`registry/namespace/repo:tag`).
- Apply a sensible **tagging strategy** (and why `latest` is dangerous in prod).
- Use **digests** for immutable deploys and understand **multi-arch** images.

## Part 1 — What a registry is

A **registry** is a server that stores **repositories** of images (each repo holds many
**tags**/versions). `docker pull`/`push` talk to it over the registry API.

- **Docker Hub** — the default public registry (`docker.io`); huge library of official
  images.
- **GHCR** — GitHub Container Registry (`ghcr.io`), tied to GitHub repos/permissions.
- **Cloud registries** — AWS **ECR**, Google **Artifact Registry**, Azure **ACR** — private,
  IAM-integrated, close to your workloads.
- **Self-hosted** — run your own (`registry:2`, Harbor) for full control/air-gapped.

If you don't specify a registry, Docker assumes **Docker Hub** (`nginx` ≡
`docker.io/library/nginx`).

## Part 2 — Image names decoded

```text
   ghcr.io / myorg / web-api : 1.4.2
   └──┬──┘  └──┬──┘ └──┬───┘  └─┬─┘
   registry  namespace  repo    tag
```

- **registry** — host (default `docker.io`).
- **namespace** — user/org (`library` for Docker official images).
- **repository** — the image name.
- **tag** — a mutable label for a version (`1.4.2`, `latest`, a git SHA). Omitted ⇒
  `:latest`.

```bash
docker tag myapp:1.0 ghcr.io/myorg/myapp:1.0     # retag a local image for a registry
docker tag myapp:1.0 ghcr.io/myorg/myapp:latest
```

## Part 3 — Authenticate, push, pull

```bash
# Log in (use a TOKEN, not your password — recall the auth lesson)
echo "$GHCR_TOKEN" | docker login ghcr.io -u myuser --password-stdin
# Docker Hub:        docker login -u myuser
# AWS ECR:           aws ecr get-login-password | docker login --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com

docker push ghcr.io/myorg/myapp:1.0       # upload (only changed layers are sent)
docker push ghcr.io/myorg/myapp:latest

docker pull ghcr.io/myorg/myapp:1.0       # download elsewhere (CI, prod)
docker logout ghcr.io
```

Pushes and pulls transfer **only the layers the registry/host doesn't already have** —
shared base layers aren't re-sent, which is why pushing a small change is fast. Credentials
are stored by a **credential helper**; on shared/CI machines prefer short-lived tokens.

> [!TIP]
> Authenticate with **access tokens** (Docker Hub PAT, GHCR token, ECR's temporary token),
> never your account password — and scope them minimally (push only where needed). In CI,
> use the platform's built-in token (e.g. `GITHUB_TOKEN` for GHCR) so credentials are
> short-lived and never hard-coded. Treat registry credentials like any secret.

## Part 4 — Tagging strategy

Tags are **mutable pointers** — the same tag can point to different images over time. Your
strategy determines reproducibility:

```text
GOOD production tags (immutable in practice):
  myapp:1.4.2            SemVer release
  myapp:1.4.2-rc1        pre-release
  myapp:git-9f3a1c2      the exact commit SHA  (great for traceability)
  myapp:2024-06-23       date-based

RISKY:
  myapp:latest           moves constantly — never deploy this to prod
```

A common pattern: tag each build with **both** an immutable tag (version or SHA) **and** a
moving one (`latest`/`stable`) for convenience — but **deploy the immutable** one.

> [!IMPORTANT]
> **Never deploy `:latest` to production.** It's a moving target — what you tested and what
> runs can silently differ, and rollbacks become guesswork. Tag releases with an
> **immutable** identifier (SemVer and/or the **git SHA**) and deploy *that*. The SHA tag in
> particular ties a running container straight back to the exact source commit — invaluable
> when debugging "what's actually running in prod?"

## Part 5 — Digests and multi-arch

For **guaranteed** immutability, pin by **digest** — a content hash of the exact image.
Unlike a tag, a digest **can never change**:

```bash
docker pull nginx@sha256:abcd1234...        # pull an EXACT image, regardless of tags
docker inspect --format='{{index .RepoDigests 0}}' nginx:1.27   # see the digest
# In production manifests/Compose/K8s: reference image@sha256:... for reproducible deploys
```

Tags can be re-pointed (even maliciously); a **digest is cryptographically fixed**.
High-assurance pipelines resolve a tag to a digest at build time and deploy the digest.

**Multi-arch images** let one tag serve multiple CPU architectures (amd64, arm64) — the
registry stores a **manifest list** and clients pull the matching variant automatically:

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/myorg/myapp:1.0 --push .       # build + push a multi-arch image
docker buildx imagetools inspect ghcr.io/myorg/myapp:1.0   # see the per-arch manifests
```

This is why `docker pull python:3.12` "just works" on both an Apple-silicon laptop and an
amd64 server.

## Hands-on lab

```bash
# 1. Run a LOCAL registry so the lab needs no account
docker run -d --name registry -p 5000:5000 registry:2
docker pull alpine:3.20

# 2. Tag for the local registry and push
docker tag alpine:3.20 localhost:5000/myteam/alpine:1.0
docker push localhost:5000/myteam/alpine:1.0

# 3. Pull it back as if on another machine (remove local first)
docker rmi localhost:5000/myteam/alpine:1.0
docker pull localhost:5000/myteam/alpine:1.0
docker run --rm localhost:5000/myteam/alpine:1.0 echo "pulled from my registry"

# 4. Inspect tags vs digest (immutability)
docker inspect --format='{{index .RepoDigests 0}}' localhost:5000/myteam/alpine:1.0
# pin by digest:
DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' localhost:5000/myteam/alpine:1.0)
docker pull "$DIGEST"                      # exact image, tag-independent

# 5. (If you have GHCR/Hub) practice real auth — token via stdin, push, logout
#   echo "$TOKEN" | docker login ghcr.io -u USER --password-stdin
#   docker tag myapp:1.0 ghcr.io/USER/myapp:1.0 && docker push ghcr.io/USER/myapp:1.0

docker rm -f registry
```

## Exercises

1. Decode an image reference like `ghcr.io/acme/api:2.3.0` into its four parts.
2. Run a local registry, push an image to it, remove it locally, and pull it back.
3. Tag one build with a SemVer tag, a git-SHA tag, and `latest`; explain which you'd deploy
   and why.
4. Find an image's digest and pull by digest; explain how that differs from pulling by tag.
5. Explain registry authentication best practice (tokens, CI tokens) and why not to use
   passwords.
6. Explain multi-arch images and how one tag serves both amd64 and arm64.

## Troubleshooting

- **`denied: requested access to the resource is denied`** — not logged in / wrong
  namespace. *Fix:* `docker login`; tag with the correct `registry/namespace`.
- **Push is huge/slow** — sending base layers. *Fix:* usually only changed layers transfer;
  ensure a shared base; check network.
- **Prod running unexpected code** — deployed `latest`. *Fix:* deploy immutable version/SHA
  tags (or digests).
- **`no matching manifest for arch`** — single-arch image on a different CPU. *Fix:* build
  multi-arch with buildx.
- **Credentials leaked in CI logs** — echoed a password. *Fix:* `--password-stdin`, use
  CI-provided short-lived tokens.
- **Local registry push refused (http)** — TLS expected. *Fix:* `localhost:5000` is allowed;
  for others configure insecure-registries or use TLS.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a registry, and what's the default one?
2. Break down `ghcr.io/myorg/web:1.4.2` into its parts.
3. What do `docker push`/`pull` transfer, and what's optimized?
4. How should you authenticate to a registry, and how in CI?
5. Why is deploying `:latest` to production dangerous?
6. Give two good immutable tagging schemes.
7. How does a digest differ from a tag, and when use it?
8. What is a multi-arch image and why does it matter?
9. **Practical:** push and pull an image via a registry.
10. **Practical:** pull an image by digest and explain the guarantee.

## Solutions & validation

1. A server storing image repos/tags; default is **Docker Hub** (`docker.io`).
2. registry `ghcr.io`, namespace `myorg`, repo `web`, tag `1.4.2`.
3. Image **layers**; only layers the other side lacks are transferred.
4. With **tokens** (not passwords); in CI use the platform's **short-lived token**.
5. `latest` is mutable — tested vs running image can differ; rollbacks become ambiguous.
6. SemVer (`1.4.2`) and **git-SHA** (`git-9f3a1c2`) (also date-based).
7. A digest is a **content hash** (immutable, tag-independent); use it for reproducible/
   high-assurance deploys.
8. One tag serving multiple CPU archs via a manifest list; clients auto-pull the right
   variant.
9. **Validation:** push to `localhost:5000`, remove, pull back, run (see lab).
10. **Validation:** `docker pull image@sha256:...` fetches the exact image regardless of
    tags.

> [!TIP]
> Registries are how a build becomes a deployable artifact. Authenticate with **tokens**,
> tag releases **immutably** (version + git SHA), and for the strongest guarantee deploy by
> **digest** — so what runs in prod is provably the exact image you built and tested. This
> traceability (image ↔ commit) is the backbone of trustworthy CI/CD.

## What's next

Next: **Lesson 1107 — Production Image Hygiene & Security.** Make images small, fast, and
safe: multi-stage builds, choosing slim/distroless bases, running as non-root, minimizing
layers and attack surface, scanning for vulnerabilities, and keeping secrets out of images.
