==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 9.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 10: Git & Version Control (Your Gateway to DevOps)

URL SLUG:
linux-to-devops-day-10-git-version-control

SUMMARY:
Day 10 of the Linux-to-DevOps roadmap and the bridge into the "Dev" half of
DevOps. Learn Git from scratch: init, status, add, commit, log, branches, merges,
.gitignore, and pushing to GitHub over SSH. Understand the workflow that powers
collaboration, infrastructure-as-code and every CI/CD pipeline. About one hour,
hands-on, with other-distro and Windows notes.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, git, version-control, github, branches, merge, cicd, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
Ubuntu

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-10.svg

SEO TITLE:
Linux to DevOps — Day 10: Git & GitHub for Beginners (Version Control)

SEO DESCRIPTION:
Day 10 of the Linux-to-DevOps roadmap: learn Git from scratch — commit, branch,
merge, .gitignore — and push to GitHub over SSH. The gateway to CI/CD. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 10** of the **Linux to DevOps Roadmap** — a milestone. Days 1–9
made you capable on a Linux server: files, permissions, services, networking,
security, scripting and automation. Today you cross the bridge into the **"Dev"**
half of DevOps with the single most important collaboration tool in software:
**Git**. Git tracks every change to your files, lets you experiment safely on
**branches**, and — pushed to **GitHub** — is the foundation of teamwork,
infrastructure-as-code, and every **CI/CD pipeline** you'll build from here.

By the end of the hour you'll have a real repository with a history of commits and
a branch you merged — and it'll be live on GitHub, reachable over the SSH keys you
made on Day 6.

> [!NOTE]
> About an hour with the lab. Works entirely on your practice machine; the GitHub
> part needs a free github.com account. We'll reuse your Day 6 SSH key to push
> securely. Keep your work in `~/devops-lab`.

## Today's mission

- Understand what **version control** is and why Git changed software forever.
- Configure Git and create your first **repository**.
- Master the core loop: **status → add → commit**, and read the **log**.
- Use **branches** to work safely, then **merge** them.
- Ignore noise with **`.gitignore`**.
- Connect to **GitHub** over SSH and **push** your work.

## Part 1 — Why version control?

Without version control you get folders called `site-final`, `site-final-v2`,
`site-really-final`, and no idea what changed between them or how to undo a
mistake. **Git** solves this completely. It records **snapshots** (commits) of your
project over time, so you can:

- See **exactly what changed**, when, and why — for every file, forever.
- **Undo** to any previous state with confidence.
- **Branch** off to try an idea without touching the working version.
- **Collaborate** — many people editing the same project without overwriting each
  other.

Git is **distributed**: every clone is a full copy of the entire history. GitHub
(and GitLab, etc.) are *hosting* for Git repositories that add collaboration,
issues, and — crucially for DevOps — automation triggers. Git is the engine;
GitHub is a place to share it. This whole site, `botera.md`, lives in Git.

## Part 2 — Install and configure Git

```bash
sudo apt update && sudo apt install -y git
git --version
```

Tell Git who you are (it stamps every commit with this — do it once per machine):

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main      # use 'main' as the default branch
git config --global core.editor nano             # editor for commit messages
git config --list                                # review your settings
```

## Part 3 — Your first repository

A **repository** ("repo") is a project folder Git is tracking. Create one:

```bash
mkdir ~/devops-lab/myproject && cd ~/devops-lab/myproject
git init                         # creates a hidden .git/ folder — now it's tracked
```

Make a file and check the repo's state — **`git status`** is the command you'll run
more than any other:

```bash
echo "# My Project" > README.md
git status
# -> README.md shows as "Untracked"
```

Git has **three areas**, and understanding them is the key to Git "clicking":

1. **Working directory** — your actual files as you edit them.
2. **Staging area** (the "index") — changes you've marked to go into the next
   commit.
3. **Repository** — the permanent history of committed snapshots.

You move changes **working → staging** with `add`, then **staging → repository**
with `commit`:

```bash
git add README.md          # stage the file (working -> staging)
git status                 # now "Changes to be committed"
git commit -m "Add project README"   # snapshot it (staging -> repository)
```

> [!TIP]
> Think of **staging** as packing a box (`git add`) before you ship it
> (`git commit`). It lets you commit *exactly* the related changes together,
> leaving other edits for a separate, cleaner commit. `git add .` stages
> everything at once when that's what you want.

## Part 4 — The everyday loop and history

The daily rhythm of Git is short and you'll repeat it forever:

```bash
# 1. edit files ...
nano README.md
echo "console.log('hi')" > app.js

# 2. see what changed
git status                 # which files changed
git diff                   # the exact line-by-line changes (not yet staged)

# 3. stage and commit
git add .
git commit -m "Add app.js and expand the README"
```

Read your history with **`git log`**:

```bash
git log                          # full history
git log --oneline                # one line per commit — the everyday view
git log --oneline --graph --all  # a visual graph of commits and branches
git show HEAD                    # the most recent commit in full detail
```

> [!IMPORTANT]
> **Write commit messages for your future self.** A good message says *why*, not
> just *what*: "Fix login crash when email is empty" beats "fix bug" or "update".
> Six months from now, a clear history is the difference between understanding
> your project and archaeology. Convention: a short summary line (~50 chars), in
> the imperative ("Add", "Fix", "Remove").

## Part 5 — Branches: work without fear

A **branch** is an independent line of work. You make a branch to build a feature
or try an idea; if it works you **merge** it back, if it doesn't you just delete
it — your main code was never touched. This is Git's superpower.

```bash
git branch                         # list branches (* marks the current one)
git switch -c new-feature          # create AND switch to a new branch
# ... edit files, add, commit on this branch ...
echo "feature stuff" > feature.txt
git add feature.txt
git commit -m "Add feature.txt"

git switch main                    # go back to main — feature.txt isn't here!
git merge new-feature              # bring the feature's commits into main
git branch -d new-feature          # delete the branch once merged
```

(`git switch` is the modern command; you'll also see the older `git checkout -b
new-feature` / `git checkout main`, which do the same thing.)

> [!TIP]
> The professional workflow is "**a branch per change**": never build directly on
> `main`. You branch, commit your work, open a **pull request** on GitHub for
> review, and merge when it's approved and tests pass. It keeps `main` always
> working — the foundation that CI/CD (your next steps) builds on.

Sometimes a merge has a **conflict** (two branches changed the same lines). Git
marks the spot in the file with `<<<<<<<`, `=======`, `>>>>>>>`; you edit it to the
version you want, remove the markers, then `git add` and `git commit`. Conflicts
feel scary once, then become routine.

## Part 6 — .gitignore

Not everything belongs in version control: secrets, logs, build output, huge
dependency folders. A **`.gitignore`** file tells Git what to leave alone:

```bash
nano .gitignore
```

```text
# dependencies
node_modules/

# logs and temp files
*.log
*.tmp

# secrets — NEVER commit these
.env
*.key
*.pem

# OS noise
.DS_Store
```

```bash
git add .gitignore
git commit -m "Add .gitignore"
```

> [!IMPORTANT]
> **Never commit secrets** — passwords, API keys, `.env` files, private SSH keys.
> Once something is committed and pushed, assume it's permanent and exposed (it
> lives in history even after you delete the file). Add secrets to `.gitignore`
> *before* your first commit. This is one of the most common and most damaging
> beginner mistakes in all of DevOps — and Day 7's security mindset applies
> directly here.

## Part 7 — Push to GitHub over SSH

Now share your repo. On **github.com**: create a free account, then create a **new,
empty repository** (no README — you already have one).

Authenticate with the **SSH key from Day 6** (no passwords): copy your public key
and add it to GitHub under **Settings → SSH and GPG keys**:

```bash
cat ~/.ssh/id_ed25519.pub          # copy this; paste into GitHub
ssh -T git@github.com              # test — GitHub greets you by username
```

Connect your local repo to GitHub (the "remote") and push:

```bash
git remote add origin git@github.com:YOURNAME/myproject.git
git branch -M main                 # ensure the branch is called main
git push -u origin main            # upload; -u remembers the link for next time
```

Refresh the GitHub page — your code, commit history and all, is now online. From
now on the loop adds one step:

```bash
git add .
git commit -m "Describe the change"
git push                           # send commits to GitHub
git pull                           # bring down others' commits before you start
```

`clone` grabs an existing repo onto a new machine — exactly how you got this very
project onto your server:

```bash
git clone git@github.com:YOURNAME/myproject.git
```

## Hands-on lab: a full Git workflow

```bash
# 1. New repo
mkdir ~/devops-lab/git-lab && cd ~/devops-lab/git-lab
git init

# 2. First commit
echo "# Git Lab" > README.md
git add README.md
git commit -m "Initial commit with README"

# 3. Add a .gitignore and a script, commit them together
printf '*.log\n.env\n' > .gitignore
cp ~/devops-lab/backup.sh ./backup.sh 2>/dev/null || echo 'echo backup' > backup.sh
git add .
git commit -m "Add backup script and .gitignore"

# 4. Branch, change, commit
git switch -c add-docs
echo "## Usage" >> README.md
git add README.md
git commit -m "Document usage in README"

# 5. Merge the branch back into main
git switch main
git merge add-docs
git branch -d add-docs

# 6. Review the story you just wrote
git log --oneline --graph --all

# 7. (Optional) Push to GitHub
#   - create an empty repo on github.com, add your SSH key, then:
git remote add origin git@github.com:YOURNAME/git-lab.git
git push -u origin main
```

If `git log --oneline --graph` shows your commits and the merged branch, and (if
you pushed) GitHub shows the same history — you've completed a full professional
Git cycle: **commit → branch → merge → push**. That loop is the backbone of every
software team on earth.

## For Windows people

Git is identical on Windows — install **Git for Windows** (which includes **Git
Bash**, giving you a real Bash shell too):

```powershell
winget install Git.Git              # or download from git-scm.com
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
# All git commands are exactly the same. SSH keys live in C:\Users\you\.ssh\
```

> [!NOTE]
> Git is **the** truly cross-platform DevOps tool — the commands don't change
> between Linux, macOS and Windows. Many Windows developers run **Git Bash** or
> **WSL** specifically so their workflow matches the Linux servers they deploy to.
> Whatever you learned here transfers everywhere, unchanged.

## Common mistakes to avoid

- **Committing secrets** — add `.env`, keys and tokens to `.gitignore` *before*
  the first commit; history is forever.
- **Giant, vague commits** — commit small, related changes with clear messages,
  not "stuff" every few days.
- **Working directly on `main`** — branch for each change; keep `main` always
  working.
- **Forgetting to `git pull`** — pull before you start so you build on others'
  latest work and avoid conflicts.
- **Confusing `add` and `commit`** — `add` stages, `commit` records. `git status`
  always tells you where things stand.
- **Committing `node_modules/` or build output** — ignore it; it's huge and
  regenerable.

## Recap — what you learned today

- **Git** records snapshots (commits) of your project, with full history and undo.
- The core loop: **`status` → `add` (stage) → `commit` (record)**; read it with
  **`log`**.
- **Branches** let you work safely; **`merge`** brings work back into `main`.
- **`.gitignore`** keeps secrets and noise out of the repo.
- **GitHub** hosts repos; push/pull over **SSH** (your Day 6 key) to collaborate.

## Homework (20–30 minutes)

1. Create a repo for one of your Day 8 scripts; make at least four meaningful
   commits as you improve it.
2. Add a `.gitignore` that excludes `*.log` and `.env`; prove an ignored file
   doesn't show in `git status`.
3. Create a branch, make two commits, merge it into `main`, and delete the branch.
4. Deliberately create a merge conflict (edit the same line on two branches),
   then resolve it.
5. Add your SSH key to GitHub and push a repo; confirm the history appears online.
6. Practise `git log --oneline --graph --all` until reading history feels natural.

## Common questions

**Git vs GitHub — what's the difference?**
**Git** is the version-control tool that runs on your machine. **GitHub** is a
website that hosts Git repositories and adds collaboration (pull requests, issues)
and automation. You can use Git with no GitHub at all; GitHub without Git makes no
sense.

**HTTPS or SSH for GitHub?**
**SSH** with the key you already have (Day 6) is clean and password-free — that's
what we used. HTTPS works too but needs a personal access token instead of a
password. For DevOps work, SSH is the common choice.

**What's a pull request?**
A request to merge your branch into another (usually `main`), with a place to
review the changes and run automated checks before merging. It's the heart of team
workflows and where CI/CD hooks in — your next topics.

**I made a mess — can I undo?**
Almost always. `git restore <file>` discards un-staged edits; `git revert <commit>`
safely undoes a commit by adding a new one; `git reset` moves your branch pointer.
Git is a safety net — learning these turns "I broke it" into "I'll just undo it".

## What's next — the journey continues

You've completed the **first ten days** of the roadmap — from your very first
command to a secure, automated, version-controlled server. That's a genuine
operations-plus-Git foundation that most working engineers rely on daily.

From here the **DevOps** half opens up: **Docker** and containers, **CI/CD
pipelines** (GitHub Actions building on today's Git), **reverse proxies & TLS**,
**infrastructure-as-code** (Terraform/Ansible), and **monitoring**. Each one
builds directly on the ten days you've just done.

Phenomenal achievement — take a moment to look back at Day 1 and see how far you've
come. Push one real project to GitHub today to celebrate, and keep the streak
going.
