---
title: "CI/CD — Fundamentals & the Pipeline Mindset"
slug: "cicd-fundamentals-and-the-pipeline-mindset"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "CI/CD Foundations"
order: 1301
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, continuous-integration, continuous-delivery, pipeline, automation]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 55
status: "published"
summary: "Why CI/CD exists and the model behind it: continuous integration vs delivery vs deployment, the build→test→deploy pipeline, fast feedback and small batches, the trigger from version control, and the principles (automate everything, fail fast, one artifact) that make shipping safe and frequent."
seoTitle: "CI/CD 1: Fundamentals & the Pipeline Mindset (CI vs CD)"
seoDescription: "Intro to CI/CD: continuous integration vs delivery vs deployment, the build/test/deploy pipeline, fast feedback, small batches, and core principles. Lab and assessment."
---

You can build images and orchestrate them — now you need to **ship changes safely and
often**. **CI/CD** is the automated path from a code commit to running software. Before any
YAML pipeline, you need the model: **continuous integration** (merge and verify constantly),
**continuous delivery** (always-deployable artifacts), and **continuous deployment** (auto-
ship to prod), plus the principles that make frequent releases *safer* than rare ones —
small batches, fast feedback, automate everything, and build one artifact you promote
through environments.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **continuous integration, delivery, and deployment**.
- Describe the **build → test → deploy** pipeline and what triggers it.
- Explain why **small batches + fast feedback** reduce risk.
- Apply core principles: **automate everything, fail fast, build once/promote**.
- Recognize key pipeline **metrics** (DORA).

## Part 1 — The problem CI/CD solves

Without automation, integrating and releasing is slow and scary: code diverges for weeks,
"integration" is a painful merge, testing is manual, and deploys are rare, large, and
risky — so people deploy even *less*, making each release bigger and riskier. A vicious
cycle.

CI/CD breaks it by making the path from commit to production **automated, fast, and
repeatable** — so you integrate continuously and release in **small, low-risk increments**.
The counterintuitive truth: **deploying more often is safer**, because each change is tiny
and easy to diagnose/roll back.

## Part 2 — CI vs CD vs CD

```text
Continuous Integration (CI)   developers merge to main frequently; every push auto-builds
                              and runs tests -> integration problems caught in minutes.
Continuous Delivery (CD)      every change that passes CI produces a deployable artifact;
                              releasing to prod is a ONE-CLICK (manual approval) action.
Continuous Deployment (CD)    every change that passes the pipeline auto-deploys to prod,
                              no human gate (requires high confidence + strong automation).
```

- **CI** is about **merging and verifying** — the foundation everyone should have.
- **Continuous *Delivery*** keeps you **always ready** to ship; a human decides *when*.
- **Continuous *Deployment*** removes that human gate — every green build goes live.

Most teams do CI + continuous **delivery**; continuous **deployment** is a maturity step
that needs excellent tests, monitoring, and fast rollback.

> [!IMPORTANT]
> The two CDs differ by **one human gate**. Continuous **Delivery** = the pipeline always
> produces something you *could* deploy at the push of a button (you choose when).
> Continuous **Deployment** = it deploys automatically with no manual approval. Don't claim
> "continuous deployment" until you trust your tests and monitoring enough to ship without a
> human looking — for most teams, **CI + Continuous Delivery** is the right, safe target.

## Part 3 — Anatomy of a pipeline

A pipeline is an ordered set of **stages**, each with **steps**, triggered by an event
(usually a push/PR):

```text
   git push / PR  ──►  PIPELINE
   ┌──────────┬──────────┬──────────┬───────────┬──────────┐
   │  BUILD   │   TEST   │   SCAN   │  PACKAGE  │  DEPLOY  │
   │ compile  │ unit +   │ security │ build the │ to env   │
   │ deps     │ integ.   │ + lint   │ artifact/ │ (stage→  │
   │          │          │          │ image     │  prod)   │
   └──────────┴──────────┴──────────┴───────────┴──────────┘
        ▲ fail any stage → stop, report, nothing ships
```

- **Build** — compile, resolve dependencies.
- **Test** — unit, then integration/e2e; the core safety net.
- **Scan** — linting, SAST, dependency/image scanning (the security tracks' shift-left).
- **Package** — produce the **artifact** (a container image, jar, binary).
- **Deploy** — push to an environment, often **staging → production**.

If any stage **fails, the pipeline stops** — broken code never reaches the next stage.

## Part 4 — The core principles

- **Automate everything** — build, test, scan, package, deploy. Manual steps are slow,
  error-prone, and unauditable.
- **Fail fast** — order stages cheap-and-fast first (lint/unit tests in seconds) so feedback
  is quick; run slow e2e later.
- **Build once, promote the same artifact** — build the image **once**, then deploy that
  *exact* artifact (by digest) to staging then prod. Never rebuild per environment — you'd
  test one thing and ship another.
- **Keep main releasable** — `main` always passes the pipeline; broken builds are fixed
  immediately ("stop the line").
- **Fast, automated rollback** — be able to revert in minutes (redeploy the previous
  artifact).
- **Pipeline as code** — the pipeline definition lives in the repo, versioned and reviewed.

> [!TIP]
> **Build the artifact once and promote it unchanged** through environments. If you rebuild
> for staging and again for prod, subtle differences (dependency versions, build flags,
> timestamps) mean prod runs something you never tested. Build one immutable image, tag it by
> **git SHA/digest** (recall the registry lesson), and deploy that same digest to each
> environment. "Test what you ship; ship what you tested."

## Part 5 — Measuring delivery (DORA)

The research-backed **DORA metrics** tell you if your delivery is healthy:

```text
Deployment Frequency     how often you deploy            (elite: on demand, many/day)
Lead Time for Changes    commit -> running in prod        (elite: < 1 hour)
Change Failure Rate      % of deploys causing a problem   (elite: 0–15%)
Mean Time to Restore     how fast you recover from failure (elite: < 1 hour)
```

The first two measure **speed**; the last two measure **stability** — and good teams achieve
**both** (they're not a trade-off). CI/CD is how: small batches deploy fast *and* fail
rarely *and* recover quickly.

## Hands-on lab

This lab is **design + a local pipeline simulation** (real CI platforms come next lesson).

```bash
# 1. A "pipeline" as a shell script — feel the fail-fast, staged structure
mkdir cicd-lab && cd cicd-lab && git init -q
cat > app.py <<'EOF'
def add(a, b): return a + b
EOF
cat > test_app.py <<'EOF'
from app import add
def test_add(): assert add(2, 3) == 5
EOF

cat > pipeline.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail                       # fail fast: stop on first error
echo "== BUILD =="   ; python -c "import app; print('build ok')"
echo "== LINT =="    ; python -m pyflakes app.py test_app.py || { echo "lint failed"; exit 1; }
echo "== TEST =="    ; python -m pytest -q
echo "== PACKAGE ==" ; tar czf app-$(git rev-parse --short HEAD 2>/dev/null || echo dev).tgz app.py
echo "== DEPLOY ==  (would promote the SAME artifact to staging -> prod)"
echo "PIPELINE GREEN"
EOF
chmod +x pipeline.sh
pip install pytest pyflakes -q
./pipeline.sh                            # all stages pass

# 2. Break a test and watch the pipeline FAIL FAST (deploy never runs)
sed -i 's/== 5/== 6/' test_app.py
./pipeline.sh || echo ">> pipeline stopped at TEST; nothing was deployed"
sed -i 's/== 6/== 5/' test_app.py        # fix it

# 3. Reflect: which stages are fast (run first) vs slow (run later)?
```

## Exercises

1. In your own words, explain CI vs continuous delivery vs continuous deployment, and which
   most teams should target.
2. Draw a build→deploy pipeline and label what each stage does and why order matters.
3. Explain "build once, promote" and what goes wrong if you rebuild per environment.
4. Give two reasons deploying more frequently can be *safer* than rare big releases.
5. Define the four DORA metrics and which measure speed vs stability.
6. Take the lab's `pipeline.sh`, add a "scan" stage, and show fail-fast ordering.

## Troubleshooting

- **Painful, risky releases** — large infrequent batches. *Fix:* smaller changes, more
  often; automate the path.
- **"Works in staging, breaks in prod"** — rebuilt per environment. *Fix:* build once,
  promote the same artifact/digest.
- **Slow feedback** — slow tests run first. *Fix:* fail fast — lint/unit early, e2e later;
  parallelize.
- **Broken `main` blocks everyone** — no "stop the line." *Fix:* required CI checks; fix
  breakages immediately.
- **No rollback plan** — *Fix:* keep previous artifacts; make redeploy-previous a one-command
  action.
- **Manual deploy steps** — error-prone/unauditable. *Fix:* pipeline as code in the repo.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does continuous integration actually mean?
2. Difference between continuous delivery and continuous deployment?
3. Name the pipeline stages in order and what each does.
4. Why does a failed stage stop the pipeline?
5. What is "build once, promote," and why does it matter?
6. Why is deploying more often often safer?
7. Order stages for fast feedback — which run first?
8. Name the four DORA metrics.
9. **Practical:** run a staged pipeline script and show fail-fast on a failing test.
10. **Practical:** add a scan stage and place it correctly.

## Solutions & validation

1. Developers **merge to main frequently**, and every change is **auto-built and tested**.
2. Delivery keeps an artifact **always deployable** (human chooses when); deployment **auto-
   ships** every green build (no gate).
3. Build → test → scan → package → deploy; verify before producing/shipping the artifact.
4. Broken code must not reach later stages (testing/packaging/prod).
5. Build the artifact **once** and deploy that **exact** one everywhere — so you ship what you
   tested.
6. Small batches are easier to test, diagnose, and roll back; risk per deploy is tiny.
7. Cheap/fast (lint, unit) first; slow (integration/e2e) later.
8. Deployment frequency, lead time, change failure rate, mean time to restore.
9. **Validation:** failing test stops before DEPLOY (see lab).
10. **Validation:** scan placed after build/test, before package/deploy.

> [!TIP]
> CI/CD is a **mindset before a tool**: integrate constantly, keep `main` releasable, build
> **one** artifact and promote it, fail fast, and make rollback trivial. Get those principles
> right and any CI platform (next lesson) is just syntax. Aim for the DORA "both": **fast and
> stable** — small batches make them reinforce, not fight, each other.

## What's next

Next: **Lesson 1302 — Pipelines as Code (GitHub Actions).** Turn these principles into a real
pipeline: workflows, jobs and steps, triggers, runners, matrix builds, caching, and secrets —
building a working CI workflow that lints, tests, and builds on every push.
