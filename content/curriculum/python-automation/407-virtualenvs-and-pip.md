---
title: "Python for Automation — Virtual Environments & pip"
slug: "python-virtualenvs-and-pip"
track: "python-automation"
trackName: "Python for Automation"
module: "Shipping Python Tools"
order: 407
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, pip, venv, virtualenv, dependencies, intermediate]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 45
status: "published"
summary: "Manage dependencies the right way. Create isolated virtual environments with venv, install packages with pip, pin versions in requirements.txt for reproducible setups, and understand why you must never sudo pip install into the system Python."
seoTitle: "Python for Automation 7: venv, pip & requirements.txt"
seoDescription: "Intermediate Python: create virtual environments with venv, install/freeze packages with pip, pin requirements.txt, and why never to sudo pip install system-wide. Lab + assessment."
---

The moment your script needs a package like `requests`, you face a real question:
where does it get installed? Get this wrong (`sudo pip install` into the system
Python) and you can **break your operating system's own tools**. This short but
essential lesson teaches the professional way: isolated **virtual environments**,
**pip** for package management, and **`requirements.txt`** for reproducible setups —
so every project gets exactly the dependencies it needs without conflicts.

## Learning objectives

By the end of this lesson you will be able to:

- Explain why dependency **isolation** matters.
- Create and activate a **virtual environment** with `venv`.
- Install, list and remove packages with **pip**.
- Pin dependencies in **`requirements.txt`** and reproduce them.
- Avoid the `sudo pip install` trap.

## Part 1 — Why virtual environments

Different projects need different package versions; the **system Python** is used by
your OS (package managers, system tools) and must not be disturbed. A **virtual
environment** ("venv") is an isolated, per-project Python with its own packages:

- **No conflicts** — project A can use `requests 2.25` while project B uses `2.31`.
- **No root needed** — install into the venv, not the system.
- **Reproducible** — list the exact versions and recreate them anywhere.
- **Safe** — you can delete a venv and the system Python is untouched.

> [!IMPORTANT]
> **Never `sudo pip install` into the system Python.** It mixes your packages with
> ones the OS manages, and a version bump can **break system tools** (on some distros
> it's even blocked with an "externally-managed-environment" error for this reason).
> The rule: **one virtual environment per project**, and `pip install` only inside an
> activated venv. If you ever typed `sudo pip`, stop — that's the habit this lesson
> replaces.

## Part 2 — Create and activate a venv

`venv` is built into Python 3:

```bash
cd ~/myproject
python3 -m venv .venv           # create a venv in the .venv directory
source .venv/bin/activate       # activate it (Linux/macOS)
# Windows: .venv\Scripts\activate

# Your prompt now shows (.venv); python/pip point INTO the venv:
which python                    # .../.venv/bin/python
python --version
pip --version                   # the venv's pip

deactivate                      # leave the venv when done
```

Once activated, plain **`python`** and **`pip`** refer to the venv — no `python3`/
`pip3` juggling, no `sudo`. Add `.venv/` to your `.gitignore` (you commit the
*requirements*, not the installed packages).

## Part 3 — pip: installing packages

```bash
# (inside an activated venv)
pip install requests                 # install the latest
pip install "requests==2.31.0"       # a specific version
pip install "requests>=2.28,<3.0"    # a version range
pip install requests rich click      # several at once

pip list                             # what's installed
pip show requests                    # details: version, location, dependencies
pip install --upgrade requests       # upgrade
pip uninstall requests               # remove
```

Packages come from **PyPI** (the Python Package Index, pypi.org), the equivalent of
apt/npm for Python. `pip` resolves and installs dependencies automatically.

## Part 4 — requirements.txt: reproducible installs

To recreate the same environment elsewhere (a teammate's machine, a server, CI),
**pin** your dependencies:

```bash
pip freeze > requirements.txt        # record EXACT installed versions
cat requirements.txt
# requests==2.31.0
# certifi==2024.2.2
# ...
```

Then anyone can reproduce it:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt      # install everything, pinned
```

> [!TIP]
> Commit **`requirements.txt`** (not the `.venv/` folder) to Git. Pinned versions
> (`==`) make installs **reproducible** — the same code + the same requirements = the
> same behavior everywhere, which is exactly what you want for a tool you'll run on
> servers or in CI. For apps you maintain, a hand-written `requirements.in` of
> top-level deps compiled to a pinned `requirements.txt` (via `pip-tools`) is the
> next step up.

## Part 5 — Running tools and a note on pipx

To run a venv's script without activating, call its python/binaries directly (useful
in cron/systemd):

```bash
~/myproject/.venv/bin/python myscript.py        # explicit interpreter, no activation
~/myproject/.venv/bin/pip list
```

For **command-line tools** you want available globally (like `httpie`, `black`,
`ansible`), **`pipx`** installs each into its own isolated venv and puts the command
on your PATH — the clean way to install Python *applications* without polluting
anything:

```bash
sudo apt install -y pipx     # or python3 -m pip install --user pipx
pipx install httpie
http --version               # available globally, isolated under the hood
```

> [!TIP]
> Mental model: **`venv` + `requirements.txt`** for *projects you're developing*;
> **`pipx`** for *Python CLI applications you just want to use*. Both keep
> dependencies isolated. Neither needs `sudo pip`. In cron/systemd, reference the
> venv's interpreter by absolute path so the job uses the right packages.

## Hands-on lab

```bash
mkdir -p ~/venv-lab && cd ~/venv-lab

# 1. Create and activate a venv
python3 -m venv .venv
source .venv/bin/activate
which python; python --version

# 2. Install a package and use it
pip install requests
python -c "import requests; print('requests', requests.__version__)"

# 3. Freeze and inspect requirements
pip freeze > requirements.txt
echo "--- requirements.txt ---"; cat requirements.txt | head

# 4. Prove isolation: recreate from requirements in a fresh venv
deactivate
python3 -m venv .venv2 && source .venv2/bin/activate
pip install -r requirements.txt >/dev/null
python -c "import requests; print('recreated:', requests.__version__)"
deactivate

# 5. Run a venv script WITHOUT activating (cron/systemd pattern)
echo 'import requests; print("from explicit interpreter:", requests.__version__)' > use.py
~/venv-lab/.venv/bin/python use.py

# 6. Clean up
cd ~ && rm -r ~/venv-lab
```

## Exercises

1. Create a virtual environment in a new project directory, activate it, and confirm
   `which python` points inside it.
2. Install `requests` (and one other package) into the venv and list what's
   installed with `pip list`.
3. Freeze the environment to `requirements.txt`, then deactivate and recreate the
   exact environment in a fresh venv from that file.
4. Run a script that imports `requests` using the venv's interpreter **by absolute
   path**, without activating.
5. Explain, in two sentences, why `sudo pip install` is dangerous and what you do
   instead.

## Troubleshooting

- **`pip install` says "externally-managed-environment" / permission denied** —
  you're installing into the system Python. *Fix:* create and activate a **venv**
  first.
- **`ModuleNotFoundError` after installing** — you installed in a different venv, or
  aren't activated. *Fix:* activate the right venv; check `which python`/`pip list`.
- **Cron/systemd job can't find a package** — it used the system Python. *Fix:*
  call the **venv's interpreter** by absolute path in the job.
- **`pip: command not found` in the venv** — venv created without pip, or wrong
  shell. *Fix:* recreate with `python3 -m venv`; activate; use `python -m pip`.
- **Teammate "it doesn't work on my machine"** — unpinned/missing deps. *Fix:*
  commit `requirements.txt`; they `pip install -r requirements.txt`.

Reproduce the isolation idea: install a package in one venv, deactivate, start a
second venv — the package isn't there until you install it (or `pip install -r`),
proving environments are independent.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What problem do virtual environments solve?
2. How do you create and activate a venv?
3. After activation, what do `python` and `pip` refer to?
4. How do you install a specific package version with pip?
5. Where do pip packages come from?
6. How do you record and reproduce an environment's exact dependencies?
7. Should you commit the `.venv/` folder or `requirements.txt`?
8. Why never `sudo pip install` into the system Python?
9. **Practical:** create a venv, install `requests`, and freeze requirements.
10. **Practical:** run a script with the venv's interpreter without activating.

## Solutions & validation

1. **Per-project dependency isolation** — no version conflicts, no root, reproducible,
   and the system Python stays safe.
2. `python3 -m venv .venv` then `source .venv/bin/activate`.
3. The **venv's** Python and pip (installs go into the venv, no `sudo`).
4. `pip install "package==X.Y.Z"`.
5. **PyPI** (the Python Package Index).
6. `pip freeze > requirements.txt`; reproduce with `pip install -r requirements.txt`
   in a fresh venv.
7. Commit **`requirements.txt`**; ignore `.venv/`.
8. It mixes with OS-managed packages and can **break system tools** (and is often
   blocked); use a venv instead.
9. **Validation:** `python3 -m venv .venv && source .venv/bin/activate && pip install
   requests && pip freeze > requirements.txt`.
10. **Validation:** `./.venv/bin/python script.py` (absolute interpreter path).

> [!TIP]
> One venv per project, `pip` only inside it, `requirements.txt` in Git, and the
> venv's interpreter by path in cron/systemd. That handful of habits eliminates
> "works on my machine" and keeps your OS's Python pristine.

## What's next

Next: **Lesson 408 — Robust CLI Tools.** The capstone: combine everything into a
real command-line tool with `argparse` for options and help, the `logging` module
for proper output, structured error handling and exit codes, and a clean project
layout — turning your scripts into tools teammates can run and trust.
