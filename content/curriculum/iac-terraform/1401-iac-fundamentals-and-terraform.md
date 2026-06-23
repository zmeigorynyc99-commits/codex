---
title: "IaC — Fundamentals & First Terraform"
slug: "iac-fundamentals-and-first-terraform"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform Foundations"
order: 1401
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, iac, declarative, providers, plan, apply]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 60
status: "published"
summary: "Why infrastructure as code, and how Terraform works: declarative vs imperative provisioning, idempotency, the provider model, HCL basics, and the core plan → apply → destroy workflow that lets you build and tear down real infrastructure reproducibly."
seoTitle: "IaC 1: Fundamentals & First Terraform (HCL, plan/apply, providers)"
seoDescription: "Intro to infrastructure as code with Terraform: declarative provisioning, idempotency, providers, HCL resources, and the plan/apply/destroy workflow. Hands-on lab and assessment."
---

You've automated build, test, and deploy — but the **infrastructure** those pipelines deploy
to (servers, networks, databases, clusters) also needs to be created and managed.
**Infrastructure as Code (IaC)** means defining that infrastructure in **version-controlled
files** instead of clicking through a console, so it's **reproducible, reviewable, and
auditable**. **Terraform** is the leading IaC tool: you **declare** the desired infrastructure
in **HCL**, and Terraform figures out the API calls to make reality match. This lesson covers
why IaC matters and the core **plan → apply → destroy** workflow.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **IaC** benefits and **declarative vs imperative** provisioning.
- Describe Terraform's **provider** model and **idempotency**.
- Write a basic **HCL** configuration with a **resource**.
- Run the core workflow: **`init` → `plan` → `apply` → `destroy`**.
- Read a **plan** and understand what Terraform will change.

## Part 1 — Why infrastructure as code

Clicking through a cloud console ("ClickOps") doesn't scale and isn't safe:

- **Not reproducible** — can you rebuild your prod environment exactly? In another region?
- **No history/review** — who changed that security group, when, and why?
- **Drift** — manual tweaks accumulate; environments diverge.
- **Slow & error-prone** — humans repeating clicks make mistakes.

IaC fixes all of this: infrastructure lives in **files in Git**, so it's **versioned**
(history, blame), **reviewable** (PRs), **reproducible** (apply the same config to get the same
infra), and **automatable** (in CI/CD). Your infrastructure becomes code — tested, reviewed,
and shipped like any other.

## Part 2 — Declarative and idempotent

Terraform is **declarative**: you describe the **desired end state**, not the steps. Terraform
compares desired state to **what currently exists** and computes the **minimal changes** to
reconcile them — the same reconciliation idea from Kubernetes, for infrastructure.

```text
You declare:  "an S3 bucket named X, versioning on"
Terraform:    looks at what exists → creates it if missing, updates it if different,
              does NOTHING if it already matches  (IDEMPOTENT)
```

**Idempotent** = running `apply` repeatedly converges to the same state; re-applying an
unchanged config changes nothing. Contrast **imperative** scripts ("create bucket"), which
fail or duplicate if the resource already exists. Declarative + idempotent is what makes IaC
safe to run again and again.

> [!IMPORTANT]
> Terraform manages the **desired state**, not a sequence of commands. You don't tell it "if
> the bucket doesn't exist, create it" — you declare "this bucket should exist," and Terraform
> figures out create/update/no-op by **diffing desired vs actual**. This is why it's safe to
> re-run: an unchanged config produces an **empty plan**. Think in terms of *what the
> infrastructure should be*, not *how to get there*.

## Part 3 — The provider model

Terraform itself knows nothing about AWS, Azure, GitHub, or Cloudflare — **providers** do.
A provider is a plugin that translates HCL resources into a specific platform's API calls:

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
provider "aws" {
  region = "eu-west-1"
}
```

There are **thousands** of providers (AWS, Azure, GCP, Kubernetes, GitHub, Datadog, …), so
Terraform manages almost anything with an API — with **one consistent workflow** across all of
them. `terraform init` downloads the providers your config needs. This lesson's labs use the
**local/null/random** providers so you can practice with **no cloud account**.

## Part 4 — HCL and resources

You write **HCL** (HashiCorp Configuration Language) — declarative, readable blocks. The core
block is a **resource**:

```hcl
# A "resource" = one piece of infrastructure to manage
resource "local_file" "hello" {       # type "local_file", local name "hello"
  filename = "${path.module}/hello.txt"
  content  = "Hello, infrastructure as code!\n"
}

resource "random_pet" "name" {        # generates a friendly random name
  length = 2
}

output "generated_name" {             # expose a value after apply
  value = random_pet.name.id
}
```

- **`resource "type" "name" { ... }`** — declares a managed resource; reference it elsewhere as
  `type.name.attribute` (e.g. `random_pet.name.id`).
- Terraform builds a **dependency graph** from these references and creates things in the right
  order automatically.
- Other blocks: **`variable`** (inputs), **`output`** (results), **`provider`**,
  **`data`** (read existing things), **`module`** (reusable groups — later lesson).

## Part 5 — The core workflow

```bash
terraform init       # download providers + set up the working dir (run first / after changes)
terraform fmt        # auto-format your .tf files
terraform validate   # check syntax/types
terraform plan       # PREVIEW: what will be created/changed/destroyed (review carefully!)
terraform apply      # execute the plan (prompts to confirm; type "yes")
terraform destroy    # tear DOWN everything this config manages
```

The plan output uses symbols:

```text
  + create        a new resource will be created
  ~ update        an existing resource will be modified in place
  - destroy       a resource will be deleted
-/+ replace       destroy and recreate (a change forces replacement)

Plan: 2 to add, 0 to change, 0 to destroy.
```

> [!IMPORTANT]
> **Always read `terraform plan` before `apply`** — it's a dry run showing exactly what will
> change, and it's your last chance to catch a mistake. Pay special attention to **`-`
> (destroy)** and **`-/+` (replace)** lines: a seemingly small change can force Terraform to
> **destroy and recreate** a resource (e.g. renaming a database), which on real infrastructure
> can mean **data loss or downtime**. Never blindly `apply`; the plan is the safety mechanism.

## Hands-on lab

```bash
# No cloud account needed — uses local/random/null providers.
mkdir tf-lab && cd tf-lab

cat > main.tf <<'EOF'
terraform {
  required_providers {
    local  = { source = "hashicorp/local",  version = "~> 2.0" }
    random = { source = "hashicorp/random", version = "~> 3.0" }
  }
}

resource "random_pet" "server" {
  length = 2
}

resource "local_file" "config" {
  filename = "${path.module}/server.txt"
  content  = "server name: ${random_pet.server.id}\n"   # dependency: file needs the pet
}

output "server_name" {
  value = random_pet.server.id
}
EOF

# 1. The workflow
terraform init                       # downloads local + random providers
terraform fmt
terraform validate
terraform plan                       # "+ create" for random_pet and local_file
terraform apply -auto-approve        # creates them; writes server.txt
cat server.txt                       # see the generated content
terraform output server_name

# 2. Idempotency: re-apply an UNCHANGED config -> no changes
terraform apply -auto-approve        # "No changes. Your infrastructure matches the configuration."

# 3. Change-driven update: edit content and see a "~ update in place"
sed -i 's/server name/SERVER NAME/' main.tf
terraform plan                       # ~ update to local_file.config
terraform apply -auto-approve
cat server.txt

# 4. See a REPLACEMENT: change the pet length (forces new random + new file)
sed -i 's/length = 2/length = 3/' main.tf
terraform plan                       # -/+ replace random_pet; ~/replace dependent file

# 5. Tear it all down
terraform destroy -auto-approve      # "- destroy" everything; server.txt removed
ls server.txt 2>/dev/null || echo "gone"
```

## Exercises

1. List four problems IaC solves versus clicking in a console.
2. Explain declarative vs imperative and why idempotency makes IaC safe to re-run.
3. Describe the provider model and why Terraform can manage thousands of platforms.
4. Write a config with two resources where one references the other; identify the implicit
   dependency.
5. Run init/plan/apply and then re-apply unchanged; explain the second plan's output.
6. Make a change that forces a **replacement** and explain why reading the plan matters.

## Troubleshooting

- **`terraform plan` errors: provider not installed** — forgot init. *Fix:* `terraform init`
  (and after adding providers).
- **Unexpected `-/+ replace`** — a change forces recreation. *Fix:* read the plan; check which
  attribute forces replacement before applying.
- **Applied something destructive** — didn't read the plan. *Fix:* always review plan; use
  `-target` / lifecycle carefully; restore from backup.
- **"resource already exists"** — created outside Terraform. *Fix:* `terraform import` (later
  lesson) to bring it under management.
- **Drift (someone changed it manually)** — *Fix:* plan shows the diff; re-apply to converge,
  or import the change.
- **Wrong region/account** — provider config. *Fix:* set provider `region`/credentials
  explicitly.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Name four benefits of IaC over manual provisioning.
2. What does "declarative" mean for Terraform?
3. What is idempotency and why does it matter?
4. What is a provider, and what does `terraform init` do?
5. What is a `resource` block, and how do you reference its attributes?
6. How does Terraform decide creation order?
7. List the core workflow commands in order.
8. What do `+`, `~`, `-`, and `-/+` mean in a plan?
9. **Practical:** apply a two-resource config and show idempotency on re-apply.
10. **Practical:** produce a plan that shows a replacement and explain the risk.

## Solutions & validation

1. Reproducible, versioned/reviewable, no drift, automatable (any four).
2. You declare the **desired end state**; Terraform computes the changes to reach it.
3. Re-running converges to the same state (unchanged config = no changes) — safe to repeat.
4. A plugin that maps HCL to a platform's API; `init` downloads required providers + sets up
   the dir.
5. A declared piece of infrastructure; reference via `type.name.attribute`.
6. From the **dependency graph** built from resource references.
7. `init → (fmt/validate) → plan → apply → destroy`.
8. create / update-in-place / destroy / destroy-and-recreate (replace).
9. **Validation:** second apply says "No changes" (see lab).
10. **Validation:** changing `length` yields `-/+ replace`; risk = recreation/data loss.

> [!TIP]
> Terraform's superpower is the **declarative, idempotent plan/apply loop**: declare what you
> want, **review the plan** (especially destroys/replacements), then apply. Treat
> infrastructure like code — in Git, reviewed, reproducible. Master this core workflow with the
> safe local providers here, and the same commands will manage real cloud infrastructure in the
> lessons ahead.

## What's next

Next: **Lesson 1402 — State: The Heart of Terraform.** How Terraform tracks reality: the state
file, why it's critical (and sensitive), remote state and locking for teams, and how state
maps your config to real resources — the concept that, misunderstood, causes most Terraform
disasters.
