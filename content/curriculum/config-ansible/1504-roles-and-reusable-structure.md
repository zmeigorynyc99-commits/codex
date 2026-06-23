---
title: "Ansible — Roles & Reusable Structure"
slug: "ansible-roles-and-reusable-structure"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible Language"
order: 1504
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, roles, galaxy, reusability, structure, collections]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 60
status: "published"
summary: "Scale playbooks into maintainable components: role anatomy (tasks/handlers/templates/defaults/vars/files), creating and using roles, Ansible Galaxy and collections, role dependencies and variables, and structuring a real project so configuration is reusable and shareable."
seoTitle: "Ansible 4: Roles & Reusable Structure (Galaxy, collections, layout)"
seoDescription: "Ansible roles: anatomy and directory layout, creating/using roles, Ansible Galaxy and collections, dependencies and defaults, and project structure for reusable config. Lab + assessment."
---

A single big playbook becomes unmaintainable as you configure more services. **Roles** are
Ansible's unit of reuse — a standardized directory structure that packages tasks, handlers,
templates, files, and default variables for one piece of functionality (a web server, a
database, a monitoring agent). This lesson covers **role anatomy**, creating and using roles,
**Ansible Galaxy** and **collections** (sharing/installing roles), **dependencies**, and
structuring a real project — so configuration becomes modular, reusable, and shareable instead
of one sprawling YAML file.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **role anatomy** and the standard directory layout.
- **Create** a role and **use** it from a playbook.
- Install roles/collections from **Ansible Galaxy**.
- Use role **defaults**, **variables**, and **dependencies**.
- Structure a **real project** with roles and group_vars.

## Part 1 — Why roles

Without roles, a playbook to configure several services becomes a giant file with mixed
concerns — hard to read, reuse, or test. **Roles** split it into self-contained components:

```text
Instead of one 500-line site.yml, you get reusable roles:
   roles/nginx/    roles/postgres/    roles/monitoring/
and a thin playbook that just lists which roles each host group gets.
```

A role is the Ansible analog of a Terraform **module** or a function — encapsulate the "how" of
configuring one thing, parameterize it with variables, and reuse it across playbooks/projects/
teams.

## Part 2 — Role anatomy

A role is a **directory** with conventionally-named subdirectories that Ansible loads
automatically:

```text
roles/webserver/
├── tasks/main.yml        # the role's tasks (entry point)
├── handlers/main.yml     # handlers (e.g. restart nginx)
├── templates/            # Jinja2 templates (.j2)
├── files/                # static files to copy
├── defaults/main.yml     # DEFAULT variables (lowest precedence — meant to be overridden)
├── vars/main.yml         # role variables (higher precedence than defaults)
├── meta/main.yml         # metadata + role DEPENDENCIES
└── README.md             # docs (what it does, variables)
```

The key files:
- **`tasks/main.yml`** — the work (referencing `templates/`/`files/` by name, no paths needed).
- **`defaults/main.yml`** — overridable defaults (the role's public "API" of knobs).
- **`handlers/main.yml`** — handlers the tasks `notify`.
- **`meta/main.yml`** — role info + `dependencies` (other roles to run first).

Ansible **auto-discovers** these by convention — you don't wire paths; just put files in the
right folders.

```bash
ansible-galaxy init roles/webserver     # scaffold the standard role skeleton
```

## Part 3 — Using roles

A playbook lists roles per host group — clean and declarative:

```yaml
# site.yml
- hosts: web
  become: true
  roles:
    - common              # run the 'common' role
    - role: webserver     # long form, with variables
      vars:
        app_port: 8080

- hosts: db
  become: true
  roles:
    - common
    - postgres
```

```yaml
# Or include/import roles within tasks for finer control:
  tasks:
    - ansible.builtin.import_role: { name: webserver }   # static (parsed at start)
    - ansible.builtin.include_role: { name: webserver }  # dynamic (at runtime, can be conditional)
```

The playbook becomes a readable **assembly** of roles. Variables passed to a role override its
`defaults`. Roles run in listed order; their tasks, handlers, and templates all come along
automatically.

> [!TIP]
> Design roles with a clear **interface**: put every tunable in **`defaults/main.yml`** with
> sensible values and document them in the README, so callers override only what they need via
> `group_vars` or role `vars`. Keep a role focused on **one responsibility** (a web server, a
> user setup) — like a good function or Terraform module. A thin `site.yml` that just lists
> roles per group is the goal: composition over one giant playbook.

## Part 4 — Galaxy, collections, and dependencies

**Ansible Galaxy** is the public hub for sharing roles and **collections** (bundles of roles +
modules + plugins):

```bash
ansible-galaxy role install geerlingguy.nginx        # install a community role
ansible-galaxy collection install community.postgresql   # install a collection
# Pin and track dependencies in a requirements file:
ansible-galaxy install -r requirements.yml
```

```yaml
# requirements.yml — pin versions for reproducibility
roles:
  - { name: geerlingguy.nginx, version: "3.1.4" }
collections:
  - { name: community.general, version: ">=8.0.0" }
```

**Role dependencies** (in `meta/main.yml`) declare roles that must run first:

```yaml
# roles/webapp/meta/main.yml
dependencies:
  - role: common
  - role: webserver
    vars: { app_port: 8080 }
```

> [!IMPORTANT]
> **Don't reinvent common roles — use vetted Galaxy roles/collections, but pin their
> versions.** Maintained roles (e.g. `geerlingguy.*`) encode a lot of edge cases for installing
> databases, web servers, etc. Pin them in a `requirements.yml` (like Terraform module/provider
> pinning) so builds are **reproducible** and upgrades are deliberate. As with any third-party
> code, review what a role does before running it with root on your fleet — it's executing on
> your servers.

## Part 5 — Project structure

A conventional, scalable layout:

```text
project/
├── ansible.cfg              # config (inventory path, roles_path, defaults)
├── requirements.yml         # external roles/collections (pinned)
├── inventories/
│   ├── dev/      hosts.ini + group_vars/  host_vars/
│   └── prod/     hosts.ini + group_vars/  host_vars/
├── group_vars/  host_vars/  # (or per-inventory as above)
├── roles/
│   ├── common/
│   ├── webserver/
│   └── postgres/
├── site.yml                 # master playbook (assembles roles per group)
└── webservers.yml           # focused playbooks
```

- **Roles** hold reusable logic; **inventories** + **group_vars** hold per-environment data;
  **`site.yml`** assembles them.
- Separate **inventories per environment** (dev/prod) with their own group_vars — parity with
  isolation, like the Terraform per-env pattern.
- `ansible.cfg` sets defaults (inventory location, `roles_path`, SSH settings) so you don't
  repeat flags.

## Hands-on lab

```bash
# Build and use a role locally (targets localhost).
mkdir ansible-roles-lab && cd ansible-roles-lab
cat > inventory.ini <<'EOF'
[local]
localhost ansible_connection=local
EOF

# 1. Scaffold a role
ansible-galaxy init roles/demo                 # creates the standard skeleton
ls roles/demo                                   # tasks handlers templates files defaults vars meta

# 2. Give the role default vars, a template, tasks, and a handler
cat > roles/demo/defaults/main.yml <<'EOF'
demo_message: "default message"
demo_path: /tmp/demo
EOF
cat > roles/demo/templates/conf.j2 <<'EOF'
host: {{ ansible_hostname }}
message: {{ demo_message }}
EOF
cat > roles/demo/tasks/main.yml <<'EOF'
- name: Ensure dir
  ansible.builtin.file: { path: "{{ demo_path }}", state: directory }
- name: Render config
  ansible.builtin.template: { src: conf.j2, dest: "{{ demo_path }}/demo.conf" }
  notify: Demo changed
EOF
cat > roles/demo/handlers/main.yml <<'EOF'
- name: Demo changed
  ansible.builtin.debug: { msg: "demo config changed" }
EOF

# 3. A thin playbook that USES the role (and overrides a default)
cat > site.yml <<'EOF'
- hosts: local
  roles:
    - role: demo
      vars: { demo_message: "configured via role var" }
EOF

# 4. Run it; inspect the rendered output; re-run for idempotency
ansible-playbook -i inventory.ini site.yml
cat /tmp/demo/demo.conf                         # message overridden the default
ansible-playbook -i inventory.ini site.yml      # changed=0 second time

# 5. (Concept) install a community role pinned by version
#    echo 'roles: [{ name: geerlingguy.nginx, version: "3.1.4" }]' > requirements.yml
#    ansible-galaxy install -r requirements.yml
rm -rf /tmp/demo
```

## Exercises

1. Explain why roles improve maintainability over one big playbook.
2. Scaffold a role and describe what each standard directory holds.
3. Create a role with a default variable and a template; use it from a playbook overriding the
   default.
4. Add a handler to a role and show it firing only on change.
5. Pin a Galaxy role/collection in `requirements.yml` and explain why pinning matters.
6. Lay out a multi-environment project with roles, per-env inventories, and `group_vars`.

## Troubleshooting

- **Role not found** — wrong path/name. *Fix:* place under `roles/` or set `roles_path`; match
  the role name.
- **Template/file not found in role** — wrong dir. *Fix:* put templates in `templates/`, files
  in `files/`; reference by name only.
- **Default not overridden** — precedence/typo. *Fix:* `defaults` are lowest; pass role `vars`
  or set `group_vars`.
- **Galaxy role version drift** — unpinned. *Fix:* pin in `requirements.yml`.
- **Dependency didn't run** — not in `meta/main.yml`. *Fix:* declare `dependencies` or list the
  role first.
- **Role does too much** — over-scoped. *Fix:* one responsibility per role; split it.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a role and what problem does it solve?
2. Name four standard role directories and what each holds.
3. How does Ansible find a role's templates/files (paths)?
4. What's the difference between `defaults/` and `vars/` in a role?
5. How do you use a role from a playbook and override a variable?
6. What is Ansible Galaxy, and what's a collection?
7. Why pin role/collection versions?
8. How do you express that one role depends on another?
9. **Practical:** create and use a role with an overridable default.
10. **Practical:** show a role-based playbook is idempotent on re-run.

## Solutions & validation

1. A standardized, reusable directory packaging one piece of config; replaces a sprawling
   playbook.
2. e.g. `tasks/`, `handlers/`, `templates/`, `files/`, `defaults/`, `vars/`, `meta/` (any
   four).
3. By **convention** — `templates/`/`files/` referenced by name, no paths needed.
4. `defaults/` = lowest precedence (overridable); `vars/` = higher precedence role vars.
5. List it under `roles:` and pass `vars:` (overrides defaults).
6. A hub for sharing roles; a **collection** bundles roles + modules + plugins.
7. Reproducible builds + deliberate upgrades (like TF module pinning).
8. In **`meta/main.yml`** `dependencies:` (or order roles in the play).
9. **Validation:** rendered file shows the overridden message (see lab).
10. **Validation:** second run reports `changed=0`.

> [!TIP]
> Roles are **functions/modules for configuration**: one responsibility, a clean `defaults`
> interface, auto-discovered structure, composed by a thin `site.yml`. Reuse **vetted Galaxy
> roles** (pinned) instead of reinventing, separate **inventories/group_vars per environment**,
> and keep data out of roles. This structure is what lets configuration scale across many
> services and teams — and it mirrors the modularity you learned in Terraform.

## What's next

Next: **Lesson 1505 — Orchestrating Real Deployments.** Put it together: multi-tier deployments,
controlling execution (serial/rolling, run_once, delegation), error handling (block/rescue,
failed_when), tags and limits, and orchestrating a zero-downtime application deployment across a
fleet.
