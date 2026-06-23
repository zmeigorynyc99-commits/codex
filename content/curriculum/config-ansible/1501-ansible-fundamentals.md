---
title: "Ansible — Fundamentals & Agentless Automation"
slug: "ansible-fundamentals-and-agentless-automation"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible Foundations"
order: 1501
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, configuration-management, agentless, idempotency, modules, ssh]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 55
status: "published"
summary: "Why configuration management, and how Ansible works: provisioning vs configuration, the agentless push model over SSH, idempotent modules, the control node and inventory, declarative-feeling tasks, and your first ad-hoc commands against managed hosts."
seoTitle: "Ansible 1: Fundamentals & Agentless Automation (modules, idempotency)"
seoDescription: "Intro to Ansible: configuration management vs provisioning, agentless SSH push model, idempotent modules, inventory, and ad-hoc commands. Hands-on lab and assessment."
---

Terraform **provisions** machines; **Ansible configures** what runs on them — installing
packages, writing config files, managing services, deploying apps. **Configuration management**
ensures every server reaches and stays in a known, consistent state, defined as code. Ansible
is the most popular tool because it's **agentless** (it just needs SSH and Python — nothing to
install on targets), **idempotent** (safe to re-run), and readable (YAML). This lesson covers
the configuration-management model, Ansible's **push-over-SSH** architecture, **modules and
idempotency**, **inventory**, and your first **ad-hoc commands**.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **provisioning** from **configuration management** and where Ansible fits.
- Explain Ansible's **agentless, push-based** architecture.
- Describe **modules** and why Ansible tasks are **idempotent**.
- Define hosts in an **inventory** and group them.
- Run **ad-hoc commands** against managed hosts.

## Part 1 — Configuration management and Ansible's place

```text
PROVISION (Terraform)         CONFIGURE (Ansible)               ORCHESTRATE (Kubernetes)
"create 5 VMs + network"  →   "install nginx, write config,  →  (for containerized apps)
                               start the service on them"
```

**Configuration management** answers: *given a machine exists, how do I get it into the exact
state I want — and keep it there — reproducibly across hundreds of machines?* The old way
(manual SSH + commands, or brittle shell scripts) doesn't scale and drifts. Ansible defines the
desired state **as code** (YAML), applies it to many hosts at once, and is **idempotent** so
re-running converges rather than breaking.

It complements the rest of your toolchain: Terraform builds the servers, Ansible configures
them, CI/CD ties it together.

## Part 2 — Agentless, push-based architecture

Ansible's defining design choice: **no agent** on managed hosts. It runs from a **control
node** and **pushes** configuration over **SSH** (Linux) or WinRM (Windows):

```text
   CONTROL NODE (your laptop/CI: has Ansible)
        │ SSH + Python  (no agent installed on targets!)
        ├──► web01   (managed node)
        ├──► web02
        └──► db01
```

- **Agentless** — nothing to install, secure, or upgrade on hundreds of targets; you just need
  **SSH access + Python** on them (both standard on Linux).
- **Push model** — the control node initiates; you run a command and it configures the targets
  *now* (vs pull-based agents like Puppet that poll).
- Ansible copies small **modules** to each host, runs them, and removes them — using the
  credentials/SSH keys you already have.

> [!IMPORTANT]
> Ansible being **agentless** is its biggest practical advantage: there's no software to deploy
> or maintain on managed nodes, no agent to secure or keep in sync — just **SSH + Python**,
> which servers already have. This makes adoption trivial (point it at existing hosts) and
> keeps the attack surface small. The flip side of the **push** model: configuration applies
> when *you run* Ansible (from a control node/CI), not continuously — so you schedule runs or
> trigger them in a pipeline.

## Part 3 — Modules and idempotency

Ansible does work through **modules** — small units like `apt`, `copy`, `service`, `user`,
`template`. Crucially, well-written modules are **idempotent**: they describe **desired state**
and only change what's needed:

```text
   ansible web -m apt -a "name=nginx state=present"
   - nginx NOT installed → installs it        → "changed"
   - nginx ALREADY installed → does nothing    → "ok" (no change)
   run it 10 times → same result, changed only the first time
```

This is the heart of Ansible: you say `state=present` / `state=started`, not "run apt-get
install" — so re-running is **safe** and **convergent**. Compare a raw shell script that would
re-run commands and possibly error or duplicate. (The `command`/`shell` modules are **not**
idempotent — they just run things — so prefer purpose-built modules.)

> [!TIP]
> **Prefer specific modules (`apt`, `copy`, `service`, `user`) over `shell`/`command`.** The
> dedicated modules are **idempotent** — they check current state and only act if needed, so
> re-runs are safe and report accurate "changed/ok" status. `shell`/`command` run blindly every
> time (not idempotent) and should be a last resort, ideally guarded with `creates`/`when`
> conditions. Idempotency is what lets you run a playbook repeatedly with confidence.

## Part 4 — Inventory

The **inventory** lists the hosts Ansible manages, organized into **groups**:

```ini
# inventory.ini
[web]
web01 ansible_host=10.0.0.11
web02 ansible_host=10.0.0.12

[db]
db01 ansible_host=10.0.0.21

[production:children]    # a group of groups
web
db

[web:vars]
ansible_user=deploy      # connection variables for the group
```

```yaml
# inventory.yaml (YAML form)
all:
  children:
    web:
      hosts: { web01: {}, web02: {} }
    db:
      hosts: { db01: {} }
```

Groups let you target sets of hosts (`web`, `db`, `production`). Inventory can also be
**dynamic** — generated from a cloud provider/Terraform output so it always reflects reality
(common in real setups). Special group `all` = every host.

## Part 5 — Ad-hoc commands

For quick, one-off tasks, **ad-hoc commands** run a single module against hosts without writing
a playbook:

```bash
# ansible <pattern> -i <inventory> -m <module> -a "<args>"
ansible all -i inventory.ini -m ping                      # connectivity check (ping module)
ansible web -i inventory.ini -m apt -a "name=nginx state=present" --become   # install (as root)
ansible web -i inventory.ini -m service -a "name=nginx state=started" --become
ansible all -i inventory.ini -m command -a "uptime"       # run a command everywhere
ansible db  -i inventory.ini -m copy -a "src=my.cnf dest=/etc/mysql/my.cnf" --become
```

- **`-m`** = module, **`-a`** = arguments, the first word = **host pattern** (group/host/`all`).
- **`--become`** = privilege escalation (run as root via sudo) — needed for system changes.
- Ad-hoc is great for quick checks/fixes (`ping`, `uptime`, restart a service across the fleet);
  for anything repeatable, use a **playbook** (next lesson).

## Hands-on lab

```bash
# Run Ansible against LOCALHOST (and optionally containers) — no fleet needed.
pip install ansible -q || sudo apt install -y ansible

# 1. Minimal inventory targeting localhost via the local connection
cat > inventory.ini <<'EOF'
[local]
localhost ansible_connection=local
EOF

# 2. Ad-hoc: ping, gather a fact, run a command
ansible local -i inventory.ini -m ping                        # "pong"
ansible local -i inventory.ini -m command -a "uptime"
ansible local -i inventory.ini -m setup -a "filter=ansible_distribution*"   # facts

# 3. Idempotency demo with the 'file' module (create a dir; re-run = no change)
ansible local -i inventory.ini -m file -a "path=/tmp/ansible-demo state=directory"
#   -> "changed": true   (first time)
ansible local -i inventory.ini -m file -a "path=/tmp/ansible-demo state=directory"
#   -> "changed": false  (already exists — IDEMPOTENT)

# 4. copy a file (declarative content), then prove re-run is idempotent
ansible local -i inventory.ini -m copy -a "content='hello\n' dest=/tmp/ansible-demo/hello.txt"
ansible local -i inventory.ini -m copy -a "content='hello\n' dest=/tmp/ansible-demo/hello.txt"  # ok, no change
cat /tmp/ansible-demo/hello.txt

# 5. Contrast: 'command' is NOT idempotent (always "changed")
ansible local -i inventory.ini -m command -a "date"           # runs every time

# cleanup
ansible local -i inventory.ini -m file -a "path=/tmp/ansible-demo state=absent"
```

## Exercises

1. Explain provisioning vs configuration management and give a tool for each.
2. Describe Ansible's agentless push architecture and what targets need.
3. Demonstrate idempotency with the `file` or `copy` module (changed → ok on re-run).
4. Explain why `command`/`shell` aren't idempotent and what to prefer.
5. Write an inventory with two groups and a group-of-groups; target one group.
6. Run three ad-hoc commands (ping, a fact via `setup`, and a service/file change).

## Troubleshooting

- **"Failed to connect / unreachable"** — SSH/inventory issue. *Fix:* verify SSH key/user/host;
  `-m ping`; check `ansible_host`/`ansible_user`.
- **"sudo password required"** — needs escalation. *Fix:* `--become` (+ `--ask-become-pass` or
  passwordless sudo).
- **No Python on target** — *Fix:* install Python (or use `raw` module to bootstrap it).
- **Task always "changed"** — using `command`/`shell`. *Fix:* use a purpose-built module, or add
  `creates`/`when`.
- **Wrong hosts targeted** — pattern/group typo. *Fix:* check the host pattern and inventory
  groups; `--list-hosts`.
- **Permission denied writing files** — not root. *Fix:* `--become` for system paths.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does configuration management do, and how does it differ from provisioning?
2. What makes Ansible "agentless," and what do managed nodes need?
3. Push vs pull — which is Ansible, and what's the implication?
4. What is a module, and what does idempotent mean for one?
5. Why prefer `apt`/`service` over `shell`/`command`?
6. What is an inventory, and what are groups for?
7. What does `--become` do?
8. When use an ad-hoc command vs a playbook?
9. **Practical:** demonstrate idempotency on a re-run.
10. **Practical:** run a `ping` and a command across an inventory group.

## Solutions & validation

1. It gets/keeps machines in a desired state (packages/files/services); provisioning **creates**
   the machines.
2. **No agent** — just SSH + Python on targets; control node pushes modules over SSH.
3. **Push** (control node initiates) — config applies when you run Ansible, not continuously.
4. A unit of work (`apt`, `copy`, ...); **idempotent** = converges to desired state, changing
   only what's needed.
5. They're **idempotent** (state-based); `shell`/`command` run blindly every time.
6. The list of managed hosts; **groups** let you target sets (web/db/production).
7. **Privilege escalation** (run as root via sudo).
8. Ad-hoc for **quick one-offs**; playbooks for **repeatable** configuration.
9. **Validation:** second `file`/`copy` run reports `changed: false` (see lab).
10. **Validation:** `-m ping` returns pong; `-m command -a uptime` runs on the group.

> [!TIP]
> Ansible's appeal is **agentless + idempotent + readable**: point it at existing hosts over
> SSH, describe **desired state** with purpose-built modules, and re-run safely. Master the
> mental shift from "run these commands" to "this is the state I want" — that's what makes
> configuration reproducible across one host or a thousand. Ad-hoc commands are for quick fixes;
> the real power is in playbooks, next.

## What's next

Next: **Lesson 1502 — Playbooks & Tasks.** Capture configuration as code: playbook structure,
plays and tasks, common modules, handlers for service restarts, running and re-running
playbooks, and writing your first real, idempotent playbook to configure a web server.
