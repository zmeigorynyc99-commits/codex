---
title: "Git — Remotes & Collaboration"
slug: "git-remotes-and-collaboration"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git Foundations"
order: 1003
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, remotes, push, pull, fetch, clone, github, collaboration]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 55
status: "published"
summary: "Take Git online: clone, fetch, pull, and push; how remote-tracking branches like origin/main work; setting upstreams; the difference between fetch and pull; handling non-fast-forward rejections; and the basics of collaborating through a shared remote (GitHub/GitLab)."
seoTitle: "Git 3: Remotes & Collaboration (clone, fetch, pull, push)"
seoDescription: "Git remotes: clone/fetch/pull/push, origin and remote-tracking branches, upstreams, fetch vs pull, non-fast-forward rejections, and SSH vs HTTPS auth. Lab + assessment."
---

So far everything has been local. **Remotes** make Git collaborative: a shared copy of the
repository (on GitHub/GitLab/Bitbucket or any server) that you and your team **push** to
and **pull** from. This lesson demystifies the network commands — `clone`, `fetch`, `pull`,
`push` — and the concept that ties them together: **remote-tracking branches** like
`origin/main`. Get these right and the fear of "I might break the shared repo" disappears.

## Learning objectives

By the end of this lesson you will be able to:

- **Clone** a repo and understand what `origin` is.
- Explain **remote-tracking branches** (`origin/main`) and **upstreams**.
- Use **`fetch`** vs **`pull`** correctly and know the difference.
- **Push** branches and set the upstream; handle **non-fast-forward** rejections.
- Choose between **HTTPS** and **SSH** authentication.

## Part 1 — Remotes and clone

A **remote** is a named reference to another copy of the repo (usually `origin`).
**Cloning** copies the entire history and sets up `origin` automatically:

```bash
git clone https://github.com/acme/widgets.git
git clone git@github.com:acme/widgets.git       # SSH variant
cd widgets
git remote -v                                   # list remotes (fetch + push URLs)
git remote add upstream https://github.com/orig/widgets.git   # add a second remote
```

`origin` is just a **name** for a URL — the default one `clone` creates. You can have
several remotes (common in fork-based workflows: `origin` = your fork, `upstream` = the
original).

## Part 2 — Remote-tracking branches

This is the concept that makes remotes click. When you fetch, Git updates **remote-tracking
branches** — read-only local pointers named `origin/<branch>` that record **where the
remote was** at your last sync:

```text
  main          your local branch (you commit here)
  origin/main   where origin's main was at your last fetch (read-only mirror)
```

```bash
git branch -a                    # -a shows remote-tracking branches too
git branch -vv                   # shows which upstream each local branch tracks
```

Your local `main` and `origin/main` are **different pointers**. You commit to local `main`;
`origin/main` only moves when you `fetch`/`pull`. The gap between them is "commits you
haven't pushed" or "commits you haven't pulled."

> [!IMPORTANT]
> `origin/main` is **not** the remote — it's your **local cached snapshot** of where the
> remote's `main` was the last time you talked to it. That's why `git status` can say "up
> to date" right after someone else pushed: you haven't fetched yet. Run **`git fetch`** to
> refresh your view of the remote before assuming you're current.

## Part 3 — Fetch vs pull

```bash
git fetch origin                 # download new commits; update origin/* — DOES NOT touch your work
git log --oneline main..origin/main   # see what you'd be merging in
git merge origin/main            # integrate when ready

git pull origin main             # = fetch + merge (or fetch + rebase) in one step
git pull --rebase origin main    # fetch then rebase your commits on top (linear)
```

- **`fetch`** is **safe and non-destructive** — it only updates remote-tracking branches;
  your working branch is untouched. You inspect, then merge deliberately.
- **`pull`** is `fetch` **+ merge** (or rebase) — convenient, but it changes your working
  branch immediately and can produce surprise merge commits/conflicts.

> [!TIP]
> Prefer **`git fetch` then look** before integrating, especially on shared branches —
> you see exactly what's coming. If you like `pull`, configure **`pull.rebase`** (e.g.
> `git config --global pull.rebase true`) so it rebases instead of creating noisy merge
> commits, keeping history linear. Either way, **fetch often** so your `origin/*` view is
> fresh.

## Part 4 — Push and upstreams

**Pushing** sends your local commits to the remote:

```bash
git push origin main                       # push local main to origin/main
git push -u origin feature-login           # push + set UPSTREAM (so future `git push` alone works)
git push                                   # after -u, just this
git push origin --delete old-branch        # delete a remote branch
```

The `-u`/`--set-upstream` flag links your local branch to the remote one, so plain
`git push`/`git pull` know where to go and `git status` reports ahead/behind counts.

**Non-fast-forward rejection** — the most common push error:

```text
! [rejected]  main -> main (non-fast-forward)
error: failed to push some refs ... Updates were rejected because the remote contains
work that you do not have locally.
```

It means **someone pushed before you** — your history would overwrite theirs. The fix is to
**integrate their work first**:

```bash
git pull --rebase origin main    # bring their commits in, replay yours on top
git push                         # now it fast-forwards cleanly
```

> [!IMPORTANT]
> A non-fast-forward rejection is Git **protecting** the shared branch from losing commits
> — never "fix" it with `git push --force` on a shared branch (that erases teammates'
> work). Instead **pull/rebase, then push**. Reserve force-pushing for **your own** feature
> branches, and prefer the safer **`--force-with-lease`** even then.

## Part 5 — Authentication: HTTPS vs SSH

- **HTTPS** — `https://github.com/...`; authenticate with a **personal access token** (not
  your password) or a credential helper. Works everywhere, easy through firewalls.
- **SSH** — `git@github.com:...`; authenticate with an **SSH key** you upload once. No
  token prompts, great for daily use.

```bash
ssh-keygen -t ed25519 -C "you@example.com"   # generate a key, add the .pub to GitHub
ssh -T git@github.com                         # test the connection
git remote set-url origin git@github.com:acme/widgets.git   # switch a repo to SSH
```

## Hands-on lab

```bash
# 1. Clone and inspect (use any repo you can access, or a local "remote")
#    Simulate a remote locally so the lab needs no network:
mkdir -p ~/lab && cd ~/lab
git init --bare server.git                  # acts as the "remote"
git clone server.git work && cd work

# 2. First push sets the upstream
echo "v1" > app.txt
git add app.txt && git commit -m "Add app v1"
git push -u origin main                      # now origin/main exists
git branch -vv                               # see the tracking link

# 3. Simulate a teammate pushing first (clone #2)
cd ~/lab && git clone server.git work2 && cd work2
echo "teammate" >> app.txt
git commit -am "Teammate change" && git push

# 4. Your push is now rejected — integrate then push
cd ~/lab/work
echo "mine" >> app.txt
git commit -am "My change"
git push                                     # -> rejected (non-fast-forward)
git pull --rebase                            # bring teammate's commit in, replay yours
git push                                     # succeeds (fast-forward)

# 5. fetch vs pull
git fetch origin
git log --oneline main..origin/main          # preview incoming before merging
```

## Exercises

1. Clone a repo (or the bare-repo simulation) and explain what `origin` and `git remote -v`
   show.
2. Describe the difference between local `main` and `origin/main`, and how each moves.
3. Show the difference between `git fetch` and `git pull`; preview incoming commits before
   merging.
4. Push a new branch with `-u` and explain what the upstream link enables.
5. Reproduce a non-fast-forward rejection and resolve it the correct way (not force).
6. Configure SSH auth (or explain HTTPS token auth) and switch a remote URL.

## Troubleshooting

- **Push rejected (non-fast-forward)** — remote has commits you lack. *Fix:* `git pull
  --rebase` then push; never force on shared branches.
- **`git status` says up-to-date but it isn't** — stale `origin/*`. *Fix:* `git fetch`
  first.
- **`git push` says "no upstream branch"** — never pushed/linked. *Fix:* `git push -u
  origin <branch>`.
- **Authentication failed (HTTPS)** — used a password. *Fix:* use a **personal access
  token** or switch to SSH.
- **`pull` created surprise merge commits** — default merge pull. *Fix:* `git config
  pull.rebase true` or `git pull --rebase`.
- **Pushed to the wrong branch** — *Fix:* be explicit (`git push origin feature`); check
  `git branch -vv`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a remote, and what is `origin`?
2. What does cloning set up for you?
3. What is `origin/main`, and how does it differ from local `main`?
4. Difference between `fetch` and `pull`?
5. Why is `fetch` considered safe?
6. What does `-u`/upstream do?
7. What causes a non-fast-forward rejection, and the correct fix?
8. Why avoid `--force` on shared branches?
9. **Practical:** reproduce and correctly resolve a non-fast-forward rejection.
10. **Practical:** preview incoming commits with `fetch` before merging.

## Solutions & validation

1. A named reference to another copy of the repo; `origin` is the default name from clone.
2. Full history + `origin` remote + a tracking `main`.
3. A read-only **local cache** of the remote's branch at last sync; local `main` is where
   you commit.
4. `fetch` downloads + updates `origin/*` only; `pull` = fetch **+ merge/rebase** into your
   branch.
5. It doesn't change your working branch — only remote-tracking refs.
6. Links local↔remote branch so bare `push`/`pull` work and ahead/behind shows.
7. Remote advanced past you; **`git pull --rebase` then push**.
8. It overwrites teammates' commits — data loss.
9. **Validation:** rejection → `pull --rebase` → successful push (see lab).
10. **Validation:** `git log --oneline main..origin/main` after `git fetch`.

> [!TIP]
> Internalize that **`origin/main` is a cached snapshot**, **`fetch` is safe and `pull`
> changes your branch**, and a **non-fast-forward rejection means pull/rebase, never
> force**. With those three, you collaborate through a shared remote confidently and never
> clobber a teammate's work.

## What's next

Next: **Lesson 1004 — Rebasing & Rewriting History.** Craft a clean, linear history: `git
rebase` to replay commits, interactive rebase to squash/reword/reorder, the cardinal rule
about never rewriting shared history, and the **reflog** safety net that lets you undo
almost anything.
