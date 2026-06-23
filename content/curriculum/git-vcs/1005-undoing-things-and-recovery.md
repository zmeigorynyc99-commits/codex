---
title: "Git — Undoing Things & Recovery"
slug: "git-undoing-things-and-recovery"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git Mastery"
order: 1005
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, reset, revert, restore, recovery, undo]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 55
status: "published"
summary: "The 'help, I messed up' lesson: the precise differences between restore, checkout/switch, reset (soft/mixed/hard), revert, and clean — knowing exactly which one safely undoes each mistake (unstage, discard, amend, undo a pushed commit) without losing work."
seoTitle: "Git 5: Undoing Things & Recovery (reset, revert, restore)"
seoDescription: "Git undo: unstage with restore, discard changes, reset soft/mixed/hard, revert a pushed commit, clean untracked files, and recover with reflog. Hands-on lab + assessment."
---

Everyone messes up in Git — staged the wrong file, want to discard an edit, made a bad
commit, need to undo something already pushed. The problem is that Git offers **several**
undo commands that look similar but behave very differently, and using the wrong one can
**lose work**. This lesson is a precise map: for each kind of "oops," which command, and
why — covering `restore`, `reset` (soft/mixed/hard), `revert`, and `clean`, plus the
reflog as the ultimate backstop.

## Learning objectives

By the end of this lesson you will be able to:

- **Unstage** a file and **discard** working-directory changes safely.
- Use **`reset --soft/--mixed/--hard`** and predict exactly what each moves.
- **Undo a pushed commit** safely with **`revert`**.
- Remove untracked files with **`clean`**.
- Pick the **right** undo for each situation and recover via the reflog.

## Part 1 — The decision map

Match the mistake to the command:

| Situation | Command | Loses work? |
|---|---|---|
| Unstage a file (keep the edit) | `git restore --staged <f>` | No |
| Discard working-dir changes to a file | `git restore <f>` | **Yes** (that file's edits) |
| Switch branch / get a file from another commit | `git switch` / `git restore -s` | No |
| Undo last commit, keep changes staged | `git reset --soft HEAD~1` | No |
| Undo last commit, keep changes unstaged | `git reset --mixed HEAD~1` (default) | No |
| Undo last commit AND discard changes | `git reset --hard HEAD~1` | **Yes** |
| Undo a commit that's already pushed | `git revert <hash>` | No (adds a commit) |
| Delete untracked files | `git clean -fd` | **Yes** (untracked) |

The two that **destroy** work are **`reset --hard`** and **`clean`** — treat them with care.

## Part 2 — restore: unstage and discard

Modern Git splits the old overloaded `checkout` into `switch` (branches) and `restore`
(files):

```bash
git restore --staged file.txt    # unstage (staging -> working); keeps your edits
git restore file.txt             # DISCARD working changes -> back to last commit (loses edits!)
git restore --source=HEAD~2 file.txt   # get file.txt as it was 2 commits ago
git restore .                    # discard ALL unstaged changes (careful)
```

`git status` even prints these hints. Remember: `restore --staged` is safe (just unstages);
plain `restore <file>` **throws away** that file's uncommitted edits.

## Part 3 — reset: moving the branch pointer

`reset` moves the current **branch pointer** (and optionally staging/working) to a target
commit. The flag decides **how much** it touches:

```text
                         moves branch?  staging?   working dir?
git reset --soft  <c>        yes          kept        kept     -> changes left STAGED
git reset --mixed <c>        yes          reset       kept     -> changes left UNSTAGED (default)
git reset --hard  <c>        yes          reset       reset    -> changes GONE (destructive)
```

```bash
git reset --soft HEAD~1      # "uncommit" but keep everything staged (redo the commit)
git reset HEAD~1             # (mixed) uncommit + unstage; edits remain in working dir
git reset --hard HEAD~1      # uncommit AND discard the changes — DANGER
git reset --hard origin/main # force local branch to match remote (lose local commits)
```

> [!IMPORTANT]
> **`--soft` and `--mixed` keep your changes** (in staging / working dir respectively) —
> they only move the commit pointer, so they're safe ways to redo a commit. **`--hard`
> discards** working-dir and staged changes — it's the one that loses work. Before any
> `reset --hard`, be sure you don't need the current state (and remember the **reflog** can
> still rescue committed work).

## Part 4 — revert: the safe undo for shared history

`reset` rewrites history — never do that to **pushed/shared** commits. To undo something
already public, use **`revert`**, which creates a **new commit** that applies the inverse:

```bash
git revert <hash>            # new commit that undoes <hash>; safe on shared branches
git revert HEAD              # undo the most recent commit (forward, not rewriting)
git revert <hash> --no-edit  # accept the default revert message
git revert <oldest>..<newest>   # revert a range
```

```text
A───B───C───D          ──revert C──►   A───B───C───D───C'   (C' undoes C, history intact)
```

Because `revert` **adds** rather than removes, everyone's history stays consistent — this
is the **correct** way to undo a commit on `main`.

> [!TIP]
> Rule of thumb: **`reset` for local/private mistakes, `revert` for anything already
> pushed.** `revert` keeps history honest and shareable (the bad change *and* its undo are
> both recorded), which is exactly what you want for a published `main`. Reach for `reset`
> only on commits you haven't shared.

## Part 5 — clean, and the reflog backstop

```bash
git clean -n                 # DRY RUN — show what would be deleted (always do this first)
git clean -fd                # delete untracked files (-f) and directories (-d)
git clean -fdx               # also remove ignored files (e.g. build output) — very thorough
```

`clean` removes **untracked** files (Git isn't tracking them, so there's nothing to
recover) — **always `-n` first**.

And the universal backstop for **committed** work:

```bash
git reflog                   # find the hash you were at before the mistake
git reset --hard <hash>      # or: git branch rescue <hash>
```

The reflog recovers from bad `reset`/rebase/amend — but it does **not** save uncommitted
changes destroyed by `reset --hard`/`restore`/`clean`. The lesson: **commit (or stash)
before risky operations.**

## Hands-on lab

```bash
mkdir undo-lab && cd undo-lab && git init
echo v1 > f.txt && git add f.txt && git commit -m "v1"

# 1. Unstage vs discard
echo v2 >> f.txt && git add f.txt
git restore --staged f.txt        # unstaged, edit kept
git diff                          # still shows v2 line
git restore f.txt                 # discard -> back to v1 (edit gone)

# 2. reset flavors — observe staging/working after each
echo v3 >> f.txt && git commit -am "v3"
git reset --soft HEAD~1; git status   # change is STAGED
git commit -m "v3 again"
git reset HEAD~1; git status          # change is UNSTAGED (mixed)
git add f.txt && git commit -m "v3 once more"

# 3. revert a "pushed" commit (safe undo)
git revert HEAD --no-edit
git log --oneline                 # bad commit + its revert both present

# 4. clean untracked files safely
touch junk.tmp scratch/
git clean -n                      # DRY RUN first
git clean -fd                     # remove them

# 5. reflog recovery after a hard reset
GOOD=$(git rev-parse HEAD)
git reset --hard HEAD~2
git reflog                        # locate $GOOD
git reset --hard "$GOOD"           # restored
```

## Exercises

1. Build the decision table from memory: for unstage, discard, uncommit-keep-staged,
   uncommit-discard, undo-pushed, delete-untracked — name the command.
2. Demonstrate `restore --staged` vs `restore <file>` and explain which loses work.
3. Show the difference between `reset --soft`, `--mixed`, and `--hard` by checking
   `git status` after each.
4. Undo a commit two different ways — `reset` (private) and `revert` (shared) — and explain
   when each is appropriate.
5. Use `git clean -n` then `-fd` to remove untracked files; explain why dry-run matters.
6. Recover from a `reset --hard` mistake using the reflog.

## Troubleshooting

- **Lost edits after `restore <file>`/`reset --hard`** — uncommitted work isn't in the
  reflog. *Fix:* none reliably; **commit/stash before risky ops** next time.
- **Rewrote a pushed commit with `reset`** — broke shared history. *Fix:* use `revert`
  instead; recover via reflog/coordination.
- **`clean` deleted something important** — it was untracked. *Fix:* unrecoverable;
  always `-n` first.
- **`reset` didn't change files as expected** — wrong flag. *Fix:* recall soft=keep staged,
  mixed=keep unstaged, hard=discard.
- **Want to undo a merge** — *Fix:* `git revert -m 1 <merge-hash>` (specify the mainline
  parent).
- **Detached HEAD after checking out a hash** — *Fix:* `git switch -c branch` to keep work.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. How do you unstage a file without losing the edit?
2. What does plain `git restore <file>` do, and what's the risk?
3. Contrast `reset --soft`, `--mixed`, and `--hard`.
4. Which reset flag is destructive, and to what?
5. When must you use `revert` instead of `reset`?
6. How does `revert` undo a commit without rewriting history?
7. What does `git clean` remove, and why run `-n` first?
8. What can (and cannot) the reflog recover?
9. **Practical:** demonstrate soft vs mixed vs hard reset via `git status`.
10. **Practical:** revert a pushed commit and show both commits in the log.

## Solutions & validation

1. `git restore --staged <file>`.
2. Discards that file's working-dir changes back to the last commit; **loses** uncommitted
   edits.
3. soft = keep changes **staged**; mixed = keep **unstaged**; hard = **discard** all.
4. `--hard` (and `clean`) — destroys working-dir/staged (and untracked) changes.
5. When the commit is **already pushed/shared** (don't rewrite shared history).
6. It adds a **new commit** applying the inverse — history stays intact.
7. **Untracked** files/dirs; `-n` is a dry run so you don't delete something important.
8. Recovers **committed** work (after reset/rebase/amend); **not** uncommitted changes.
9. **Validation:** status shows staged / unstaged / gone respectively (see lab).
10. **Validation:** `git log` shows the commit and its `Revert "…"` follow-up.

> [!TIP]
> Keep one rule front of mind: **`reset`/`restore`/`clean` are for local, unshared messes;
> `revert` is for anything already pushed.** Know which commands **lose work** (`reset
> --hard`, `restore <file>`, `clean`) and **commit or stash before** using them. With the
> reflog as backup, almost any *committed* mistake is recoverable — so work boldly, just
> commit often.

## What's next

Next: **Lesson 1006 — Team Workflows & Pull Requests.** How real teams ship: feature-branch
and trunk-based workflows, opening and reviewing **pull/merge requests**, draft PRs and
required reviews, protected branches and status checks, and how PRs connect Git to CI/CD.
