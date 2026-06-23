---
title: "IaC — Other Tools & When to Use Them"
slug: "iac-other-tools-and-when-to-use-them"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform in Practice"
order: 1407
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [iac, pulumi, cloudformation, ansible, crossplane, comparison]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 50
status: "published"
summary: "Terraform isn't the only IaC tool: how it compares to Pulumi, CloudFormation/Bicep, the CDK family, Crossplane, and config managers like Ansible; the provisioning-vs-configuration and declarative-vs-imperative distinctions; and choosing the right tool — or combination — for a job."
seoTitle: "IaC 7: Other Tools & When to Use Them (Pulumi, CloudFormation, CDK)"
seoDescription: "IaC landscape: Terraform vs Pulumi, CloudFormation/Bicep, CDK, Crossplane, and Ansible; provisioning vs configuration, declarative vs imperative, and tool selection. Lab + assessment."
---

Terraform is the most popular IaC tool, but it's one of several — and knowing the landscape
helps you choose well and work in mixed environments. This lesson maps the IaC ecosystem:
**Pulumi** (IaC in general-purpose languages), **CloudFormation/ARM/Bicep** (cloud-native),
the **CDK** family (imperative-feeling, synthesizes to declarative), **Crossplane** (IaC via
Kubernetes), and where **configuration managers** like **Ansible** fit. The key is two
distinctions — **provisioning vs configuration** and **declarative vs imperative** — that tell
you which tool (or combination) fits a job.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **provisioning** (create infra) from **configuration management** (set up
  what's inside).
- Compare Terraform with **Pulumi, CloudFormation/Bicep, CDK, Crossplane**.
- Explain **state-based** vs **stateless** IaC approaches.
- Recognize when to combine tools (Terraform + Ansible, etc.).
- Choose an IaC tool for a given context.

## Part 1 — Two distinctions that organize everything

```text
PROVISIONING  vs  CONFIGURATION MANAGEMENT
  "create the servers/networks/DBs"  |  "install packages, set files, manage services ON them"
  Terraform, Pulumi, CloudFormation  |  Ansible, Chef, Puppet, Salt

DECLARATIVE  vs  IMPERATIVE
  "describe desired state"           |  "describe the steps to take"
  Terraform, CloudFormation          |  scripts; (Ansible is mostly declarative tasks)
```

- **Provisioning** stands up the **infrastructure** (the next track, Ansible, covers
  configuration). Terraform is a **provisioning** tool.
- **Declarative** tools manage **desired state** (idempotent, plan-based); **imperative** tools
  run **steps**. Most modern IaC is declarative — even tools that *look* imperative (CDK,
  Pulumi) ultimately produce declarative resource definitions.

These two axes place every tool — and explain why teams often use **two** tools (Terraform to
provision, Ansible to configure).

## Part 2 — Pulumi: IaC in real languages

**Pulumi** lets you write IaC in **general-purpose languages** (TypeScript, Python, Go, C#)
instead of a DSL:

```python
# Pulumi (Python) — real language, loops/functions/classes available
import pulumi_aws as aws
for i in range(3):
    aws.s3.Bucket(f"bucket-{i}")
```

- **Pros**: full language power (loops, abstractions, testing with real test frameworks), IDE
  support, reuse code skills.
- **Cons**: that power can become complexity; smaller ecosystem than Terraform; still uses
  state (Pulumi service or self-managed).
- **Like Terraform**: declarative under the hood (desired state + plan/up), provider-based,
  state-driven.

Choose Pulumi when your team strongly prefers a real language and wants programmatic
abstractions; choose Terraform/HCL when you want a constrained, purpose-built config language
that's harder to over-engineer.

## Part 3 — Cloud-native: CloudFormation, ARM/Bicep, CDK

Each major cloud has a **native** IaC service:

- **AWS CloudFormation** — AWS-only, declarative JSON/YAML, **managed state** (AWS tracks it —
  no state file to manage), deep AWS integration, but verbose and AWS-locked.
- **Azure ARM / Bicep** — Azure's native templates; **Bicep** is a cleaner DSL over ARM JSON.
- **GCP Deployment Manager / Config Connector** — GCP-native options.
- **CDK (AWS CDK / CDK for Terraform)** — write in a real language that **synthesizes** to
  CloudFormation (AWS CDK) or Terraform (CDKTF). Feels imperative, produces declarative
  templates.

```text
Terraform           multi-cloud, huge ecosystem, you manage state
CloudFormation/Bicep single-cloud, native/managed state, tight integration but lock-in
CDK                  real language → synthesizes to CFN/TF (best of both for some teams)
```

> [!IMPORTANT]
> The big trade-off is **multi-cloud + ecosystem (Terraform/Pulumi)** vs **native integration +
> managed state (CloudFormation/Bicep)**. Cloud-native tools have **no state file to manage**
> (the cloud tracks it) and the deepest integration with that cloud's newest features — but
> they **lock you in** and don't span providers. Terraform/Pulumi work across **all** providers
> with a consistent workflow, at the cost of managing state yourself. Pick based on whether you
> value portability/breadth or native depth/zero-state-ops.

## Part 4 — Crossplane and the Kubernetes-native approach

**Crossplane** turns Kubernetes into a **control plane for infrastructure**: you define cloud
resources as **Kubernetes custom resources**, and Crossplane (an operator) reconciles them —
provisioning cloud infra via the K8s API and its continuous reconciliation loop.

```text
   kubectl apply -f rds-database.yaml   (a Crossplane CRD)
        → Crossplane operator provisions a real RDS instance, continuously reconciled
```

- **Pros**: GitOps-native (Argo/Flux manage infra too), continuous drift correction, one
  control plane for apps **and** infra, good for platform teams building self-service.
- **Cons**: requires Kubernetes, newer/steeper, ties infra lifecycle to the cluster.

It's the convergence of the Kubernetes reconciliation model (Lesson 1201) with provisioning —
attractive for platform engineering (next track's territory).

## Part 5 — Configuration managers and combining tools

**Ansible/Chef/Puppet/Salt** are **configuration management** (next track) — they configure
the **insides** of machines (packages, files, services), not provision infrastructure. Some
overlap exists (Ansible can provision via cloud modules; Terraform can run provisioners), but
each is best at its specialty.

The common, pragmatic pattern is **combine tools**:

```text
   Terraform  → provisions VMs, networks, load balancers, the cluster        (infrastructure)
        │ hands off (IPs/inventory)
   Ansible    → configures the OS, installs/runs the app on those VMs        (configuration)
```

> [!TIP]
> Use the **right tool for each layer** and don't force one to do the other's job. **Terraform/
> Pulumi/CloudFormation provision** the infrastructure; **Ansible/Chef/Puppet configure** what
> runs on it; **Kubernetes/Crossplane** handle orchestration and (with Crossplane) cloud
> resources via the cluster. A typical stack is *Terraform to build, Ansible to configure, a
> CI/CD pipeline to tie them together*. Tool choice matters less than **clear layer
> boundaries** and using each where it's strong.

## Hands-on lab

```text
This lab is a DECISION exercise (the real tools need cloud accounts). For each scenario,
choose a tool (or combination) and justify using the two distinctions.

Scenario A: A startup all-in on AWS wants zero state-file management and deepest AWS
            integration for serverless. →  ____________________________
Scenario B: A team runs workloads on AWS AND GCP and wants one consistent workflow. → ____
Scenario C: Engineers want to write infra with loops/abstractions in TypeScript with unit
            tests. →  ____________________________
Scenario D: A platform team wants developers to self-service databases via `kubectl`/GitOps
            on an existing cluster. →  ____________________________
Scenario E: You provisioned 10 VMs with Terraform; now you must install Nginx + your app and
            manage their config on each. →  ____________________________

Suggested answers:
A → CloudFormation/Bicep-equivalent (native, managed state, AWS depth)  [single-cloud + native]
B → Terraform/Pulumi (multi-cloud, one workflow)                         [portability]
C → Pulumi or CDK (real language + tests)                                [language power]
D → Crossplane (K8s-native, GitOps, self-service)                        [reconciliation model]
E → Ansible (configuration management) — Terraform provisioned, Ansible configures  [combine]
```

```bash
# Reinforce the layer boundary with the docker provider (provision) + a config step (configure):
mkdir iac-compare-lab && cd iac-compare-lab
cat > main.tf <<'EOF'
terraform { required_providers { docker = { source = "kreuzwerker/docker", version = "~> 3.0" } } }
provider "docker" {}
resource "docker_image" "web" { name = "nginx:1.27-alpine" }
resource "docker_container" "web" {
  name = "iac-web"  image = docker_image.web.image_id
  ports { internal = 80  external = 8089 }
}
EOF
terraform init && terraform apply -auto-approve     # PROVISION (Terraform's job)
docker exec iac-web sh -c 'echo "<h1>configured</h1>" > /usr/share/nginx/html/index.html'  # CONFIGURE (Ansible's job, simulated)
curl -s localhost:8089
terraform destroy -auto-approve
```

## Exercises

1. Define provisioning vs configuration management with one tool example each.
2. Define declarative vs imperative and classify Terraform, Ansible, and a shell script.
3. Compare Terraform and CloudFormation on state management and lock-in.
4. Explain Pulumi's main advantage and risk versus HCL.
5. Describe how Crossplane provisions infrastructure and why platform teams like it.
6. Give a scenario where you'd combine two IaC tools and the hand-off between them.

## Troubleshooting

- **Fighting Terraform to configure OS internals** — wrong layer. *Fix:* provision with TF,
  configure with Ansible.
- **Locked into one cloud unexpectedly** — native tool. *Fix:* choose Terraform/Pulumi if
  portability matters.
- **State headaches** — managing state for everything. *Fix:* native tools (managed state) or
  remote backend discipline.
- **Over-engineered Pulumi code** — too much language power. *Fix:* keep it simple; consider
  HCL's constraints.
- **Two tools stepping on each other** — unclear boundaries. *Fix:* define clear hand-off
  (provision → configure).
- **Reinventing existing modules/templates** — *Fix:* use registries (TF Registry, CFN
  resources, Pulumi packages).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Provisioning vs configuration management — define and give a tool for each.
2. Declarative vs imperative — classify Terraform and a shell script.
3. What does CloudFormation manage for you that Terraform doesn't?
4. Terraform vs cloud-native tools — the core trade-off?
5. What is Pulumi's main differentiator?
6. What does CDK do (AWS CDK / CDKTF)?
7. How does Crossplane provision infrastructure?
8. Why and how do teams combine Terraform and Ansible?
9. **Practical:** pick tools for the lab's five scenarios with justification.
10. **Practical:** demonstrate the provision-then-configure layer boundary.

## Solutions & validation

1. Provisioning = create infra (Terraform); configuration = set up what's on it (Ansible).
2. **Declarative** (desired state) — Terraform; **imperative** (steps) — shell script.
3. **State** — CloudFormation manages it for you (no state file); Terraform you manage.
4. **Multi-cloud + ecosystem (you manage state)** vs **native integration + managed state +
   lock-in**.
5. IaC in **general-purpose languages** (loops/abstractions/tests), still declarative
   underneath.
6. Write in a real language that **synthesizes** to CloudFormation/Terraform.
7. As **Kubernetes custom resources** reconciled by an operator into real cloud infra.
8. Terraform **provisions** (VMs/network), Ansible **configures** (packages/app) — hand off via
   inventory/IPs.
9. **Validation:** A→native, B→Terraform/Pulumi, C→Pulumi/CDK, D→Crossplane, E→Ansible.
10. **Validation:** TF creates the container; a config step sets its content.

> [!TIP]
> There's no single "best" IaC tool — there's the right tool **per layer and context**. Use the
> two distinctions (**provision vs configure**, **declarative vs imperative**) to place any
> tool and pick: native tools for single-cloud depth + managed state, Terraform/Pulumi for
> multi-cloud breadth, CDK/Pulumi for language power, Crossplane for K8s-native self-service,
> and a **config manager** (next track) for what runs inside the machines. Combining tools with
> clear boundaries beats forcing one to do everything.

## What's next

Next: **Lesson 1408 — IaC Best Practices & Troubleshooting.** Tie the track together: project
structure and naming, secret handling, drift management, importing existing infrastructure,
debugging plan/apply failures, testing IaC (validate/plan/Terratest/policy), and a production-
readiness checklist for infrastructure as code.
