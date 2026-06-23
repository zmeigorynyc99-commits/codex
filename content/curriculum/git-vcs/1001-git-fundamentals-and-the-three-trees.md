---
title: "Git — Fundamentals & the Three Trees"
slug: "git-fundamentals-and-the-three-trees"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git Foundations"
order: 1001
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, version-control, commit, staging, basics, beginner]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 55
status: "published"
summary: "The mental model that makes Git click: the three trees (working directory, staging area/index, repository), how snapshots and commits work, and the core everyday loop — init, status, add, commit, log, diff — plus configuring identity and writing good commit messages."
seoTitle: "Git 1: Fundamentals & the Three Trees (staging, commits, log)"
seoDescription: "Beginner Git: working dir vs staging area vs repository, snapshots and commits, init/status/add/commit/log/diff, .gitignore, and good commit messages. Lab + assessment."
---

Git confuses people because they learn commands without the **model** underneath them.
This lesson fixes that first: Git tracks your project as a series of **snapshots**, and
moves changes through **three trees** — your **working directory**, the **staging area**
(index), and the **repository**. Once that picture is clear, the everyday loop —
`status`, `add`, `commit`, `log`, `diff` — stops being magic incantations and becomes
obvious. This is the foundation the entire DevOps/CI-CD world is built on.

## Learning objectives

By the end of this lesson you will be able to:

- Explain Git's **snapshot** model and the **three trees**.
- Configure your **identity** and initialize a repo.
- Run the core loop: **`status` → `add` → `commit`**, and read **`log`/`diff`**.
- Use **`.gitignore`** to exclude files.
- Write a **good commit message**.

## Part 1 — Why version control, and Git's model

Version control records the **history** of a project: who changed what, when, and why —
so you can review, revert, branch, and collaborate without emailing `final_v3_FINAL.zip`.
Git is **distributed**: every clone is a full copy of the history, so you work offline and
there's no single point of failure.

Key idea: **Git stores snapshots, not diffs.** Each **commit** is a complete picture of
your tracked files at a moment in time (unchanged files are stored by reference, so it's
efficient). A commit has an **author, message, timestamp, a unique SHA-1 hash**, and a
pointer to its **parent** — the chain of parents *is* your history.

## Part 2 — The three trees

This is the model to memorize:

```text
  WORKING DIRECTORY        STAGING AREA (index)        REPOSITORY (.git)
  your actual files   ──►  what goes in the next  ──►  committed snapshots
  (edit freely)            commit (you choose)         (permanent history)
        │   git add ───────────►│   git commit ──────────►│
        │◄────────── git restore / checkout ──────────────│
```

- **Working directory** — the files you see and edit.
- **Staging area (index)** — a "draft" of your next commit; you **stage** exactly the
  changes you want with `git add`. This lets you craft focused commits.
- **Repository** — `git commit` permanently records the staged snapshot into `.git`.

> [!IMPORTANT]
> The **staging area** is Git's superpower and the thing beginners skip. You don't commit
> "all your changes" — you **choose** what goes in each commit by staging it. That's how
> you make **small, focused commits** (one logical change each) even when your working
> directory has several unrelated edits. `git add` = "include this in the next snapshot";
> `git commit` = "take the snapshot."

## Part 3 — Setup and the core loop

```bash
# One-time identity (shows up in every commit you author)
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main

# Start a repo and do the loop
git init                     # create .git/ — now this folder is a repo
git status                   # the most useful command — what's changed/staged
echo "hello" > app.txt
git add app.txt              # stage it (working dir -> staging)
git status                   # app.txt now "to be committed"
git commit -m "Add app.txt with greeting"   # staging -> repository
git log --oneline            # see the commit history
```

`git status` is your compass — run it constantly. It tells you which files are
**untracked**, **modified**, or **staged**, and suggests the command to move them.

## Part 4 — Inspecting changes: diff and log

```bash
git diff                     # unstaged changes (working dir vs staging)
git diff --staged            # staged changes (staging vs last commit)
git log                      # full history
git log --oneline --graph --all   # compact, visual history
git show <hash>              # what a specific commit changed
git log -p app.txt           # history of one file, with diffs
```

`git diff` answers "what exactly did I change?" — and **which tree** you compare matters:
plain `diff` is working-vs-staging, `--staged` is staging-vs-last-commit.

## Part 5 — .gitignore and good commits

Not everything belongs in version control — build output, dependencies, secrets, OS
cruft:

```bash
# .gitignore  (committed to the repo so the whole team shares it)
node_modules/
*.log
.env                 # NEVER commit secrets
dist/
.DS_Store
```

A good **commit message** explains the *why*, not just the *what*:

```text
Summary line: imperative, ~50 chars ("Add retry to upload client")

Optional body after a blank line: explain the motivation and context —
what problem this solves and any trade-offs. Wrap at ~72 chars.
```

> [!TIP]
> Commit **small and often**, each commit one logical change with a clear message. Use the
> **imperative mood** ("Fix login bug", not "Fixed"/"Fixes") — it reads as "this commit
> will…". Small focused commits make history reviewable, `revert`/`bisect` precise, and
> merges saner. A repo's `git log` is documentation; write it for the next person (often
> future-you).

## Hands-on lab

```bash
# 1. New repo + identity (skip config if already set)
mkdir git-lab && cd git-lab && git init

# 2. Stage selectively — craft TWO focused commits from THREE files
echo "# Project" > README.md
echo "print('hi')" > app.py
echo "secret=123" > .env
echo ".env" > .gitignore          # exclude the secret

git add README.md
git commit -m "Add project README"
git add app.py .gitignore
git commit -m "Add app entry point and ignore .env"
git status                         # .env is ignored -> not shown as untracked

# 3. See the three trees in action
echo "print('bye')" >> app.py
git status                         # app.py modified, NOT staged
git diff                           # working vs staging (your new line)
git add app.py
git diff                           # now empty (nothing unstaged)
git diff --staged                  # shows the staged change
git commit -m "Add farewell message to app"

# 4. Read history
git log --oneline --graph
git show HEAD                      # the latest commit's changes
```

## Exercises

1. Explain the three trees and which command moves changes between each pair.
2. Configure your Git identity and start a new repo; prove it with `git status`.
3. From a directory with three changed files, create two **focused** commits using
   selective `git add`.
4. Create a `.gitignore` that excludes a secrets file and a build folder; show that the
   secret no longer appears in `git status`.
5. Show the difference between `git diff` and `git diff --staged` with a concrete edit.
6. Write a commit message (summary + body) that explains the *why* of a change.

## Troubleshooting

- **"Nothing to commit" but I changed files** — not staged. *Fix:* `git add`, then check
  `git status`.
- **Committed a secret/`node_modules`** — missing `.gitignore` (and ignore only affects
  **untracked** files). *Fix:* add to `.gitignore`; `git rm --cached <file>` to untrack an
  already-committed file.
- **Wrong author on commits** — identity unset/wrong. *Fix:* `git config user.email/name`.
- **Huge confusing commit** — committed everything at once. *Fix:* stage selectively; make
  small commits.
- **`git diff` shows nothing after editing** — you already staged it. *Fix:* use
  `git diff --staged`.
- **Accidentally `git init` in the wrong place / home dir** — *Fix:* `rm -rf .git` in that
  directory (carefully).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Does Git store diffs or snapshots? What's in a commit?
2. Name the three trees and their roles.
3. Which command stages changes, and which commits them?
4. What does `git status` tell you?
5. Difference between `git diff` and `git diff --staged`?
6. What is `.gitignore` for, and what does it NOT affect?
7. Why make small, focused commits?
8. What makes a good commit message (mood + content)?
9. **Practical:** create two focused commits from several changed files.
10. **Practical:** ignore a secrets file and prove it's excluded.

## Solutions & validation

1. **Snapshots**; a commit has author, message, timestamp, SHA, and parent pointer(s).
2. **Working dir** (edit), **staging/index** (next commit draft), **repository** (committed
   history).
3. `git add` stages; `git commit` commits.
4. Untracked/modified/staged files and how to proceed.
5. `git diff` = working vs staging; `--staged` = staging vs last commit.
6. Exclude files from tracking; it does **not** untrack already-committed files.
7. Reviewable history; precise `revert`/`bisect`; cleaner merges.
8. **Imperative mood** summary (~50 chars) + body explaining the **why**.
9. **Validation:** two commits via selective `git add` (see lab).
10. **Validation:** `.env` in `.gitignore` → absent from `git status`.

> [!TIP]
> Burn the **three-tree** picture into memory and run **`git status`** obsessively — those
> two habits prevent most beginner confusion. Stage deliberately, commit small, write
> messages for humans, and Git stops being scary and starts being the safety net that lets
> you change code fearlessly.

## What's next

Next: **Lesson 1002 — Branching & Merging.** Git's killer feature: cheap branches let you
work on features in isolation. You'll learn to create and switch branches, merge them
(fast-forward vs three-way), resolve **merge conflicts**, and understand how `HEAD` and
branch pointers actually move.
