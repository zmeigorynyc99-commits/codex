---
title: "Ansible — Vault & Secrets Management"
slug: "ansible-vault-and-secrets-management"
track: "config-ansible"
trackName: "Configuration Management (Ansible)"
module: "Ansible in Practice"
order: 1506
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [ansible, vault, secrets, encryption, security, vault-id]
cover: "/covers/curriculum/config-ansible.svg"
estMinutes: 50
status: "published"
summary: "Handle sensitive data safely: encrypting secrets with Ansible Vault, encrypting variables and whole files, vault IDs for multiple environments, password management in CI, integrating external secret stores, and keeping credentials out of plaintext in your repository."
seoTitle: "Ansible 6: Vault & Secrets Management (encrypt vars/files, vault-id)"
seoDescription: "Ansible Vault: encrypt variables and files, encrypt_string, vault IDs, password management in CI, and external secret stores. Hands-on lab and assessment."
---

Playbooks need secrets — database passwords, API keys, certificates — but you **cannot commit
them in plaintext** to Git (recall the security and CI/CD lessons). **Ansible Vault** is the
built-in answer: it **encrypts** sensitive variables and files so they're safe to store in your
repository alongside everything else, decrypting them only at runtime with a password. This
lesson covers encrypting variables and files, **vault IDs** for multiple environments, managing
the vault password (especially in CI), and when to reach for an **external secrets manager**
instead.

## Learning objectives

By the end of this lesson you will be able to:

- Encrypt and decrypt files and variables with **Ansible Vault**.
- Use **`encrypt_string`** for inline encrypted values.
- Run playbooks that **decrypt at runtime** (password prompt/file).
- Use **vault IDs** for multiple environments.
- Manage the vault password in **CI** and know when to use **external secret stores**.

## Part 1 — Why Vault

The problem: a playbook references `db_password`, which must live *somewhere*. Plaintext in
`group_vars` → committed to Git → leaked. **Ansible Vault** lets you **encrypt** that value/file
so the **ciphertext** is what's committed, and Ansible decrypts it at runtime using a password
you supply out-of-band:

```text
   group_vars/prod/secrets.yml   →  encrypted with Vault  →  safe in Git (ciphertext)
        │ at runtime
   ansible-playbook --ask-vault-pass  →  decrypts in memory  →  uses the real value
```

This keeps **everything in one Git repo** (config + encrypted secrets) without leaking — the
secret is never in plaintext on disk in the repo.

## Part 2 — Encrypting files

```bash
# Create a new encrypted file (opens your editor; content saved encrypted)
ansible-vault create group_vars/prod/secrets.yml

# Encrypt an existing plaintext file in place
ansible-vault encrypt group_vars/prod/secrets.yml

# View / edit / decrypt
ansible-vault view  group_vars/prod/secrets.yml
ansible-vault edit  group_vars/prod/secrets.yml      # edit without leaving plaintext on disk
ansible-vault decrypt group_vars/prod/secrets.yml    # back to plaintext (careful!)
ansible-vault rekey group_vars/prod/secrets.yml      # change the password
```

An encrypted file looks like `$ANSIBLE_VAULT;1.1;AES256\n6230...` — opaque ciphertext, safe to
commit. The file still contains normal YAML variables; they're just encrypted at rest and
decrypted when Ansible loads them.

## Part 3 — Encrypting single values (encrypt_string)

Encrypting a whole file is overkill when only **one value** is secret. **`encrypt_string`**
produces an encrypted value you paste **inline** in an otherwise-plaintext vars file:

```bash
ansible-vault encrypt_string 's3cr3t-password' --name 'db_password'
```

```yaml
# group_vars/prod/vars.yml  (mostly plaintext, one encrypted value)
db_host: db01.prod
db_user: app
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  39626436...   (the encrypted blob)
```

This keeps non-secret config **readable in diffs** while only the sensitive value is encrypted —
the recommended pattern. A common convention: keep plaintext vars in `vars.yml` and encrypted
secrets in `vault.yml`, referencing the vault vars from the plaintext ones.

> [!TIP]
> Prefer **`encrypt_string` for individual secrets** (or a dedicated `vault.yml`) over
> encrypting entire files of mixed config. That way your normal variables stay **readable in
> code review and git diffs**, and only the truly sensitive values are opaque. A clean
> convention: `group_vars/prod/vars.yml` (plaintext, references) + `group_vars/prod/vault.yml`
> (encrypted secrets). Reviewers see what changed; secrets stay encrypted.

## Part 4 — Running with Vault and vault IDs

Ansible needs the password at runtime to decrypt:

```bash
ansible-playbook site.yml --ask-vault-pass            # prompt for the password
ansible-playbook site.yml --vault-password-file ~/.vault_pass   # read from a file (CI-friendly)
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass      # or via env/ansible.cfg
```

**Vault IDs** let you use **different passwords per environment** (so dev and prod secrets have
separate keys):

```bash
# Encrypt with a labeled vault id
ansible-vault encrypt --vault-id prod@prompt group_vars/prod/vault.yml
ansible-vault encrypt --vault-id dev@~/.vault_dev  group_vars/dev/vault.yml

# Provide multiple vault ids at run time
ansible-playbook site.yml --vault-id dev@~/.vault_dev --vault-id prod@prompt
```

Vault IDs mean a compromised dev password doesn't expose prod secrets — separate keys per
environment, least privilege applied to secrets.

## Part 5 — Password management, CI, and external stores

The vault password itself is a secret — manage it carefully:

```text
□ DON'T commit the vault password file (gitignore it)
□ In CI: store the vault password in the CI SECRET store; write it to a temp file or use
  --vault-password-file pointing at it; never echo it
□ Use a password SCRIPT (--vault-password-file can be an executable) to fetch from a manager
□ Rotate with `ansible-vault rekey` if exposed (and rotate the underlying secrets too)
```

```bash
# CI example: write the password from a CI secret to a file, then use it
echo "$ANSIBLE_VAULT_PASSWORD" > .vault_pass && chmod 600 .vault_pass
ansible-playbook site.yml --vault-password-file .vault_pass
rm -f .vault_pass
```

When to use **external secret managers** (Vault by HashiCorp, AWS/GCP/Azure secret stores)
instead: when secrets are **shared across tools**, need **dynamic/short-lived** credentials,
central rotation, or audit. Ansible can **fetch** from them at runtime (lookup plugins). Ansible
Vault is great for **repo-local** secrets; external managers for **organization-wide** secret
infrastructure — often you use both.

> [!IMPORTANT]
> Ansible Vault protects secrets **at rest in your repo**, but the **vault password** is now the
> key to everything — guard it like a root credential. **Never commit it**; in CI, source it
> from the platform's secret store and avoid leaving it on disk. Use **vault IDs** so
> environments have **separate** passwords (least privilege). For secrets shared across many
> tools or needing dynamic rotation, integrate a real **secrets manager** (Vault/cloud) rather
> than stretching Ansible Vault to do everything. And if the password leaks: **rekey AND rotate
> the secrets**, because the ciphertext may already be in git history.

## Hands-on lab

```bash
mkdir vault-lab && cd vault-lab
echo ".vault_pass" > .gitignore         # NEVER commit the password

# 1. Set a vault password (file-based for the lab)
echo "labpassword123" > .vault_pass && chmod 600 .vault_pass

# 2. Encrypt a single value with encrypt_string (the recommended pattern)
ansible-vault encrypt_string --vault-password-file .vault_pass 's3cr3t-db-pass' --name 'db_password' \
  > vault_value.txt
cat vault_value.txt                      # the !vault encrypted blob to paste into vars

# 3. Create an encrypted vars file
cat > secrets_plain.yml <<'EOF'
api_key: "AKIA-super-secret-123"
db_password: "s3cr3t-db-pass"
EOF
ansible-vault encrypt --vault-password-file .vault_pass secrets_plain.yml
head -1 secrets_plain.yml                # $ANSIBLE_VAULT;1.1;AES256... (ciphertext)

# 4. View it (decrypted) without leaving plaintext on disk
ansible-vault view --vault-password-file .vault_pass secrets_plain.yml

# 5. Use it in a playbook that decrypts at runtime
cat > inventory.ini <<'EOF'
[local]
localhost ansible_connection=local
EOF
cat > use.yml <<'EOF'
- hosts: local
  vars_files: [secrets_plain.yml]
  tasks:
    - name: Show that the secret is usable (DON'T do this in real life)
      ansible.builtin.debug:
        msg: "db_password length is {{ db_password | length }}"   # use it, don't print it
EOF
ansible-playbook -i inventory.ini use.yml --vault-password-file .vault_pass

# 6. Rekey (rotate the vault password)
echo "newpassword456" > .vault_pass_new
ansible-vault rekey --vault-password-file .vault_pass --new-vault-password-file .vault_pass_new secrets_plain.yml

# cleanup
rm -f .vault_pass .vault_pass_new vault_value.txt secrets_plain.yml
```

## Exercises

1. Explain why secrets can't be committed in plaintext and how Vault solves it.
2. Encrypt a whole file and view/edit it without leaving plaintext on disk.
3. Use `encrypt_string` to encrypt a single value and embed it in a plaintext vars file;
   explain why that's preferred.
4. Run a playbook that decrypts vault content at runtime via a password file.
5. Set up two vault IDs (dev/prod) and explain the security benefit.
6. Describe how you'd supply the vault password in CI without committing it, and when to use an
   external secrets manager.

## Troubleshooting

- **"Attempting to decrypt but no vault secrets found"** — no password given. *Fix:*
  `--ask-vault-pass`/`--vault-password-file`/env.
- **Wrong password** — decryption fails. *Fix:* use the correct vault id/password; rekey if
  forgotten (need the old one).
- **Secret in git history (plaintext)** — committed before encrypting. *Fix:* rotate the secret;
  purge history; encrypt going forward.
- **Vault password committed** — leak. *Fix:* gitignore it; rekey + rotate; store in CI secrets.
- **Whole file encrypted, unreadable diffs** — over-encrypted. *Fix:* `encrypt_string`/separate
  `vault.yml` for just secrets.
- **CI can't decrypt** — password not provided. *Fix:* write CI secret to a temp file for
  `--vault-password-file`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What problem does Ansible Vault solve?
2. How do you encrypt and view a file?
3. What does `encrypt_string` do, and why prefer it for single secrets?
4. How does Ansible get the password at runtime?
5. What are vault IDs for?
6. How do you manage the vault password in CI?
7. When use an external secrets manager instead of Vault?
8. If the vault password leaks, what must you do?
9. **Practical:** encrypt a value and use it in a playbook at runtime.
10. **Practical:** rekey an encrypted file.

## Solutions & validation

1. Lets you store **encrypted** secrets safely in Git (decrypted only at runtime).
2. `ansible-vault encrypt <file>`; `ansible-vault view`/`edit`.
3. Encrypts a **single value** for inline use — keeps non-secret config **readable in diffs**.
4. Via `--ask-vault-pass`, `--vault-password-file`, or `ANSIBLE_VAULT_PASSWORD_FILE`.
5. **Separate passwords per environment** (dev/prod) — least privilege/isolation.
6. Store it in the **CI secret store**; write to a temp file for `--vault-password-file`; don't
   commit/echo.
7. For **shared/dynamic/centrally-rotated/audited** secrets across many tools.
8. **Rekey** the vault **and rotate the underlying secrets** (ciphertext may be in history).
9. **Validation:** playbook uses `db_password` after decrypting with the password file (see
   lab).
10. **Validation:** `ansible-vault rekey` changes the password successfully.

> [!TIP]
> Keep secrets in the repo **only encrypted**: use **`encrypt_string`/a `vault.yml`** so diffs
> stay readable, **vault IDs** for per-environment keys, and treat the **vault password as a
> root credential** (never committed, sourced from CI secrets, rotated on leak). For
> organization-wide or dynamic secrets, integrate a real **secrets manager**. This is the
> security track's secret-hygiene applied to configuration management.

## What's next

Next: **Lesson 1507 — Testing & Quality (Molecule, lint).** Make roles and playbooks reliable:
syntax checks and ansible-lint, idempotence testing, Molecule for testing roles in containers,
check mode in CI, and a quality workflow that catches problems before they hit production.
