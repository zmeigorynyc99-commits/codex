---
title: "CI/CD — Pipelines as Code with GitHub Actions"
slug: "cicd-pipelines-as-code-github-actions"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "CI/CD Foundations"
order: 1302
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, github-actions, workflows, jobs, matrix, caching, secrets]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 65
status: "published"
summary: "Build a real CI pipeline as code: GitHub Actions workflows, jobs and steps, triggers and runners, the marketplace actions, matrix builds for multiple versions, dependency caching, artifacts, and using secrets — a working workflow that lints, tests, and builds on every push."
seoTitle: "CI/CD 2: Pipelines as Code with GitHub Actions (jobs, matrix, cache)"
seoDescription: "GitHub Actions: workflow YAML, jobs/steps, triggers, runners, marketplace actions, matrix builds, caching, artifacts, and secrets. Hands-on lab and assessment."
---

Principles become real when you write a pipeline. **GitHub Actions** is a widely used,
approachable CI/CD platform where the pipeline lives **as code** in your repo
(`.github/workflows/`). The concepts here — workflows, jobs, steps, triggers, runners,
reusable actions, matrices, caching, secrets — transfer directly to GitLab CI, CircleCI,
Jenkins, and the rest; only the syntax differs. This lesson builds a working CI workflow that
lints, tests, and builds on every push and pull request.

## Learning objectives

By the end of this lesson you will be able to:

- Write a **workflow** with **jobs**, **steps**, and **triggers**.
- Use **runners** and **marketplace actions** (`uses:`) vs shell (`run:`).
- Run **matrix** builds across versions/OSes and parallel jobs with dependencies.
- **Cache** dependencies and pass **artifacts** between jobs.
- Use **secrets** securely in a pipeline.

## Part 1 — Workflow anatomy

```yaml
# .github/workflows/ci.yaml
name: CI
on:                                   # TRIGGERS
  push: { branches: [main] }
  pull_request:                       # run on every PR
jobs:
  test:                               # a JOB (runs on its own runner)
    runs-on: ubuntu-latest            # the RUNNER (VM/container)
    steps:                            # ordered STEPS
      - uses: actions/checkout@v4     # a marketplace ACTION (reusable)
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt   # a shell command
      - run: pytest -q
```

The hierarchy: **workflow → jobs → steps**. Each **job** runs on a fresh **runner** (clean
VM); **steps** run in order on that runner. A step is either **`uses:`** (a reusable action
from the marketplace) or **`run:`** (shell commands). Push this file and Actions runs it on
the configured triggers.

## Part 2 — Triggers and runners

```yaml
on:
  push: { branches: [main, 'release/**'], paths: ['src/**'] }
  pull_request:
  schedule: [{ cron: '0 6 * * 1' }]   # weekly (e.g. nightly builds, dependency checks)
  workflow_dispatch:                  # manual "Run workflow" button (with inputs)
```

- **`push`/`pull_request`** — the bread and butter (filter by branch/path).
- **`schedule`** — cron for periodic jobs.
- **`workflow_dispatch`** — manual trigger (great for deploys with inputs).
- **Runners**: GitHub-hosted (`ubuntu-latest`, `windows-latest`, `macos-latest`) or
  **self-hosted** (your own machines, for special hardware/networks).

> [!TIP]
> Filter triggers so you don't waste minutes: `paths:` runs the workflow only when relevant
> files change, and branch filters keep noise down. Use **`pull_request`** as the gate (it's
> what branch protection requires) and **`workflow_dispatch`** for human-initiated deploys.
> Pin marketplace actions to a **major version** (`@v4`) or a commit SHA for supply-chain
> safety — a floating action is third-party code running with your repo's token.

## Part 3 — Jobs, dependencies, and parallelism

Jobs run **in parallel by default**; use **`needs`** to order them:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [{ uses: actions/checkout@v4 }, { run: ruff check . }]
  test:
    runs-on: ubuntu-latest
    steps: [{ uses: actions/checkout@v4 }, { run: pytest -q }]
  build:
    needs: [lint, test]               # only runs if BOTH lint and test pass
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t myapp:${{ github.sha }} .
```

`lint` and `test` run **concurrently** (fast feedback); `build` **waits** for both (fail
fast — don't build broken code). This `needs` graph is how you express the staged pipeline
from Lesson 1301.

## Part 4 — Matrix, caching, and artifacts

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:                          # run the SAME job across combinations
        os: [ubuntu-latest, windows-latest]
        python: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python }}
          cache: pip                   # CACHE dependencies (big speedup)
      - run: pip install -r requirements.txt
      - run: pytest -q
      - uses: actions/upload-artifact@v4   # save build output / reports
        with: { name: coverage-${{ matrix.os }}-${{ matrix.python }}, path: htmlcov/ }
```

- **Matrix** — runs the job across every combination (test on 2 OSes × 2 Python versions = 4
  runs) without duplicating YAML.
- **Caching** — reuse downloaded dependencies between runs (`cache: pip`, or the generic
  `actions/cache`) to cut minutes.
- **Artifacts** — `upload-artifact`/`download-artifact` persist files (test reports,
  binaries) and pass them between jobs.

## Part 5 — Secrets and security

Never hard-code credentials. Store them as **repository/organization/environment secrets**
and reference them:

```yaml
    steps:
      - run: ./deploy.sh
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}   # injected, masked in logs
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }} # auto-provided, short-lived
permissions:
  contents: read                       # least privilege for the workflow's token
  packages: write                      # only what this workflow needs
```

> [!IMPORTANT]
> Treat the pipeline as a **production system with credentials**. Use **secrets** (never
> plaintext in YAML), and remember secrets are **masked in logs** but a malicious step can
> still exfiltrate them — so pin third-party actions, scope the **`GITHUB_TOKEN`** with
> minimal **`permissions:`**, and be cautious running untrusted code (especially on
> `pull_request` from forks). The built-in `GITHUB_TOKEN` is short-lived and scoped — prefer
> it over long-lived personal tokens.

## Hands-on lab

```yaml
# .github/workflows/ci.yaml — a complete, realistic CI pipeline
name: CI
on:
  push: { branches: [main] }
  pull_request:
permissions: { contents: read }
jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix: { python: ["3.11", "3.12"] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${{ matrix.python }}", cache: pip }
      - run: pip install -r requirements.txt ruff pytest
      - run: ruff check .                    # lint (fast — fail early)
      - run: pytest -q --cov                  # test
      - uses: actions/upload-artifact@v4
        with: { name: report-${{ matrix.python }}, path: .coverage }
  build:
    needs: quality                            # only build if quality passed
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t myapp:${{ github.sha }} .
      # - push to a registry here (next lessons)
```

```bash
# Run it locally first (good habit) before pushing:
ruff check . && pytest -q
# Then commit the workflow and watch it run in the repo's "Actions" tab:
git add .github/workflows/ci.yaml && git commit -m "ci: add lint+test+build pipeline"
# (optional) test Actions locally with `act`:  act pull_request
```

## Exercises

1. Write a workflow that runs on push and PR, checks out code, sets up a language runtime,
   installs deps, and runs tests.
2. Split lint, test, and build into separate jobs with a `needs` graph; explain the
   parallelism and gating.
3. Add a matrix across two runtime versions (and optionally two OSes); explain `fail-fast`.
4. Add dependency caching and show (conceptually) the time saved.
5. Upload a test/coverage artifact and describe how another job would consume it.
6. Add a deploy step that uses a secret, and scope the workflow `permissions` minimally.

## Troubleshooting

- **Workflow doesn't run** — wrong path/filename or trigger. *Fix:* `.github/workflows/*.yml`;
  check `on:` and branch/path filters.
- **"command not found"** — runtime not set up. *Fix:* add the `setup-*` action before using
  it.
- **Secrets empty** — not defined / fork PR / typo. *Fix:* add repo secret; note forks don't
  get secrets by default.
- **Slow pipelines** — no caching / serial jobs. *Fix:* cache deps; parallelize independent
  jobs.
- **Matrix all fail together** — `fail-fast: true` cancels siblings. *Fix:* set
  `fail-fast: false` to see all results.
- **Third-party action risk** — floating tag. *Fix:* pin `@vX`/SHA; minimize `permissions`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's the workflow → job → step hierarchy, and where does each job run?
2. Difference between a `uses:` step and a `run:` step?
3. Name three trigger types and a use for each.
4. How do jobs run by default, and how do you order them?
5. What does a matrix build do?
6. Why cache dependencies, and what are artifacts for?
7. How should credentials be provided to a pipeline?
8. Why scope `permissions` and pin third-party actions?
9. **Practical:** write a multi-job pipeline with lint/test gating a build.
10. **Practical:** add a matrix + caching to a test job.

## Solutions & validation

1. Workflow contains jobs; jobs contain steps; **each job runs on a fresh runner**.
2. `uses:` runs a **reusable marketplace action**; `run:` runs **shell commands**.
3. e.g. `push`/`pull_request` (gate), `schedule` (cron), `workflow_dispatch` (manual).
4. **Parallel** by default; **`needs:`** creates ordering/dependencies.
5. Runs the same job across **combinations** (versions/OSes) without duplicating YAML.
6. Caching reuses deps to **save time**; artifacts **persist/pass files** between jobs/runs.
7. As **secrets** (masked, not in YAML); prefer the scoped, short-lived `GITHUB_TOKEN`.
8. Limit blast radius if a step/action is compromised (least privilege + supply-chain
   safety).
9. **Validation:** `build` has `needs: [lint, test]` and only runs when green (see lab).
10. **Validation:** `strategy.matrix` + `cache: pip` present.

> [!TIP]
> Pipeline-as-code means your CI is **versioned, reviewed, and reproducible** like any code.
> Structure jobs as the staged pipeline (fast checks gate slow ones via `needs`), **cache**
> to stay fast, use a **matrix** for coverage, and handle **secrets + permissions** as
> security-critical. The syntax is GitHub-specific; the structure is universal — you can read
> any CI system once you know this shape.

## What's next

Next: **Lesson 1303 — Testing & Quality Gates.** A pipeline is only as good as its checks:
the test pyramid (unit/integration/e2e), code coverage and quality gates, linting and static
analysis, flaky-test management, and making green-CI a meaningful guarantee of shippable code.
