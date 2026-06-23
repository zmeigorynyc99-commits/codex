---
title: "Terraform — State: The Heart of Terraform"
slug: "terraform-state-the-heart-of-terraform"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform Foundations"
order: 1402
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, state, remote-state, locking, backend, drift]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 60
status: "published"
summary: "How Terraform knows what exists: the state file as the mapping between config and real resources, why it's critical and sensitive, remote backends and state locking for teams, drift detection, and state operations — the concept that, misunderstood, causes most Terraform disasters."
seoTitle: "Terraform 2: State (remote backends, locking, drift, sensitive data)"
seoDescription: "Terraform state: what it is and why it matters, the state file, remote backends with locking (S3+DynamoDB), drift, sensitive data, and safe state operations. Lab + assessment."
---

**State** is the single most important — and most misunderstood — concept in Terraform. To
compute a plan, Terraform must know **what it currently manages**, so it records a **state
file** mapping your HCL resources to **real-world resource IDs**. Misunderstand state and you
get the classic Terraform disasters: corrupted state, two engineers clobbering each other,
secrets leaked in a state file, or Terraform trying to recreate everything because it "lost"
the mapping. This lesson demystifies state: what it is, why it's sensitive, **remote backends
with locking** for teams, **drift**, and safe state operations.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **what state is** and why Terraform needs it.
- Describe the risks of **local state** and why **remote state** is essential for teams.
- Configure a **remote backend** with **state locking**.
- Understand **drift** and how Terraform detects it.
- Use core **state operations** safely (and why to avoid editing state by hand).

## Part 1 — What state is and why it exists

When you `apply`, Terraform creates real resources (each with a real ID like
`i-0abc123`/`bucket-xyz`). It records the mapping **HCL resource ↔ real resource** in a
**state file** (`terraform.tfstate`, JSON):

```text
   your config            state file (the map)            real world
   resource "aws_instance" "web"  →  i-0abc123def456  →  an actual EC2 instance
```

Without state, Terraform couldn't know that `aws_instance.web` *is* `i-0abc123` — on the next
plan it would think nothing exists and try to **create duplicates**. State is how Terraform:

- **Maps** config to real resources.
- **Tracks metadata** (dependencies, resource attributes) to compute accurate plans fast.
- Knows **what to update/destroy** when your config changes.

> [!IMPORTANT]
> **State is the source of truth for what Terraform manages** — it's not just a cache. If you
> lose or corrupt it, Terraform forgets which real resources it owns and may try to **recreate
> everything** (or orphan live resources). Never delete `terraform.tfstate` casually, never
> hand-edit it, and always back it up (remote backends do this for you). Most Terraform
> horror stories are really **state** stories.

## Part 2 — The problem with local state

By default, state is a **local file** (`terraform.tfstate`). For a solo experiment that's
fine; for a team or production it's dangerous:

```text
✗ It's on ONE person's laptop — others can't run Terraform consistently.
✗ Two people applying at once -> RACE/corruption (no locking).
✗ It contains SECRETS in plaintext (db passwords, keys, all resource attributes).
✗ Not backed up — laptop dies, state gone.
✗ Easy to accidentally commit to Git (leaking secrets + causing conflicts).
```

So: **never commit state to Git** (add `*.tfstate*` to `.gitignore`), and for any shared work,
use a **remote backend**.

## Part 3 — Remote state and locking

A **remote backend** stores state in shared, durable storage and (critically) provides
**locking** so only one apply runs at a time:

```hcl
# Example: AWS S3 backend with DynamoDB locking
terraform {
  backend "s3" {
    bucket         = "mycompany-tf-state"
    key            = "prod/network/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "tf-locks"     # LOCK table -> prevents concurrent applies
    encrypt        = true           # encrypt state at rest
  }
}
```

Common backends: **S3 + DynamoDB** (AWS), **Azure Storage**, **GCS**, **Terraform Cloud/
Enterprise**, **Consul**. They give you:

- **Shared state** — everyone/CI reads the same state.
- **Locking** — a second `apply` waits/fails instead of corrupting state.
- **Encryption at rest** + **versioning/backup** (e.g. S3 versioning to recover prior state).

> [!IMPORTANT]
> For anything beyond solo experimentation, use a **remote backend with locking**. Locking is
> what stops two engineers (or a person and a CI job) from applying simultaneously and
> **corrupting state**. And because state contains **secrets in plaintext**, the backend must
> **encrypt at rest**, restrict access (IAM/RBAC — least privilege), and be **versioned** so
> you can recover. Treat the state store as sensitive production data.

## Part 4 — Drift and refresh

**Drift** = the real world no longer matches state (someone changed a resource manually in the
console). Terraform detects drift by **refreshing** — reading actual resource attributes and
comparing to state:

```bash
terraform plan        # implicitly refreshes; shows drift as changes to reconcile
terraform plan -refresh-only   # ONLY detect drift, don't propose config changes
terraform apply -refresh-only  # update state to match reality (accept the drift)
```

When drift is detected, you decide: **re-apply** to push state's desired config back onto
reality (undo the manual change), or **accept** the change (update config + state). Either way,
Terraform makes drift **visible** — a big advantage over hoping nobody touched anything.

## Part 5 — State operations (carefully)

Sometimes you must manipulate the state-to-reality mapping. Use the **`terraform state`**
commands — **never** hand-edit the JSON:

```bash
terraform state list                 # all resources Terraform tracks
terraform state show aws_instance.web # details of one tracked resource
terraform import aws_instance.web i-0abc123   # adopt an EXISTING resource into state
terraform state mv old.name new.name # rename/move a resource WITHOUT recreating it
terraform state rm aws_instance.web  # stop tracking (does NOT delete the real resource)
terraform force-unlock <lock-id>     # release a stuck lock (use with caution)
```

- **`import`** — bring a manually-created resource under Terraform management.
- **`state mv`** — refactor (rename a resource, move into a module) without destroy/recreate.
- **`state rm`** — forget a resource (it keeps existing in the cloud) — useful before handing
  it to another config.

> [!TIP]
> Reach for `terraform state mv`/`import`/`rm` to **refactor without destroying** real
> infrastructure — e.g. renaming a resource in code would normally show as destroy+create, but
> `state mv` updates the mapping so it's a no-op. **Never edit `terraform.tfstate` by hand**
> (you'll corrupt it); the `state` subcommands do it safely with backups. And take a state
> backup (or rely on backend versioning) before any risky state surgery.

## Hands-on lab

```bash
# Local-provider lab so you can SEE state without a cloud account.
mkdir tf-state-lab && cd tf-state-lab
cat > main.tf <<'EOF'
terraform { required_providers { random = { source = "hashicorp/random" } } }
resource "random_integer" "port" { min = 8000  max = 9000 }
resource "random_pet"     "name" { length = 2 }
EOF
echo "*.tfstate*" > .gitignore     # NEVER commit state

terraform init
terraform apply -auto-approve

# 1. Inspect state — the mapping Terraform keeps
terraform state list                 # random_integer.port, random_pet.name
terraform state show random_pet.name # the recorded attributes
cat terraform.tfstate | head -20     # JSON: resources + their real values (treat as SENSITIVE)

# 2. Refactor WITHOUT recreating: rename a resource via state mv
sed -i 's/random_pet" "name"/random_pet" "hostname"/' main.tf
terraform plan                       # WOULD show destroy+create (name changed)
terraform state mv random_pet.name random_pet.hostname
terraform plan                       # now: "No changes" — mapping moved, nothing recreated

# 3. Stop tracking a resource (it would keep existing in a real cloud)
terraform state rm random_integer.port
terraform state list                 # port no longer tracked (still "exists")
terraform plan                       # Terraform would propose to CREATE it again (it forgot it)

# 4. Drift concept: state vs reality
terraform apply -refresh-only -auto-approve   # reconcile state with the real world

# cleanup
terraform destroy -auto-approve
```

## Exercises

1. Explain in your own words what the state file maps and why Terraform needs it.
2. List four risks of local state and the fix for each.
3. Configure (or describe) a remote backend with locking and explain what locking prevents.
4. Explain why state contains secrets and what that demands of the backend.
5. Detect drift conceptually and describe two ways to resolve it.
6. Use `terraform state mv` to rename a resource without recreating it; show the before/after
   plan.

## Troubleshooting

- **Terraform wants to recreate everything** — lost/wrong state. *Fix:* restore state from
  backend versioning; never delete state; check backend config.
- **State corrupted by concurrent applies** — no locking. *Fix:* remote backend with locking;
  recover prior version.
- **Secrets leaked** — state committed to Git / unencrypted. *Fix:* gitignore state; encrypted
  remote backend; rotate secrets; restrict access.
- **Renaming a resource forces destroy/create** — *Fix:* `terraform state mv` to move the
  mapping instead.
- **"Error acquiring the state lock"** — a previous run didn't release it. *Fix:* wait, or
  `force-unlock <id>` (verify nothing's running).
- **Existing resource conflicts** — created outside TF. *Fix:* `terraform import` it into
  state.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does the state file map, and why is it essential?
2. What happens if Terraform loses its state?
3. Name three risks of local state.
4. What two key things does a remote backend provide?
5. What does state locking prevent?
6. Why must the state backend be encrypted and access-controlled?
7. What is drift, and how does Terraform detect it?
8. What does `terraform state mv` do, and why use it?
9. **Practical:** rename a resource via `state mv` without recreating it.
10. **Practical:** show the state list and the sensitive nature of the state file.

## Solutions & validation

1. The mapping between **HCL resources and real resource IDs** + metadata; without it
   Terraform can't plan accurately.
2. It may try to **recreate** managed resources (or orphan live ones).
3. On one laptop, no locking (corruption), plaintext secrets, no backup, easy to commit (any
   three).
4. **Shared state** + **locking** (also encryption/versioning).
5. **Concurrent applies** corrupting state.
6. It stores **secrets in plaintext** — needs encryption at rest + least-privilege access +
   versioning.
7. Real resources differing from state; detected by **refresh** (read actual attributes) during
   plan.
8. Moves the state mapping (rename/relocate) **without destroy/recreate**.
9. **Validation:** after `state mv`, plan says "No changes" (see lab).
10. **Validation:** `terraform state list` + state JSON shows real values (sensitive).

> [!TIP]
> Respect state and you avoid 90% of Terraform pain: keep it **remote, locked, encrypted,
> versioned, and out of Git**; read **drift** in the plan; and **refactor with `state`
> commands**, never a text editor. State is Terraform's memory of reality — guard it like the
> production data it effectively is.

## What's next

Next: **Lesson 1403 — Variables, Outputs & Expressions.** Make configs flexible and reusable:
input variables and types, validation, locals, outputs, the expression language (functions,
conditionals, `for`), and `count`/`for_each` for creating multiple resources without
copy-paste.
