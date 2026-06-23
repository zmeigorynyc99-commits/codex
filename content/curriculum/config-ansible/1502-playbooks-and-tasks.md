---
title: "Ansible — Playbooks & Tasks"
slug: "ansible-playbooks-and-tasks"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible Foundations"
order: 1502
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, playbooks, tasks, handlers, modules, yaml]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 60
status: "published"
summary: "Capture configuration as code: playbook structure, plays and tasks, common modules (package/copy/template/service/user), handlers for service restarts, check mode and idempotent re-runs, and writing a complete playbook that configures a web server end to end."
seoTitle: "Ansible 2: Playbooks & Tasks (handlers, modules, check mode)"
seoDescription: "Ansible playbooks: plays/tasks structure, common modules, handlers, notify, check mode and idempotency, and a full web-server playbook. Hands-on lab and assessment."
---

Ad-hoc commands are handy, but real configuration management is **codified** in **playbooks** —
YAML files that declare the desired state of your hosts, versioned in Git and re-run safely.
This lesson covers playbook **structure** (plays → tasks), the **common modules** you'll use
constantly, **handlers** (run something only when a change happens, e.g. restart a service after
its config changes), **check mode** (dry run), and ties it together by writing a complete,
idempotent playbook that configures a web server from scratch.

## Learning objectives

By the end of this lesson you will be able to:

- Write a **playbook** with plays, hosts, and tasks.
- Use **common modules**: package, copy, template, service, user, file.
- Use **handlers** with `notify` to trigger actions on change.
- Run with **check mode** (dry run) and verify idempotency.
- Build a complete, idempotent **web-server playbook**.

## Part 1 — Playbook structure

A **playbook** is a YAML list of **plays**; each play maps a group of **hosts** to a list of
**tasks**:

```yaml
# site.yml
- name: Configure web servers          # a PLAY
  hosts: web                           # which inventory group
  become: true                         # run tasks as root (sudo)
  vars:
    app_port: 8080
  tasks:                               # ordered list of TASKS
    - name: Install nginx              # each task = a name + a module + args
      ansible.builtin.apt:
        name: nginx
        state: present

    - name: Ensure nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true                  # start on boot too
```

```bash
ansible-playbook -i inventory.ini site.yml
```

- **Play** — binds `hosts` (a pattern/group) to settings (`become`, `vars`) and `tasks`.
- **Task** — a **name** (shown in output) + one **module** with arguments. Tasks run **top to
  bottom**, in order.
- A playbook can have **multiple plays** (e.g. configure `web`, then `db`).

## Part 2 — Common modules

You'll use a small set constantly (use **fully-qualified** names like `ansible.builtin.copy`):

```yaml
tasks:
  - name: Install packages
    ansible.builtin.apt: { name: [nginx, git], state: present, update_cache: true }

  - name: Create app user
    ansible.builtin.user: { name: appuser, system: true, shell: /usr/sbin/nologin }

  - name: Create a directory
    ansible.builtin.file: { path: /var/www/app, state: directory, owner: appuser, mode: "0755" }

  - name: Copy a static file
    ansible.builtin.copy: { src: index.html, dest: /var/www/app/index.html, mode: "0644" }

  - name: Render a config from a template
    ansible.builtin.template: { src: nginx.conf.j2, dest: /etc/nginx/sites-available/app }

  - name: Manage a service
    ansible.builtin.service: { name: nginx, state: started, enabled: true }
```

Key ones: **package/apt/dnf/yum** (install), **copy** (static files), **template** (dynamic
files — next lesson), **file** (dirs/perms/symlinks), **user/group**, **service/systemd**,
**lineinfile/blockinfile** (edit files), **git**, **command/shell** (last resort). Each is
idempotent and declares **state**.

## Part 3 — Handlers and notify

Often you want to **restart a service only if its config actually changed** — not on every run.
**Handlers** do exactly this: a task `notify`s a handler, which runs **once at the end**, only
**if** the notifying task reported a change:

```yaml
  tasks:
    - name: Deploy nginx config
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Restart nginx          # only fires the handler IF this task changed something

  handlers:
    - name: Restart nginx
      ansible.builtin.service:
        name: nginx
        state: restarted
```

- A handler runs **at most once per play**, **at the end**, and **only when notified by a
  changed task**.
- If the config is unchanged on a re-run, the template task is `ok` (not changed) → the handler
  **does not** fire → no needless restart.

> [!IMPORTANT]
> **Handlers are how you avoid unnecessary, disruptive restarts.** A service restart on every
> playbook run causes blips even when nothing changed. With `notify` + a handler, the restart
> fires **only when the config task actually reported a change** — so a no-op run leaves the
> service untouched. Handlers run once, at the end of the play (after all tasks), so multiple
> notifications to the same handler still trigger a single restart. This pattern keeps
> idempotent runs truly side-effect-free.

## Part 4 — Check mode, diff, and idempotency

```bash
ansible-playbook -i inv site.yml --check          # DRY RUN: report what WOULD change, change nothing
ansible-playbook -i inv site.yml --check --diff   # also show the file diffs that would be made
ansible-playbook -i inv site.yml --diff           # real run, but show diffs of changed files
ansible-playbook -i inv site.yml --list-tasks     # preview tasks without running
ansible-playbook -i inv site.yml -v               # verbose (more v's = more detail)
```

After a real run, **re-run the playbook**: a correct, idempotent playbook reports
**`changed=0`** the second time (everything already in desired state). This is your test that
the playbook is well-written:

```text
PLAY RECAP
web01 : ok=6  changed=4  unreachable=0  failed=0     # first run: made changes
web01 : ok=6  changed=0  unreachable=0  failed=0     # second run: idempotent! nothing to do
```

> [!TIP]
> Always sanity-check with **`--check --diff`** (a dry run showing intended changes) before a
> real run on important hosts, and **always re-run** a playbook to confirm **`changed=0`** the
> second time — that's proof it's idempotent. If a task is "changed" on every run, it's usually
> a `command`/`shell` without a guard, a permissions/owner mismatch, or non-deterministic
> content; fix it so steady-state runs are no-ops.

## Part 5 — A complete web-server playbook

```yaml
# webserver.yml — install, configure, and run nginx idempotently
- name: Configure web server
  hosts: web
  become: true
  vars:
    doc_root: /var/www/app
  tasks:
    - name: Install nginx
      ansible.builtin.apt: { name: nginx, state: present, update_cache: true }

    - name: Ensure docroot exists
      ansible.builtin.file: { path: "{{ doc_root }}", state: directory, mode: "0755" }

    - name: Deploy index page
      ansible.builtin.copy:
        content: "<h1>Configured by Ansible</h1>\n"
        dest: "{{ doc_root }}/index.html"
        mode: "0644"

    - name: Deploy site config
      ansible.builtin.template:
        src: site.conf.j2
        dest: /etc/nginx/sites-available/app
      notify: Reload nginx

    - name: Enable the site
      ansible.builtin.file:
        src: /etc/nginx/sites-available/app
        dest: /etc/nginx/sites-enabled/app
        state: link
      notify: Reload nginx

    - name: Ensure nginx is running and enabled
      ansible.builtin.service: { name: nginx, state: started, enabled: true }

  handlers:
    - name: Reload nginx
      ansible.builtin.service: { name: nginx, state: reloaded }
```

## Hands-on lab

```bash
# Run against localhost (or a container). Uses become for system changes.
cat > inventory.ini <<'EOF'
[local]
localhost ansible_connection=local
EOF

# 1. A small idempotent playbook (no root needed — writes to /tmp)
cat > demo.yml <<'EOF'
- name: Demo configuration
  hosts: local
  tasks:
    - name: Ensure a config dir
      ansible.builtin.file: { path: /tmp/app, state: directory, mode: "0755" }
    - name: Deploy a config file
      ansible.builtin.copy:
        content: "port=8080\n"
        dest: /tmp/app/app.conf
      notify: Print changed
    - name: Ensure a marker file
      ansible.builtin.copy: { content: "ok\n", dest: /tmp/app/marker }
  handlers:
    - name: Print changed
      ansible.builtin.debug: { msg: "config changed -> would restart service" }
EOF

# 2. Dry run first
ansible-playbook -i inventory.ini demo.yml --check --diff

# 3. Real run -> see changes + handler fire
ansible-playbook -i inventory.ini demo.yml

# 4. RE-RUN -> changed=0, handler does NOT fire (idempotent!)
ansible-playbook -i inventory.ini demo.yml      # PLAY RECAP shows changed=0

# 5. Change the content and re-run -> only that task changes, handler fires again
sed -i 's/port=8080/port=9090/' demo.yml
ansible-playbook -i inventory.ini demo.yml --diff

cat /tmp/app/app.conf
rm -rf /tmp/app
```

## Exercises

1. Write a playbook with one play, targeting a group, that installs a package and starts its
   service.
2. Use four different modules (file, copy/template, user, service) in one playbook.
3. Add a handler and `notify` so a service reloads only when its config changes; prove it
   doesn't fire on a no-op run.
4. Run a playbook in `--check --diff` and explain the output.
5. Run a playbook twice and show `changed=0` the second time; explain what that proves.
6. Make a task that's wrongly "always changed," then fix it to be idempotent.

## Troubleshooting

- **Handler never runs** — no task notified it / no change. *Fix:* `notify` must match the
  handler name; the task must report `changed`.
- **Service restarts every run** — restart task instead of handler. *Fix:* use `notify` +
  handler (only on change).
- **Task always "changed"** — `command`/`shell` or mode/owner mismatch. *Fix:* purpose-built
  module; set owner/mode explicitly; add `creates`.
- **YAML errors** — indentation. *Fix:* 2-space indent, consistent; `ansible-playbook
  --syntax-check`.
- **Permission denied** — needs root. *Fix:* `become: true`.
- **Wrong module name** — *Fix:* use FQCN (`ansible.builtin.copy`); check `ansible-doc <module>`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's the structure of a playbook (plays/hosts/tasks)?
2. What is a task made of, and in what order do tasks run?
3. Name five common modules and what each does.
4. What is a handler, and when does it run?
5. Why use a handler instead of always restarting?
6. What does `--check` do, and `--diff`?
7. What does `changed=0` on a re-run prove?
8. Why prefer `template`/`copy` over editing files with `shell`?
9. **Practical:** write a playbook with a notify/handler and show it's idempotent.
10. **Practical:** run `--check --diff` and interpret the result.

## Solutions & validation

1. A list of **plays**; each play binds **hosts** to ordered **tasks** (+ settings/handlers).
2. A **name** + a **module** with args; tasks run **top to bottom**.
3. e.g. apt/package (install), file (dirs/perms), copy/template (files), user, service (any
   five).
4. A task triggered by `notify`; runs **once at the end** of the play, **only if** notified by a
   changed task.
5. To avoid unnecessary restarts — it fires only when config actually changed.
6. `--check` = dry run (no changes); `--diff` shows file diffs.
7. The playbook is **idempotent** — steady state, nothing left to change.
8. They're **idempotent** and declarative; `shell` edits are blind/error-prone.
9. **Validation:** second run shows `changed=0` and handler doesn't fire (see lab).
10. **Validation:** `--check --diff` reports intended changes without making them.

> [!TIP]
> A good playbook reads like **documentation of desired state** and is **safe to run anytime**:
> purpose-built modules, **handlers** for change-triggered restarts, and a clean
> **`changed=0`** on re-run. Always dry-run with `--check --diff` on important hosts, and treat
> "changed on every run" as a bug. Codified, idempotent playbooks in Git are how configuration
> becomes reproducible and reviewable.

## What's next

Next: **Lesson 1503 — Variables, Facts & Templates.** Make playbooks dynamic and reusable:
variables and precedence, gathered facts about hosts, Jinja2 templates to render config files
per host, conditionals and loops, and `group_vars`/`host_vars` for clean per-environment
configuration.
