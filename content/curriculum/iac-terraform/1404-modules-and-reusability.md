---
title: "Terraform — Modules & Reusability"
slug: "terraform-modules-and-reusability"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform Language"
order: 1404
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, modules, reusability, composition, registry, versioning]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 60
status: "published"
summary: "Package infrastructure into reusable components: authoring modules with inputs and outputs, calling local and registry modules, composition and versioning, the root-vs-child module relationship, and structuring a real project so teams share patterns instead of copy-pasting HCL."
seoTitle: "Terraform 4: Modules & Reusability (authoring, registry, versioning)"
seoDescription: "Terraform modules: authoring with inputs/outputs, calling local and registry modules, composition, version pinning, and project structure for reusable infrastructure. Lab + assessment."
---

Copy-pasting the same HCL across environments and projects is the IaC version of duplicated
code — and just as harmful. **Modules** are Terraform's unit of reuse: a packaged set of
resources with **inputs** (variables) and **outputs**, callable many times with different
parameters. This lesson covers authoring your own modules, calling **local** and **registry**
modules, **versioning** them, and structuring a real project so a team defines a pattern (a
network, a service, a database) **once** and reuses it everywhere — the key to scaling
Terraform across environments and teams.

## Learning objectives

By the end of this lesson you will be able to:

- Explain the **root vs child module** relationship.
- **Author** a module with variables (inputs) and outputs.
- **Call** local and registry modules and pass variables.
- **Version-pin** modules and understand composition.
- Structure a **multi-environment** project using modules.

## Part 1 — What a module is

Every Terraform configuration is already a module — the **root module** (the directory you run
`terraform` in). A **child module** is a reusable directory of `.tf` files you **call** from
another module, passing inputs and receiving outputs:

```text
   root module (envs/prod)
      │ calls
   module "network"  →  child module (modules/network/)  → creates VPC, subnets, ...
   module "app"      →  child module (modules/app/)       → creates instances, LB, ...
```

A module **encapsulates** a chunk of infrastructure behind a clean interface (its variables and
outputs), exactly like a function encapsulates code. You write the "how" once and reuse it by
passing different "what."

## Part 2 — Authoring a module

A module is just a directory with the standard files:

```text
modules/webserver/
├── variables.tf     # INPUTS (the module's API)
├── main.tf          # the resources
└── outputs.tf       # OUTPUTS (what callers can use)
```

```hcl
# modules/webserver/variables.tf
variable "name"     { type = string }
variable "replicas" { type = number  default = 1 }
variable "tags"     { type = map(string)  default = {} }

# modules/webserver/main.tf
resource "local_file" "server" {
  count    = var.replicas
  filename = "${var.name}-${count.index}.conf"
  content  = "name=${var.name} idx=${count.index}\n"
}

# modules/webserver/outputs.tf
output "files" { value = [for f in local_file.server : f.filename] }
output "count" { value = var.replicas }
```

Design modules with a **clear, minimal interface**: required inputs, sensible defaults,
documented outputs. A good module hides complexity and exposes only the knobs callers actually
need.

## Part 3 — Calling modules

```hcl
# root main.tf — call the local module twice with different inputs
module "web" {
  source   = "./modules/webserver"     # local path
  name     = "web"
  replicas = 3
  tags     = { tier = "frontend" }
}

module "api" {
  source   = "./modules/webserver"
  name     = "api"
  replicas = 2
}

output "web_files" { value = module.web.files }   # consume a module output
```

- **`module "name" { source = ... }`** — instantiate a module; pass inputs as arguments.
- Reference outputs as **`module.<name>.<output>`**.
- Run **`terraform init`** after adding/changing a module source (it installs/links modules).
- The **same module**, called twice, builds two independent sets of resources — reuse without
  duplication.

## Part 4 — Module sources and versioning

`source` can point to many places:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"   # Terraform Registry (public)
  version = "~> 5.0"                            # PIN the version (registry modules only)
  # ...inputs...
}

# Other sources:
# source = "./modules/network"                       # local path
# source = "git::https://github.com/org/modules.git//vpc?ref=v1.2.0"   # git, pinned by ref
# source = "app.terraform.io/org/network/aws"        # private registry
```

> [!IMPORTANT]
> **Always pin module versions.** A registry module needs a `version` constraint
> (`~> 5.0`); a git module needs a `?ref=<tag/commit>`. Without pinning, `terraform init` can
> pull a **new, breaking** module version and silently change your plan — or worse, your
> infrastructure. Pinning makes builds **reproducible** and upgrades **deliberate** (bump the
> version, review the plan). The public **Terraform Registry** has vetted modules for common
> infrastructure (VPCs, EKS, RDS) — use them, but pin them.

## Part 5 — Project structure for multiple environments

A common, clean layout separates **reusable modules** from **per-environment roots**:

```text
infra/
├── modules/                    # reusable building blocks (your "library")
│   ├── network/
│   ├── app/
│   └── database/
├── envs/
│   ├── dev/
│   │   ├── main.tf             # calls modules with DEV inputs; own backend/state
│   │   └── dev.tfvars
│   ├── staging/
│   └── prod/
│       ├── main.tf             # SAME modules, PROD inputs; SEPARATE state
│       └── prod.tfvars
```

Each environment is a **root module** with its **own state** (separate backend key), calling the
**same shared modules** with different variables. This gives you **identical infrastructure
patterns** across environments with **isolated blast radius** (a `prod` apply can't touch `dev`
state). Alternatives include Terraform **workspaces** (one config, multiple states) and tools
like Terragrunt — but separate directories + shared modules is the most common and explicit.

> [!TIP]
> Keep **one library of well-designed modules** and **thin per-environment roots** that just
> wire modules together with environment-specific variables and their **own state**. This
> gives parity (dev mirrors prod because it's the same modules) with isolation (separate state
> per env). Resist over-modularizing — a module should encapsulate a **meaningful, reused**
> unit (a VPC, a service), not wrap a single resource. Start flat, extract a module when you
> copy-paste it the second time.

## Hands-on lab

```bash
mkdir -p tf-modules-lab/modules/webserver && cd tf-modules-lab

# 1. Author a reusable module
cat > modules/webserver/variables.tf <<'EOF'
variable "name"     { type = string }
variable "replicas" { type = number  default = 1 }
EOF
cat > modules/webserver/main.tf <<'EOF'
terraform { required_providers { local = { source = "hashicorp/local" } } }
resource "local_file" "server" {
  count    = var.replicas
  filename = "${path.root}/${var.name}-${count.index}.conf"
  content  = "name=${var.name} idx=${count.index}\n"
}
EOF
cat > modules/webserver/outputs.tf <<'EOF'
output "files" { value = [for f in local_file.server : f.filename] }
EOF

# 2. Root module calls it TWICE with different inputs (reuse!)
cat > main.tf <<'EOF'
module "web" { source = "./modules/webserver"  name = "web"  replicas = 3 }
module "api" { source = "./modules/webserver"  name = "api"  replicas = 2 }
output "all_files" { value = concat(module.web.files, module.api.files) }
EOF

terraform init                 # installs/links the module
terraform apply -auto-approve
ls *.conf                      # web-0..2 and api-0..1 from ONE module
terraform output all_files

# 3. Change one caller's input — only that module's resources change
sed -i 's/name = "api"  replicas = 2/name = "api"  replicas = 4/' main.tf
terraform plan                 # adds api-2, api-3; web untouched
terraform apply -auto-approve

# 4. (Concept) version pinning — a registry/git module would carry version/?ref=
#    module "vpc" { source = "terraform-aws-modules/vpc/aws"  version = "~> 5.0" ... }

terraform destroy -auto-approve
```

## Exercises

1. Explain root vs child modules and the module interface (inputs/outputs).
2. Author a module with two inputs and one output; call it from a root module.
3. Call the same module twice with different inputs and show independent resources.
4. Pin a registry or git module version and explain why pinning matters.
5. Sketch a multi-environment project layout using shared modules and separate state per env.
6. Identify a case of over-modularization and explain when *not* to make a module.

## Troubleshooting

- **`Module not installed`** — added a module without init. *Fix:* `terraform init`.
- **Unexpected module changes after init** — unpinned version pulled a new release. *Fix:*
  pin `version`/`?ref`; review the plan.
- **Can't reference a module's value** — wrong syntax. *Fix:* `module.<name>.<output>`; ensure
  it's declared as an output.
- **One env's apply affected another** — shared state. *Fix:* separate backend/state per
  environment.
- **Module too granular/awkward** — over-modularized. *Fix:* modules encapsulate meaningful
  units; inline single resources.
- **Inputs duplicated everywhere** — *Fix:* sensible defaults + a clear interface; pass only
  what varies.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's the difference between a root and a child module?
2. What makes up a module's interface?
3. How do you call a module and consume its output?
4. Why must you run `init` after adding a module?
5. Name three valid module sources.
6. Why pin module versions, and how (registry vs git)?
7. How do you structure a multi-environment project with shared modules?
8. When should you NOT create a module?
9. **Practical:** call one module twice with different inputs.
10. **Practical:** show changing one caller doesn't affect the other.

## Solutions & validation

1. The **root** is where you run Terraform; a **child** is a reusable directory it calls.
2. Its **input variables** and **outputs**.
3. `module "x" { source = ... }`; reference `module.x.<output>`.
4. `init` **installs/links** modules (and providers) before plan/apply.
5. Local path, Terraform Registry, git (also private registry).
6. Reproducibility/deliberate upgrades; registry uses `version`, git uses `?ref=`.
7. Shared `modules/` + per-env root directories with **separate state** and env `.tfvars`.
8. When it would wrap a single resource / isn't reused — over-modularization adds friction.
9. **Validation:** web (3) and api (2) files from one module (see lab).
10. **Validation:** raising api replicas leaves web files unchanged.

> [!TIP]
> Modules are **functions for infrastructure**: encapsulate a meaningful, reused unit behind a
> clean input/output interface, **pin versions**, and compose thin per-environment roots from a
> shared module library. This is how teams scale Terraform — define the network/service/
> database pattern once, reuse it with parity across dev/staging/prod, and review changes as
> code. Don't over-modularize; extract on the second copy-paste.

## What's next

Next: **Lesson 1405 — Provisioning Real Resources.** Apply everything to actual cloud
infrastructure: provider auth, data sources, resource dependencies and references, a realistic
multi-resource build (network + compute), and the dependency graph — turning HCL into running
infrastructure safely.
