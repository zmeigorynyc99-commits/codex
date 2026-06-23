---
title: "Cloud — Compute: VMs, Containers & Serverless"
slug: "cloud-compute-vms-containers-serverless"
track: "cloud-fundamentals"
trackName: "Cloud Fundamentals"
module: "Cloud Foundations"
order: 1602
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Cloud"
tags: [cloud, compute, vms, serverless, autoscaling, containers]
cover: "/covers/curriculum/cloud-fundamentals.svg"
estMinutes: 60
status: "published"
summary: "The ways to run code in the cloud: virtual machines and instance types, images and autoscaling groups, managed container platforms, and serverless functions — choosing the right compute model and understanding the control, scaling, and cost trade-offs of each."
seoTitle: "Cloud 2: Compute — VMs, Containers & Serverless (autoscaling, FaaS)"
seoDescription: "Cloud compute: virtual machines and instance types, images/autoscaling, managed containers, and serverless functions; choosing a model and cost trade-offs. Lab and assessment."
---

Compute is where your code runs — and the cloud offers a **spectrum** of options from "a whole
virtual machine you manage" to "just a function that runs on demand." Each trades **control** for
**convenience** and has a different **scaling and cost** profile. This lesson covers **virtual
machines** (instance types, images, autoscaling), **managed container platforms** (running the
Docker/Kubernetes workloads you already know), and **serverless functions** — and, most
importantly, **how to choose** the right compute model for a workload.

## Learning objectives

By the end of this lesson you will be able to:

- Provision and right-size **virtual machines** (instance types/families).
- Use **images** and **autoscaling groups** for elastic, self-healing VM fleets.
- Run workloads on **managed container** platforms.
- Explain **serverless** functions and their scaling/cost model.
- **Choose** a compute model for a given workload.

## Part 1 — Virtual machines

The IaaS workhorse: a **VM** (instance) is a virtual server you control fully — pick an OS,
SSH in, install anything. You choose an **instance type** matched to the workload:

```text
INSTANCE FAMILIES (concept; names vary by provider):
  General purpose   balanced CPU/memory (web servers, small apps)
  Compute optimized high CPU:memory ratio (batch, encoding, HPC)
  Memory optimized  lots of RAM (databases, caches, in-memory analytics)
  Storage optimized high local disk/IOPS (data warehouses)
  GPU/accelerated   ML training/inference, rendering
```

Sizing involves **vCPUs + memory** (e.g. "4 vCPU, 16 GB"). **Right-sizing** matters for cost:
too big wastes money, too small throttles. Start measured, adjust with metrics. You also attach
**block storage** (a virtual disk) and place the VM in a **network/subnet** (next lessons).

## Part 2 — Images and autoscaling

You don't hand-configure each VM. You bake an **image** (a snapshot of a configured disk — AMI/
machine image) and launch many identical VMs from it:

```text
   build a golden IMAGE (OS + your app/config, e.g. via Packer + Ansible)
        │ launch from a template
   AUTOSCALING GROUP:  min=2  desired=4  max=20
      - launches VMs from the image to meet 'desired'
      - SCALES OUT on high load (CPU/requests), SCALES IN when idle
      - self-HEALS: replaces unhealthy/terminated instances automatically
      - spreads instances across AZs for HA
```

An **autoscaling group** (ASG / managed instance group) turns VMs into an **elastic, self-
healing fleet** — the cloud-native version of the Kubernetes reconciliation idea for VMs:
declare desired capacity + scaling rules, and the cloud maintains it. Put a **load balancer** in
front to distribute traffic across the fleet.

> [!TIP]
> Treat VMs as **cattle, not pets**: never hand-configure a server you'd be sad to lose. Bake an
> **image** (golden AMI) with your app/config baked in, launch fleets from it via an **autoscaling
> group** across multiple **AZs**, and front them with a load balancer. The ASG gives you
> elasticity (scale with demand) **and** self-healing (replaces dead instances) — so individual
> VM failures are non-events. This is the immutable-infrastructure pattern: replace, don't patch
> in place.

## Part 3 — Managed container platforms

You already know Docker and Kubernetes (earlier tracks). The cloud offers **managed** ways to run
containers so you don't operate the control plane yourself:

```text
Managed Kubernetes   EKS / GKE / AKS — provider runs the control plane; you run workloads
Container services   ECS / Cloud Run / Container Apps — simpler, container-native deploys
Serverless containers Fargate / Cloud Run — "give us a container, we run+scale it, no VMs"
```

- **Managed Kubernetes** (EKS/GKE/AKS) — full K8s without operating the masters; you still manage
  nodes (or use serverless nodes).
- **Serverless containers** (Fargate, Cloud Run) — you supply a container; the platform runs and
  scales it with **no VMs to manage** — the convenience of serverless with the portability of
  containers.

These build directly on the Docker/Kubernetes skills you have — the cloud just removes the
undifferentiated operations.

## Part 4 — Serverless (FaaS)

**Serverless functions** (Lambda, Cloud Functions, Azure Functions) run your code **on demand**
in response to events, with **no servers to manage** and **per-invocation billing**:

```text
   event (HTTP request, file upload, queue message, schedule)
        │ triggers
   FUNCTION runs (your code, a few hundred ms) → returns → scales to ZERO when idle
   you pay per INVOCATION + compute time (ms × memory) — nothing when not running
```

- **No infrastructure** — no VMs, OS, patching, or scaling to manage.
- **Scales automatically** from zero to thousands of concurrent executions.
- **Pay only for execution** (not idle) — great for spiky/intermittent workloads.
- **Event-driven** — glue between services, APIs, data pipelines, automation.

Trade-offs: **cold starts** (first invocation latency), **time/memory limits**, **statelessness**
(no local persistence), and harder local debugging. Best for event-driven, bursty, or glue
workloads — not long-running or latency-critical-at-all-times services.

> [!IMPORTANT]
> Serverless **scales to zero** — its superpower and its constraint. You pay **nothing when
> idle** and it scales automatically, which is ideal for **spiky, event-driven, or infrequent**
> workloads (a webhook handler, a nightly job, an image-resize on upload). But functions are
> **stateless, time-limited, and have cold starts**, so they're a poor fit for steady high-
> throughput services or anything needing local state/long execution. Match the model to the
> traffic shape: bursty/intermittent → serverless; steady/heavy → containers/VMs.

## Part 5 — Choosing a compute model

```text
                  CONTROL   OPS BURDEN   SCALING        BEST FOR
VM (IaaS)         highest   highest      manual/ASG     legacy, full control, specific OS/kernel
Managed K8s       high      medium       you tune       complex microservices, portability
Serverless        low       lowest       automatic      bursty/event-driven, glue, unpredictable
containers (Cloud Run/Fargate) low       lowest         automatic   stateless web/APIs, simple ops
SaaS/managed svc  lowest    none         provider       use a managed DB/queue instead of running one
```

The decision: **how much control do you need vs how much operational burden can you avoid?**
Default toward **more managed** unless you have a specific reason (kernel access, legacy software,
cost at huge scale, regulatory) to take on more. Many real systems **mix** them (VMs for stateful
legacy, containers for services, functions for glue).

## Hands-on lab

```text
Decision + sizing exercise (real provisioning needs an account; concepts are universal).

1. CHOOSE a compute model for each workload and justify:
   a) A REST API with steady 24/7 traffic                     → ______
   b) A function that resizes images when users upload them   → ______
   c) A legacy app needing a specific kernel module + root    → ______
   d) A nightly report job that runs for 3 minutes            → ______
   e) 30 microservices needing service discovery + autoscale  → ______
   (Suggested: a) containers/Cloud Run, b) serverless, c) VM, d) serverless/scheduled,
    e) managed Kubernetes)

2. RIGHT-SIZE: an app uses ~70% of a 2-vCPU/8GB VM at peak. Is it right-sized? What metrics would
   you check before resizing up or down?

3. ELASTICITY: design an autoscaling group for a web tier — min/desired/max, scale metric,
   multi-AZ, and what a load balancer adds.

4. COST shape: sketch the cost curve (idle vs peak) for the SAME spiky workload on (a) a fixed VM
   vs (b) serverless. Which wins for spiky traffic and why?
```

```bash
# Read-only exploration if you have a cloud CLI configured:
# aws ec2 describe-instance-types --query 'InstanceTypes[0:5].[InstanceType,VCpuInfo.DefaultVCpus,MemoryInfo.SizeInMiB]' --output table
# gcloud functions list ;  aws lambda list-functions
echo "VM = control; serverless = zero-ops + scale-to-zero; containers = portable middle ground."
```

## Exercises

1. Describe instance families and match three workloads to the right family.
2. Explain images + autoscaling groups and how they provide elasticity and self-healing.
3. Compare managed Kubernetes vs serverless containers vs functions on ops burden.
4. Explain serverless scaling-to-zero, its billing model, and two limitations.
5. Choose a compute model for five workloads (the lab) with justification.
6. Sketch and compare the cost shape of a fixed VM vs serverless for spiky traffic.

## Troubleshooting

- **VM over/under-sized** — wrong instance type. *Fix:* measure CPU/mem; right-size; consider
  burstable types.
- **Manual VM config drift / pets** — *Fix:* golden images + ASG; immutable infra.
- **One VM = single point of failure** — *Fix:* ASG across multiple AZs + load balancer.
- **Serverless cold starts hurt latency** — *Fix:* provisioned concurrency / keep-warm; or use
  containers for steady traffic.
- **Function hit time/memory limits** — wrong fit. *Fix:* move long/heavy work to containers/
  batch.
- **Surprise serverless bill at scale** — high steady invocations. *Fix:* re-evaluate vs
  containers for sustained load.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is an instance type/family, and why does it matter?
2. What problem do golden images solve?
3. What does an autoscaling group provide?
4. How do managed container platforms reduce ops burden?
5. What does "serverless scales to zero" mean for cost?
6. Name two serverless limitations.
7. What's the core trade-off across all compute models?
8. When pick serverless vs containers vs VM?
9. **Practical:** choose compute models for five workloads.
10. **Practical:** compare cost shape of VM vs serverless for spiky traffic.

## Solutions & validation

1. A VM's CPU/memory profile; matching it to the workload avoids waste/throttling.
2. Reproducible, pre-configured VMs — launch many identical instances; no hand-config.
3. Elastic, self-healing fleet: maintains desired capacity, scales with load, replaces unhealthy
   instances across AZs.
4. The provider runs the control plane / scaling so you only manage workloads (or just supply a
   container).
5. You pay **nothing when idle** and it scales automatically — ideal for spiky/event-driven work.
6. e.g. cold starts, time/memory limits, statelessness (any two).
7. **Control vs operational burden** (and scaling/cost shape).
8. Serverless for bursty/event-driven; containers for portable services; VM for full control/
   legacy.
9. **Validation:** steady API→containers, image-resize→serverless, legacy→VM, nightly→serverless,
   many microservices→managed K8s.
10. **Validation:** VM pays for idle; serverless pays ~0 when idle → serverless wins for spiky.

> [!TIP]
> Picture compute as a **spectrum from control to convenience**: VMs (you run it) → managed
> containers (you supply it) → serverless (you write a function). Default toward **more managed**
> and **scale-to-zero** for bursty work, drop to VMs only when you need the control. Treat VMs as
> **cattle** (images + ASGs), and match the model to the **traffic shape and ops appetite** — most
> real systems mix all three.

## What's next

Next: **Lesson 1603 — Storage & Databases in the Cloud.** Where data lives: object storage
(buckets), block and file storage, and the managed-database landscape (relational, NoSQL, caches,
warehouses) — choosing the right storage and the durability/availability guarantees behind them.
