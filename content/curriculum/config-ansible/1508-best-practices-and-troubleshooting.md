---
title: "Ansible — Best Practices & Troubleshooting"
slug: "ansible-best-practices-and-troubleshooting"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible in Practice"
order: 1508
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, best-practices, troubleshooting, performance, debugging]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 60
status: "published"
summary: "Tie the track together: project structure and conventions, debugging failed runs (verbosity, start-at-task, step, debugger), performance tuning (forks, fact caching, pipelining), idempotency pitfalls, integrating with Terraform and CI, and a production-readiness checklist."
seoTitle: "Ansible 8: Best Practices & Troubleshooting (debug, performance, structure)"
seoDescription: "Ansible best practices: structure/conventions, debugging failed runs, performance (forks/pipelining/fact caching), idempotency pitfalls, Terraform/CI integration, readiness checklist. Capstone lab + assessment."
---

This capstone consolidates the track into the **habits, debugging skills, and performance
tuning** that make Ansible reliable at scale. We'll cover **project structure and conventions**,
**debugging** failed runs (verbosity, `--start-at-task`, `--step`, the debugger), **performance**
(forks, pipelining, fact caching, async), the **idempotency pitfalls** that bite people, how
Ansible **integrates with Terraform and CI**, and a **production-readiness checklist** tying the
whole track together — so your configuration management is fast, maintainable, and safe.

## Learning objectives

By the end of this lesson you will be able to:

- Apply sensible **project structure and conventions**.
- **Debug** failed playbook runs methodically.
- Tune **performance**: forks, pipelining, fact caching, async.
- Avoid common **idempotency pitfalls**.
- Integrate Ansible with **Terraform/CI** and run a **readiness checklist**.

## Part 1 — Project structure and conventions

```text
project/
├── ansible.cfg              # inventory path, roles_path, pipelining, forks, defaults
├── requirements.yml         # external roles/collections (pinned)
├── inventories/
│   ├── dev/{hosts.ini, group_vars/, host_vars/}
│   └── prod/{hosts.ini, group_vars/, host_vars/}
├── roles/{common, webserver, postgres}/
├── site.yml                 # master playbook (assembles roles per group)
└── playbooks/               # focused playbooks
```

Conventions that pay off:
- **Roles** for reusable logic; **inventories + group_vars** for per-env data; **thin `site.yml`**
  that assembles roles.
- **Name every task** (output readability + `--start-at-task`).
- **FQCN modules** (`ansible.builtin.copy`) for clarity/portability.
- **Pin** package versions (avoid `state: latest`) and external roles/collections.
- **`ansible.cfg`** for defaults so you don't repeat flags.
- Secrets via **Vault** (encrypted), never plaintext.

## Part 2 — Debugging failed runs

```bash
ansible-playbook site.yml -v          # verbose (-vvv / -vvvv for connection+module detail)
ansible-playbook site.yml --start-at-task "Deploy app"   # resume from a task (after a fix)
ansible-playbook site.yml --step      # interactive: confirm each task (y/n/continue)
ansible-playbook site.yml --limit web01   # narrow to the failing host
ansible-playbook site.yml --list-tasks --list-hosts      # preview what/where
ANSIBLE_STDOUT_CALLBACK=debug ansible-playbook site.yml   # readable multi-line output
```

```yaml
# Drop into the task debugger on failure (inspect/modify vars, retry)
- hosts: web
  debugger: on_failed
  tasks:
    - name: risky task
      ...
# at the prompt: p task_vars / p result / r (retry) / c (continue)
```

Method: **read the error + the failed task name**, **increase verbosity** (`-vvv` shows the exact
module call and response), **isolate** with `--limit`/`--start-at-task`, and **register +
`debug`** intermediate values. Most failures are connectivity, permissions (`become`), a wrong
variable (precedence), or a non-idempotent `command`.

> [!TIP]
> Your fastest debugging lever is **`-vvv`** — it shows the exact module invocation, arguments,
> and the raw result/JSON from the host, which usually reveals the real cause (a wrong path,
> permission, or variable value). Then **`register`** a task's result and **`debug: var=result`**
> to see what Ansible actually got. After fixing, **`--start-at-task`** + **`--limit`** lets you
> re-run just the failed step on just the failed host instead of the whole fleet.

## Part 3 — Performance tuning

Ansible can be slow on large fleets; several knobs help a lot:

```ini
# ansible.cfg
[defaults]
forks = 50                    # parallelism: how many hosts at once (default 5 — raise it!)
gathering = smart             # cache facts; don't re-gather every run
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 7200

[ssh_connection]
pipelining = True             # fewer SSH ops per task — BIG speedup (needs no requiretty)
control_path = /tmp/ansible-%%h
```

- **`forks`** — the #1 lever: run more hosts in parallel (default 5 is low; 25–100 typical).
- **`pipelining`** — reduces SSH round-trips per task — significant speedup (requires sudoers
  without `requiretty`).
- **Fact caching** — skip re-gathering facts every run; or set `gather_facts: false` when you
  don't need them.
- **`async`/`poll`** — run long tasks in the background (fire-and-poll) so they don't block.
- **Tags/`--limit`** — don't run more than you need.

> [!IMPORTANT]
> For fleet-scale speed, the two biggest wins are **raising `forks`** (default 5 is far too low —
> set 25–100 to update many hosts in parallel) and enabling **`pipelining`** (fewer SSH
> operations per task). Add **fact caching** (or `gather_facts: false`) to skip the expensive
> fact-gathering on every run. These three turn a multi-hour fleet run into minutes — without
> them, large Ansible runs feel painfully slow and people blame the tool rather than the config.

## Part 4 — Idempotency pitfalls

The recurring source of "changed on every run" / unsafe re-runs:

```text
✗ command/shell without guards   → always "changed"  → add `creates:`/`removes:`/`when:`/changed_when
✗ package state: latest          → re-checks/updates every run → pin versions / state: present
✗ template with timestamps/random → content differs each run → make content deterministic
✗ owner/mode not set explicitly  → drifts → set owner/group/mode in copy/file
✗ lineinfile matching loosely     → re-edits → precise regexp/backrefs
✗ shell pipelines for logic        → use modules (uri, get_url, unarchive, etc.)
```

The fix is almost always **use the right module** (idempotent by design) and **guard
`command`/`shell`** with `creates`/`when`/`changed_when`. Verify by **running twice** (Lesson
1507) — `changed=0` proves it.

## Part 5 — Integration and readiness

Ansible rarely works alone:

```text
TERRAFORM → ANSIBLE:  Terraform provisions hosts and outputs IPs; a dynamic inventory (or
                      Terraform output → inventory) feeds Ansible, which configures them.
CI/CD:                Pipeline runs lint → syntax → Molecule (test), then ansible-playbook
                      against the target inventory (with Vault password from CI secrets).
DYNAMIC INVENTORY:    inventory plugins (aws_ec2, gcp, etc.) so the host list always matches reality.
```

```text
ANSIBLE PRODUCTION-READINESS CHECKLIST (the whole track):
□ Roles for reusable logic; thin site.yml; inventories + group_vars per environment
□ Every task named; FQCN modules; versions pinned (no state: latest); external roles pinned
□ Idempotent (run twice → changed=0); command/shell guarded; tested with --check
□ Secrets in Ansible Vault (vault-id per env); password from CI secrets, never committed
□ Linted (yamllint + ansible-lint) and Molecule-tested critical roles in CI
□ Orchestration: serial + max_fail_percentage + handlers for safe rolling changes
□ Performance: forks raised, pipelining on, fact caching (or gather_facts: false)
□ Dynamic/Terraform-fed inventory; runs from CI/control node, not random laptops
□ Dry-run (--check --diff) reviewed before prod; limited blast radius (--limit, canary host)
```

## Hands-on lab

```bash
mkdir ansible-capstone && cd ansible-capstone
cat > inventory.ini <<'EOF'
[web]
n1 ansible_connection=local
n2 ansible_connection=local
n3 ansible_connection=local
EOF
cat > ansible.cfg <<'EOF'
[defaults]
forks = 25
gathering = smart
stdout_callback = yaml
EOF

# 1. Debugging: verbosity + register/debug
cat > play.yml <<'EOF'
- hosts: web
  gather_facts: false
  tasks:
    - name: Get a value
      ansible.builtin.command: echo "result-42"
      register: r
      changed_when: false
    - name: Inspect it
      ansible.builtin.debug: { var: r.stdout }
EOF
ansible-playbook -i inventory.ini play.yml -v
# resume-from-task demo:
ansible-playbook -i inventory.ini play.yml --start-at-task "Inspect it"

# 2. Idempotency pitfall + fix
cat > idem.yml <<'EOF'
- hosts: n1
  gather_facts: false
  tasks:
    - name: BAD - mkdir via command (always changed)
      ansible.builtin.command: mkdir -p /tmp/x
    - name: GOOD - file module (idempotent)
      ansible.builtin.file: { path: /tmp/y, state: directory }
EOF
ansible-playbook -i inventory.ini idem.yml >/dev/null
ansible-playbook -i inventory.ini idem.yml | grep -E "changed=" 
#   the command task keeps it non-idempotent; fix by adding: args: { creates: /tmp/x }

# 3. Performance: time a run with low vs higher forks (conceptual on local)
time ansible -i inventory.ini web -m ping >/dev/null

# 4. Limit + check (blast-radius control)
ansible-playbook -i inventory.ini play.yml --limit n1 --check

rm -rf /tmp/x /tmp/y
```

## Exercises

1. Lay out a production Ansible project with roles, per-env inventories, and `ansible.cfg`.
2. Debug a failing task using `-vvv`, `register`/`debug`, and `--start-at-task`.
3. Identify and fix three idempotency pitfalls; verify with a double run.
4. Tune performance with `forks`, `pipelining`, and fact caching; explain each.
5. Describe the Terraform → Ansible hand-off and dynamic inventory.
6. Walk through the production-readiness checklist for a sample project.

## Troubleshooting

- **Slow on many hosts** — low forks, no pipelining/caching. *Fix:* raise `forks`, enable
  `pipelining`, cache facts.
- **"changed" every run** — non-idempotent task. *Fix:* right module / guard command; verify
  double-run.
- **Failure with no detail** — low verbosity. *Fix:* `-vvv`; `register`+`debug`.
- **Re-running whole playbook to fix one host** — *Fix:* `--limit` + `--start-at-task`.
- **Inventory stale/wrong hosts** — static list drifted. *Fix:* dynamic inventory / Terraform
  output.
- **Secret leaked / plaintext** — *Fix:* Vault; rotate; password from CI secrets.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's a good Ansible project structure, and three conventions to follow?
2. What's the fastest way to see why a task failed?
3. How do you resume a playbook after fixing a failed task?
4. Name the two biggest performance levers and one more.
5. List three idempotency pitfalls and their fixes.
6. How do Terraform and Ansible integrate?
7. Why use dynamic inventory?
8. Where should secrets and the vault password live?
9. **Practical:** debug with `-vvv` + `register`/`debug` and resume with `--start-at-task`.
10. **Practical:** show an idempotency pitfall and the double-run fix.

## Solutions & validation

1. Roles + per-env inventories/group_vars + thin `site.yml`; conventions: name tasks, FQCN, pin
   versions (any three).
2. **`-vvv`** (shows the module call + raw result); plus `register`+`debug`.
3. **`--start-at-task "<name>"`** (and `--limit` the host).
4. **`forks`** and **`pipelining`** (plus fact caching / `gather_facts: false`).
5. e.g. `command` (guard with `creates`/`changed_when`), `state: latest` (pin), non-deterministic
   templates (make deterministic).
6. Terraform provisions + outputs IPs → (dynamic) inventory → Ansible configures the hosts.
7. So the host list always reflects reality (cloud auto-scaling/changes).
8. Secrets in **Vault** (encrypted in repo); vault **password** from CI secrets, never committed.
9. **Validation:** `-vvv` reveals the call; `--start-at-task` resumes (see lab).
10. **Validation:** command task stays changed; adding `creates:`/using `file` → `changed=0`.

> [!TIP]
> Production Ansible is **structured, fast, idempotent, tested, and secure**: roles + per-env
> inventories, **named tasks/FQCN/pinned versions**, idempotent modules (verified by double-run),
> **Vault** for secrets, **lint + Molecule** in CI, and performance via **forks + pipelining +
> fact caching**. Debug with **`-vvv`** and surgical `--limit`/`--start-at-task`. Feed it a
> **dynamic/Terraform inventory** and run it from CI. That's configuration management you can
> trust against a real fleet.

## What's next

You've completed the **Configuration Management (Ansible)** track — fundamentals, playbooks,
variables/templates, roles, orchestration, Vault, testing, and best practices. With Terraform to
provision and Ansible to configure, you can build and manage infrastructure entirely as code.
Next in the roadmap: **Cloud Fundamentals** — the platforms (AWS/Azure/GCP) where all of this
runs — followed by **observability**, **databases**, and the remaining platform tracks.
