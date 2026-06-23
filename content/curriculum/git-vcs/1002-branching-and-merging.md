---
title: "Git — Branching & Merging"
slug: "git-branching-and-merging"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git Foundations"
order: 1002
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, branching, merging, conflicts, head, beginner]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 60
status: "published"
summary: "Git's killer feature: cheap, fast branches for isolated work. Create and switch branches, understand HEAD and branch pointers, merge with fast-forward vs three-way merges, and resolve merge conflicts confidently — the daily mechanics of feature development."
seoTitle: "Git 2: Branching & Merging (HEAD, fast-forward, conflicts)"
seoDescription: "Git branches: create/switch, HEAD and pointers, fast-forward vs three-way merge, and resolving merge conflicts step by step. Hands-on lab and assessment."
---

Branching is the feature that made Git win. A **branch** is just a movable pointer to a
commit — creating one is instant and nearly free, so you can spin up a branch per feature,
experiment safely, and **merge** back when ready, all without disturbing `main`. This
lesson makes branching concrete: how **`HEAD`** and branch pointers move, **fast-forward**
vs **three-way** merges, and — the part everyone dreads until they understand it —
**resolving merge conflicts**.

## Learning objectives

By the end of this lesson you will be able to:

- Create, list, switch, and delete **branches**.
- Explain what **`HEAD`** and a **branch pointer** are and how they move.
- Merge with **fast-forward** vs **three-way** merges and read the graph.
- **Resolve merge conflicts** step by step.
- Adopt a simple **feature-branch** habit.

## Part 1 — What a branch really is

A branch is a **lightweight movable pointer to a commit** — that's the whole secret. `main`
is just a pointer; so is any branch you create. **`HEAD`** is a special pointer to "where
you are now" (usually the branch you're on).

```bash
git branch                       # list branches (* marks current)
git branch feature-login         # create a branch (pointer at current commit)
git switch feature-login         # move HEAD onto it  (older: git checkout)
git switch -c feature-login      # create AND switch in one step
git branch -d feature-login      # delete a merged branch
```

When you commit on `feature-login`, that branch pointer advances; `main` stays put. Because
a branch is just a 41-byte pointer, creating one is **instant** — make them freely.

```text
        A───B───C   (main)
                 \
                  D───E   (feature-login)   <- HEAD here after switching
```

## Part 2 — Switching and isolation

Switching branches makes your **working directory** match that branch's snapshot. So you
develop a feature in isolation, switch back to `main` to ship a hotfix, then switch back —
your in-progress work is preserved on its branch.

```bash
git switch -c feature-x          # start a feature
# ...edit, add, commit...
git switch main                  # back to main — working dir reflects main
git switch feature-x             # resume the feature exactly where you left off
```

> [!TIP]
> Make a branch for **every** unit of work (`feat/login`, `fix/typo`) and keep `main`
> always-deployable. Branches are so cheap there's no reason to develop on `main`. If you
> have uncommitted changes that conflict with switching, either commit them or **`git
> stash`** them (covered later) — Git protects you from silently losing work.

## Part 3 — Fast-forward merges

To bring a branch's work into another, you **merge**. If the target branch hasn't moved
since you branched, Git just slides the pointer forward — a **fast-forward** (no merge
commit, perfectly linear):

```bash
git switch main
git merge feature-login          # fast-forward if main has no new commits
```

```text
before:   A───B   (main)              after FF:   A───B───C───D   (main, feature-login)
               \
                C───D  (feature-login)
```

## Part 4 — Three-way merges and merge commits

If **both** branches have new commits (history diverged), Git performs a **three-way
merge**: it combines the two tips and their **common ancestor** into a new **merge commit**
with **two parents**:

```bash
git switch main
git merge feature-login          # creates a merge commit (M)
git merge --no-ff feature-login  # force a merge commit even when FF is possible
```

```text
        A───B───C        (main)
             \       \
              D───E───M  (M = merge commit, parents C and E)
```

A merge commit records that two lines of history came together. Many teams prefer
`--no-ff` for feature merges so the branch's existence is visible in history (or prefer
rebasing for linearity — next lesson).

## Part 5 — Merge conflicts

A **conflict** happens when the two branches changed the **same lines** of the same file —
Git can't decide, so it asks you. This is normal, not an error:

```bash
git merge feature-x
# CONFLICT (content): Merge conflict in app.py
git status                       # lists "Unmerged paths"
```

Git marks the conflict in the file:

```text
<<<<<<< HEAD
color = "blue"          # the version on your current branch (main)
=======
color = "green"         # the version coming from feature-x
>>>>>>> feature-x
```

Resolve it by **editing the file** to the correct final content (remove the `<<<`/`===`/
`>>>` markers), then:

```bash
git add app.py                   # mark this file resolved
git merge --continue             # (or: git commit) to complete the merge
# Changed your mind mid-merge?  git merge --abort   # back to pre-merge state
```

> [!IMPORTANT]
> Conflicts are **expected** when people touch the same code — they are not failures.
> Resolve them by deciding the **correct final result** (often a combination of both
> sides, not just picking one), removing **all** conflict markers, then `git add` +
> continue. If it goes wrong, **`git merge --abort`** safely returns you to before the
> merge. Use a merge tool/IDE for big conflicts, and always re-run tests after resolving.

## Hands-on lab

```bash
# 1. Set up a repo with a main commit
mkdir branch-lab && cd branch-lab && git init
echo "color = blue" > app.py
git add app.py && git commit -m "Add app with blue"

# 2. Fast-forward merge
git switch -c feature-logging
echo "log = on" >> app.py
git commit -am "Enable logging"
git switch main
git merge feature-logging          # FAST-FORWARD (main had no new commits)
git log --oneline --graph

# 3. Create a real conflict (three-way)
git switch -c feature-green
sed -i 's/color = blue/color = green/' app.py
git commit -am "Change color to green"
git switch main
sed -i 's/color = blue/color = red/' app.py
git commit -am "Change color to red"
git merge feature-green            # CONFLICT on the color line
git status
# -> edit app.py, choose the final color, delete the <<< === >>> markers
git add app.py
git merge --continue
git log --oneline --graph          # see the merge commit with two parents

# 4. Try the escape hatch on a fresh conflict
# git merge <branch>  ->  git merge --abort   (returns to pre-merge state)
```

## Exercises

1. Explain what a branch and `HEAD` are; show the commands to create+switch in one step.
2. Produce a **fast-forward** merge and explain why no merge commit was created.
3. Force a divergence and produce a **three-way merge** with a merge commit; show the graph.
4. Deliberately create a merge conflict, resolve it to a sensible combined result, and
   complete the merge.
5. Start a merge, then `--abort` it, and confirm you're back to the pre-merge state.
6. Describe a feature-branch workflow you'd use for a small team in 3–4 sentences.

## Troubleshooting

- **"Your local changes would be overwritten by checkout"** — uncommitted work conflicts
  with switching. *Fix:* commit or `git stash` first.
- **Expected FF but got a merge commit** — the target moved. *Fix:* that's a three-way
  merge; rebase first if you want linear history.
- **Conflict markers committed into the file** — didn't remove `<<</===/>>>`. *Fix:* edit
  them out, re-add, recommit.
- **Merge went wrong** — *Fix:* `git merge --abort` (before committing) to undo cleanly.
- **Deleted a branch with unmerged work** — `-d` refused; if you forced `-D`, recover via
  `git reflog`.
- **On a "detached HEAD"** — you checked out a commit, not a branch. *Fix:* `git switch -c
  newbranch` to keep the work.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a Git branch, fundamentally?
2. What does `HEAD` point to?
3. When does a merge fast-forward vs create a merge commit?
4. How many parents does a merge commit have?
5. What causes a merge conflict?
6. Walk through resolving a conflict.
7. How do you safely cancel an in-progress merge?
8. Why develop on branches instead of `main`?
9. **Practical:** create and resolve a real merge conflict.
10. **Practical:** show a fast-forward and a three-way merge in one repo's graph.

## Solutions & validation

1. A **movable pointer to a commit**.
2. The current location — usually the branch you're on (the next commit's parent).
3. **Fast-forward** when the target hasn't diverged; **merge commit** when both branches
   have new commits.
4. **Two** parents.
5. Both branches changed the **same lines** of the same file.
6. Edit the file to the correct final content, remove conflict markers, `git add`, then
   `git merge --continue`/commit.
7. `git merge --abort`.
8. Isolation: `main` stays deployable; features don't interfere; easy review/rollback.
9. **Validation:** resolved file has no markers; merge commit created (see lab).
10. **Validation:** `git log --oneline --graph` shows one linear FF and one diverged merge.

> [!TIP]
> Treat branches as **free and disposable**: one per task, merge when done, delete after.
> Master the conflict loop — *edit to the right result → `git add` → continue* — and the
> escape hatch **`git merge --abort`**, and you'll never fear a conflict again. Branching
> fluency is the gateway to pull requests and team workflows.

## What's next

Next: **Lesson 1003 — Remotes & Collaboration.** Take Git online: `clone`, `fetch`, `pull`,
and `push`, how remote-tracking branches (`origin/main`) work, setting upstreams, and the
basics of collaborating through a shared remote like GitHub/GitLab.
