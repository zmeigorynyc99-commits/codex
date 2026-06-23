---
title: "Cloud — Fundamentals & Service Models"
slug: "cloud-fundamentals-and-service-models"
track: "cloud-fundamentals"
trackName: "Cloud Fundamentals"
module: "Cloud Foundations"
order: 1601
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Cloud"
tags: [cloud, iaas, paas, saas, shared-responsibility, regions]
cover: "/covers/curriculum/cloud-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "What the cloud actually is and how to reason about it: the five essential characteristics, IaaS vs PaaS vs SaaS, public/private/hybrid, the shared responsibility model, regions and availability zones, and the economics (capex→opex, pay-as-you-go) that change how you build."
seoTitle: "Cloud 1: Fundamentals & Service Models (IaaS/PaaS/SaaS, shared responsibility)"
seoDescription: "Cloud basics: essential characteristics, IaaS/PaaS/SaaS, deployment models, shared responsibility, regions and AZs, and cloud economics. Hands-on lab and assessment."
---

Everything you've learned — Linux, networking, containers, IaC — increasingly runs on **the
cloud**. But "the cloud" is just *someone else's computers*, rented on demand, with a lot of
managed services on top. To use it well you need the conceptual map: the **essential
characteristics** of cloud, the **service models** (IaaS/PaaS/SaaS) that decide how much you
manage, the **shared responsibility model** (who secures what — the #1 source of cloud
breaches), **regions and availability zones** for resilience, and the **economics** that change
how you architect. This lesson is provider-agnostic — AWS/Azure/GCP differ in naming, not in
these fundamentals.

## Learning objectives

By the end of this lesson you will be able to:

- Define cloud computing via its **essential characteristics**.
- Distinguish **IaaS, PaaS, and SaaS** by what you vs the provider manage.
- Compare **public/private/hybrid/multi-cloud** deployment models.
- Explain the **shared responsibility model** and why it matters for security.
- Describe **regions, availability zones**, and cloud **economics**.

## Part 1 — What "cloud" really is

The cloud is **on-demand access to computing resources over the internet**, managed by a
provider. The widely-cited NIST **essential characteristics**:

```text
On-demand self-service    spin up resources yourself, instantly, via API/console
Broad network access      reachable over the network from anywhere
Resource pooling          provider's resources shared across many tenants (multi-tenancy)
Rapid elasticity          scale up/down quickly with demand
Measured service          you pay for what you use (metered)
```

The shift that matters: instead of **buying and racking servers** (months of lead time, big
upfront cost), you **rent capacity in seconds** and **pay per use**. That changes everything
about how you build — experiment cheaply, scale elastically, fail and recover fast.

## Part 2 — Service models: IaaS, PaaS, SaaS

The models differ by **how much you manage vs the provider** — the "pizza as a service" ladder:

```text
                 YOU manage ▲                         provider manages ▼
ON-PREM    everything (hardware → app)
IaaS       OS, runtime, app          | provider: hardware, virtualization, network
           (e.g. EC2 VM, a raw VM)   |   → max control, max responsibility
PaaS       just your app + data      | provider: OS, runtime, scaling, patching
           (e.g. App Engine, RDS)    |   → focus on code, less ops
SaaS       just use it (config only) | provider: everything
           (e.g. Gmail, Salesforce)  |   → zero infra to manage
```

- **IaaS** (Infrastructure) — rent VMs/networks/storage; you manage the OS up. Most control,
  most work. (EC2, Compute Engine, Azure VMs.)
- **PaaS** (Platform) — deploy your code; the provider runs the OS/runtime/scaling. (App Engine,
  Heroku, managed databases.)
- **SaaS** (Software) — finished applications you just use. (Gmail, Slack.)

Higher up the stack = **less control, less operational burden**. Choose based on how much you
*want* to manage vs offload.

> [!IMPORTANT]
> The service models are a **control-vs-convenience trade-off**: IaaS gives you maximum control
> and maximum responsibility (you patch the OS, scale it, secure it); PaaS/managed services hand
> the undifferentiated heavy lifting (OS patching, scaling, backups) to the provider so you focus
> on your app. The modern default is "**managed services where you can, IaaS where you must**" —
> don't run your own database VM if a managed database does it better and frees your team. More
> management isn't more virtuous; it's more toil.

## Part 3 — Deployment models

```text
Public cloud    shared provider infrastructure (AWS/Azure/GCP) — elastic, no capex
Private cloud   cloud tech on YOUR dedicated infra (on-prem/hosted) — control/compliance
Hybrid          mix of public + private, connected — burst to public, keep sensitive private
Multi-cloud     use multiple public providers — avoid lock-in, best-of-breed, resilience
```

Most organizations are **public-first** but often **hybrid** (legacy/regulated workloads stay
private) and increasingly **multi-cloud** (different providers for different strengths, or to
avoid lock-in — though multi-cloud adds real complexity).

## Part 4 — The shared responsibility model

The single most important security concept in cloud: **the provider secures the cloud; you
secure what you put in it.** The line moves with the service model:

```text
                          IaaS            PaaS            SaaS
Data & access (IAM)       YOU             YOU             YOU       ← ALWAYS yours
Application               YOU             YOU             provider
OS / runtime              YOU             provider        provider
Virtualization/host       provider        provider        provider
Physical / network        provider        provider        provider
```

- **The provider** secures the **physical infrastructure, hypervisor, and managed-service
  internals** ("security **of** the cloud").
- **You** secure your **data, identity/access (IAM), configurations, and (for IaaS) the OS and
  app** ("security **in** the cloud").

> [!IMPORTANT]
> **Most cloud breaches are the customer's fault, not the provider's** — misconfigured storage
> buckets, over-permissive IAM, open security groups, leaked keys. The provider's infrastructure
> is rarely the weak link; **your configuration** is. And note: **data and access control are
> ALWAYS your responsibility**, at every service level — even with SaaS, *you* decide who can
> access what. Understanding exactly where the responsibility line sits for each service is how
> you avoid the classic "we thought AWS secured that" breach.

## Part 5 — Regions, AZs, and economics

**Geography for resilience:**

```text
Region            a geographic area (e.g. us-east-1, europe-west1) — pick for latency/compliance
Availability Zone one or more isolated datacenters within a region (separate power/network)
   → deploy across MULTIPLE AZs so one datacenter failure doesn't take you down
Edge / CDN        points of presence worldwide for low-latency content delivery
```

Spread workloads across **AZs** for high availability; choose **regions** for user latency and
**data residency** (legal/compliance) requirements.

**Economics** — the model flips capex to opex:

```text
Capex → Opex      no big upfront hardware purchase; pay monthly for usage
Pay-as-you-go      pay per second/hour/GB/request — and STOP paying when you stop using
Elasticity         scale to demand (and down!) — don't pay for idle capacity
Pricing levers     on-demand (flexible, pricier) vs reserved/savings plans (commit, cheaper)
                   vs spot/preemptible (cheap, can be reclaimed) — match to workload
```

This changes architecture: you can **experiment cheaply**, **scale elastically**, and must
**watch cost** (it's easy to leave things running). Cost is now an engineering concern (FinOps).

## Hands-on lab

This lab is **conceptual mapping** (real cloud needs an account; later lessons use free-tier
patterns).

```text
1. SERVICE MODEL mapping — classify each as IaaS / PaaS / SaaS:
   - A raw Linux VM you SSH into and install everything       → ______
   - A managed PostgreSQL database (no OS access)             → ______
   - Gmail                                                     → ______
   - A "deploy your container, we scale it" platform          → ______
   - Object storage (buckets) with an API                     → ______
   (Answers: IaaS, PaaS, SaaS, PaaS, IaaS/PaaS-ish storage service)

2. SHARED RESPONSIBILITY — for a company running an app on IaaS VMs, who secures each?
   - Physical datacenter:        provider / you?
   - Guest OS patching:          provider / you?
   - The app's code:             provider / you?
   - IAM / who can access data:  provider / you?
   - Network firewall rules (SG): provider / you?
   (Answers: provider, you, you, you, you)

3. RESILIENCE — your app runs on ONE VM in ONE AZ. List two single points of failure and how
   regions/AZs fix them.

4. COST — you spun up a large VM for a test and forgot it for a month. Explain the bill and
   which pricing model (on-demand/reserved/spot) suited a short test.
```

```bash
# Explore cloud concepts with a free CLI (if you have one configured) — read-only:
# aws sts get-caller-identity        # who am I (IAM identity)
# aws ec2 describe-regions --query 'Regions[].RegionName' --output text
# gcloud compute regions list ; az account list-locations -o table
echo "Regions exist for latency, compliance, and resilience; AZs for HA within a region."
```

## Exercises

1. List the five essential characteristics of cloud computing and give an example of each.
2. Classify five services as IaaS/PaaS/SaaS and justify by who manages the OS.
3. Explain the control-vs-responsibility trade-off across the service models.
4. Compare public/private/hybrid/multi-cloud with a use case for each.
5. Draw the shared responsibility line for IaaS vs SaaS; what's ALWAYS yours?
6. Explain why deploying across multiple AZs improves availability, and how regions affect
   compliance.

## Troubleshooting

- **"We thought the provider secured that"** — misread shared responsibility. *Fix:* learn the
  line per service; you own data/IAM/config always.
- **Surprise huge bill** — left resources running / wrong pricing model. *Fix:* budgets/alerts;
  stop idle resources; use reserved/spot appropriately.
- **App down when one datacenter failed** — single AZ. *Fix:* multi-AZ deployment.
- **High latency / compliance issue** — wrong region. *Fix:* choose region by user location/data
  residency.
- **Over-managing (running your own DB VM)** — unnecessary toil. *Fix:* use managed/PaaS where
  it fits.
- **Lock-in fear paralysis** — *Fix:* use portable patterns (containers/IaC); multi-cloud only
  when justified (it adds complexity).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Name three essential characteristics of cloud computing.
2. Differentiate IaaS, PaaS, and SaaS by who manages the OS.
3. What's the control-vs-responsibility trade-off across models?
4. Compare hybrid and multi-cloud.
5. State the shared responsibility model in one sentence.
6. What is ALWAYS the customer's responsibility, even in SaaS?
7. Difference between a region and an availability zone?
8. How does cloud change the cost model, and name two pricing options.
9. **Practical:** classify five services as IaaS/PaaS/SaaS.
10. **Practical:** assign shared-responsibility for five IaaS items.

## Solutions & validation

1. On-demand self-service, broad network access, resource pooling, rapid elasticity, measured
   service (any three).
2. IaaS = you manage OS up; PaaS = provider manages OS/runtime; SaaS = provider manages
   everything.
3. Higher up (PaaS/SaaS) = less control but less operational responsibility; IaaS = most
   control/most work.
4. Hybrid = mix public+private (connected); multi-cloud = multiple public providers (avoid
   lock-in/best-of-breed).
5. **Provider secures the cloud; you secure what you put in it** (line moves with the model).
6. **Data and access/identity (IAM).**
7. Region = geographic area; AZ = isolated datacenter(s) within a region (deploy across AZs for
   HA).
8. **Capex→opex / pay-as-you-go**; e.g. on-demand, reserved/savings, spot.
9. **Validation:** VM=IaaS, managed DB=PaaS, Gmail=SaaS, container platform=PaaS, object
   storage=storage service.
10. **Validation:** provider (physical), you (OS, app, IAM, firewall rules).

> [!TIP]
> Anchor on three ideas: the **service model** decides how much you manage (offload toil with
> managed services), the **shared responsibility model** decides what you must secure (data/IAM/
> config are always yours — most breaches are misconfig), and **regions/AZs + pay-as-you-go**
> shape resilience and cost. Master these and the specifics of any provider become details, not
> mysteries.

## What's next

Next: **Lesson 1602 — Compute: VMs, Containers & Serverless.** The ways to run code in the
cloud: virtual machines and instance types, autoscaling, managed container platforms, and
serverless functions — choosing the right compute model and understanding the cost/control
trade-offs of each.
