---
title: "Cloud — Security & Compliance"
slug: "cloud-security-and-compliance"
track: "cloud-fundamentals"
trackName: "Cloud Fundamentals"
module: "Cloud Operations"
order: 1605
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Cloud"
tags: [cloud, security, encryption, kms, compliance, threat-detection]
cover: "/covers/curriculum/cloud-fundamentals.svg"
estMinutes: 60
status: "published"
summary: "Defense in depth for the cloud: encryption at rest and in transit with KMS, secrets management, logging and threat detection, network security and posture management, compliance frameworks, and the cloud-specific attack surface that misconfigurations expose."
seoTitle: "Cloud 5: Security & Compliance (KMS, threat detection, posture)"
seoDescription: "Cloud security: encryption/KMS, secrets management, audit logging and threat detection, CSPM, compliance frameworks, and the cloud attack surface. Hands-on lab and assessment."
---

You've secured the network and IAM; this lesson rounds out **cloud security as defense in depth**.
Building on the security track, we cover **encryption** (at rest and in transit, and key
management with KMS), **secrets management**, **audit logging and threat detection**, **security
posture management** (catching misconfigurations automatically), **compliance frameworks**, and
the **cloud-specific attack surface**. The recurring theme from earlier lessons holds: in the
cloud, **misconfiguration — not the provider — is the threat**, so automated guardrails matter as
much as good intentions.

## Learning objectives

By the end of this lesson you will be able to:

- Apply **encryption** at rest and in transit, and manage keys with **KMS**.
- Use cloud **secrets managers** for credentials.
- Enable **audit logging** and **threat detection**.
- Use **posture management (CSPM)** to catch misconfigurations.
- Understand **compliance frameworks** and the cloud **attack surface**.

## Part 1 — Encryption and KMS

Encrypt data **at rest** and **in transit** (the cryptography lesson, applied):

```text
AT REST    storage/disks/databases encrypted with keys — often a checkbox, but KEY MANAGEMENT matters
IN TRANSIT TLS everywhere (between users↔services and service↔service); no plaintext on the wire
KMS        a managed Key Management Service stores/rotates encryption keys in hardware (HSM-backed)
   → services encrypt using KMS keys; access to the KEY is controlled by IAM (separation of duties)
   → "envelope encryption": data keys encrypt data, the KMS key encrypts the data keys
```

- **At-rest encryption** is usually easy to enable (often default) — do it everywhere; the cost is
  negligible.
- **KMS** centralizes key storage, rotation, and **access control via IAM** — so you control *who
  can decrypt* separately from *who can read the storage*. This separation is powerful: even with
  storage access, an attacker can't decrypt without KMS permission.
- **In transit**: TLS 1.2+ everywhere, including **internal** service-to-service (zero trust).

> [!TIP]
> Enable **encryption at rest everywhere** (it's cheap/default) and manage keys with **KMS** so
> that **decrypt permission is a separate IAM control** from storage access — an attacker who
> compromises a bucket still can't read the data without KMS access. Use **customer-managed keys**
> when you need control over rotation/revocation, and enforce **TLS in transit even internally**.
> The combination of KMS + IAM + TLS gives you cryptographic defense in depth on top of the network
> and access controls.

## Part 2 — Secrets management

Applications need credentials (DB passwords, API keys) — and hardcoding them is the recurring sin:

```text
✗ secrets in code/config/env committed to Git, in plaintext user-data, or in AMIs
✓ cloud SECRETS MANAGER (Secrets Manager, Secret Manager, Key Vault):
   - stores secrets encrypted (KMS-backed), access via IAM, audited, with rotation
   - apps fetch at runtime using their ROLE (no static secret in the app)
   - automatic rotation for supported services (e.g. database passwords)
```

This unifies the secret handling from every prior track (K8s Secrets, Ansible Vault, CI/CD OIDC):
the real secret lives in a **managed, encrypted, access-controlled, audited** store; workloads
retrieve it at runtime via their **role**; nothing sensitive sits in code or images.

## Part 3 — Audit logging and threat detection

You can't detect or investigate what you don't log (the SIEM lesson, in the cloud):

```text
AUDIT LOGS   CloudTrail / Cloud Audit Logs / Azure Activity — record EVERY API call:
   who did what, when, from where → the cloud control-plane audit trail (enable org-wide!)
FLOW LOGS    VPC flow logs — network traffic metadata (detect exfiltration, scanning)
THREAT DETECTION  GuardDuty / Security Command Center / Defender — ML/signature detection of
   anomalous API calls, crypto-mining, leaked-credential use, known-bad IPs
CENTRALIZE   ship logs to a SIEM/log store; alert on suspicious events (recall MTTD/MTTR)
```

- **Audit logs (CloudTrail et al.)** are non-negotiable — the record of every control-plane
  action, essential for detection, forensics, and compliance. Enable across **all accounts/
  regions**.
- **Threat-detection services** continuously analyze logs for known-bad behavior (leaked-key use,
  crypto-mining, anomalous calls) with minimal setup — turn them on.

## Part 4 — Posture management and guardrails

Because misconfiguration is the main risk, automate **finding and preventing** it:

```text
CSPM (Cloud Security Posture Management)  continuously scans for misconfigurations:
   public buckets, open security groups, unencrypted volumes, over-permissive IAM, no MFA
   (Security Hub / Defender for Cloud / SCC, or tools like Prowler, ScoutSuite)
PREVENTIVE GUARDRAILS  stop bad config before it happens:
   Service Control Policies / Org policies — e.g. "deny creating public buckets org-wide"
   Policy-as-code (OPA/Sentinel/Config rules) in CI for IaC (recall DevSecOps)
```

Two layers: **detective** (CSPM scans for existing misconfig) and **preventive** (org policies +
IaC policy-as-code block it at creation). The preventive layer is more valuable — stop the public
bucket from ever being created rather than finding it after the breach. This is the security
track's "shift left" applied to cloud config.

> [!IMPORTANT]
> Since **misconfiguration is the dominant cloud threat**, invest in **automated guardrails** over
> hoping people configure things correctly. **Preventive** controls — org-level policies that
> *deny* public buckets / unencrypted disks / wildcard IAM, plus **policy-as-code on your IaC** —
> stop misconfigurations from ever existing. Back them with **detective** CSPM scanning for what
> slips through. Humans will misconfigure things at scale; the only reliable defense is making the
> insecure configuration **impossible or immediately flagged**.

## Part 5 — Compliance and the attack surface

**Compliance frameworks** define required controls for regulated data/industries:

```text
SOC 2     security/availability controls (common for SaaS)
ISO 27001 information security management
PCI DSS   payment card data
HIPAA     healthcare data (US)
GDPR      EU personal data (privacy, residency, breach notification)
FedRAMP   US government cloud
```

Providers are compliant for the **infrastructure** (their half of shared responsibility) and
publish attestations; **you** must implement and evidence the controls for **your** workloads
(config, access, encryption, logging). Many controls map directly to what this track teaches.

**The cloud attack surface** (what attackers actually exploit):

```text
□ Public storage buckets (the classic data leak)
□ Over-permissive IAM / leaked long-lived keys (privilege escalation, account takeover)
□ Open security groups / exposed databases & management ports
□ Unpatched workloads (still your job on IaaS — vuln management track)
□ Secrets in code/images; misconfigured public snapshots/AMIs
□ Supply chain (compromised dependencies/images) and SSRF reaching the metadata service
```

Almost all of these are **configuration and access** problems — which is why IAM, network design,
encryption, secrets management, and posture guardrails (this and the prior lesson) *are* cloud
security.

## Hands-on lab

```text
Assessment + design exercise (real services need an account).

1. ENCRYPTION — for each, state at-rest, in-transit, or both, and where KMS helps:
   a) A database holding PII
   b) API traffic between users and your service
   c) Service-to-service internal calls
   (All should be encrypted; KMS manages keys + decrypt access via IAM)

2. SECRETS — a junior committed a DB password to the repo and put an API key in the AMI's
   user-data. List what's wrong and the correct approach for each.

3. DETECTION — which log/service detects each?
   a) "Who deleted that bucket?"            → ______ (audit log/CloudTrail)
   b) "A leaked key is mining crypto"        → ______ (threat detection)
   c) "Unusual outbound data transfer"        → ______ (flow logs + detection)

4. POSTURE — write three PREVENTIVE org guardrails that would stop common breaches.
   (e.g. deny public buckets, require encryption, deny wildcard IAM / require MFA)

5. SHARED RESPONSIBILITY (compliance) — for PCI on IaaS, name two controls the provider covers
   and two you must implement.
```

```bash
# Read-only checks if you have a cloud CLI configured:
# aws cloudtrail describe-trails ;  aws guardduty list-detectors
# aws s3api get-public-access-block --bucket <b> ;  aws iam get-account-summary
echo "encrypt everywhere (KMS) + secrets manager + audit logs + preventive guardrails."
```

## Exercises

1. Explain encryption at rest vs in transit and how KMS separates decrypt access from storage
   access.
2. Describe the right way to handle application secrets in the cloud and what it replaces.
3. Explain why audit logs (CloudTrail et al.) are non-negotiable and what threat detection adds.
4. Compare detective (CSPM) and preventive (org policy/policy-as-code) controls; which is better
   and why?
5. List five items on the cloud attack surface and the control that addresses each.
6. Explain the customer's vs provider's role for a compliance framework like PCI on IaaS.

## Troubleshooting

- **Data readable after storage compromise** — no key separation. *Fix:* KMS + IAM-controlled
  decrypt; customer-managed keys.
- **Secret in code/AMI/user-data** — *Fix:* secrets manager + role-based runtime fetch; rotate
  exposed secret.
- **No record of an incident** — audit logging off. *Fix:* enable CloudTrail/audit logs org-wide;
  centralize.
- **Public bucket leaked data** — misconfig. *Fix:* preventive guardrail to deny public buckets +
  CSPM detection.
- **Crypto-mining from a leaked key unnoticed** — no detection. *Fix:* enable threat detection;
  alert + auto-respond.
- **"We're compliant because AWS is"** — shared responsibility misread. *Fix:* implement/evidence
  YOUR controls.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does KMS provide beyond just encrypting data?
2. Why encrypt internal service-to-service traffic?
3. How should application secrets be stored and retrieved?
4. Why are audit logs essential, and what does threat detection add?
5. Difference between CSPM (detective) and org policies (preventive)?
6. Which is more valuable and why?
7. Name four items on the cloud attack surface.
8. Who is responsible for compliance controls on IaaS — provider or you?
9. **Practical:** map three security questions to the right log/service.
10. **Practical:** write three preventive guardrails.

## Solutions & validation

1. Centralized key storage/rotation + **IAM-controlled decrypt access** (separate from storage
   access).
2. Zero-trust: don't assume the internal network is safe; prevents MITM/sniffing.
3. In a **secrets manager** (encrypted, IAM-controlled, audited, rotatable); fetched at runtime via
   the workload's **role**.
4. They record every API action (detection/forensics/compliance); threat detection **analyzes** for
   anomalous/malicious behavior.
5. CSPM **finds** existing misconfig; org policies/policy-as-code **prevent** it at creation.
6. **Preventive** — stops the misconfiguration from ever existing (vs finding it post-breach).
7. e.g. public buckets, over-permissive IAM/leaked keys, open SGs/exposed DBs, unpatched
   workloads, secrets in images (any four).
8. **You** implement/evidence your workload controls; the provider covers the infrastructure half.
9. **Validation:** deletion→audit log, leaked key mining→threat detection, exfiltration→flow logs.
10. **Validation:** deny public buckets, require encryption, require MFA / deny wildcard IAM.

> [!TIP]
> Cloud security is **defense in depth against misconfiguration**: encrypt everywhere with **KMS**
> (decrypt gated by IAM), keep secrets in a **secrets manager**, turn on **audit logs + threat
> detection**, and — most importantly — deploy **preventive guardrails** (org policies + IaC
> policy-as-code) so insecure config can't be created, backed by **CSPM** to catch the rest. The
> provider secures the infrastructure; making *your* configuration secure-by-default is the job.

## What's next

Next: **Lesson 1606 — Serverless & Managed Services.** Building cloud-native: event-driven
architectures with functions, managed queues and streams, API gateways, the trade-offs of going
serverless, and composing managed services into applications with minimal operational overhead.
