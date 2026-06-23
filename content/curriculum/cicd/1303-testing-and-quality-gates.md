---
title: "CI/CD — Testing & Quality Gates"
slug: "cicd-testing-and-quality-gates"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "Pipeline Quality"
order: 1303
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, testing, test-pyramid, coverage, quality-gates, linting]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 60
status: "published"
summary: "A pipeline is only as trustworthy as its checks: the test pyramid (unit/integration/e2e), code coverage and quality gates, linting and static analysis, dealing with flaky tests, and making 'green CI' a meaningful guarantee that code is safe to ship."
seoTitle: "CI/CD 3: Testing & Quality Gates (test pyramid, coverage, flaky tests)"
seoDescription: "CI testing: the test pyramid, unit/integration/e2e balance, coverage and quality gates, linting/static analysis, flaky-test handling, and trustworthy green CI. Lab + assessment."
---

CI gives you confidence to ship fast — but **only if the checks are good**. A pipeline that
passes while shipping bugs is worse than useless; one that's flaky teaches people to ignore
failures. This lesson is about making **green CI mean something**: the **test pyramid**
(lots of fast unit tests, fewer integration, fewest e2e), **coverage** and **quality gates**
that block bad merges, **linting/static analysis** to catch issues without running code, and
**flaky-test** discipline so failures are always trustworthy.

## Learning objectives

By the end of this lesson you will be able to:

- Apply the **test pyramid** and balance unit/integration/e2e tests.
- Use **code coverage** appropriately (and avoid its traps).
- Configure **quality gates** that block merges on failures/thresholds.
- Add **linting and static analysis** (and where they fit).
- Diagnose and contain **flaky tests** so CI stays trustworthy.

## Part 1 — The test pyramid

Balance test types by speed, cost, and scope:

```text
        /\         E2E / UI   — few; slow, brittle, realistic (whole system)
       /  \        Integration— some; test components together (db, api, services)
      /____\       Unit       — MANY; fast, isolated, cheap (one function/class)
```

- **Unit tests** — fast (ms), isolated, run constantly. The **base** — most of your tests.
- **Integration tests** — components together (code + real DB, service + service); slower,
  catch wiring bugs.
- **End-to-end (e2e)** — the whole system via the UI/API; most realistic but **slow and
  flaky** — keep them few and focused on critical paths.

Anti-pattern: the **"ice cream cone"** (many slow e2e tests, few unit tests) — slow CI,
flaky, hard to debug. Invert it.

> [!IMPORTANT]
> Put most of your testing effort in **fast, isolated unit tests** and reserve **e2e for a
> handful of critical user journeys**. Inverted pyramids (mostly e2e) give slow, flaky
> pipelines where failures don't pinpoint the bug. A failing unit test says "this function is
> broken"; a failing e2e says "something, somewhere, is broken." Push tests **down** the
> pyramid wherever you can — it's the difference between 2-minute and 40-minute CI.

## Part 2 — Coverage: useful but gameable

**Code coverage** measures what % of code your tests execute:

```bash
pytest --cov=myapp --cov-report=term --cov-report=html   # Python
# coverage gate: fail if below a threshold
pytest --cov=myapp --cov-fail-under=80
```

Coverage is a **useful signal, not a goal**. 80% coverage of meaningful tests is great; 100%
coverage of tests that assert nothing is worthless. High coverage tells you code is *executed*,
not that it's *correct*. Use it to **find untested areas**, set a **floor** (e.g. don't drop
below current), but don't worship the number — and never let "hit the coverage target" drive
people to write empty tests.

## Part 3 — Quality gates

A **quality gate** is a pass/fail bar the pipeline enforces before code can merge/deploy:

```text
Typical gates (any failing = block the merge):
  ✓ all tests pass
  ✓ coverage ≥ threshold (or didn't decrease)
  ✓ linter clean / no new warnings
  ✓ static analysis: no new issues (SonarQube/CodeQL)
  ✓ security scan: no new HIGH/CRITICAL (recall vuln management)
  ✓ build succeeds
```

Wire gates to **branch protection** (Lesson: Git workflows): make these **required status
checks** so a PR literally cannot merge until they're green. That's what turns "we have
tests" into "broken code can't reach main."

```yaml
# In CI: make the job fail (non-zero exit) on any gate violation
- run: pytest -q --cov=myapp --cov-fail-under=80
- run: ruff check .                    # non-zero exit on lint errors
- run: trivy fs --severity HIGH,CRITICAL --exit-code 1 .
```

## Part 4 — Linting and static analysis

Catch problems **without running the code** — fast and early in the pipeline:

- **Linters/formatters** — style and obvious bugs (ruff/flake8, eslint, golangci-lint;
  prettier/black/gofmt for formatting). Run **first** (seconds).
- **Static analysis (SAST)** — deeper bug/security analysis (SonarQube, CodeQL, Semgrep) —
  finds injection, null derefs, code smells.
- **Type checking** — mypy/TypeScript catch whole classes of bugs pre-runtime.

These are **shift-left**: the earlier and cheaper you catch a problem, the better. A linter
failing in 5 seconds beats an e2e failing in 30 minutes (or a bug in prod).

> [!TIP]
> Order quality checks **cheapest-first** so feedback is fast: format/lint (seconds) → type
> check → unit tests → integration → e2e → security scan. Auto-format in a pre-commit hook so
> style never even reaches CI. Static analysis and type checking catch bugs that tests miss
> (and vice-versa) — they're complementary layers, not substitutes.

## Part 5 — Flaky tests: the trust killer

A **flaky test** passes and fails non-deterministically (timing, ordering, shared state,
network). They're insidious because they **train people to ignore red CI** ("just re-run
it") — destroying the entire value of the pipeline.

```text
Common causes & fixes:
  timing/race      → wait for conditions, not sleeps; control the clock
  test ordering    → isolate state; no shared globals; fresh fixtures
  external deps     → mock/stub; use test containers; avoid real network
  randomness        → seed it; make deterministic
```

Handle flakes deliberately: **quarantine** (mark as non-blocking) → **fix** quickly → return
to the gate. Don't normalize "re-run until green." Track flaky-test rate as a health metric.

> [!IMPORTANT]
> **A flaky test is a broken test.** The moment "re-run the pipeline" becomes a habit, your
> team stops trusting CI and starts merging through red — and a real failure slips by
> unnoticed. Treat flakiness as a **priority bug**: quarantine the test so it stops blocking,
> fix the root cause (usually timing or shared state), then re-enable it. Green CI must mean
> "safe to ship" *every* time, or it means nothing.

## Hands-on lab

```bash
mkdir qg-lab && cd qg-lab
cat > calc.py <<'EOF'
def divide(a, b):
    if b == 0: raise ValueError("divide by zero")
    return a / b
EOF
cat > test_calc.py <<'EOF'
import pytest
from calc import divide
def test_divide(): assert divide(6, 2) == 3
def test_divide_by_zero():
    with pytest.raises(ValueError): divide(1, 0)
EOF
pip install pytest pytest-cov ruff -q

# 1. Run the pyramid base: fast unit tests + coverage gate
pytest -q --cov=calc --cov-report=term --cov-fail-under=80

# 2. Lint as a gate (cheap, runs first)
ruff check . && echo "lint clean"

# 3. Make coverage drop and watch the gate FAIL
cat >> calc.py <<'EOF'
def untested(x):     # no test covers this -> coverage falls
    return x * 2 + 1
EOF
pytest -q --cov=calc --cov-fail-under=80 || echo ">> GATE BLOCKED: coverage below 80%"

# 4. Simulate a flaky test, see the problem, then fix determinism
cat > test_flaky.py <<'EOF'
import random
def test_flaky(): assert random.random() > 0.2   # ~20% fail rate (BAD)
EOF
for i in 1 2 3 4 5; do pytest -q test_flaky.py >/dev/null 2>&1 && echo "run $i pass" || echo "run $i FAIL (flaky!)"; done
# Fix: make it deterministic
cat > test_flaky.py <<'EOF'
import random
def test_deterministic():
    random.seed(42)
    assert random.random() > 0.2     # always the same result now
EOF
pytest -q test_flaky.py
```

## Exercises

1. Draw the test pyramid and explain the speed/scope trade-off of each layer; name the
   anti-pattern.
2. Add a coverage gate to a project and demonstrate it blocking when coverage drops.
3. Explain why high coverage doesn't guarantee correctness, with an example.
4. List five quality gates and how you'd wire them to block a merge.
5. Order a set of checks (lint, e2e, unit, type-check, scan) cheapest-first and justify.
6. Reproduce a flaky test, explain a likely root cause, and make it deterministic.

## Troubleshooting

- **Slow, flaky CI** — inverted pyramid (too many e2e). *Fix:* push tests down to unit/
  integration.
- **Green CI but bugs ship** — weak/empty tests, low real coverage. *Fix:* meaningful
  assertions; test behavior, not lines.
- **Coverage gamed to 100%** — tests assert nothing. *Fix:* review test quality; coverage is a
  floor, not a goal.
- **Team re-runs until green** — flaky tests normalized. *Fix:* quarantine + fix; treat
  flakiness as a bug.
- **Gates not enforced** — checks not required. *Fix:* branch protection → required status
  checks.
- **Lint failures ignored** — runs too late/noisy. *Fix:* run first; auto-format pre-commit.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Describe the test pyramid and why unit tests dominate.
2. What's the e2e trade-off, and how many should you have?
3. What does coverage measure — and what does it NOT prove?
4. What is a quality gate, and how do you enforce one on merges?
5. Difference between linting, static analysis, and type checking?
6. Why order checks cheapest-first?
7. What is a flaky test and why is it so damaging?
8. How do you handle a flaky test responsibly?
9. **Practical:** add a coverage gate and show it blocking.
10. **Practical:** make a flaky test deterministic.

## Solutions & validation

1. Many fast **unit** tests at the base, fewer integration, fewest e2e — speed/cost/
   isolation.
2. e2e is realistic but **slow/flaky** — keep few, on critical paths only.
3. The % of code **executed** by tests; not that the code is **correct**.
4. A pass/fail bar (tests/coverage/lint/scan) enforced via **required status checks** in
   branch protection.
5. Lint = style/obvious bugs; static analysis = deeper bug/security scanning; type checking =
   type errors pre-runtime.
6. Fast feedback — cheap checks fail in seconds before slow ones run.
7. Non-deterministic pass/fail; it trains people to ignore red CI, so real failures slip
   through.
8. **Quarantine** (non-blocking) → **fix root cause** → re-enable; track flaky rate.
9. **Validation:** `--cov-fail-under=80` blocks when coverage drops (see lab).
10. **Validation:** seeding RNG makes the test deterministic.

> [!TIP]
> The pipeline's value is **trust**: when CI is green, it's truly safe to ship. Build that
> with a healthy **pyramid** (fast unit base, few e2e), **meaningful** coverage as a floor,
> **enforced quality gates** wired to branch protection, **cheap-first** ordering, and
> **zero tolerance for flakiness**. Fast *and* trustworthy checks are what let you deploy
> often without fear.

## What's next

Next: **Lesson 1304 — Building & Publishing Artifacts.** From source to a deployable thing:
building container images in CI, semantic versioning and tagging by git SHA, pushing to a
registry with proper auth, build caching/BuildKit, and producing reproducible, traceable
artifacts ready to deploy.
