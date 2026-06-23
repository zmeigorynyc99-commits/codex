---
title: "Git — Team Workflows & Pull Requests"
slug: "git-team-workflows-and-pull-requests"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git in Teams"
order: 1006
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, pull-request, code-review, workflow, trunk-based, gitflow, ci]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 60
status: "published"
summary: "How real teams ship: feature-branch, Git Flow, trunk-based and forking workflows; opening and reviewing pull/merge requests; merge vs squash vs rebase-merge; protected branches, required reviews and status checks; and how PRs connect Git to CI/CD."
seoTitle: "Git 6: Team Workflows & Pull Requests (review, branch protection)"
seoDescription: "Git team workflows: feature-branch, Git Flow, trunk-based, forking; pull requests and code review; squash vs merge vs rebase-merge; protected branches and CI checks. Lab + assessment."
---

Git commands are only half the story — the other half is the **social process** teams use
to integrate work safely. This lesson covers the **workflows** (feature-branch, Git Flow,
trunk-based, forking) and the mechanism that powers modern collaboration: the **pull
request** (PR) / merge request (MR). You'll learn how to open and review PRs, the
trade-offs of **merge vs squash vs rebase-merge**, and the guardrails — **protected
branches, required reviews, and status checks** — that connect Git to **CI/CD**.

## Learning objectives

By the end of this lesson you will be able to:

- Compare **feature-branch**, **Git Flow**, **trunk-based**, and **forking** workflows.
- Open a **pull request** and conduct a useful **code review**.
- Choose between **merge commit**, **squash merge**, and **rebase merge**.
- Configure **branch protection**, required reviews, and **status checks**.
- Explain how PRs trigger **CI/CD**.

## Part 1 — Branching workflows

There's no single "right" workflow — pick one that fits the team and release cadence:

- **Feature-branch** — branch per feature off `main`, PR back. Simple, the default for most
  teams.
- **Git Flow** — long-lived `main` + `develop`, plus `feature/`, `release/`, `hotfix/`
  branches. Structured but heavy; suited to **scheduled releases / versioned products**.
- **Trunk-based** — everyone integrates into `main` frequently (often daily) via **short-
  lived** branches behind **feature flags**. Favored for **continuous delivery**; minimizes
  long-lived divergence and merge pain.
- **Forking** — contributors work in their **own fork** and PR to the upstream repo. The
  standard for **open source** and untrusted contributors.

> [!TIP]
> Default to **feature-branch** or **trunk-based** with **short-lived branches**. The single
> biggest predictor of merge pain is **how long a branch lives** — long branches drift far
> from `main` and produce gnarly conflicts. Merge small and often, ideally daily; keep PRs
> small enough to review in one sitting.

## Part 2 — Pull requests

A **pull request** proposes merging one branch into another, providing a place for
**review, discussion, and automated checks** before code lands:

```bash
# Typical PR flow (CLI side)
git switch -c feat/search
# ...commit work...
git push -u origin feat/search
# then open a PR in the web UI (or `gh pr create`), targeting main
```

A good PR has: a **focused scope**, a clear **title and description** (what + why, how to
test, screenshots/links), a **small diff**, and **passing checks**. PRs are also the
historical record of *why* a change was made — link issues, decisions, and discussion.

## Part 3 — Code review

Review is where quality and shared understanding happen. As an **author**: keep PRs small,
explain context, respond to every comment. As a **reviewer**: be timely, specific, and
kind — review the **code, not the person**.

```text
What to look for in review:
- Correctness  — does it do the right thing? edge cases? tests?
- Clarity      — readable, named well, no needless complexity?
- Security     — input validation, secrets, authz (recall the security track)?
- Design fit   — consistent with the codebase's patterns?
- Tests/docs   — covered and updated?

Comment styles:  "blocking" (must fix) vs "nit"/"suggestion" (optional).
```

> [!TIP]
> The most reviewable PR is a **small** one. A 30-line PR gets a careful review; a
> 2,000-line PR gets a rubber-stamp "LGTM". Split large changes into a stack of small PRs.
> As a reviewer, distinguish **blocking** comments from **nits** so authors know what's
> required vs optional, and approve promptly once concerns are addressed — slow reviews are
> a top source of team friction.

## Part 4 — Merge strategies

When a PR is approved, how it lands shapes your history:

| Strategy | Result | Use when |
|---|---|---|
| **Merge commit** (`--no-ff`) | Keeps all branch commits + a merge commit | You want full history / true branch record |
| **Squash merge** | Combines the whole PR into **one** commit on `main` | You want a clean, one-commit-per-PR `main` (very common) |
| **Rebase merge** | Replays the PR's commits linearly, no merge commit | You want linear history **and** to keep individual commits |

**Squash** keeps `main` tidy (one commit per feature) at the cost of losing intermediate
commits; **merge commit** preserves everything but adds noise; **rebase merge** is linear
but rewrites the PR commits. Many teams standardize on **squash** for app repos.

## Part 5 — Branch protection and CI/CD

Guardrails enforce the process so `main` stays healthy:

- **Protected branch** — no direct pushes to `main`; changes must go through a PR.
- **Required reviews** — N approvals before merge (and optionally **code owners**).
- **Required status checks** — CI (build, tests, lint, security scans) must pass before
  merge — this is the bridge to **CI/CD**.
- **Up-to-date branch** — require the PR be current with `main` before merging.
- **Linear history / signed commits** — optional stricter policies.

```text
PR opened ─► CI runs (build + test + lint + scan) ─► reviewers approve ─►
            checks green + approvals met ─► merge allowed ─► (CD deploys main)
```

> [!IMPORTANT]
> **Protect `main`.** Direct pushes to a shared mainline are how broken builds and
> unreviewed code reach production. Require PRs, **green CI**, and at least one review.
> This turns your branching discipline into an **enforced quality gate** — and it's
> exactly where Git hands off to the CI/CD pipelines you'll build in later tracks. The PR
> is the unit of change that CI validates and CD ships.

## Hands-on lab

```bash
# Local simulation of the PR mechanics (no platform needed for steps 1-3)
mkdir team-lab && cd team-lab && git init
echo "v1" > app.txt && git add . && git commit -m "Init"

# 1. Feature branch + focused commits
git switch -c feat/banner
echo "banner" >> app.txt && git commit -am "Add banner"
echo "fix"    >> app.txt && git commit -am "Tweak banner"

# 2. Prepare a clean PR: squash your two commits into one before review
git rebase -i HEAD~2          # squash "Tweak" into "Add banner"

# 3. Simulate squash-merge into main
git switch main
git merge --squash feat/banner
git commit -m "Add banner (#42)"     # ONE clean commit on main
git log --oneline

# 4. On a real platform (GitHub), practice:
#    - git push -u origin feat/banner ; open a PR with a clear description
#    - request a review; address comments; ensure CI is green
#    - choose Squash and merge; delete the branch
#    Branch protection to enable on main: require PR, 1 review, passing checks.
```

```text
5. Review exercise: take a teammate's (or your own) PR and write 3 comments —
   one blocking (correctness/security), one suggestion (clarity), one nit —
   and label each accordingly.
```

## Exercises

1. Compare feature-branch, Git Flow, and trunk-based; pick one for a 5-person CD team and
   justify.
2. Write a high-quality PR description for a change (title, what/why, how to test).
3. Explain merge vs squash vs rebase-merge and when you'd choose each.
4. Perform a local squash-merge so `main` has one clean commit per feature.
5. List the branch-protection rules you'd require on `main` and why each matters.
6. Review a small diff: produce one blocking comment and one nit, clearly labeled.

## Troubleshooting

- **Massive, unreviewable PR** — scope too big. *Fix:* split into small, focused PRs.
- **Long-lived branch, painful conflicts** — drift from `main`. *Fix:* short-lived branches;
  rebase on `main` frequently; merge often.
- **Broken `main`** — direct pushes / merged red CI. *Fix:* protect `main`, require green
  checks + review.
- **Messy `main` history** — merge commits everywhere. *Fix:* standardize on squash (or
  rebase-merge).
- **PR stuck waiting** — slow reviews. *Fix:* SLAs for review, smaller PRs, request specific
  reviewers/code owners.
- **Merged unfinished work** — no draft/checks. *Fix:* draft PRs, required reviews and
  status checks.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Name three branching workflows and a context each suits.
2. What predicts merge pain most, and how do you reduce it?
3. What is a pull request and what does it provide beyond merging?
4. List three things a good reviewer checks.
5. Difference between a blocking comment and a nit.
6. Compare merge, squash, and rebase-merge outcomes.
7. What does branch protection enforce on `main`?
8. How do PRs connect to CI/CD?
9. **Practical:** squash-merge a feature so `main` has one clean commit.
10. **Practical:** write a PR description and three labeled review comments.

## Solutions & validation

1. e.g. feature-branch (most teams), Git Flow (versioned/scheduled releases), trunk-based
   (continuous delivery), forking (open source).
2. **Branch longevity** — keep branches short-lived; merge/rebase frequently.
3. A proposal to merge with **review, discussion, and automated checks**; also a record of
   *why*.
4. Correctness/edge cases, clarity, security, design fit, tests/docs (any three).
5. **Blocking** = must fix before merge; **nit** = optional/minor suggestion.
6. Merge = keeps commits + merge commit; squash = one combined commit; rebase-merge = linear,
   keeps commits, no merge commit.
7. No direct pushes; required reviews; required green status checks; up-to-date branch.
8. PRs trigger CI; **required status checks** gate the merge; CD deploys the merged `main`.
9. **Validation:** `git merge --squash` → single commit on `main` (see lab).
10. **Validation:** a clear description + one blocking + one suggestion + one nit, labeled.

> [!TIP]
> Workflow is a **team contract**: short-lived branches, small focused PRs, timely kind
> reviews, a consistent merge strategy, and a **protected `main` gated by green CI and
> review**. The exact workflow matters less than picking one and enforcing it — that
> discipline is what makes Git scale from one developer to hundreds and feeds directly into
> CI/CD.

## What's next

Next: **Lesson 1007 — Practical Git Toolkit.** The high-value commands that save you daily:
`stash`, `cherry-pick`, `tag` (and releases), `bisect` to hunt down the commit that
introduced a bug, plus `blame`, `worktree`, and a quick look at hooks and submodules.
