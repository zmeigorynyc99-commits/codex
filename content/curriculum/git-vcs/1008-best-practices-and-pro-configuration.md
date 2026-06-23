---
title: "Git — Best Practices & Pro Configuration"
slug: "git-best-practices-and-pro-configuration"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git in Teams"
order: 1008
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, best-practices, gitignore, secrets, config, aliases, conventions]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 55
status: "published"
summary: "Tie the track together: repository hygiene with .gitignore/.gitattributes, keeping secrets out of history (and purging them if they slip in), commit message conventions, useful global config and aliases, line-ending and large-file handling, and a pre-push checklist for clean, secure repos."
seoTitle: "Git 8: Best Practices & Pro Configuration (secrets, aliases, hygiene)"
seoDescription: "Git best practices: .gitignore/.gitattributes, removing leaked secrets from history, Conventional Commits, global config and aliases, line endings, Git LFS, and a pre-push checklist. Capstone lab + assessment."
---

You now know the mechanics; this capstone is about the **habits and configuration** that
keep repositories clean, secure, and pleasant to work in over years. We'll cover repo
**hygiene** (`.gitignore`/`.gitattributes`), the critical topic of **keeping secrets out of
history** (and what to do when one slips in), **commit conventions**, productivity **config
and aliases**, **line-ending** and **large-file** handling, and a **pre-push checklist**.
These are the differences between a repo that's a joy and one that's a liability.

## Learning objectives

By the end of this lesson you will be able to:

- Maintain a good **`.gitignore`** and use **`.gitattributes`** for line endings.
- **Keep secrets out** of Git and **purge** one that leaked.
- Apply commit conventions (**Conventional Commits**) and sane **config/aliases**.
- Handle **large files** with **Git LFS** and avoid bloating history.
- Run a **pre-push checklist** for clean, secure pushes.

## Part 1 — Repository hygiene

```bash
# .gitignore — exclude build output, deps, local env, secrets, OS/editor cruft
# (use templates from github.com/github/gitignore for your stack)
node_modules/
dist/  build/  target/
.env  .env.*           # local secrets/config
*.log  *.tmp
.DS_Store  .idea/  .vscode/

# Already committed something that should be ignored? Untrack it (keeps the file locally):
git rm --cached config.local.json
```

```text
# .gitattributes — normalize line endings and mark binary/LFS files
* text=auto                 # normalize line endings in the repo (LF) automatically
*.sh text eol=lf            # shell scripts always LF
*.png binary                # don't try to diff/merge binaries
```

A clean repo contains **source, not artifacts**: no `node_modules`, no build output, no
local config, no secrets. Commit a **`.gitignore`** early so the team shares it.

## Part 2 — Secrets: prevention and remediation

Committed secrets are one of the most common and damaging mistakes — and Git's history
makes them **persist even after deletion** in a later commit.

```bash
# PREVENT
echo ".env" >> .gitignore
git secrets --install        # or use pre-commit hooks / gitleaks to block secret commits
gitleaks detect              # scan the repo for leaked credentials
```

```text
REMEDIATE a leaked secret (in order):
1. ROTATE/REVOKE the secret immediately — assume it's compromised the moment it's pushed.
   (Purging history does NOT un-leak it; anyone may already have it.)
2. Remove it from ALL history: git filter-repo (preferred) or BFG Repo-Cleaner.
3. Force-push the cleaned history and have everyone re-clone (coordinate!).
4. Add prevention (gitignore + secret scanning) so it can't recur.
```

> [!IMPORTANT]
> **The first response to a leaked secret is to ROTATE it, not to delete the commit.** Once
> a credential is pushed (especially to a public repo), treat it as **compromised forever**
> — bots scan GitHub for keys within seconds. Removing it from history (`git filter-repo`/
> BFG) is still worth doing to stop further spread, but it does **not** make the old secret
> safe. Prevention (gitignore + a secret-scanning hook) beats cleanup every time.

## Part 3 — Commit conventions

Consistency makes history scannable and can **automate** changelogs/versioning.
**Conventional Commits** is a widely used format:

```text
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
Examples:
  feat(auth): add password reset flow
  fix(api): handle null user in profile endpoint
  docs: update README install steps
  feat!: drop Node 16 support      # "!" marks a BREAKING change (-> MAJOR bump)
```

Tools (semantic-release, commitlint) read these to auto-generate **CHANGELOGs** and pick
the next **SemVer** version. Even without tooling, a consistent style makes `git log` far
more useful.

## Part 4 — Config, aliases, and large files

```bash
# Quality-of-life global config
git config --global pull.rebase true          # linear pulls (no merge noise)
git config --global init.defaultBranch main
git config --global core.editor "code --wait"
git config --global rerere.enabled true       # remember conflict resolutions (reuse them)
git config --global push.autoSetupRemote true # auto -u on first push

# Aliases that save keystrokes
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 HEAD"
git config --global alias.unstage "restore --staged"

# Large/binary files: don't bloat history — use Git LFS
git lfs install
git lfs track "*.psd" "*.zip" "*.mp4"   # stores pointers in Git, blobs in LFS
git add .gitattributes
```

`core.autocrlf`/`.gitattributes` handle **line endings** across OSes (Windows CRLF vs Unix
LF) so you don't get "the whole file changed" diffs. **Git LFS** keeps big binaries out of
the main history (which is otherwise permanent and clones for everyone, forever).

> [!TIP]
> Set **`rerere.enabled`** (reuses your past conflict resolutions — a lifesaver during long
> rebases), **`pull.rebase`** and **`push.autoSetupRemote`** once globally, and add a couple
> of **aliases** (`lg`, `st`). For binaries, decide **before** committing — a large file in
> history is permanent and re-downloaded on every clone; LFS or keeping artifacts out of Git
> entirely avoids a repo that balloons to gigabytes.

## Part 5 — The pre-push checklist

A 30-second habit before pushing shared work:

```text
□ git status        — nothing unintended staged; no stray files
□ git diff --staged — review EXACTLY what you're committing (no debug prints, secrets, keys)
□ Tests/lint pass locally
□ Commits are focused with clear, conventional messages
□ Branch is up to date with main (rebase/merge) — avoid surprise conflicts
□ No secrets/large binaries (scan if unsure: gitleaks)
□ Pushing to the INTENDED branch (git branch -vv)
```

> [!TIP]
> The cheapest bug prevention in Git is **reading your own diff before you push**. `git diff
> --staged` catches debug logging, commented-out code, accidental files, and — critically —
> **secrets**, before they become permanent history. Pair it with a **pre-commit hook**
> (lint/format/secret-scan) so the machine enforces what you might forget.

## Hands-on lab — capstone

```bash
mkdir bp-lab && cd bp-lab && git init

# 1. Hygiene from day one
printf 'node_modules/\ndist/\n.env\n*.log\n' > .gitignore
printf '* text=auto\n*.sh text eol=lf\n*.png binary\n' > .gitattributes
git add .gitignore .gitattributes && git commit -m "chore: add gitignore and gitattributes"

# 2. Conventional commits
echo "app" > app.js && git add app.js && git commit -m "feat(core): add app entry point"
echo "fix" >> app.js && git commit -am "fix(core): handle empty input"

# 3. Simulate a leaked secret and the CORRECT response order
echo "API_KEY=sk_live_SECRET" > .env.bad
git add .env.bad && git commit -m "oops add secret"     # mistake
#   Correct response: (1) ROTATE the key for real, then purge:
git rm .env.bad && echo ".env.bad" >> .gitignore && git commit -m "chore: remove secret file"
#   For full history purge you'd use:  git filter-repo --path .env.bad --invert-paths
#   (and force-push + re-clone). Note: rotation is step 1 regardless.

# 4. Config + aliases
git config --global alias.lg "log --oneline --graph --all --decorate"
git lg

# 5. Pre-push review
git diff --staged       # (nothing staged now) — practice reading before pushing
git log --oneline
```

## Exercises

1. Write a `.gitignore` and `.gitattributes` for a stack you know; explain each entry.
2. A teammate pushed `AWS_SECRET=...` to a public repo. List, in order, exactly what you do.
3. Rewrite five poor commit messages into Conventional Commits and explain the types.
4. Configure three global settings and two aliases that improve your workflow; show them in
   use.
5. Decide how to handle a 200 MB video asset in a repo and justify (LFS vs out-of-repo).
6. Produce a pre-push checklist and walk through it on a real change, catching at least one
   issue.

## Troubleshooting

- **Secret already pushed** — *Fix:* **rotate first**, then purge history (`filter-repo`/BFG)
  + force-push + re-clone; add scanning.
- **`.gitignore` not ignoring a file** — already tracked. *Fix:* `git rm --cached <file>`
  then commit.
- **"Whole file changed" diffs** — line-ending mismatch. *Fix:* `.gitattributes` `* text=auto`
  / `core.autocrlf`.
- **Repo huge/slow to clone** — big binaries in history. *Fix:* Git LFS going forward;
  history rewrite to remove past blobs if needed.
- **Inconsistent messy history** — no convention. *Fix:* adopt Conventional Commits +
  commitlint hook.
- **Pushed debug code/secret** — skipped diff review. *Fix:* `git diff --staged` habit +
  pre-commit hook.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What belongs in `.gitignore`, and how do you stop tracking an already-committed file?
2. What does `.gitattributes` `* text=auto` solve?
3. What is the FIRST thing to do when a secret is leaked, and why?
4. Why doesn't deleting a secret in a new commit fix the leak?
5. Give the Conventional Commits format and three types.
6. Name two global config settings that improve your workflow and what they do.
7. When and why use Git LFS?
8. List four items on a pre-push checklist.
9. **Practical:** set up `.gitignore`/`.gitattributes` and make conventional commits.
10. **Practical:** show the correct response sequence to a committed secret.

## Solutions & validation

1. Build output, deps, local env, secrets, OS/editor cruft; `git rm --cached <file>` to
   untrack.
2. Normalizes **line endings** across OSes, avoiding spurious whole-file diffs.
3. **Rotate/revoke** the secret — it's compromised the instant it's pushed.
4. History keeps the old commit; anyone with the history (or who already cloned/scanned) has
   it — deletion ≠ un-leak.
5. `<type>(<scope>): <desc>`; e.g. `feat`, `fix`, `docs`, `chore`, `refactor`.
6. e.g. `pull.rebase true` (linear pulls), `rerere.enabled` (reuse conflict resolutions),
   `push.autoSetupRemote` (auto -u).
7. For **large/binary** files — keeps blobs out of permanent history so clones stay small.
8. e.g. review `git diff --staged`, tests/lint pass, no secrets/big files, branch up to
   date, right branch.
9. **Validation:** committed `.gitignore`/`.gitattributes` + `feat(...)`/`fix(...)` messages.
10. **Validation:** rotate → remove/purge history → force-push + re-clone → add scanning.

> [!TIP]
> Great Git hygiene is mostly **prevention as habit**: ignore artifacts and secrets from day
> one, read your diff before every push, write consistent messages, and keep binaries out of
> history. Configure your tools to enforce it (hooks, secret scanning, sensible global
> config). Do this and your repositories stay small, secure, and welcoming — for the whole
> team and for future-you.

## What's next

You've completed the **Git & Version Control** track — from the three trees and branching
through remotes, rebasing, recovery, team workflows, the practical toolkit, and pro
configuration. Version control is the substrate everything else in DevOps sits on. Next in
the roadmap: **Docker & Containers** — packaging applications into portable images and
running them anywhere — followed by **Kubernetes, CI/CD, and Infrastructure as Code**,
where your Git skills become the trigger for automated build, test, and deployment.
