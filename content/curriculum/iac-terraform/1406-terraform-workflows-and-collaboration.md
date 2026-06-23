---
title: "Terraform — Workflows & Collaboration"
slug: "terraform-workflows-and-collaboration"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform in Practice"
order: 1406
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, workflows, ci, workspaces, policy-as-code, collaboration]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 60
status: "published"
summary: "Running Terraform as a team: remote state and environment isolation, the plan-on-PR / apply-on-merge CI workflow (Atlantis, TF Cloud), workspaces vs directories, policy-as-code (Sentinel/OPA) guardrails, and keeping every infrastructure change reviewed and auditable."
seoTitle: "Terraform 6: Workflows & Collaboration (CI plan/apply, policy-as-code)"
seoDescription: "Team Terraform: remote state, plan-on-PR/apply-on-merge CI, Atlantis/TF Cloud, workspaces vs directories, policy-as-code (Sentinel/OPA), and auditable change workflows. Lab + assessment."
---

Terraform on a laptop is fine for learning; **teams running production infrastructure** need a
disciplined workflow. Without it you get the classic failures: two people applying conflicting
changes, an un-reviewed `apply` that breaks prod, no audit trail, and environments drifting
apart. This lesson covers the **collaborative workflow**: remote state and environment
isolation (recap + patterns), the **plan-on-PR / apply-on-merge** CI model (Atlantis, Terraform
Cloud), **workspaces vs directories**, **policy-as-code** guardrails, and making every infra
change **reviewed and auditable** — Terraform as GitOps for infrastructure.

## Learning objectives

By the end of this lesson you will be able to:

- Structure **environment isolation** with remote state.
- Implement the **plan-on-PR, apply-on-merge** CI workflow.
- Compare **workspaces** vs **separate directories** for environments.
- Add **policy-as-code** guardrails (Sentinel/OPA/Conftest).
- Keep infrastructure changes **reviewed and auditable**.

## Part 1 — The collaborative problem

Solo Terraform breaks down with multiple people:

```text
✗ Two engineers `apply` at once          → state corruption (solved by remote state + locking)
✗ Someone applies un-reviewed changes     → broke prod, no review
✗ Plans run on laptops with different state/versions → inconsistent results
✗ No record of who changed what, when, why → no audit trail
✗ Manual applies                          → slow, error-prone, not repeatable
```

The fix is to run Terraform like CI/CD code: **state is remote+locked** (Lesson 1402), changes
go through **pull requests**, **plans are reviewed**, and **applies are automated** on merge —
treating infrastructure changes exactly like application code changes.

## Part 2 — The plan-on-PR / apply-on-merge workflow

The standard team workflow ties Terraform to Git:

```text
   open PR (changes .tf)
        │ CI runs:  terraform fmt -check · validate · PLAN
        ▼
   plan posted as a PR comment  →  REVIEWERS read the plan (what will change?)
        │ approve + merge
        ▼
   on merge to main:  CI runs `terraform apply` (the reviewed plan) → infra updated
```

- **Plan on PR** — every infra change shows its **plan** in the PR, so reviewers see *exactly*
  what will be created/changed/**destroyed** before approving — the plan is the diff.
- **Apply on merge** — once approved and merged, CI applies automatically (no manual laptop
  apply).
- **Save the plan** (`terraform plan -out=tfplan`) and **apply that exact plan** so what's
  applied is what was reviewed.

Tools that implement this: **Atlantis** (PR-comment driven), **Terraform Cloud/Enterprise**,
**Spacelift**, **env0**, or a hand-rolled GitHub Actions pipeline.

> [!IMPORTANT]
> Make the **`terraform plan` the reviewable artifact in a PR** — it's the precise diff of what
> will change to real infrastructure, including any **destroys/replacements**. Reviewers should
> read it like a code diff before approving. Then **apply the saved plan on merge** so the
> applied change is provably the one that was reviewed. This is GitOps for infrastructure:
> every change is a PR, reviewed, merged, applied, and recorded — no surprise `apply` from
> someone's terminal.

## Part 3 — Workspaces vs directories

Two ways to manage multiple environments with one codebase:

```text
SEPARATE DIRECTORIES (envs/dev, envs/prod)        WORKSPACES (terraform workspace)
  + explicit, visible, fully isolated state         + one config, multiple states
  + per-env backend, variables, even versions       + less duplication
  + hard to accidentally cross environments         - SAME config for all (less flexible)
  - some duplication                                 - easy to apply to the WRONG workspace
```

```bash
# Workspaces: one config, separate state per workspace
terraform workspace new prod
terraform workspace select prod
terraform workspace list
# config uses terraform.workspace to vary names: "${terraform.workspace}-app"
```

For **production with meaningfully different environments**, **separate directories** (Lesson
1404) are usually safer and clearer — explicit isolation, no risk of applying to the wrong
workspace. **Workspaces** suit lightweight, near-identical environments or ephemeral
short-lived ones. (Many teams avoid relying on workspaces for prod for exactly the "wrong
workspace" footgun.)

> [!TIP]
> For real prod/staging/dev separation, prefer **separate directories with their own backend/
> state** — it's explicit and makes "applying to the wrong environment" structurally hard. Use
> **workspaces** for ephemeral or near-identical environments (e.g. per-developer or per-PR
> preview stacks). Whichever you pick, the cardinal rule stands: **each environment has its own
> isolated state**, so a `dev` mistake can never touch `prod`.

## Part 4 — Policy-as-code guardrails

Beyond human review, enforce rules **automatically** in the pipeline (recall DevSecOps policy-
as-code):

```text
Sentinel (TF Cloud/Enterprise)   policy language; e.g. "no instance bigger than X",
                                 "all resources must be tagged", "no public S3"
OPA / Conftest                   test the PLAN (terraform show -json) against Rego policies
tfsec / Checkov / Terrascan      security/compliance scanning of HCL in CI
```

```bash
# Scan HCL for misconfigurations as a CI gate
tfsec .                                  # or: checkov -d .
# Policy-test the plan output:
terraform plan -out=tfplan && terraform show -json tfplan > plan.json
conftest test plan.json --policy policies/    # fail PR if a policy is violated
```

Policies enforce standards **every time**, automatically: required tags, no public storage,
allowed instance types, no resources without encryption. Combined with plan review, this is
defense in depth for infrastructure changes.

## Part 5 — Auditability and good habits

```text
□ All changes via PR (plan reviewed) — git history IS the audit log of infra changes
□ Remote, locked, encrypted, versioned state per environment
□ `fmt`/`validate`/security-scan/policy gates in CI (required checks)
□ Pin Terraform version + provider versions (.terraform.lock.hcl committed) for reproducibility
□ Apply the SAVED plan that was reviewed (no drift between review and apply)
□ Least-privilege credentials for the CI runner (OIDC/assumed role), separate per env
□ Document modules; keep PRs small and focused (one logical change)
```

Commit the **`.terraform.lock.hcl`** (provider version lock) so everyone/CI uses identical
provider versions. Pin the **Terraform CLI version** (`required_version`). These make infra
builds as reproducible as your application builds.

## Hands-on lab

```bash
# Simulate the plan-on-PR / apply-on-merge workflow locally with the local provider.
mkdir tf-team-lab && cd tf-team-lab
cat > main.tf <<'EOF'
terraform {
  required_version = ">= 1.5"
  required_providers { local = { source = "hashicorp/local", version = "~> 2.0" } }
}
variable "env" { type = string }
resource "local_file" "cfg" {
  filename = "${var.env}-app.conf"
  content  = "env=${var.env}\n"
}
EOF
terraform init
echo "*.tfstate*" > .gitignore
ls .terraform.lock.hcl                 # provider lock — COMMIT this for reproducibility

# 1. "Plan on PR" — produce and SAVE the reviewable plan
terraform plan -out=tfplan -var="env=dev"      # reviewers would read this
terraform show tfplan | head -20               # the human-readable diff (the "PR comment")

# 2. "Apply on merge" — apply the EXACT saved plan (what was reviewed)
terraform apply tfplan                          # no re-plan; applies the reviewed plan
cat dev-app.conf

# 3. Environment isolation via WORKSPACES (separate state per env)
terraform workspace new prod
terraform apply -auto-approve -var="env=prod"   # prod state is separate from default/dev
terraform workspace list
terraform state list                            # only this workspace's resources

# 4. Policy-as-code concept: gate the plan JSON
terraform show -json tfplan > plan.json
echo "Would run: conftest test plan.json --policy policies/  (e.g. require certain naming)"

# cleanup
terraform workspace select prod && terraform destroy -auto-approve -var="env=prod"
terraform workspace select default && terraform destroy -auto-approve -var="env=dev"
```

## Exercises

1. Describe five problems that arise running Terraform without a team workflow and the fix for
   each.
2. Diagram the plan-on-PR / apply-on-merge workflow and explain why you apply the *saved* plan.
3. Compare workspaces vs separate directories; pick one for prod/staging/dev and justify.
4. Save a plan, show it as the "reviewable diff," then apply that exact plan.
5. Add a policy-as-code or security-scan gate (tfsec/Conftest) and describe a rule it enforces.
6. List the practices that make infrastructure changes auditable and reproducible.

## Troubleshooting

- **State corrupted by concurrent applies** — no remote state/locking. *Fix:* remote backend +
  locking; run applies only in CI.
- **Applied something nobody reviewed** — manual laptop apply. *Fix:* plan-on-PR/apply-on-merge;
  restrict who can apply.
- **Applied to the wrong environment** — workspace footgun. *Fix:* separate directories; check
  `terraform workspace show`.
- **Plan ≠ what got applied** — re-planned at apply. *Fix:* apply the **saved** `-out` plan.
- **Different provider versions across team** — lock not committed. *Fix:* commit
  `.terraform.lock.hcl`; pin versions.
- **Insecure resources merged** — no policy gate. *Fix:* tfsec/Checkov/Conftest as required
  checks.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Name three failures of un-coordinated team Terraform.
2. Describe the plan-on-PR / apply-on-merge workflow.
3. Why apply the saved plan rather than re-planning at apply time?
4. Workspaces vs directories — trade-offs and which for prod?
5. What's the cardinal rule for environment state regardless of method?
6. What is policy-as-code for Terraform, and name a tool.
7. Why commit `.terraform.lock.hcl` and pin versions?
8. How does this workflow provide an audit trail?
9. **Practical:** save a plan and apply that exact plan.
10. **Practical:** show environment isolation via workspaces (or directories).

## Solutions & validation

1. Concurrent-apply corruption, un-reviewed applies, inconsistent plans, no audit, manual error
   (any three).
2. PR runs fmt/validate/**plan** (reviewed as the diff); on merge CI **applies** the reviewed
   plan.
3. So the applied change is **provably** the reviewed one (no drift between review and apply).
4. Workspaces: one config/less dup but wrong-workspace risk; directories: explicit isolation
   but some dup — **directories** for prod.
5. **Each environment has its own isolated state.**
6. Automated rules enforced on the plan/HCL (Sentinel/OPA-Conftest/tfsec) — e.g. required tags,
   no public storage.
7. Reproducible builds — identical provider/CLI versions for everyone and CI.
8. Every change is a **PR with a reviewed plan**, merged and applied — git history is the
   record.
9. **Validation:** `terraform apply tfplan` applies the saved plan (see lab).
10. **Validation:** `prod` workspace has separate state from `dev`.

> [!TIP]
> Run Terraform like application code: **remote/locked state per environment**, changes via
> **PR with a reviewed plan**, **apply the saved plan on merge** from CI (not laptops), guarded
> by **policy-as-code** and version locks. This makes infrastructure changes **reviewed,
> reproducible, and auditable** — GitOps for infrastructure. The discipline matters more than
> the specific tool (Atlantis/TF Cloud/Actions).

## What's next

Next: **Lesson 1407 — Other IaC Tools & When to Use Them.** Terraform isn't the only option:
how it compares to Pulumi, CloudFormation/ARM/Bicep, Ansible, Crossplane, and CDK; the
declarative-vs-imperative and provisioning-vs-configuration distinctions; and choosing the
right tool (or combination) for a job.
