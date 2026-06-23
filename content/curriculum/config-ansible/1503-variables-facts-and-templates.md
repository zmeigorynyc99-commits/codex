---
title: "Ansible — Variables, Facts & Templates"
slug: "ansible-variables-facts-and-templates"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible Language"
order: 1503
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, variables, facts, jinja2, templates, conditionals]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 60
status: "published"
summary: "Make playbooks dynamic and reusable: variables and their precedence, gathered facts about hosts, Jinja2 templates to render config files per host, conditionals (when) and loops, and group_vars/host_vars for clean per-host and per-environment configuration."
seoTitle: "Ansible 3: Variables, Facts & Templates (Jinja2, group_vars)"
seoDescription: "Ansible variables and precedence, facts via setup, Jinja2 templates, when conditionals, loops, and group_vars/host_vars for per-environment config. Hands-on lab and assessment."
---

Static playbooks that hardcode values can't serve different hosts or environments. Ansible
becomes powerful when playbooks are **dynamic**: **variables** parameterize them, **facts**
provide automatically-gathered information about each host, **Jinja2 templates** render config
files customized per host, and **conditionals/loops** add logic. This lesson also covers
**`group_vars`/`host_vars`** — the clean way to set per-group and per-host configuration — so
one playbook configures your whole fleet correctly.

## Learning objectives

By the end of this lesson you will be able to:

- Define and reference **variables**; understand **precedence**.
- Use **facts** gathered about hosts.
- Render **Jinja2 templates** for per-host config files.
- Use **`when`** conditionals and **loops**.
- Organize variables with **`group_vars`/`host_vars`**.

## Part 1 — Variables

Variables can be defined in many places and referenced with **`{{ }}`** (Jinja2):

```yaml
- hosts: web
  vars:                                    # play-level vars
    app_port: 8080
    packages: [nginx, git, curl]
  tasks:
    - name: Show the port
      ansible.builtin.debug:
        msg: "App will run on port {{ app_port }}"   # reference with {{ }}
```

```bash
ansible-playbook site.yml -e "app_port=9090"        # extra vars (-e) — HIGHEST precedence
ansible-playbook site.yml -e "@prod_vars.yml"        # vars from a file
```

Variables can live in: play `vars`, `vars_files`, `group_vars/`, `host_vars/`, inventory, role
defaults/vars, registered task results, and `-e` extra vars. Names use underscores; reference
with `{{ var }}` (quote when a value **starts** with `{{ }}` in YAML).

## Part 2 — Variable precedence

When the same variable is set in multiple places, **precedence** decides which wins. The
practical highlights (low → high):

```text
role defaults  <  inventory/group_vars  <  host_vars  <  play vars  <  task vars  <  -e extra vars
   (weakest, easily overridden)                                          (always wins)
```

- **Role `defaults`** — lowest; meant to be overridden (sensible fallbacks).
- **`group_vars` / `host_vars`** — the everyday way to set per-environment/per-host values.
- **`-e` extra vars** — highest; overrides everything (good for one-off overrides, CI inputs).

> [!IMPORTANT]
> When a variable "won't change," it's almost always **precedence** — something higher is
> overriding you. Remember the practical order: **role defaults are weakest**, **`-e` extra
> vars always win**, and **`host_vars` beats `group_vars`** (more specific wins). Set
> per-environment values in **`group_vars`**, per-host exceptions in **`host_vars`**, keep
> overridable fallbacks in role **`defaults`**, and use **`-e`** for deliberate one-off
> overrides. When confused, run with `--extra-vars` debug or `ansible-inventory --host <h>` to
> see resolved values.

## Part 3 — Facts

Before running tasks, Ansible **gathers facts** — a large dictionary of information about each
host (OS, IPs, memory, CPU, mounts, hostname):

```yaml
- hosts: all
  tasks:
    - name: Show some facts
      ansible.builtin.debug:
        msg: "{{ ansible_distribution }} {{ ansible_distribution_version }} on {{ ansible_hostname }}"
    - name: Use a fact in a condition
      ansible.builtin.apt: { name: nginx, state: present }
      when: ansible_distribution == "Ubuntu"
```

```bash
ansible all -m setup                              # dump ALL facts for a host
ansible all -m setup -a "filter=ansible_mem*"     # filter facts
```

Facts make playbooks **adaptive** — install the right package for the OS, size config to the
host's memory, use the host's IP in a template. Disable with `gather_facts: false` for speed
when you don't need them. You can also **set custom facts** and **register** task output as
variables.

## Part 4 — Jinja2 templates

The **`template`** module renders a **Jinja2** (`.j2`) file with variables/facts and copies the
result to the host — the idiomatic way to manage config files that differ per host:

```jinja
# templates/nginx.conf.j2
server {
    listen {{ app_port }};
    server_name {{ ansible_hostname }};
    root {{ doc_root }};
    worker_processes {{ ansible_processor_vcpus }};   # sized from a host FACT
    {% for upstream in backends %}
    # backend: {{ upstream }}
    {% endfor %}
}
```

```yaml
    - name: Render nginx config
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Reload nginx
```

Jinja2 supports `{{ variables }}`, `{% for %}`/`{% if %}` logic, and **filters**
(`{{ name | upper }}`, `{{ list | join(',') }}`, `{{ value | default('x') }}`). Templates are
idempotent (only changed if the rendered output differs) and pair with handlers for
change-triggered reloads.

## Part 5 — Conditionals, loops, and group_vars/host_vars

```yaml
  tasks:
    - name: Install on Debian family only
      ansible.builtin.apt: { name: nginx, state: present }
      when: ansible_os_family == "Debian"          # CONDITIONAL

    - name: Install several packages (LOOP)
      ansible.builtin.apt: { name: "{{ item }}", state: present }
      loop: "{{ packages }}"                        # item = each element

    - name: Create users
      ansible.builtin.user: { name: "{{ item.name }}", groups: "{{ item.groups }}" }
      loop:
        - { name: alice, groups: sudo }
        - { name: bob,   groups: docker }
```

Organize variables by **directory convention** so Ansible loads them automatically:

```text
inventory.ini
group_vars/
  all.yml            # vars for ALL hosts
  web.yml            # vars for the 'web' group
  production.yml     # vars for the 'production' group
host_vars/
  web01.yml          # vars for the host 'web01' (most specific)
```

This is the clean pattern: **per-environment config in `group_vars`**, **per-host exceptions in
`host_vars`**, no values hardcoded in playbooks — one playbook, correct everywhere.

> [!TIP]
> Keep playbooks **logic, not data**: put values in **`group_vars`/`host_vars`** (auto-loaded by
> group/host name), reference them in tasks and **templates**, and let **facts** adapt to each
> host. A single `webserver.yml` then configures dev and prod correctly because their
> `group_vars` differ — the IaC/12-factor idea again. Use `when` for OS/role differences and
> `loop` to avoid repeating tasks.

## Hands-on lab

```bash
cat > inventory.ini <<'EOF'
[local]
localhost ansible_connection=local
EOF
mkdir -p templates group_vars

# 1. group_vars auto-loaded for the 'local' group
cat > group_vars/local.yml <<'EOF'
app_port: 8080
packages: [curl, git]
greeting: "hello from group_vars"
EOF

# 2. A Jinja2 template using vars + a FACT + a loop
cat > templates/app.conf.j2 <<'EOF'
# rendered by Ansible on {{ ansible_hostname }} ({{ ansible_distribution | default('unknown') }})
port = {{ app_port }}
note = {{ greeting | upper }}
{% for p in packages %}
package = {{ p }}
{% endfor %}
EOF

cat > play.yml <<'EOF'
- hosts: local
  tasks:
    - name: Show a fact and a var
      ansible.builtin.debug:
        msg: "{{ ansible_hostname }} port={{ app_port }}"
    - name: Render the template
      ansible.builtin.template: { src: templates/app.conf.j2, dest: /tmp/app.conf }
    - name: Loop to create files
      ansible.builtin.copy: { content: "pkg {{ item }}\n", dest: "/tmp/{{ item }}.txt" }
      loop: "{{ packages }}"
    - name: Conditional (only on Linux)
      ansible.builtin.debug: { msg: "running on Linux" }
      when: ansible_system == "Linux"
EOF

# 3. Run it and inspect the rendered template
ansible-playbook -i inventory.ini play.yml
echo "----"; cat /tmp/app.conf

# 4. Override a var with -e (highest precedence) and re-render
ansible-playbook -i inventory.ini play.yml -e "app_port=9999"
grep port /tmp/app.conf            # now 9999 — extra vars won

# 5. See gathered facts
ansible local -i inventory.ini -m setup -a "filter=ansible_distribution*"
rm -f /tmp/app.conf /tmp/curl.txt /tmp/git.txt
```

## Exercises

1. Define variables in three places (play vars, group_vars, `-e`) and show which wins.
2. Use a host fact in a `when` condition and in a template.
3. Write a Jinja2 template that loops over a list variable and uses a filter (e.g. `upper`/
   `default`).
4. Use a `loop` to install/create several items from a list variable.
5. Organize per-group and per-host variables with `group_vars`/`host_vars` and reference them.
6. Demonstrate variable precedence resolving an override and explain the order.

## Troubleshooting

- **Variable not interpolating** — missing `{{ }}` or wrong context. *Fix:* `{{ var }}`; quote
  YAML values that start with `{{`.
- **Wrong value used** — precedence. *Fix:* recall order; `-e` wins; host_vars beats
  group_vars; check `ansible-inventory --host`.
- **Fact is empty** — facts not gathered. *Fix:* ensure `gather_facts: true` (default); check
  the exact fact name via `-m setup`.
- **Template renders blank/var** — undefined variable. *Fix:* define it or use `| default(...)`.
- **group_vars not loaded** — wrong filename/location. *Fix:* `group_vars/<groupname>.yml` next
  to the inventory/playbook.
- **Loop item undefined** — used `item` outside a loop. *Fix:* `item`/`item.field` only inside a
  `loop`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. How do you reference a variable, and name three places vars can be defined.
2. State the practical precedence order (low → high) for the key sources.
3. What are facts, and how do you view them?
4. What does the `template` module do, and why is it idempotent?
5. Give a Jinja2 loop and a filter example.
6. What does `when` do? Give a fact-based example.
7. What are `group_vars`/`host_vars` for, and which is more specific?
8. Which variable source always wins?
9. **Practical:** render a template using a var and a fact.
10. **Practical:** override a variable with `-e` and show it took effect.

## Solutions & validation

1. `{{ var }}`; e.g. play `vars`, `group_vars`, `host_vars`, `-e`, inventory (any three).
2. role defaults < group_vars < host_vars < play vars < task vars < **`-e` extra vars**.
3. Auto-gathered host info; view with `ansible <h> -m setup` (filterable).
4. Renders a **Jinja2** template with vars/facts to a file; idempotent (changes only if output
   differs).
5. `{% for x in list %}...{% endfor %}`; `{{ name | upper }}` / `{{ v | default('x') }}`.
6. Runs a task only if a condition is true; e.g. `when: ansible_os_family == "Debian"`.
7. Per-group / per-host variable files (auto-loaded); **host_vars** is more specific (wins).
8. **`-e` extra vars.**
9. **Validation:** rendered `/tmp/app.conf` shows the port var + hostname fact (see lab).
10. **Validation:** `-e app_port=9999` makes the template show 9999.

> [!TIP]
> Dynamic playbooks = **data in `group_vars`/`host_vars`, logic in tasks, per-host config via
> templates + facts**. Keep playbooks free of hardcoded values, lean on **precedence** (set
> defaults low, override high), and use `when`/`loop` for variation. One well-parameterized
> playbook then correctly configures every host and environment — the payoff of treating
> configuration as code.

## What's next

Next: **Lesson 1504 — Roles & Reusable Structure.** Scale playbooks into maintainable
components: role anatomy (tasks/handlers/templates/defaults/vars), creating and using roles,
Ansible Galaxy, dependencies, and structuring a real project so configuration is reusable and
shareable.
