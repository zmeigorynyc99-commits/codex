---
title: "Terraform — Variables, Outputs & Expressions"
slug: "terraform-variables-outputs-and-expressions"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform Language"
order: 1403
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, variables, outputs, locals, for-each, count]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 60
status: "published"
summary: "Make configurations flexible and DRY: input variables with types and validation, locals, outputs, the expression language (functions, conditionals, for-expressions), and creating many resources without copy-paste using count and for_each."
seoTitle: "Terraform 3: Variables, Outputs & Expressions (for_each, locals)"
seoDescription: "Terraform language: input variables and validation, locals, outputs, functions and conditionals, for-expressions, and count vs for_each for multiple resources. Lab + assessment."
---

Hardcoded configurations don't scale across environments or teams. Terraform's language lets
you make configs **parameterized and DRY**: **input variables** (with types and validation) for
what changes between environments, **locals** for computed values, **outputs** to expose
results, a rich **expression language** (functions, conditionals, loops), and — crucially —
**`count`** and **`for_each`** to create many similar resources without copy-paste. This lesson
turns rigid configs into reusable ones.

## Learning objectives

By the end of this lesson you will be able to:

- Define **input variables** with types, defaults, and **validation**.
- Use **locals** for computed/repeated values and **outputs** to expose data.
- Apply **functions, conditionals, and for-expressions**.
- Create multiple resources with **`count`** and **`for_each`** (and know which to use).
- Supply variable values via files/CLI/env safely.

## Part 1 — Input variables

**Variables** parameterize a config — the knobs that differ between dev/staging/prod:

```hcl
variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "instance_count" {
  type    = number
  default = 2
}

variable "tags" {
  type    = map(string)
  default = { team = "platform" }
}
```

Reference them as **`var.<name>`**. Types (`string`, `number`, `bool`, `list()`, `map()`,
`object()`, `set()`) catch errors early; **`validation`** blocks reject bad inputs with a clear
message before anything is applied.

## Part 2 — Supplying variable values

```bash
terraform apply -var="environment=prod" -var="instance_count=5"   # CLI
terraform apply -var-file="prod.tfvars"                           # a file of values
export TF_VAR_environment=prod                                    # env var (TF_VAR_ prefix)
```

```hcl
# prod.tfvars
environment    = "prod"
instance_count = 5
tags           = { team = "platform", cost-center = "1234" }
```

Precedence (later wins): defaults → `terraform.tfvars`/`*.auto.tfvars` → `-var-file` → `-var`/
`TF_VAR_`. Use **`.tfvars` files per environment** for clean separation. **Never** put secrets
in committed `.tfvars` — mark sensitive variables and source secrets from a vault/env.

> [!TIP]
> Use a **`.tfvars` file per environment** (`dev.tfvars`, `prod.tfvars`) so one config serves
> all environments — the IaC version of 12-factor config. Mark secret variables
> **`sensitive = true`** so they're redacted in plan/output, and never commit secret values;
> source them from `TF_VAR_*` env vars (set by your CI/secrets manager) or a vault. Strong
> **types + validation** catch bad inputs at plan time instead of as a half-applied mess.

## Part 3 — Locals and outputs

**Locals** are computed/named values to avoid repetition; **outputs** expose results (to users,
CI, or other configs):

```hcl
locals {
  name_prefix = "${var.environment}-myapp"
  common_tags = merge(var.tags, { environment = var.environment, managed_by = "terraform" })
}

resource "local_file" "f" {
  filename = "${local.name_prefix}.txt"
  content  = "env=${var.environment}\n"
}

output "file_path" {
  value = local_file.f.filename
}
output "db_password" {
  value     = random_password.db.result
  sensitive = true                 # redacted in CLI output
}
```

Use **`local.<name>`** to reference locals. Outputs are how a config **publishes** values —
shown after apply, queryable with `terraform output`, and consumable by other configurations
(remote state).

## Part 4 — Expressions: functions, conditionals, loops

HCL has a real expression language:

```hcl
# Built-in functions (hundreds): string, collection, encoding, numeric, ...
upper(var.environment)                          # "PROD"
"${local.name_prefix}-${formatdate("YYYYMMDD", timestamp())}"
length(var.subnets)
merge(local.common_tags, { extra = "x" })
cidrsubnet("10.0.0.0/16", 8, 2)                 # -> 10.0.2.0/24

# Conditional (ternary)
instance_type = var.environment == "prod" ? "m5.large" : "t3.micro"

# for-expression: transform/filter collections
locals {
  upper_names = [for n in var.names : upper(n)]                       # list
  name_map    = { for n in var.names : n => length(n) }              # map
  prod_only   = [for s in var.servers : s.id if s.env == "prod"]      # filter
}
```

These let you compute values, pick configuration by environment, and reshape data — keeping
configs DRY and expressive without external scripting.

## Part 5 — count vs for_each

To create **many** similar resources without copy-paste:

```hcl
# count: N copies, indexed 0..N-1
resource "local_file" "numbered" {
  count    = var.instance_count
  filename = "server-${count.index}.txt"
  content  = "server ${count.index}\n"
}

# for_each: one resource PER item in a set/map (keyed by a stable key)
resource "local_file" "named" {
  for_each = toset(["web", "api", "worker"])
  filename = "${each.key}.txt"             # each.key / each.value
  content  = "role: ${each.key}\n"
}
```

- **`count`** — a number of identical copies; addressed by **index** (`[0]`, `[1]`).
- **`for_each`** — one per element of a **set/map**; addressed by **key** (`["web"]`).

The crucial difference: **count is index-based**, so removing an item in the middle **shifts**
all later indices → Terraform recreates resources. **for_each is key-based**, so removing one
item only destroys **that** resource. Prefer **`for_each`** for anything where items can be
added/removed.

> [!IMPORTANT]
> **Prefer `for_each` over `count` for collections of distinct things.** With `count`, deleting
> the 2nd of 5 items renumbers items 3–5, and Terraform **destroys and recreates** them (their
> index — their identity — changed). With `for_each`, each resource is keyed by a **stable
> name**, so removing one affects only that one. Reserve `count` for "N identical copies" or
> simple conditional creation (`count = var.enabled ? 1 : 0`); use `for_each` whenever items
> have identity.

## Hands-on lab

```bash
mkdir tf-vars-lab && cd tf-vars-lab
cat > main.tf <<'EOF'
terraform { required_providers { local = { source = "hashicorp/local" } } }

variable "environment" {
  type    = string
  default = "dev"
  validation {
    condition     = contains(["dev","staging","prod"], var.environment)
    error_message = "environment must be dev/staging/prod."
  }
}
variable "roles" { type = set(string)  default = ["web","api","worker"] }
variable "replicas" { type = number    default = 2 }

locals {
  prefix = "${var.environment}-app"
  size   = var.environment == "prod" ? "large" : "small"
}

# for_each: one file per role (key-based, stable identity)
resource "local_file" "role" {
  for_each = var.roles
  filename = "${local.prefix}-${each.key}.txt"
  content  = "role=${each.key} size=${local.size}\n"
}

# count: N identical replica files (index-based)
resource "local_file" "replica" {
  count    = var.replicas
  filename = "${local.prefix}-replica-${count.index}.txt"
  content  = "replica ${count.index}\n"
}

output "files"      { value = [for f in local_file.role : f.filename] }
output "size_chosen" { value = local.size }
EOF

terraform init
# 1. Defaults (dev)
terraform apply -auto-approve
ls *.txt ; terraform output

# 2. Override via -var (prod => size large) and watch the conditional
terraform apply -auto-approve -var="environment=prod"
terraform output size_chosen          # "large"
cat prod-app-web.txt

# 3. for_each identity: REMOVE a role and see ONLY that file destroyed (not renumbered)
terraform apply -auto-approve -var='roles=["web","api"]'   # worker file destroyed; web/api untouched
terraform plan -var='roles=["web","api"]'                  # No changes

# 4. count renumbering: lower replicas and observe index-based destroy
terraform apply -auto-approve -var="replicas=1"            # replica-1 destroyed (highest index)

# 5. Validation rejects bad input
terraform plan -var="environment=qa" || echo ">> rejected by validation (qa not allowed)"

terraform destroy -auto-approve -var="environment=prod"
```

## Exercises

1. Define a typed variable with a validation rule and demonstrate it rejecting a bad value.
2. Use a local to build a common tag map merged from a variable, and reference it.
3. Add a `sensitive` output and show it's redacted.
4. Use a conditional expression to pick a value based on environment.
5. Create three resources with `for_each` and show that removing one item destroys only that
   resource.
6. Explain the index-renumbering pitfall of `count` with a concrete add/remove example.

## Troubleshooting

- **Validation error at plan** — input violates a rule. *Fix:* pass an allowed value; read the
  error message.
- **Secret shown in plan/output** — not marked sensitive / committed tfvars. *Fix:*
  `sensitive = true`; source secrets from env/vault.
- **Removing a `count` item recreated others** — index shift. *Fix:* use `for_each` (stable
  keys).
- **`for_each` error: value depends on resource attributes** — keys must be known at plan.
  *Fix:* use static/known keys, not computed-at-apply values.
- **Wrong var value applied** — precedence confusion. *Fix:* recall order (CLI `-var` beats
  files beats defaults).
- **Type mismatch** — passing a list where a map is expected. *Fix:* match declared types.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What are input variables for, and how do you add validation?
2. Name three ways to supply variable values and the precedence.
3. What's the difference between a local and a variable?
4. What does an output do, and why mark some sensitive?
5. Give an example of a conditional and a for-expression.
6. Difference between `count` and `for_each`?
7. Why does removing a middle `count` item cause recreation?
8. When should you use `for_each` instead of `count`?
9. **Practical:** demonstrate `for_each` removing only one resource.
10. **Practical:** show validation rejecting a bad variable value.

## Solutions & validation

1. To parameterize configs; add a `validation { condition, error_message }` block.
2. `-var`, `-var-file`/`.tfvars`, `TF_VAR_*` env; CLI `-var` has highest precedence over files/
   defaults.
3. A **local** is computed/named inside the config; a **variable** is an external input.
4. Exposes a value (CLI/other configs); mark **sensitive** to redact secrets.
5. `var.env == "prod" ? "large" : "small"`; `[for n in names : upper(n)]`.
6. `count` = N indexed copies; `for_each` = one per set/map element keyed by a stable key.
7. Indices shift, changing resource identity → destroy/recreate of later items.
8. When items have **identity** (can be added/removed independently).
9. **Validation:** removing "worker" destroys only its file (see lab).
10. **Validation:** `environment=qa` fails validation.

> [!TIP]
> Flexible configs come from **typed, validated variables** (per-environment `.tfvars`),
> **locals** for DRY computed values, **outputs** for results, and the **expression language**
> for logic. The highest-leverage habit is **`for_each` over `count`** — key resources by
> stable names so changes don't renumber and recreate unrelated infrastructure. These are the
> building blocks for the reusable **modules** in the next lesson.

## What's next

Next: **Lesson 1404 — Modules & Reusability.** Package infrastructure into reusable components:
authoring modules with inputs/outputs, calling local and registry modules, composition and
versioning, and structuring a real project so teams share infrastructure patterns instead of
copy-pasting HCL.
