---
title: "Cloud — Networking & IAM"
slug: "cloud-networking-and-iam"
track: "cloud-fundamentals"
trackName: "Cloud Fundamentals"
module: "Cloud Foundations"
order: 1604
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Cloud"
tags: [cloud, vpc, networking, iam, security-groups, least-privilege]
cover: "/covers/curriculum/cloud-fundamentals.svg"
estMinutes: 65
status: "published"
summary: "Connecting and securing cloud resources: virtual networks (VPCs), subnets (public/private), security groups and firewalls, load balancers and DNS, and Identity & Access Management — roles, policies, and the least-privilege practices that are the number-one cloud-security concern."
seoTitle: "Cloud 4: Networking & IAM (VPC, subnets, security groups, least privilege)"
seoDescription: "Cloud networking: VPCs, public/private subnets, security groups, NAT, load balancers, DNS; and IAM roles/policies/least privilege. Hands-on lab and assessment."
---

Cloud resources need to **connect** (to each other and the internet) and be **secured** — and
this is where most cloud breaches happen (misconfigured networks and over-permissive access).
This lesson covers cloud **networking** — virtual networks (VPCs), **public/private subnets**,
**security groups/firewalls**, **load balancers**, and **DNS** — and **IAM** (Identity & Access
Management), the roles, policies, and **least-privilege** practices that determine who/what can do
what. Everything here is the Linux networking and security tracks applied to the cloud, and it's
the highest-leverage place to get security right.

## Learning objectives

By the end of this lesson you will be able to:

- Design a **VPC** with **public and private subnets**.
- Control traffic with **security groups** (and NACLs) using default-deny.
- Use **load balancers** and **DNS** to expose services.
- Explain **IAM**: identities, policies, roles, and least privilege.
- Apply **least-privilege** access and use **roles** instead of static keys.

## Part 1 — VPCs and subnets

A **VPC** (Virtual Private Cloud) is your **private, isolated network** in the cloud — you define
its IP range and carve it into **subnets** across AZs:

```text
VPC  10.0.0.0/16   (your private network)
├── PUBLIC subnet  10.0.1.0/24 (AZ-a)   has a route to an Internet Gateway → internet-facing
│     └── load balancer, bastion host, NAT gateway
├── PRIVATE subnet 10.0.10.0/24 (AZ-a)  NO direct internet route → app servers, databases
│     └── reaches the internet OUTBOUND via a NAT gateway (but not reachable inbound)
└── (repeat across AZ-b, AZ-c for high availability)
```

- **Public subnet** — has a route to an **internet gateway**; resources here can be reached from
  the internet (load balancers, bastions).
- **Private subnet** — **no inbound internet route**; for app servers and databases. They reach
  out via a **NAT gateway** (for updates) but can't be reached directly from the internet.

This is the CIDR/subnetting from the networking track, applied to cloud — and the foundation of a
secure architecture: **keep databases and app servers in private subnets**, expose only the load
balancer publicly.

> [!IMPORTANT]
> **Put internet-facing things (load balancers, bastions) in public subnets and everything else —
> app servers, databases, caches — in private subnets.** A database with a public IP and an open
> port is one of the most common, most damaging cloud misconfigurations. Private-subnet resources
> reach out for updates via NAT but accept **no inbound internet traffic**, so even a
> misconfigured security group can't expose them to the world. Architect for "private by default,
> public only where required."

## Part 2 — Security groups and NACLs

**Security groups** are stateful, instance-level virtual firewalls (recall the firewall lesson) —
**default-deny inbound**, allow only what's needed:

```text
Security group for a web server:
  inbound:  allow tcp 443 from 0.0.0.0/0          (HTTPS from anyone)
            allow tcp 22  from <bastion SG/your IP> (SSH restricted!)
  outbound: allow all (or tighten)
  default:  DENY everything else inbound  (stateful: replies auto-allowed)

Security group for a database:
  inbound:  allow tcp 5432 FROM the web server's security group  (not the world!)
  → reference SGs, not IPs: "the web tier may reach the DB," precise and dynamic
```

- **Security groups** — stateful (reply traffic auto-allowed), attached to instances, default-deny
  inbound. The primary control.
- **NACLs** (network ACLs) — stateless, subnet-level, allow **and** deny rules — a coarser second
  layer.
- **Reference security groups, not IPs** — "allow from the web-tier SG" stays correct as instances
  come and go.

This is **default-deny + least-privilege networking** (security track) in cloud form: open the
minimum ports, from the minimum sources, and never expose databases to `0.0.0.0/0`.

## Part 3 — Load balancers and DNS

```text
   internet → DNS (api.example.com → LB) → LOAD BALANCER (public subnet)
                                              │ distributes across healthy targets
                                       app instances (private subnet, multiple AZs)
```

- **Load balancer** — distributes traffic across healthy instances (with **health checks**),
  enables zero-downtime deploys and autoscaling, terminates **TLS**. Layer 7 (HTTP, path/host
  routing — like Ingress) or Layer 4 (TCP).
- **DNS** (Route 53/Cloud DNS) — maps names to resources; supports **health-checked failover**,
  latency/geo routing, and weighted routing (for canaries). 
- The pattern: **DNS → public load balancer → private app fleet across AZs** — resilient and
  secure.

## Part 4 — IAM: the heart of cloud security

**IAM** controls **who (identity) can do what (permissions) on which resources** — the most
important security system in any cloud (recall AuthN/AuthZ from the security track):

```text
IDENTITIES   users (humans), groups, ROLES (assumable identities), service accounts
POLICIES     JSON documents granting/denying ACTIONS on RESOURCES (optionally with conditions)
ROLES        a set of permissions that an identity/service ASSUMES temporarily (no static keys)
```

```json
// An IAM policy: least-privilege, specific actions on a specific resource
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-app-bucket/*"
}
```

- **Policies** are **default-deny**: nothing is allowed unless a policy grants it (an explicit
  deny always wins).
- **Roles** are the modern best practice: instead of giving an app static access keys, it
  **assumes a role** and gets **temporary, automatically-rotated credentials**. Same for CI via
  OIDC (the CI/CD lesson).

## Part 5 — Least privilege and IAM best practices

```text
□ LEAST PRIVILEGE — grant the minimum actions on the minimum resources (start from nothing)
□ Use ROLES, not long-lived access keys — temporary credentials, auto-rotated
□ MFA on all human users, especially admins; never use the root/owner account day-to-day
□ Avoid wildcards (Action:"*", Resource:"*") — the red flag of over-permissioning
□ Group permissions via groups/managed policies; audit with access analyzers
□ Service accounts/roles per workload (the cloud version of K8s ServiceAccounts)
□ Rotate/scope any keys that must exist; detect leaked keys (secret scanning)
```

> [!IMPORTANT]
> **IAM misconfiguration is the #1 cause of cloud breaches** — over-permissive policies, wildcard
> permissions, and leaked long-lived keys. Apply **least privilege ruthlessly**: start from zero
> and grant only the specific actions on the specific resources a principal needs. **Use roles
> (temporary credentials), not static keys**; require **MFA**; never operate as root/owner; and
> treat any `"*"` in a policy as something to justify in review. Getting IAM right prevents more
> breaches than any other single control — it's the security track's least-privilege principle, and
> it matters most here.

## Hands-on lab

```text
Design + policy exercise (real IAM/VPC needs an account).

1. VPC DESIGN — sketch a 2-AZ VPC for a web app:
   - Which tier goes in PUBLIC vs PRIVATE subnets? (LB, app, DB, NAT, bastion)
   - What can reach the database, and from where?
   (Expected: LB+NAT+bastion public; app+DB private; DB allows 5432 only from the app SG)

2. SECURITY GROUPS — write rules (in words) for:
   a) A web LB: inbound ____, outbound ____
   b) App servers: inbound from ____, outbound ____
   c) Database: inbound ____ from ____ only
   (Expected: LB 443 from world; app from LB SG; DB 5432 from app SG only)

3. SPOT THE MISCONFIG — what's wrong with each?
   a) Database SG: inbound 5432 from 0.0.0.0/0          → __________
   b) IAM policy: { Action: "*", Resource: "*" }        → __________
   c) App uses a hardcoded long-lived access key in code → __________
   (Answers: DB exposed to internet; god-mode policy; use a role + secrets mgr instead)

4. LEAST-PRIVILEGE POLICY — write (in JSON-ish) a policy letting a function read ONLY from one
   bucket and write logs — nothing else.
```

```bash
# Read-only exploration with a cloud CLI if configured:
# aws ec2 describe-vpcs ;  aws ec2 describe-security-groups --query 'SecurityGroups[].IpPermissions'
# aws iam list-roles ;  aws sts get-caller-identity
echo "private subnets + default-deny SGs + least-privilege IAM roles = secure cloud baseline."
```

## Exercises

1. Design a VPC with public/private subnets across two AZs and place five resource types
   correctly.
2. Write security-group rules for a 3-tier app (LB/app/DB) using SG references, not IPs.
3. Identify three classic cloud misconfigurations and the fix for each.
4. Explain IAM identities, policies, and roles, and why policies are default-deny.
5. Write a least-privilege IAM policy for a specific task and explain what you excluded.
6. Explain why roles + temporary credentials beat long-lived access keys.

## Troubleshooting

- **Database reachable from the internet** — public subnet / open SG. *Fix:* private subnet; SG
  inbound only from the app SG.
- **Can't SSH / app can't be reached** — missing/incorrect SG or route. *Fix:* check SG inbound,
  route tables, public/private placement.
- **Over-permissive IAM (`*`)** — breach risk. *Fix:* least privilege; specific actions/resources;
  remove wildcards.
- **Leaked long-lived key** — *Fix:* rotate immediately; switch to roles/OIDC; secret scanning.
- **Private instances can't reach the internet for updates** — no NAT. *Fix:* NAT gateway in the
  public subnet + route.
- **No MFA / using root** — *Fix:* enforce MFA; create least-privilege admin users; lock away
  root.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a VPC, and what's the difference between public and private subnets?
2. Where should databases live, and why?
3. How do security groups work, and what's the benefit of referencing SGs over IPs?
4. What does a load balancer add, and how does DNS fit?
5. What are IAM identities, policies, and roles?
6. Why are IAM policies default-deny?
7. State the least-privilege principle for IAM.
8. Why use roles instead of long-lived keys?
9. **Practical:** write SG rules for a 3-tier app.
10. **Practical:** spot and fix three cloud misconfigurations.

## Solutions & validation

1. Your isolated cloud network; **public** subnets have an internet route (LB/bastion), **private**
   don't (app/DB).
2. **Private subnets** — no inbound internet exposure (huge breach class avoided).
3. Stateful instance firewalls, default-deny inbound; referencing SGs stays correct as instances
   change.
4. LB distributes traffic to healthy targets (+ TLS/health checks); DNS maps names → LB (with
   failover/routing).
5. Identities (users/roles/SAs), policies (JSON grants of actions on resources), roles (assumable
   temporary permissions).
6. Nothing is allowed unless explicitly granted (explicit deny wins).
7. Grant the **minimum** actions on the **minimum** resources needed.
8. Roles give **temporary, auto-rotated** credentials — no static secret to leak.
9. **Validation:** LB 443 from world; app from LB SG; DB 5432 from app SG only (see lab).
10. **Validation:** DB open to world→private+SG; `*` policy→least privilege; hardcoded key→role.

> [!TIP]
> Secure cloud architecture is the security track applied: **private subnets by default**
> (databases never public), **default-deny security groups referencing tiers**, a **load balancer**
> as the only public entry, and — most importantly — **least-privilege IAM with roles, not keys,
> and MFA**. IAM misconfig causes more breaches than anything else, so spend your security effort
> there. Get the network topology and IAM right and the rest of cloud security gets much easier.

## What's next

Next: **Lesson 1605 — Cloud Security & Compliance.** Going deeper on protecting cloud workloads:
encryption (at rest/in transit, KMS), secrets management, logging and threat detection, network
security, compliance frameworks, and the cloud-specific attack surface — defense in depth for the
cloud.
