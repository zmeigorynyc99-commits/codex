---
title: "Git — Practical Toolkit (Stash, Cherry-pick, Tags, Bisect)"
slug: "git-practical-toolkit-stash-cherry-pick-tags-bisect"
track: "git-vcs"
trackName: "Git & Version Control"
module: "Git in Teams"
order: 1007
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [git, stash, cherry-pick, tag, bisect, blame, hooks]
cover: "/covers/curriculum/git-vcs.svg"
estMinutes: 60
status: "published"
summary: "The high-value commands that save you daily: stash to shelve work, cherry-pick to move a single commit, tags and releases for versioning, bisect to binary-search for the commit that introduced a bug, plus blame, worktree, and a look at hooks and submodules."
seoTitle: "Git 7: Practical Toolkit — Stash, Cherry-pick, Tags, Bisect"
seoDescription: "Daily-use Git: stash, cherry-pick, annotated tags and releases, git bisect to find a regression, blame, worktree, and an intro to hooks and submodules. Lab + assessment."
---

Beyond the core loop and team workflow, Git has a set of **power tools** that turn awkward
situations into one-liners. This lesson collects the ones you'll reach for regularly:
**`stash`** (shelve work-in-progress), **`cherry-pick`** (grab one commit from another
branch), **tags and releases** (mark versions), and the underrated debugging superpower
**`git bisect`** (binary-search history to find exactly which commit introduced a bug).
We'll also touch `blame`, `worktree`, hooks, and submodules.

## Learning objectives

By the end of this lesson you will be able to:

- Shelve and restore work with **`git stash`**.
- Move a specific commit between branches with **`cherry-pick`**.
- Create **annotated tags** and understand releases/SemVer.
- Find a regression fast with **`git bisect`**.
- Use **`blame`**, **`worktree`**, and know what **hooks** and **submodules** are for.

## Part 1 — Stash: shelve work-in-progress

You're mid-change and need to switch branches (urgent hotfix) but aren't ready to commit.
**Stash** sets your changes aside and restores a clean working directory:

```bash
git stash                       # shelve tracked changes; working dir clean
git stash -u                    # also stash UNtracked files
git stash push -m "wip search"  # named stash
git stash list                  # see the stack: stash@{0}, stash@{1}, ...
git stash pop                   # re-apply the latest and remove it from the stack
git stash apply stash@{1}       # re-apply a specific stash, keep it in the stack
git stash drop stash@{0}        # delete a stash
```

Use it for quick context switches. For anything you'll keep more than briefly, prefer a
**commit on a branch** — stashes are easy to forget and aren't shared.

## Part 2 — Cherry-pick: copy one commit

`cherry-pick` applies a **specific commit** onto your current branch (a new commit with the
same changes). Great for backporting a fix to a release branch, or grabbing one commit
without merging a whole branch:

```bash
git switch release-1.x
git cherry-pick a1b2c3d         # apply that commit here (new hash, same diff)
git cherry-pick a1b2c3d^..f4e5d6  # a range of commits
git cherry-pick --continue      # after resolving conflicts (or --abort)
```

Use sparingly — over-cherry-picking duplicates commits across branches and muddies history.
The common legit case is **backporting** a bug fix from `main` to a maintenance branch.

## Part 3 — Tags and releases

A **tag** marks a specific commit — typically a release version. Prefer **annotated** tags
(they store author/date/message and can be signed):

```bash
git tag -a v1.2.0 -m "Release 1.2.0"   # annotated (recommended)
git tag v1.2.0                          # lightweight (just a pointer)
git tag                                 # list tags
git show v1.2.0                         # see what it points to
git push origin v1.2.0                  # tags are NOT pushed by default!
git push origin --tags                  # push all tags
```

Tags usually follow **Semantic Versioning** `MAJOR.MINOR.PATCH` (e.g. `2.4.1`): bump
**MAJOR** for breaking changes, **MINOR** for new backward-compatible features, **PATCH**
for fixes. Platforms turn tags into **Releases** (with notes/artifacts).

> [!TIP]
> Use **annotated** tags for releases (`-a`) so the version carries a message/date/author,
> and remember **tags don't push automatically** — `git push origin <tag>` or `--tags`.
> Follow **SemVer** so consumers can reason about upgrades at a glance: a PATCH is safe, a
> MAJOR means "read the changelog before upgrading."

## Part 4 — Bisect: binary-search for the bad commit

A bug appeared "sometime in the last 200 commits." **`git bisect`** finds the exact
offending commit in ~log₂(n) steps by binary search:

```bash
git bisect start
git bisect bad                  # current commit is broken
git bisect good v1.1.0          # this old tag/commit was fine
# Git checks out a commit halfway between — you test it, then:
git bisect good                 # ...if this one works
git bisect bad                  # ...or if it's broken
# repeat ~8 times for 200 commits -> Git names the FIRST bad commit
git bisect reset                # return to where you started

# Automate it with a test script (exit 0 = good, non-zero = bad):
git bisect start HEAD v1.1.0
git bisect run ./test.sh        # Git runs it at each step automatically
```

Bisect is the fastest way to pin a regression to a single commit — turning "when did this
break?" from hours of guessing into a few automated tests.

> [!IMPORTANT]
> When a regression's cause is unclear, **don't read 200 diffs — bisect**. Mark a known-bad
> and known-good commit and Git binary-searches to the **exact** commit that introduced the
> bug in ~log₂(n) tests. With `git bisect run <script>` it's fully automated. This is one of
> Git's most powerful and underused features — and a strong argument for **small commits**,
> which make the culprit's diff tiny and obvious.

## Part 5 — blame, worktree, hooks, submodules

```bash
# Who last changed each line, and in which commit (for understanding, not blaming)
git blame app.py
git log -L 10,20:app.py         # history of specific lines

# Multiple working directories from one repo (work on two branches at once)
git worktree add ../hotfix main   # check out main in a sibling dir, no re-clone
git worktree list

# Hooks: scripts Git runs on events (pre-commit lint, commit-msg checks, pre-push tests)
ls .git/hooks/                  # samples; tools like pre-commit/husky manage these

# Submodules: a Git repo nested inside another at a pinned commit
git submodule add https://github.com/acme/lib vendor/lib
git submodule update --init --recursive   # after cloning a repo that has submodules
```

- **blame** — find which commit/author last touched a line (for *context*, e.g. to read the
  PR that explains it).
- **worktree** — check out multiple branches simultaneously in separate folders without
  cloning again.
- **hooks** — automate checks (lint, format, tests, message rules) at commit/push time;
  managed by frameworks like `pre-commit` or Husky.
- **submodules** — embed another repo at a fixed commit (powerful but fiddly; many teams
  prefer package managers/monorepos).

## Hands-on lab

```bash
mkdir toolkit-lab && cd toolkit-lab && git init
for i in 1 2 3 4 5; do echo "line $i" >> f.txt; git add f.txt; git commit -m "Add line $i"; done

# 1. Stash a WIP, switch context, come back
echo "wip" >> f.txt
git stash push -m "wip change"
git stash list
git stash pop                    # WIP restored
git checkout -- f.txt 2>/dev/null; git restore f.txt   # clean up the wip line

# 2. Tag a release (annotated) and inspect
git tag -a v1.0.0 -m "First release"
git show v1.0.0 | head

# 3. Cherry-pick: copy commit "Add line 3" onto a new branch
HASH=$(git log --oneline | grep 'Add line 3' | cut -d' ' -f1)
git switch -c backport
git reset --hard HEAD~3          # pretend this branch is older
git cherry-pick "$HASH"          # bring just that one change over
git log --oneline

# 4. Bisect a planted bug
git switch -c bugfix master 2>/dev/null || git switch main
echo "GOOD" > status.txt && git add status.txt && git commit -m "good baseline"
for i in 1 2 3; do echo "c$i" >> log.txt; git add log.txt; git commit -m "change $i"; done
echo "BUG" > status.txt && git commit -am "oops introduce bug"
for i in 4 5; do echo "c$i" >> log.txt; git add log.txt; git commit -m "change $i"; done
git bisect start HEAD HEAD~6
git bisect run sh -c 'grep -q GOOD status.txt'   # good while status says GOOD
git bisect reset

# 5. blame
git blame f.txt | head
```

## Exercises

1. Stash work (including untracked files), switch branches, and restore it; explain when to
   stash vs commit.
2. Cherry-pick a single commit onto another branch and describe a real backporting scenario.
3. Create an annotated tag, push it correctly, and explain SemVer with an example bump.
4. Use `git bisect` (manual or `run`) to find a planted bad commit; report how many steps it
   took.
5. Use `git blame`/`git log -L` to find the commit that introduced a specific line, then read
   its message.
6. Explain what hooks and submodules are for, and one caution about each.

## Troubleshooting

- **Lost a stash** — forgot to pop, or dropped it. *Fix:* `git stash list`; recover via
  `git fsf`/reflog if dropped recently. Prefer commits for anything non-trivial.
- **Cherry-pick conflict** — *Fix:* resolve, `git cherry-pick --continue` (or `--abort`).
- **Duplicate commits across branches** — over-cherry-picking. *Fix:* merge/rebase instead
  where appropriate; cherry-pick only specific backports.
- **Tag not on the remote** — tags don't auto-push. *Fix:* `git push origin <tag>` / `--tags`.
- **Bisect gives wrong result** — flaky/ambiguous test or wrong good/bad. *Fix:* a
  deterministic `bisect run` script; double-check the known-good commit.
- **Submodule "empty" after clone** — not initialized. *Fix:* `git submodule update --init
  --recursive`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does `git stash` do, and when prefer a commit instead?
2. What does `cherry-pick` do, and a legitimate use case?
3. Annotated vs lightweight tags — which for releases and why?
4. Do tags push automatically? How do you push them?
5. Explain SemVer MAJOR.MINOR.PATCH with an example.
6. What problem does `git bisect` solve, and roughly how many steps for 1000 commits?
7. How does `git bisect run` automate the search?
8. What is `git blame` for (and not for)?
9. **Practical:** find a planted bad commit with bisect.
10. **Practical:** create and push an annotated release tag.

## Solutions & validation

1. Shelves uncommitted changes for a clean working dir; prefer a **commit on a branch** for
   anything kept more than briefly.
2. Applies a **specific commit** onto the current branch; e.g. **backporting** a fix to a
   release branch.
3. **Annotated** (`-a`) — stores author/date/message, can be signed.
4. No; `git push origin <tag>` or `git push origin --tags`.
5. Breaking → MAJOR, new compatible feature → MINOR, fix → PATCH (e.g. 1.4.2 → 1.5.0 for a
   feature).
6. Finds the exact commit that introduced a bug via binary search; ~**10** steps for 1000
   (log₂).
7. Runs a script at each step; exit 0 = good, non-zero = bad — fully automatic.
8. Seeing who/which commit last changed each line (for **context**), not assigning fault.
9. **Validation:** `git bisect run` names the first bad commit (see lab).
10. **Validation:** `git tag -a v1.0.0 -m ...` then `git push origin v1.0.0`.

> [!TIP]
> Keep these in your back pocket: **stash** for quick context switches, **cherry-pick** for
> surgical backports, **annotated tags + SemVer** for releases, and **bisect** to nail
> regressions in minutes. They're not everyday commands like `commit`, but each one turns a
> recurring headache into a one-liner — and bisect especially rewards the **small-commit**
> habit you've practiced all track.

## What's next

Next: **Lesson 1008 — Git Best Practices & Pro Configuration.** Tie the track together:
repository hygiene (`.gitignore`/`.gitattributes`), keeping secrets out of history (and
purging them if they slip in), useful global config and aliases, commit conventions, and a
pre-push checklist — the habits that keep repositories clean, secure, and pleasant for
everyone.
