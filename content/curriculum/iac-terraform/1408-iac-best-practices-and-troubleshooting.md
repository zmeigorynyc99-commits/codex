---
title: "Terraform — Best Practices & Troubleshooting"
slug: "terraform-best-practices-and-troubleshooting"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform in Practice"
order: 1408
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, best-practices, troubleshooting, drift, import, testing]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 60
status: "published"
summary: "Tie the track together: project structure and naming, secret handling, drift management, importing existing infrastructure, debugging plan/apply failures, testing IaC (validate/plan/Terratest/policy), and a production-readiness checklist for infrastructure as code."
seoTitle: "Terraform 8: Best Practices & Troubleshooting (drift, import, testing)"
seoDescription: "Terraform best practices: structure/naming, secrets, drift, import, debugging plan/apply, testing IaC (Terratest/policy), and a readiness checklist. Capstone lab + assessment."
---

This capstone consolidates the track into the **habits and recovery skills** that separate
fragile IaC from production-grade infrastructure. We'll cover **project structure and naming**,
**secret handling**, **drift management**, **importing** existing (ClickOps'd) infrastructure,
**debugging** plan/apply failures, **testing** IaC, and a **production-readiness checklist**.
These are the practices that keep your infrastructure reproducible, safe to change, and
recoverable when things go sideways.

## Learning objectives

By the end of this lesson you will be able to:

- Apply sensible **project structure, naming, and tagging**.
- Handle **secrets** correctly in Terraform.
- Detect and resolve **drift**; **import** existing resources.
- **Debug** plan/apply failures methodically.
- **Test** IaC (validate/plan/policy/Terratest) and run a **readiness checklist**.

## Part 1 — Structure, naming, and tagging

```text
project/
├── modules/                 # reusable building blocks
├── envs/{dev,staging,prod}/ # per-env roots, separate state
├── versions.tf              # required_version + provider versions (pinned)
├── variables.tf  outputs.tf
├── main.tf
└── .terraform.lock.hcl      # COMMIT (reproducible provider versions)
```

- **Standard file names** (`main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`) so anyone
  can navigate.
- **Consistent resource naming** + **tags** on everything (`environment`, `team`, `managed_by =
  terraform`, `cost-center`) — essential for cost tracking, ownership, and finding things.
- **Pin** Terraform and provider versions; **commit the lock file**.
- Keep root modules **thin** (wire modules + env vars); put logic in **modules**.

## Part 2 — Secrets in Terraform

Two secret problems: secrets in **config** and secrets in **state**.

```text
✗ Hardcoded in .tf or committed .tfvars        → leak (Git history)
✗ Output without sensitive=true                 → printed in plan/CI logs
!  Secrets ALWAYS end up in STATE in plaintext  → so state must be encrypted + access-controlled
```

```hcl
variable "db_password" { type = string  sensitive = true }   # redacted in output
# Source the value from the environment / a secrets manager, never commit it:
#   export TF_VAR_db_password=...   (from CI secret store / Vault)
# Or read from a vault provider / cloud secrets manager via a data source:
data "aws_secretsmanager_secret_version" "db" { secret_id = "prod/db" }
```

Even with all that, the secret **lands in state in plaintext** (Lesson 1402) — so the
**encrypted, access-controlled remote backend** is non-negotiable. Best practice: source
secrets from a **dedicated secrets manager** at apply time and minimize what's stored.

> [!IMPORTANT]
> Two rules: **never commit secrets** to `.tf`/`.tfvars` (mark variables `sensitive`, source
> from env/Vault), and remember **secrets are written to state in plaintext** — so the state
> backend **must** be encrypted and tightly access-controlled. Anyone who can read state can
> read every secret. Prefer pulling secrets from a manager (Vault/cloud) over passing them
> through Terraform at all where possible.

## Part 3 — Drift and importing existing infrastructure

**Drift** (Lesson 1402) — reconcile with `plan`/`apply -refresh-only`; decide to re-apply
(override the manual change) or accept it (update config).

**Importing** brings existing, manually-created resources under Terraform management — common
when adopting IaC on an existing estate:

```bash
# 1. Write the resource block to match the existing thing
#    resource "aws_s3_bucket" "logs" { bucket = "my-existing-logs" }
# 2. Import it into state
terraform import aws_s3_bucket.logs my-existing-logs
# 3. terraform plan -> tweak HCL until the plan shows "No changes" (config matches reality)

# Terraform 1.5+: declarative import blocks (plannable, reviewable)
import {
  to = aws_s3_bucket.logs
  id = "my-existing-logs"
}
# and generate config: terraform plan -generate-config-out=generated.tf
```

The goal: after import, your HCL **matches** the live resource so `plan` is clean — then
Terraform owns it going forward. This is how you migrate from ClickOps to IaC incrementally.

## Part 4 — Debugging plan/apply failures

```bash
TF_LOG=DEBUG terraform plan 2> debug.log   # verbose provider/HTTP logs (TRACE for more)
terraform validate                          # syntax/type errors before planning
terraform plan                              # most errors surface here (good!)
terraform state list / show <addr>          # inspect what TF thinks exists
terraform refresh                           # (or plan) reconcile state with reality
terraform force-unlock <id>                 # release a stuck lock (verify nothing runs)
```

Common failures and fixes:

```text
"resource already exists"        → created outside TF → `terraform import` it
provider auth / 403               → credentials/region/permissions → fix env/role
cycle error                       → circular dependency → break it (refactor references)
"value depends on resource attrs" → for_each/count key not known at plan → use static keys
apply fails halfway               → partial state; re-plan, fix the failing resource, re-apply
"Error acquiring state lock"      → stuck lock → wait or force-unlock
```

Terraform's plan-first model means **most errors appear at plan** (before any change) — a big
safety advantage. When an apply fails partway, state reflects what succeeded; **re-plan** to see
remaining work and continue.

> [!TIP]
> Let the **plan be your debugger** — it catches most errors before touching infrastructure.
> For provider/API issues, **`TF_LOG=DEBUG`** reveals the actual API calls and responses. When
> an apply fails midway, don't panic or hand-edit state: **re-run plan** to see what's left,
> fix the offending resource, and apply again (Terraform is idempotent — it won't recreate what
> already succeeded). And for "already exists" errors, the answer is almost always
> **`import`**.

## Part 5 — Testing IaC and readiness

```text
TESTING LAYERS (cheap → thorough):
  terraform fmt -check / validate     syntax, formatting, types
  tflint                              best-practice/provider linting
  tfsec / checkov / conftest          security + policy-as-code (DevSecOps)
  terraform plan (review)             the change preview as a gate
  Terratest / `terraform test`        spin up real infra, assert, tear down (integration)
```

```text
TERRAFORM PRODUCTION-READINESS CHECKLIST (the whole track):
□ Remote, locked, encrypted, versioned state — separate per environment
□ Versions pinned (CLI + providers); .terraform.lock.hcl committed
□ Modules for reusable units; thin per-env roots; for_each over count
□ Secrets never in code/tfvars; sourced from env/Vault; state treated as sensitive
□ plan-on-PR / apply-on-merge in CI; apply the SAVED reviewed plan
□ fmt/validate/tflint/tfsec/policy gates as required checks
□ prevent_destroy on stateful/irreplaceable resources; always read the plan
□ Consistent naming + tags (environment/team/managed_by/cost-center)
□ Drift checked regularly; existing resources imported, not duplicated
□ Tested (validate/plan/policy, Terratest for critical modules)
```

## Hands-on lab

```bash
mkdir tf-capstone && cd tf-capstone
cat > versions.tf <<'EOF'
terraform {
  required_version = ">= 1.5"
  required_providers { local = { source = "hashicorp/local", version = "~> 2.0" } }
}
EOF
cat > main.tf <<'EOF'
variable "name" { type = string  default = "app" }
locals { tags = { managed_by = "terraform", env = "lab" } }
resource "local_file" "cfg" {
  filename = "${var.name}.conf"
  content  = "name=${var.name}\n"
  lifecycle { prevent_destroy = false }   # would be true for a real DB/state bucket
}
output "path" { value = local_file.cfg.filename }
EOF

# 1. Testing layers
terraform init
terraform fmt -check || terraform fmt
terraform validate
terraform plan -out=tfplan
terraform show -json tfplan > plan.json     # feed to conftest/policy in real CI
terraform apply tfplan

# 2. IMPORT an "existing" resource into state (simulate adopting ClickOps infra)
echo "name=manual" > manual.conf            # a file created OUTSIDE terraform
cat >> main.tf <<'EOF'
resource "local_file" "adopted" {
  filename = "manual.conf"
  content  = "name=manual\n"
}
EOF
terraform import local_file.adopted "manual.conf" 2>/dev/null || \
  echo "(local_file import is illustrative; real providers import by ID)"
terraform plan                               # goal: tweak HCL until "No changes"

# 3. Debug verbosely
TF_LOG=DEBUG terraform plan 2>debug.log >/dev/null; echo "debug lines: $(wc -l < debug.log)"

# 4. prevent_destroy demo on a "critical" resource
sed -i 's/prevent_destroy = false/prevent_destroy = true/' main.tf
terraform apply -auto-approve
terraform destroy -auto-approve || echo ">> destroy blocked by prevent_destroy (as intended)"
sed -i 's/prevent_destroy = true/prevent_destroy = false/' main.tf
terraform destroy -auto-approve
```

## Exercises

1. Lay out a production project structure with modules, per-env roots, and pinned versions.
2. Explain the two secret problems in Terraform and how you handle each.
3. Import an existing resource into state and iterate HCL until the plan is clean.
4. Detect drift and resolve it two ways (re-apply vs accept).
5. Debug a failing plan with `TF_LOG` and an "already exists" error; state the fix.
6. List the IaC testing layers and add two as CI gates.

## Troubleshooting

- **Secrets in state/Git** — *Fix:* encrypted backend + access control; `sensitive`; source
  from Vault; rotate leaked secrets.
- **"Already exists"** — created outside TF. *Fix:* `terraform import` (or import block).
- **Drift surprises** — manual changes. *Fix:* regular `plan`/refresh; re-apply or accept;
  reduce console access.
- **Apply failed halfway** — partial state. *Fix:* re-plan, fix the resource, re-apply
  (idempotent).
- **Accidental destroy of prod data** — *Fix:* `prevent_destroy`; read plans; backups/state
  versioning.
- **Non-reproducible across team/CI** — unpinned. *Fix:* pin versions; commit lock file.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's a sensible Terraform project structure, and what do you pin/commit?
2. Why tag and name resources consistently?
3. What are the two secret problems, and the fixes?
4. Why must state be encrypted even if you never output secrets?
5. How do you bring an existing resource under Terraform?
6. How do you debug a provider/API failure?
7. What happens to state when an apply fails partway, and how do you proceed?
8. Name three IaC testing layers.
9. **Practical:** import a resource and reach a clean plan.
10. **Practical:** show `prevent_destroy` protecting a resource.

## Solutions & validation

1. modules/ + per-env roots with separate state; pin CLI/providers; **commit
   `.terraform.lock.hcl`**.
2. Cost tracking, ownership, discoverability, and automation.
3. In **config** (don't commit; `sensitive`; env/Vault) and in **state** (encrypted, access-
   controlled backend).
4. Secrets are written to **state in plaintext** regardless of outputs.
5. **`terraform import`** (or a 1.5+ import block) + match HCL until plan is clean.
6. **`TF_LOG=DEBUG`** to see API calls; check auth/region/permissions.
7. State reflects what **succeeded**; **re-plan** to see remaining work and re-apply
   (idempotent).
8. fmt/validate, tflint, tfsec/policy, plan review, Terratest (any three).
9. **Validation:** post-import plan shows "No changes" once HCL matches.
10. **Validation:** `destroy` errors with `prevent_destroy = true`.

> [!TIP]
> Production IaC is **disciplined and recoverable**: structured/pinned/tagged, secrets out of
> code with an encrypted state backend, drift watched and existing resources **imported** (not
> duplicated), changes gated by plan review + policy, and stateful resources guarded by
> `prevent_destroy`. Let the **plan be your debugger** and remember Terraform is **idempotent**
> — most failures are recoverable by fixing and re-applying. Run the checklist before trusting
> any config with production.

## What's next

You've completed the **Infrastructure as Code (Terraform)** track — fundamentals, state, the
language, modules, real provisioning, team workflows, the IaC landscape, and best practices.
You can now provision infrastructure declaratively, reproducibly, and safely. Next in the
roadmap: **Configuration Management (Ansible)** — configuring what runs **inside** the machines
Terraform provisions — followed by the **cloud**, **observability**, and remaining platform
tracks.
