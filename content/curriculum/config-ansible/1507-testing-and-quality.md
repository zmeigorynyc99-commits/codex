---
title: "Ansible — Testing & Quality"
slug: "ansible-testing-and-quality"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible in Practice"
order: 1507
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, testing, molecule, ansible-lint, idempotence, ci]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 55
status: "published"
summary: "Make roles and playbooks reliable: syntax checks, ansible-lint and yamllint, idempotence testing, Molecule for testing roles in containers, check mode in CI, and a quality workflow that catches problems before they reach production servers."
seoTitle: "Ansible 7: Testing & Quality (Molecule, ansible-lint, idempotence)"
seoDescription: "Ansible testing: syntax-check, yamllint/ansible-lint, idempotence testing, Molecule role testing in containers, check mode, and a CI quality workflow. Lab and assessment."
---

Configuration code runs as **root on your servers** — a bad playbook can break a fleet. So
Ansible code deserves the same testing discipline as application code (recall the CI/CD testing
lesson). This lesson covers the **testing ladder** for Ansible: **syntax checks**, **linting**
(yamllint, ansible-lint), **idempotence testing**, and **Molecule** — the standard framework for
testing roles in throwaway containers (converge → verify → idempotence → destroy). Plus running
these as **CI gates** so problems are caught before they touch production.

## Learning objectives

By the end of this lesson you will be able to:

- Run **syntax checks** and **`--check`** mode.
- Lint with **yamllint** and **ansible-lint**.
- Test **idempotence** (a second run = `changed=0`).
- Use **Molecule** to test roles in containers.
- Wire Ansible quality checks into **CI**.

## Part 1 — The testing ladder

From cheapest/fastest to most thorough — the same shift-left idea as application CI:

```text
1. yamllint              YAML formatting/syntax (instant)
2. ansible-playbook --syntax-check   playbook structure is valid
3. ansible-lint          best practices, deprecations, anti-patterns
4. --check --diff        dry run: what WOULD change
5. idempotence test      run twice -> second run must be changed=0
6. Molecule              spin up real containers, converge, VERIFY, destroy
```

Each rung catches different problems; run the cheap ones on every commit and the expensive ones
(Molecule) in CI. The goal is the same as all testing: **catch problems before production**.

## Part 2 — Syntax checks and check mode

```bash
ansible-playbook site.yml --syntax-check          # validates structure (no execution)
ansible-playbook site.yml --list-tasks            # preview the tasks
ansible-playbook site.yml --check --diff          # DRY RUN: report intended changes + diffs
ansible-inventory -i inventory.ini --graph        # verify inventory/groups resolve
```

`--syntax-check` catches YAML/structure errors instantly. **`--check`** (dry run) is invaluable
before running against important hosts — it reports what would change **without changing
anything** (note: some modules can't fully predict in check mode). Pair with `--diff` to see the
exact file changes.

## Part 3 — Linting

**yamllint** checks YAML style; **ansible-lint** checks Ansible-specific best practices and
catches real bugs:

```bash
pip install ansible-lint yamllint
yamllint .                         # indentation, line length, trailing spaces
ansible-lint site.yml              # best practices, deprecations, risky patterns
ansible-lint                       # lints the whole project (roles, playbooks)
```

ansible-lint flags things like: using `command` where a module exists, missing task `name`s,
unpinned `latest` package versions, deprecated syntax, hardcoded secrets, non-idempotent
patterns, and permission issues. It encodes hard-won community conventions — fixing its warnings
genuinely improves reliability.

> [!TIP]
> Run **`ansible-lint`** early and treat its findings as real: it catches the exact mistakes
> that cause flaky, non-idempotent, or insecure playbooks — `command` instead of a module,
> missing names, `package: state=latest` (non-deterministic), deprecated modules, world-readable
> permissions. It's the Ansible equivalent of a SAST/linter gate. Add a `.ansible-lint` config
> to tune rules to your team, but resist silencing warnings you simply don't want to fix.

## Part 4 — Idempotence testing

The defining property of good Ansible: a **second run changes nothing**. Test it explicitly:

```bash
ansible-playbook site.yml                          # first run: makes changes
ansible-playbook site.yml | tee run2.txt           # second run...
grep -E "changed=[1-9]" run2.txt && echo "NOT idempotent!" || echo "idempotent ✓"
#   pass = "changed=0" for every host on the second run
```

If the second run reports changes, something is **non-idempotent** — usually `command`/`shell`
without guards, `state: latest` (re-checks/updates every time), templates with non-deterministic
content (timestamps), or owner/mode mismatches. Idempotence testing is the single most important
Ansible test — Molecule automates exactly this.

## Part 5 — Molecule

**Molecule** is the standard role-testing framework. It spins up a clean container, runs your
role, verifies the result, and checks idempotence — all automatically:

```bash
pip install molecule molecule-plugins[docker]
cd roles/myrole
molecule init scenario               # creates molecule/default/ (converge.yml, verify.yml, ...)
molecule test                        # the full cycle (below)
```

The `molecule test` sequence:

```text
create     → start a fresh container (the "server")
converge   → run the role against it (does it apply cleanly?)
idempotence→ run AGAIN → must report changed=0 (the key test)
verify     → run assertions (service running? file exists? port open?) — testinfra/ansible
destroy    → tear down the container
```

```yaml
# molecule/default/verify.yml — assert the role did its job
- hosts: all
  tasks:
    - name: Check nginx is running
      ansible.builtin.service_facts:
    - assert:
        that: "ansible_facts.services['nginx.service'].state == 'running'"
```

Molecule gives roles **real, automated, repeatable tests** in disposable infrastructure — so you
can refactor a role and *prove* it still converges, stays idempotent, and produces the desired
state, before it ever touches production.

> [!IMPORTANT]
> **Molecule's idempotence step is the test that matters most** — it runs your role twice in a
> clean container and fails if the second run reports any change. Combined with **verify**
> assertions (the service is actually running, the file actually exists), it proves your role
> *works* and is *safe to re-run*, not just that it parses. Test critical/shared roles with
> Molecule in CI; it's the difference between "the YAML is valid" and "this role reliably
> produces the desired state."

## Part 6 — CI workflow

```yaml
# .github/workflows/ansible.yml (sketch)
jobs:
  lint:
    steps:
      - uses: actions/checkout@v4
      - run: pip install ansible ansible-lint yamllint
      - run: yamllint .
      - run: ansible-lint
      - run: ansible-playbook site.yml --syntax-check
  molecule:
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - run: pip install molecule molecule-plugins[docker] ansible
      - run: cd roles/myrole && molecule test     # converge + idempotence + verify
```

Gate merges on lint + syntax (fast) and Molecule (thorough) — exactly the test-pyramid/quality-
gate pattern from CI/CD, applied to configuration management.

## Hands-on lab

```bash
mkdir ansible-test-lab && cd ansible-test-lab
pip install ansible ansible-lint yamllint -q

cat > inventory.ini <<'EOF'
[local]
localhost ansible_connection=local
EOF

# 1. A playbook with a deliberate lint smell (command instead of a module)
cat > site.yml <<'EOF'
- hosts: local
  tasks:
    - name: Make a dir the WRONG way (lint will flag this)
      ansible.builtin.command: mkdir -p /tmp/lab
    - name: Make a dir the right (idempotent) way
      ansible.builtin.file: { path: /tmp/lab2, state: directory }
EOF

# 2. Syntax check + lint
ansible-playbook site.yml --syntax-check
yamllint site.yml || true
ansible-lint site.yml || echo ">> ansible-lint flagged the command task (use the file module)"

# 3. Dry run
ansible-playbook -i inventory.ini site.yml --check --diff

# 4. Idempotence test (the command task will be 'changed' every run -> NOT idempotent)
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml | tee run2.txt
grep -qE "changed=[1-9]" run2.txt && echo ">> NOT idempotent (fix the command task)" || echo "idempotent ✓"

# 5. Fix it: replace the command with the file module, re-test idempotence
sed -i '/Make a dir the WRONG way/,+1d' site.yml
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml | tee run3.txt
grep -qE "changed=[1-9]" run3.txt && echo "still not idempotent" || echo "idempotent ✓"

# 6. (Concept) Molecule: cd roles/<role> && molecule init scenario && molecule test
rm -rf /tmp/lab /tmp/lab2 run2.txt run3.txt
```

## Exercises

1. List the Ansible testing ladder from cheapest to most thorough.
2. Run `--syntax-check` and `--check --diff` on a playbook and explain each.
3. Lint a playbook with ansible-lint; fix one flagged issue (e.g. `command` → module).
4. Write an idempotence test that fails on a non-idempotent task, then make it pass.
5. Describe the Molecule `test` sequence and which step is most important.
6. Sketch a CI workflow gating merges on lint + syntax + Molecule.

## Troubleshooting

- **Playbook fails on real hosts but "looked fine"** — no testing. *Fix:* syntax-check + lint +
  `--check` + idempotence before prod.
- **Second run shows changes** — non-idempotent task. *Fix:* purpose-built module / guards;
  avoid `state: latest`.
- **ansible-lint noisy** — default rules. *Fix:* `.ansible-lint` config to tune, but fix real
  issues.
- **Molecule can't start containers** — docker/driver missing. *Fix:* install
  `molecule-plugins[docker]` + Docker.
- **Check mode misleading** — some modules can't predict. *Fix:* combine with Molecule's real
  convergence.
- **Tests pass but role does nothing useful** — no verify assertions. *Fix:* add `verify.yml`
  checks (service running, file present).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Name the Ansible testing ladder rungs.
2. What does `--syntax-check` vs `--check` do?
3. What does ansible-lint catch? Give two examples.
4. How do you test idempotence, and what's the passing condition?
5. What is Molecule, and what does `molecule test` do?
6. Which Molecule step is most important and why?
7. What does a Molecule `verify` step add?
8. How do these map onto a CI quality gate?
9. **Practical:** make a non-idempotent task and fix it (verified by re-run).
10. **Practical:** run ansible-lint and fix one finding.

## Solutions & validation

1. yamllint → `--syntax-check` → ansible-lint → `--check --diff` → idempotence → Molecule.
2. `--syntax-check` validates structure; `--check` is a **dry run** reporting intended changes.
3. Best-practice/bug issues — e.g. `command` instead of a module, missing names, `state:latest`,
   deprecations.
4. Run **twice**; pass = **`changed=0`** on the second run.
5. A role-testing framework; `molecule test` = create → converge → **idempotence** → verify →
   destroy.
6. The **idempotence** step — proves the role is safe to re-run (no changes second time).
7. Real **assertions** that the desired state exists (service running, file present, port open).
8. Lint/syntax as fast gates, Molecule as the thorough gate — required checks before merge.
9. **Validation:** command task changes every run; file module → `changed=0` (see lab).
10. **Validation:** ansible-lint flags the `command` task; replacing it clears the warning.

> [!TIP]
> Test configuration code like application code: **lint early**, **dry-run with `--check`**,
> always verify **idempotence** (run twice → `changed=0`), and use **Molecule** to prove
> critical roles converge and stay idempotent in disposable containers. Wire it into CI as gates.
> Since playbooks run as root on your fleet, this testing is what stands between a refactor and a
> fleet-wide outage.

## What's next

Next: **Lesson 1508 — Best Practices & Troubleshooting.** Tie the track together: project
structure and conventions, debugging failed runs (verbosity, start-at-task, step), performance
(forks, fact caching, pipelining), idempotency pitfalls, integration with Terraform/CI, and a
production-readiness checklist.
