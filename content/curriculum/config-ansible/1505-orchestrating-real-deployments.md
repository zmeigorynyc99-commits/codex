---
title: "Ansible — Orchestrating Real Deployments"
slug: "ansible-orchestrating-real-deployments"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible in Practice"
order: 1505
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, orchestration, rolling, serial, error-handling, tags]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 65
status: "published"
summary: "Coordinate multi-host deployments: controlling execution with serial/rolling updates, run_once and delegation, error handling with block/rescue and failed_when, tags and limits for partial runs, and orchestrating a zero-downtime application rollout across a fleet."
seoTitle: "Ansible 5: Orchestrating Real Deployments (serial, block/rescue, tags)"
seoDescription: "Ansible orchestration: serial/rolling updates, run_once, delegation, block/rescue error handling, failed_when/changed_when, tags and limits, and zero-downtime rollouts. Lab + assessment."
---

Configuring one host is straightforward; **orchestrating a deployment across many hosts** —
without taking the whole service down — needs control over *how* and *in what order* Ansible
runs. This lesson covers the orchestration features: **`serial`** for rolling updates,
**`run_once`** and **delegation** for coordinator tasks, robust **error handling**
(`block`/`rescue`, `failed_when`, `changed_when`), and **tags/limits** for partial runs. We tie
it together with a **zero-downtime rolling deployment** pattern — the kind of playbook that
updates a fleet behind a load balancer safely.

## Learning objectives

By the end of this lesson you will be able to:

- Control rollout pace with **`serial`** (rolling updates).
- Use **`run_once`** and **`delegate_to`** for coordinator/one-host tasks.
- Handle errors with **`block`/`rescue`/`always`**, `failed_when`, `changed_when`.
- Run partial playbooks with **tags** and **`--limit`**.
- Orchestrate a **zero-downtime** rolling deployment.

## Part 1 — Execution strategy: serial / rolling updates

By default Ansible runs a play on **all hosts in parallel** (well, in batches by `forks`). For a
**rolling update**, use **`serial`** to process hosts in **small batches** so the service stays
up:

```yaml
- hosts: web                  # say, 9 web servers behind a load balancer
  serial: 3                   # update 3 at a time (3 batches of 3)
  # serial: "30%"             # or a percentage
  # serial: [1, 3, 5]          # ramp: 1 first (canary), then 3, then 5
  max_fail_percentage: 20     # abort the whole rollout if >20% of a batch fails
  tasks:
    - name: Take out of LB, update, put back  # (see Part 5)
      ...
```

`serial` turns "update everything at once" (downtime/risk) into a **controlled rolling
update**: a batch finishes fully before the next starts. Combine with **`max_fail_percentage`**
so a bad release **stops** instead of rolling out to the whole fleet — a built-in safety brake.

> [!IMPORTANT]
> **`serial` is how you get zero-downtime rolling deployments in Ansible.** Without it, a play
> hits every host at once — fine for config, dangerous for restarting a live service fleet-wide.
> With `serial: N` (or a percentage), Ansible updates a **batch at a time**, so most of the
> fleet keeps serving while each batch is recycled. Pair it with **`max_fail_percentage`** to
> **halt** the rollout if a batch fails — the same blast-radius limiting as canary deployments,
> applied to configuration runs.

## Part 2 — run_once and delegation

Sometimes a task should run on **one** host, or be **executed elsewhere** than the target:

```yaml
    - name: Run database migration ONCE (not per web host)
      ansible.builtin.command: /opt/app/migrate.sh
      run_once: true                          # runs on a single host in the batch

    - name: Remove this host from the load balancer (run ON the LB)
      ansible.builtin.command: "lb-ctl drain {{ inventory_hostname }}"
      delegate_to: loadbalancer01             # run the task on a DIFFERENT host

    - name: Add a DNS record (talk to a DNS host on behalf of this play)
      community.general.something:
        ...
      delegate_to: localhost                  # run locally (e.g. call an API)
```

- **`run_once`** — execute the task a single time (e.g. a DB migration, a one-off notification),
  not once per host.
- **`delegate_to`** — run the task **on another host** while still in the context of the current
  host (e.g. tell the **load balancer** to drain *this* web server, or call an API from
  `localhost`).

These enable **orchestration** — coordinating actions across different machines, not just
configuring each host in isolation.

## Part 3 — Error handling

Robust playbooks handle failure deliberately. **`block`/`rescue`/`always`** is try/catch/finally
for tasks:

```yaml
    - name: Safe deploy
      block:
        - name: Deploy new version
          ansible.builtin.command: /opt/app/deploy.sh
        - name: Smoke test
          ansible.builtin.uri: { url: "http://localhost:8080/health", status_code: 200 }
      rescue:
        - name: Roll back on failure
          ansible.builtin.command: /opt/app/rollback.sh
        - name: Fail the play after rollback
          ansible.builtin.fail: { msg: "Deploy failed; rolled back." }
      always:
        - name: Always re-enable monitoring
          ansible.builtin.command: /opt/app/monitoring on
```

Other controls:

```yaml
    - command: /usr/bin/check-thing
      register: result
      failed_when: "'ERROR' in result.stdout"   # custom failure condition
      changed_when: result.rc == 2               # custom "changed" condition (idempotency)
    - command: /usr/bin/optional-thing
      ignore_errors: true                        # continue even if this fails
```

`block/rescue` lets you **roll back** on failure; `failed_when`/`changed_when` make
`command`/`shell` behave correctly (define what counts as failed/changed); `ignore_errors` for
truly optional steps.

> [!TIP]
> Wrap risky multi-step operations (deploys, migrations) in **`block`/`rescue`/`always`** so a
> failure triggers a **rollback** (`rescue`) and cleanup/monitoring restoration always runs
> (`always`) — Ansible's try/catch/finally. And tame `command`/`shell` with **`failed_when`**
> and **`changed_when`** so they report failure/change accurately instead of "always changed,
> never failed unless rc≠0." Good error handling is what makes an orchestration playbook safe to
> run against production.

## Part 4 — Tags and limits for partial runs

You don't always want to run the whole playbook against the whole fleet:

```yaml
    - name: Install packages
      ansible.builtin.apt: { name: nginx, state: present }
      tags: [packages, setup]
    - name: Deploy app
      ansible.builtin.copy: { src: app, dest: /opt/app }
      tags: [deploy]
```

```bash
ansible-playbook site.yml --tags deploy           # run only deploy-tagged tasks
ansible-playbook site.yml --skip-tags packages     # run everything except packages
ansible-playbook site.yml --limit web01            # only this host
ansible-playbook site.yml --limit 'web:!web03'      # the web group except web03
ansible-playbook site.yml --check --diff            # dry-run a deploy
ansible-playbook site.yml --start-at-task "Deploy app"   # resume from a task
```

- **Tags** — run/skip subsets of tasks (`--tags`/`--skip-tags`) — e.g. just the deploy step.
- **`--limit`** — restrict to specific hosts/patterns (great for re-running on one failed host).

These make large playbooks practical: deploy without re-running setup, fix one host, or test on
a canary host first.

## Part 5 — A zero-downtime rolling deployment

```yaml
- name: Rolling deploy behind a load balancer
  hosts: web
  serial: 2                         # 2 hosts at a time
  max_fail_percentage: 25
  become: true
  tasks:
    - name: Drain from load balancer
      ansible.builtin.command: "lb-ctl drain {{ inventory_hostname }}"
      delegate_to: loadbalancer01    # tell the LB to stop sending traffic here

    - name: Wait for connections to finish
      ansible.builtin.wait_for: { timeout: 15 }

    - name: Deploy new version
      block:
        - ansible.builtin.copy: { src: "app-{{ app_version }}.tar.gz", dest: /opt/app/ }
        - ansible.builtin.command: /opt/app/install.sh
        - name: Health check
          ansible.builtin.uri: { url: "http://localhost:8080/health", status_code: 200 }
          retries: 5
          delay: 3
          register: health
          until: health.status == 200
      rescue:
        - ansible.builtin.command: /opt/app/rollback.sh
        - ansible.builtin.fail: { msg: "Deploy failed on {{ inventory_hostname }}, rolled back." }

    - name: Return to load balancer
      ansible.builtin.command: "lb-ctl enable {{ inventory_hostname }}"
      delegate_to: loadbalancer01
```

This combines everything: **`serial`** (rolling), **`delegate_to`** (LB drain/enable),
**`block/rescue`** (health-checked deploy with rollback), and **`max_fail_percentage`** (stop on
trouble) — a production-grade, zero-downtime rollout.

## Hands-on lab

```bash
# Simulate orchestration locally with multiple "hosts" via the local connection.
cat > inventory.ini <<'EOF'
[web]
node1 ansible_connection=local
node2 ansible_connection=local
node3 ansible_connection=local
node4 ansible_connection=local
EOF

# 1. serial rolling update — watch hosts processed in batches
cat > roll.yml <<'EOF'
- hosts: web
  serial: 2
  gather_facts: false
  tasks:
    - name: "Update {{ inventory_hostname }}"
      ansible.builtin.debug: { msg: "deploying to {{ inventory_hostname }} (batch)" }
    - name: run_once coordinator task
      ansible.builtin.debug: { msg: "this runs ONCE per batch" }
      run_once: true
EOF
ansible-playbook -i inventory.ini roll.yml        # note batches of 2

# 2. block/rescue/always with a forced failure
cat > safe.yml <<'EOF'
- hosts: node1
  gather_facts: false
  tasks:
    - block:
        - name: do work
          ansible.builtin.debug: { msg: "working" }
        - name: fail on purpose
          ansible.builtin.command: /bin/false
      rescue:
        - name: handle failure
          ansible.builtin.debug: { msg: "RESCUE: rolling back" }
      always:
        - name: cleanup
          ansible.builtin.debug: { msg: "ALWAYS: cleanup ran" }
EOF
ansible-playbook -i inventory.ini safe.yml        # see rescue + always run

# 3. failed_when / changed_when
cat > custom.yml <<'EOF'
- hosts: node1
  gather_facts: false
  tasks:
    - command: echo "STATUS=OK"
      register: r
      changed_when: false               # this check never "changes" anything
      failed_when: "'ERROR' in r.stdout"
    - debug: { var: r.stdout }
EOF
ansible-playbook -i inventory.ini custom.yml

# 4. Tags + limit
cat > tagged.yml <<'EOF'
- hosts: web
  gather_facts: false
  tasks:
    - debug: { msg: "setup task" }
      tags: setup
    - debug: { msg: "deploy task" }
      tags: deploy
EOF
ansible-playbook -i inventory.ini tagged.yml --tags deploy           # only deploy
ansible-playbook -i inventory.ini tagged.yml --limit node1           # only node1
```

## Exercises

1. Use `serial` to roll an update across four hosts two at a time; observe the batching.
2. Add `max_fail_percentage` and explain how it limits blast radius.
3. Use `run_once` for a migration and `delegate_to` for a load-balancer action; explain each.
4. Wrap a deploy in `block/rescue/always` so a failure rolls back and cleanup always runs.
5. Use `failed_when`/`changed_when` to make a `command` task behave idempotently and fail
   correctly.
6. Use tags and `--limit` to run only the deploy step on a single host.

## Troubleshooting

- **Whole fleet went down during deploy** — no `serial`. *Fix:* `serial: N` + drain/enable on
  the LB.
- **Bad release rolled out everywhere** — no failure cap. *Fix:* `max_fail_percentage`; health
  checks + `block/rescue`.
- **Migration ran on every host** — *Fix:* `run_once: true`.
- **Task ran on the wrong machine** — *Fix:* `delegate_to` the correct host (LB/localhost).
- **`command` always reports changed** — *Fix:* `changed_when: false` (or a real condition).
- **Can't re-run just one host/step** — *Fix:* `--limit host` and `--tags`/`--start-at-task`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does `serial` do, and why is it key to rolling updates?
2. What does `max_fail_percentage` protect against?
3. When use `run_once` vs `delegate_to`?
4. What do `block`, `rescue`, and `always` do?
5. What are `failed_when` and `changed_when` for?
6. How do tags and `--limit` help with large playbooks/fleets?
7. Sketch a zero-downtime rollout's steps per host.
8. How do you stop a bad rollout from reaching the whole fleet?
9. **Practical:** run a serial rollout and a block/rescue with rollback.
10. **Practical:** run only one tag on one host.

## Solutions & validation

1. Processes hosts in **batches**, so the service stays up during a rolling update.
2. Aborts the rollout if too many hosts in a batch fail — **limits blast radius**.
3. `run_once` = a task executes a single time; `delegate_to` = run a task **on another host**.
4. try/catch/finally: `block` runs, `rescue` on failure (rollback), `always` runs regardless.
5. Define custom **failure** and **changed** conditions (esp. for `command`/`shell`).
6. Tags run/skip task subsets; `--limit` restricts to specific hosts — partial, targeted runs.
7. drain from LB → wait → deploy + health-check (block/rescue) → re-enable on LB.
8. `serial` + `max_fail_percentage` + health checks/rollback.
9. **Validation:** batches of 2; rescue + always execute on failure (see lab).
10. **Validation:** `--tags deploy --limit node1` runs only that.

> [!TIP]
> Orchestration is **controlled change across many hosts**: roll with **`serial`**, cap failures
> with **`max_fail_percentage`**, coordinate via **`run_once`/`delegate_to`**, and make it safe
> with **`block/rescue/always`** rollbacks and health checks. Add **tags/`--limit`** for surgical
> runs. That combination turns Ansible from "configure a host" into "safely deploy to a fleet
> with zero downtime" — the same blast-radius discipline as canary/rolling deployments.

## What's next

Next: **Lesson 1506 — Ansible Vault & Secrets.** Handle sensitive data safely: encrypting
secrets with Ansible Vault, encrypted variables and files, vault IDs and password management,
integrating with external secret stores, and keeping credentials out of plaintext in your repo.
