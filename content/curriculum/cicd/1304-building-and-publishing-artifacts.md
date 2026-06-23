---
title: "CI/CD — Building & Publishing Artifacts"
slug: "cicd-building-and-publishing-artifacts"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "Pipeline Quality"
order: 1304
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, artifacts, container-build, versioning, registry, supply-chain]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 55
status: "published"
summary: "From source to a deployable thing: building container images in CI, semantic versioning and tagging by git SHA, pushing to a registry with proper auth, build caching with BuildKit, and producing reproducible, traceable artifacts — plus an intro to supply-chain security (SBOM, signing)."
seoTitle: "CI/CD 4: Building & Publishing Artifacts (image build, tagging, SBOM)"
seoDescription: "CI artifacts: building container images, semantic versioning and SHA tags, registry auth/push, BuildKit caching, reproducibility, and supply-chain basics (SBOM, signing). Lab + assessment."
---

The output of CI is an **artifact** — the immutable thing you'll deploy. For most modern apps
that's a **container image**, but the principles apply to any binary/package. This lesson
covers building images **in the pipeline**, **versioning and tagging** them so every artifact
traces back to a commit, **pushing** to a registry with proper auth, **build caching** to
stay fast, and an intro to **supply-chain security** (SBOMs, signing, provenance) — the
emerging requirement for trustworthy software delivery.

## Learning objectives

By the end of this lesson you will be able to:

- Build a **container image in CI** and tag it meaningfully.
- Apply a **versioning/tagging** strategy (SemVer + git SHA) for traceability.
- **Authenticate and push** to a registry from the pipeline.
- Use **BuildKit caching** to speed image builds in CI.
- Explain **reproducibility** and **supply-chain** basics (SBOM, signing).

## Part 1 — Building the artifact once

Per "build once, promote" (Lesson 1301), CI builds the image **a single time**; later stages
deploy that exact image:

```yaml
# .github/workflows/build.yaml (excerpt)
jobs:
  build:
    needs: [test]                      # only build green code
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3        # BuildKit builder
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha                      # BuildKit cache (GitHub Actions cache)
          cache-to: type=gha,mode=max
```

`docker/build-push-action` builds and pushes in one step, with caching. Everything you
learned in the Docker track (multi-stage, slim base, non-root) applies — CI is just where it
runs automatically on every change.

## Part 2 — Versioning and tagging strategy

Every artifact must be **traceable to its source**. Tag with both an immutable identity and
human-friendly versions:

```text
ghcr.io/org/app:9f3a1c2          ← git SHA: EXACT commit (always unique, immutable)
ghcr.io/org/app:1.4.2            ← SemVer release (from a git tag)
ghcr.io/org/app:1.4              ← moving minor tag (convenience)
ghcr.io/org/app:main             ← latest on a branch (convenience)
```

```bash
# Derive a SemVer tag from a git tag in CI (only on tagged releases):
on: { push: { tags: ['v*'] } }
# tag the image with the version: ${GITHUB_REF_NAME#v}  ->  1.4.2
```

The **git SHA tag is the anchor** — it ties a running container back to the exact commit
("what's in prod? → SHA 9f3a1c2 → this commit/PR"). SemVer tags are for humans and releases.
**Deploy by SHA or digest**, never `latest` (Lesson: registries).

> [!TIP]
> Always tag images with the **git SHA** in CI — it's free, unique, and immutable, giving you
> a perfect audit trail from production back to source. Layer SemVer tags on **release**
> (from git tags) for humans. The combination means you can answer "exactly what code is
> running?" instantly and roll back to any prior SHA with certainty. `latest` is a convenience
> for dev, never a deploy target.

## Part 3 — Registry auth in CI

CI authenticates to the registry with **short-lived, scoped** credentials:

```text
GHCR     ${{ secrets.GITHUB_TOKEN }}  — auto-provided, scoped by `permissions:`, expires
Docker Hub  a repo/org access token stored as a secret
AWS ECR  OIDC federation -> temporary creds (no stored long-lived keys!) or aws ecr get-login
GCP/Azure  Workload Identity Federation / OIDC -> short-lived tokens
```

The modern best practice is **OIDC federation**: the CI provider proves its identity to the
cloud, which issues **temporary** credentials — so you store **no long-lived cloud keys** in
secrets at all. Where that's not available, use a **scoped access token** stored as a secret.

> [!IMPORTANT]
> Prefer **OIDC/workload-identity federation** over storing long-lived cloud keys in CI
> secrets. A leaked static `AWS_SECRET_ACCESS_KEY` in a pipeline is a serious incident
> waiting to happen; with OIDC, CI exchanges a signed identity token for **short-lived**
> credentials scoped to exactly what the job needs, and there's no permanent secret to leak.
> When you must use a token, scope it minimally (push to one repo) and rotate it.

## Part 4 — Build caching and speed

Image builds in CI are slow without caching (fresh runner = empty cache each time). Use
**BuildKit** caching:

```yaml
      - uses: docker/build-push-action@v6
        with:
          cache-from: type=gha          # pull cached layers from GitHub Actions cache
          cache-to: type=gha,mode=max   # push all layers to the cache
          # or registry-backed: type=registry,ref=ghcr.io/org/app:buildcache
```

Combined with **cache-friendly Dockerfile ordering** (deps before source, Lesson: Docker
images), this makes incremental builds fast. Also consider **multi-arch** builds
(`platforms: linux/amd64,linux/arm64`) when you deploy to mixed architectures — buildx handles
it in one step.

## Part 5 — Reproducibility and supply-chain security

Increasingly, you must prove **what's in** your artifact and **where it came from**:

- **Reproducibility** — pin base images (by digest), pin dependency versions (lockfiles), so
  the same source yields the same artifact. Avoid `latest` bases and unpinned installs.
- **SBOM** (Software Bill of Materials) — a manifest of every component/dependency in the
  image. Generate it in CI (`syft`, `docker sbom`, Trivy) for auditability and fast CVE
  response ("are we affected by X? grep the SBOM").
- **Image signing & provenance** — sign images (`cosign`) and attach **build provenance**
  (SLSA attestations) so deployers can verify the image is authentic and built by your
  pipeline, not tampered with.

```bash
syft ghcr.io/org/app:9f3a1c2 -o spdx-json > sbom.json     # generate an SBOM
cosign sign ghcr.io/org/app@sha256:...                     # sign by digest
cosign verify ghcr.io/org/app@sha256:... --certificate-identity ...  # verify at deploy
```

> [!TIP]
> Bake **supply-chain hygiene** into the build stage: pin bases by **digest**, generate an
> **SBOM** every build, **scan** it (vuln management), and **sign** the image with cosign.
> When the next Log4Shell hits, an SBOM lets you answer "are we affected?" in seconds, and
> signatures + provenance let production **refuse** any image that didn't come from your
> trusted pipeline. This is where CI/CD meets the security track at scale.

## Hands-on lab

```bash
# Local simulation of the CI build/tag/push flow (uses a local registry — no account needed)
docker run -d --name registry -p 5000:5000 registry:2
mkdir build-lab && cd build-lab && git init -q
echo "FROM nginx:1.27-alpine" > Dockerfile
git add . && git commit -qm "init"

# 1. Build and tag by GIT SHA (the traceable anchor) + a version + latest
SHA=$(git rev-parse --short HEAD)
docker build -t localhost:5000/app:$SHA -t localhost:5000/app:1.0.0 -t localhost:5000/app:latest .

# 2. Push the SAME image under all tags
docker push localhost:5000/app:$SHA
docker push localhost:5000/app:1.0.0
docker push localhost:5000/app:latest

# 3. Trace artifact -> source: the SHA tag maps to a commit
echo "Image localhost:5000/app:$SHA  <-->  commit $(git rev-parse HEAD)"

# 4. Pin by digest (immutable) — what you'd actually DEPLOY
DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' localhost:5000/app:$SHA)
echo "deploy this exact artifact: $DIGEST"

# 5. Generate an SBOM and scan (if syft/trivy installed)
docker sbom localhost:5000/app:$SHA 2>/dev/null | head || echo "(install syft/docker sbom)"
trivy image --severity HIGH,CRITICAL localhost:5000/app:$SHA 2>/dev/null | tail -3 || true

docker rm -f registry
```

## Exercises

1. Write a CI job that builds a container image only after tests pass and pushes it tagged by
   git SHA and `latest`.
2. Explain why the git-SHA tag is the traceability anchor and what you'd actually deploy.
3. Derive a SemVer image tag from a git tag (release) and explain when it runs.
4. Configure registry auth two ways (scoped token vs OIDC) and explain why OIDC is preferred.
5. Add BuildKit caching to an image build and explain the speedup with cache-friendly
   Dockerfile ordering.
6. Generate an SBOM for an image and describe how it helps during a CVE response.

## Troubleshooting

- **Prod runs wrong code** — deployed `latest`. *Fix:* deploy by SHA/digest; tag by SHA in
  CI.
- **Push denied** — auth/permissions. *Fix:* `permissions: packages: write`; correct
  registry login; scoped token.
- **Slow image builds every run** — no cache on fresh runners. *Fix:* BuildKit
  `cache-from/to`; order Dockerfile deps-first.
- **Can't tell what's in an image** — no SBOM. *Fix:* generate/store an SBOM each build.
- **Long-lived cloud keys in secrets** — leak risk. *Fix:* OIDC federation → temporary creds.
- **Non-reproducible builds** — unpinned bases/deps. *Fix:* pin base by digest + lockfiles.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why build the artifact only once in the pipeline?
2. What two kinds of tags should every image get, and why?
3. Which tag is the traceability anchor, and what do you deploy?
4. How should CI authenticate to a registry, ideally?
5. Why is OIDC federation better than stored cloud keys?
6. How does BuildKit caching speed CI builds?
7. What is an SBOM and why generate one?
8. What do image signing and provenance provide?
9. **Practical:** build, tag by SHA, and push an image.
10. **Practical:** generate an SBOM (or pin a digest) for an image.

## Solutions & validation

1. So you deploy the **exact** tested artifact everywhere ("build once, promote").
2. **git SHA** (immutable, traceable) + **SemVer** (human/release) — traceability + clarity.
3. The **git SHA** (or digest) is the anchor; deploy by **SHA/digest**, not `latest`.
4. With **short-lived, scoped** credentials — ideally **OIDC** (no stored keys).
5. CI exchanges a signed identity for **temporary** creds; no permanent secret to leak.
6. Reuses cached layers across runs (`cache-from/to`), especially with deps-before-source
   ordering.
7. A **bill of materials** of all components; enables audit and fast CVE impact analysis.
8. **Authenticity/integrity** — proof the image came unmodified from your pipeline.
9. **Validation:** image tagged `:$SHA` pushed (see lab).
10. **Validation:** `docker sbom`/`syft` output or a pinned `@sha256:` digest.

> [!TIP]
> CI's job is to emit a **trustworthy, traceable, immutable artifact**: built once, tagged by
> **git SHA** (+ SemVer on release), pushed with **short-lived OIDC creds**, **cached** for
> speed, and accompanied by an **SBOM + signature**. Deploy that exact artifact by digest.
> This is the hand-off point to the deployment lessons — and the foundation of a secure
> software supply chain.

## What's next

Next: **Lesson 1305 — Deployment Strategies.** Getting the artifact to production safely:
rolling, blue-green, and canary deployments, feature flags, automated rollback, and
environment promotion (dev → staging → prod) — releasing without downtime or drama.
