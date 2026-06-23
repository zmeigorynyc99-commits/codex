---
title: "Git — Rebasing & Rewriting History"
slug: "git-rebasing-and-rewriting-history"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git Mastery"
order: 1004
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, rebase, interactive-rebase, squash, reflog, history]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 60
status: "published"
summary: "Craft a clean, linear history: git rebase to replay commits onto a new base, interactive rebase to squash/reword/reorder/drop commits, the cardinal rule about never rewriting shared history, force-with-lease, and the reflog safety net that lets you undo almost anything."
seoTitle: "Git 4: Rebasing & Rewriting History (interactive rebase, reflog)"
seoDescription: "Git rebase vs merge, interactive rebase (squash/reword/reorder/fixup), the golden rule of not rewriting shared history, force-with-lease, and reflog recovery. Lab + assessment."
---

**Rebase** is Git's tool for producing a clean, linear, readable history — and it's the
command beginners are most afraid of, usually because nobody explained the one rule that
keeps it safe. This lesson covers `git rebase` (replaying commits onto a new base),
**interactive rebase** (squash, reword, reorder, drop), when to rebase vs merge, the
all-important **golden rule** about shared history, and the **reflog** — the safety net
that means you can almost always undo a rebase gone wrong.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what **rebase** does and how it differs from merge.
- Use **`git rebase main`** to update a feature branch linearly.
- Run **interactive rebase** to squash/reword/reorder/drop commits.
- State and apply the **golden rule** of rewriting history; use **`--force-with-lease`**.
- Recover lost commits with the **reflog**.

## Part 1 — Rebase vs merge

Both integrate changes; they produce **different histories**:

- **Merge** preserves the true, branching history and adds a **merge commit**.
- **Rebase** **replays** your branch's commits **on top of** another branch, as if you'd
  started from its latest commit — a **linear** history with **no merge commit**.

```text
       A───B───C  (main)              rebase feature onto main:
            \                          A───B───C  (main)
             D───E  (feature)                    \
                                                  D'───E'  (feature, replayed)
```

Note `D'` and `E'` are **new commits** (new hashes) with the same changes — rebasing
**rewrites** those commits.

```bash
git switch feature
git rebase main          # replay feature's commits on top of current main
# resolve any conflicts, then:
git rebase --continue    # (or --abort to bail, --skip to drop a commit)
```

## Part 2 — Why and when to rebase

```bash
# Keep a feature branch current without merge commits:
git switch feature
git fetch origin
git rebase origin/main   # your work now sits on top of the latest main — easy, clean PR
```

Rebasing **before** merging a feature gives reviewers a tidy, linear diff and avoids
"Merge branch 'main' into feature" noise. Many teams rebase feature branches and then do a
fast-forward (or squash) merge into `main`.

> [!TIP]
> Use **rebase to keep your feature branch up to date** with `main` and to **clean up your
> own commits before sharing**. Use **merge** to bring a finished branch into `main` (or
> when you want to preserve the real branching history). A common, clean pattern: *rebase
> your branch on `main`, then open the PR* — reviewers see only your changes, in order.

## Part 3 — Interactive rebase

`git rebase -i` lets you **rewrite a series of commits** — the tool for cleaning up messy
work-in-progress before review:

```bash
git rebase -i HEAD~4      # edit the last 4 commits
```

You get an editor list; change the verb on each line:

```text
pick   a1b2c3 Add login form
squash b2c3d4 fix typo            # fold into previous commit (combine + edit message)
fixup  c3d4e5 fix typo again      # fold in, DISCARD this message
reword d4e5f6 Add validation      # keep commit, edit its message
# reorder by moving lines; delete a line (or 'drop') to remove a commit entirely
```

- **squash/fixup** — combine several commits into one (turn "wip, fix, fix, fix" into one
  clean commit).
- **reword** — fix a commit message.
- **reorder** — change commit order by moving lines.
- **drop** — delete a commit.
- **edit** — pause at a commit to amend its content.

Also handy: **`git commit --amend`** rewrites just the **last** commit (message or content):

```bash
git commit --amend -m "Better message"     # fix the most recent commit
git commit --amend --no-edit               # add staged changes to the last commit
```

## Part 4 — The golden rule and force-with-lease

Rebasing/amending **creates new commits with new hashes** — it **rewrites history**. That's
fine for commits only you have, and dangerous for commits others have based work on:

> [!IMPORTANT]
> **The golden rule: never rewrite history that others have pulled.** Rebasing/amending
> **published, shared** commits changes their hashes, so teammates' repos diverge and chaos
> follows. Rewrite **freely on your own un-pushed (or solo feature) branches**; **never**
> rebase a shared `main`/`develop`. When you must update an already-pushed *personal*
> branch after a rebase, push with **`--force-with-lease`** (which refuses if someone else
> pushed in the meantime) — never a bare `--force`.

```bash
git push --force-with-lease origin feature   # safe-ish force for YOUR branch after rebase
```

## Part 5 — The reflog: your safety net

The **reflog** records where `HEAD` (and branches) pointed over time — even commits that
seem "lost" after a bad rebase/reset are still reachable for a while:

```bash
git reflog                       # every position HEAD has had, with hashes
git reset --hard HEAD@{2}        # jump back to where you were 2 moves ago
git branch rescue <hash>         # recover a "lost" commit onto a new branch
```

Because of the reflog, a botched rebase is almost always recoverable: find the pre-rebase
hash in `git reflog` and reset/branch to it.

> [!TIP]
> Fear of rebase usually comes from thinking it's irreversible — it isn't. **`git reflog`**
> is your undo history for Git itself. Before a scary rebase, note the current hash (or just
> trust the reflog); if it goes wrong, `git reset --hard <hash>` puts you back exactly. Lost
> commits live in the reflog for ~90 days by default.

## Hands-on lab

```bash
mkdir rebase-lab && cd rebase-lab && git init
printf 'main\n' > f.txt && git add f.txt && git commit -m "Base"

# 1. Make a messy feature branch
git switch -c feature
echo a >> f.txt && git commit -am "Add feature part 1"
echo b >> f.txt && git commit -am "wip"
echo c >> f.txt && git commit -am "fix typo"
git log --oneline                        # 3 messy commits

# 2. Clean them into ONE good commit with interactive rebase
git rebase -i HEAD~3                      # squash/fixup the wip+typo into part 1, reword
git log --oneline                         # now tidy

# 3. Meanwhile main moved — rebase onto it for a linear history
git switch main && echo x >> other.txt && git add other.txt && git commit -m "Main moves"
git switch feature && git rebase main
git log --oneline --graph --all           # feature sits on top of main, linear

# 4. amend the last commit
git commit --amend -m "Add feature (clean)"

# 5. Reflog recovery — simulate a mistake and undo it
BAD=$(git rev-parse HEAD)
git reset --hard HEAD~2                    # "oops, lost commits"
git reflog                                 # find the pre-reset hash
git reset --hard "$BAD"                     # fully restored
```

## Exercises

1. Explain the difference between merge and rebase, including what happens to commit hashes.
2. Rebase a feature branch onto an updated `main` and show the resulting linear graph.
3. Use interactive rebase to squash three messy commits into one well-worded commit.
4. Reword and reorder commits with `rebase -i`; verify with `git log`.
5. State the golden rule and explain why `--force-with-lease` is safer than `--force`.
6. Simulate a destructive `reset --hard`, then recover the lost commits using the reflog.

## Troubleshooting

- **Rebase conflict on every commit** — replaying each commit re-hits the conflict. *Fix:*
  resolve + `git rebase --continue` each step; `--abort` to bail.
- **"Lost" commits after rebase/reset** — *Fix:* `git reflog`; `git reset --hard <hash>` or
  branch to it.
- **Teammates' branches broke after you rebased `main`** — violated the golden rule. *Fix:*
  don't rewrite shared history; coordinate a recovery.
- **`push` rejected after rebasing a pushed branch** — history diverged. *Fix:*
  `--force-with-lease` (your branch only).
- **`--force` clobbered someone's commits** — *Fix:* recover via their reflog/your reflog;
  use `--force-with-lease` next time.
- **Rebase produced duplicate commits** — rebased commits that were already merged. *Fix:*
  rebase onto the correct base; use `--onto` for surgical moves.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does rebase do, and how does the history differ from a merge?
2. Why do rebased commits get new hashes?
3. Name three operations interactive rebase can perform.
4. What's the difference between squash and fixup?
5. What does `git commit --amend` change?
6. State the golden rule of rewriting history.
7. Why prefer `--force-with-lease` over `--force`?
8. What is the reflog and what does it let you recover?
9. **Practical:** squash three commits into one with `rebase -i`.
10. **Practical:** recover a commit removed by `reset --hard` using the reflog.

## Solutions & validation

1. **Replays** commits onto a new base → **linear** history (no merge commit); merge keeps
   branching + a merge commit.
2. Rebase **rewrites** them (new parent/base) → new SHAs.
3. e.g. squash, fixup, reword, reorder, drop, edit.
4. **squash** keeps/combines messages (lets you edit); **fixup** discards the squashed
   commit's message.
5. Rewrites the **last** commit (message and/or staged content).
6. **Never rewrite history others have pulled** (shared branches).
7. It **refuses** if the remote advanced unexpectedly, preventing overwriting new commits.
8. A log of every `HEAD`/branch position; lets you recover "lost" commits after rebase/
   reset.
9. **Validation:** `git log --oneline` shows one clean commit (see lab).
10. **Validation:** `git reset --hard <hash-from-reflog>` restores the commits.

> [!TIP]
> Rebase is about **storytelling**: present your work as a clean, logical sequence of
> commits, not a diary of fumbles. Rewrite **your own** history freely, **never** shared
> history, force only with **`--force-with-lease`**, and trust the **reflog** as your undo.
> Mastering rebase is what separates tidy, reviewable repos from tangled ones.

## What's next

Next: **Lesson 1005 — Undoing Things & Recovery.** The "help, I messed up" lesson: the
precise differences between `checkout`/`switch`, `restore`, `reset` (soft/mixed/hard),
`revert`, and `clean` — knowing exactly which one safely undoes each kind of mistake,
without losing work.
