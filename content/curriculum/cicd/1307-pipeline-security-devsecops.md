---
title: "CI/CD — Pipeline Security (DevSecOps)"
slug: "cicd-pipeline-security-devsecops"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "Delivery & Operations"
order: 1307
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, devsecops, sast, dast, sbom, secret-scanning, policy-as-code]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 60
status: "published"
summary: "Shift security left into the pipeline: SAST/DAST and dependency/container scanning as gates, secret scanning, SBOM and image signing, securing the pipeline itself (least-privilege runners, OIDC, pinned actions), and policy-as-code — making security automatic rather than an afterthought."
seoTitle: "CI/CD 7: Pipeline Security / DevSecOps (SAST, DAST, SBOM, OIDC)"
seoDescription: "DevSecOps: SAST/DAST, dependency and container scanning gates, secret scanning, SBOM/signing, securing the pipeline (OIDC, least privilege), and policy-as-code. Lab + assessment."
---

A fast pipeline that ships vulnerabilities quickly is a liability. **DevSecOps** integrates
security **into** the pipeline so it's **automatic and continuous** — caught at commit time,
not in a once-a-year audit. This lesson applies the security track's principles to CI/CD:
**shift-left scanning** (SAST, dependencies, containers, IaC) as **gates**, **secret
scanning**, **SBOM and signing** for supply-chain integrity, and — crucially — **securing the
pipeline itself**, because the CI system is a high-value target with access to source,
secrets, and prod. Plus **policy-as-code** to enforce standards automatically.

## Learning objectives

By the end of this lesson you will be able to:

- Add **SAST, dependency (SCA), container, and IaC scanning** as pipeline gates.
- Add **secret scanning** to block committed credentials.
- Generate an **SBOM** and **sign** artifacts for supply-chain integrity.
- **Secure the pipeline itself**: least-privilege, OIDC, pinned actions, protected runners.
- Enforce standards with **policy-as-code**.

## Part 1 — Shift left: scanning as gates

"Shift left" = move security checks **earlier** (and cheaper) — into the pipeline, on every
change, as **blocking gates**:

```text
   commit/PR ──► pipeline gates (fail = block merge):
   ┌───────────────┬───────────────┬──────────────┬──────────────┬──────────────┐
   │ SECRET SCAN   │ SAST          │ SCA (deps)   │ CONTAINER    │ IaC SCAN     │
   │ gitleaks      │ CodeQL/Semgrep│ npm audit /  │ Trivy/Grype  │ tfsec/Checkov│
   │ (no creds)    │ (code bugs)   │ pip-audit    │ (image CVEs) │ (misconfig)  │
   └───────────────┴───────────────┴──────────────┴──────────────┴──────────────┘
```

- **SAST** (static app security testing) — analyzes source for vulnerable patterns
  (injection, XSS) — CodeQL, Semgrep, SonarQube.
- **SCA** (software composition analysis) — flags vulnerable **dependencies** (most app risk!)
  — `npm audit`, `pip-audit`, Trivy, Dependabot.
- **Container scanning** — image CVEs — Trivy, Grype (Lesson: Docker hygiene).
- **IaC scanning** — Terraform/K8s misconfigs — tfsec, Checkov, kube-linter.
- **DAST** (dynamic) — tests the **running** app for vulnerabilities — OWASP ZAP (usually in a
  later/staging stage since it needs a live target).

Gate on **new HIGH/CRITICAL** findings (risk-based, per vuln management) so you don't block on
the entire historical backlog.

> [!TIP]
> Make scans **gates, not reports** — a finding that doesn't block a merge gets ignored. But
> gate on **new** HIGH/CRITICAL issues, not the whole backlog, or you'll never merge anything
> and people will disable the check. Run the **fast** scans (secret scan, SCA, lint-style
> SAST) on every PR; reserve **slow** ones (full DAST against a deployed staging env) for
> later stages. Risk-based gating keeps security *and* velocity.

## Part 2 — Secret scanning

The most common, most damaging leak: a **credential committed to Git**. Scan for it
**before** it lands:

```yaml
- uses: gitleaks/gitleaks-action@v2          # scan the diff/history for secrets
# or pre-commit hook so it never even reaches CI:
#   repo: https://github.com/gitleaks/gitleaks  hook: gitleaks
```

Combine **pre-commit hooks** (block locally) + **CI scanning** (catch what slips through) +
**provider-side scanning** (GitHub secret scanning + push protection). And recall the incident
response: if a secret *is* committed, **rotate it first**, then purge history — detection
limits but doesn't undo exposure.

## Part 3 — SBOM, signing, and provenance

Supply-chain attacks (compromised dependencies/build systems) make **artifact integrity**
essential:

```yaml
- run: syft ${{ env.IMAGE }} -o spdx-json > sbom.json      # SBOM: what's inside
- run: cosign sign --yes ${{ env.IMAGE_DIGEST }}            # sign the image (keyless/OIDC)
- run: cosign attest --predicate sbom.json ${{ env.IMAGE_DIGEST }}   # attach SBOM attestation
# At deploy time, verify only signed images run (admission policy):
#   cosign verify ... ; or Kyverno/Gatekeeper policy requiring a valid signature
```

- **SBOM** — inventory of components → instant CVE impact analysis (Lesson 1304).
- **Signing** (cosign) — cryptographic proof the artifact came **unmodified** from your
  pipeline.
- **Provenance/attestation** (SLSA) — verifiable record of *how/where* it was built.
- **Admission control** — production **refuses** unsigned/unverified images, closing the loop.

## Part 4 — Securing the pipeline itself

The pipeline is a **prime target**: it has your source, secrets, and often prod access. Treat
it as production infrastructure:

```text
□ Least-privilege tokens — scope GITHUB_TOKEN with `permissions:`; minimal cloud roles
□ OIDC federation — short-lived cloud creds, no stored long-lived keys
□ Pin third-party actions to a SHA (a floating tag = arbitrary code with your token)
□ Protect runners — ephemeral/isolated self-hosted runners; never run untrusted PR code with secrets
□ Guard secrets — don't expose them to fork PRs; use environments with required reviewers for deploys
□ Protect branches/CI config — require review on workflow file changes (they can exfiltrate secrets)
□ Audit + least access — who can edit pipelines, approve deploys, read secrets
```

A notorious risk: a malicious **pull_request** from a fork running with access to secrets, or a
compromised third-party action stealing your tokens. Both are prevented by the controls above.

> [!IMPORTANT]
> **Your CI/CD system is high-value production infrastructure** — it can read your code, holds
> your secrets, and can deploy to prod. Secure it accordingly: **OIDC** instead of stored keys,
> **least-privilege** tokens, **pinned** third-party actions (to a SHA), **isolated ephemeral
> runners**, and **no secrets exposed to untrusted PR code**. A compromised pipeline is worse
> than a compromised server — it can poison *every* future release. Apply the security track's
> least-privilege and supply-chain thinking to the pipeline itself.

## Part 5 — Policy-as-code

Encode security/compliance rules as **code** the pipeline enforces automatically — no human
gatekeeper required:

```text
OPA / Rego        general policy engine ("no public S3 buckets", "images must be signed")
Conftest          test config/IaC against Rego policies in CI
Kyverno/Gatekeeper Kubernetes admission policies ("no privileged pods", "require limits")
Checkov/tfsec     IaC policy checks
```

```yaml
- run: conftest test deploy/ --policy policies/   # fail CI if manifests violate policy
```

Policy-as-code makes standards **consistent, versioned, and unavoidable** — "no container runs
as root," "every resource has limits," "only signed images deploy" become **automated gates**
instead of wiki pages nobody reads.

## Hands-on lab

```bash
mkdir devsecops-lab && cd devsecops-lab && git init -q

# 1. Secret scanning catches a committed credential
echo 'AWS_SECRET_ACCESS_KEY=AKIAabc123EXAMPLEkeyvalue0000000000000000' > config.env
gitleaks detect --no-git 2>/dev/null && echo "clean" || echo ">> SECRET DETECTED — block + ROTATE"

# 2. Dependency (SCA) scan
echo 'flask==0.12.2' > requirements.txt        # old version with known CVEs
pip install pip-audit -q 2>/dev/null
pip-audit -r requirements.txt 2>/dev/null | head || echo "(install pip-audit) — would flag CVEs"

# 3. Container scan gate (fail on HIGH/CRITICAL)
trivy image --severity HIGH,CRITICAL --exit-code 1 nginx:1.18 2>/dev/null \
  && echo "image clean" || echo ">> image has HIGH/CRITICAL CVEs — gate blocks"

# 4. IaC misconfig scan
cat > main.tf <<'EOF'
resource "aws_s3_bucket" "b" { bucket = "demo" }
resource "aws_s3_bucket_public_access_block" "b" {
  bucket = aws_s3_bucket.b.id
  block_public_acls = false      # <- insecure on purpose
}
EOF
tfsec . 2>/dev/null | tail -5 || echo "(install tfsec) — would flag public access"

# 5. SBOM generation
syft dir:. -o spdx-json 2>/dev/null > sbom.json && echo "SBOM written" || echo "(install syft)"

# 6. Pipeline self-security checklist (review): pinned actions? OIDC? least-priv permissions?
```

## Exercises

1. List the scan types (secret, SAST, SCA, container, IaC, DAST) and what each catches; place
   them in pipeline order.
2. Add a secret-scanning gate and demonstrate it blocking a committed credential.
3. Add a container-scan gate that fails on HIGH/CRITICAL; explain risk-based gating.
4. Generate an SBOM and explain its role in CVE response and signing.
5. Audit a sample workflow for self-security: token scope, OIDC, pinned actions, fork-PR
   secret exposure.
6. Write a policy-as-code rule (in words or Rego/Conftest) enforcing one standard, and wire it
   as a gate.

## Troubleshooting

- **Scans ignored** — reports, not gates. *Fix:* fail the build; gate on new HIGH/CRITICAL.
- **Every merge blocked by backlog** — gating on all historical findings. *Fix:* gate on
  **new** issues; track the rest.
- **Secret leaked despite scanning** — scan after push only. *Fix:* pre-commit + CI + provider
  push protection; rotate on leak.
- **Compromised action stole tokens** — floating tag, broad permissions. *Fix:* pin to SHA;
  minimal `permissions:`; OIDC.
- **Fork PR exfiltrated secrets** — untrusted code with secrets. *Fix:* don't expose secrets to
  fork PRs; use environment protections.
- **DAST flaky/blocking PRs** — needs a live app. *Fix:* run against staging in a later stage,
  not on every PR.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does "shift left" mean for security?
2. Differentiate SAST, SCA, DAST, and container scanning.
3. Why gate on *new* HIGH/CRITICAL rather than all findings?
4. Where should secret scanning happen, and what if a secret leaks anyway?
5. What do SBOM, signing, and provenance each provide?
6. Why is the CI/CD system itself a high-value target?
7. Name three controls that secure the pipeline.
8. What is policy-as-code and one rule you'd enforce?
9. **Practical:** show a scan gate blocking (secret or container).
10. **Practical:** generate an SBOM for a project/image.

## Solutions & validation

1. Move security checks **earlier/cheaper** — into the pipeline on every change, as gates.
2. SAST = static code analysis; SCA = vulnerable **dependencies**; DAST = tests the **running**
   app; container = image package CVEs.
3. So velocity isn't blocked by the whole historical backlog while still stopping new risk.
4. Pre-commit + CI + provider push protection; if leaked, **rotate first**, then purge.
5. SBOM = component inventory; signing = authenticity/integrity; provenance = how/where built
   (SLSA).
6. It can read source, holds secrets, and can deploy to prod — compromise poisons all
   releases.
7. e.g. OIDC (no stored keys), least-privilege tokens, pinned actions, isolated runners, no
   fork-PR secrets.
8. Rules as code the pipeline enforces (OPA/Conftest/Kyverno) — e.g. "only signed images
   deploy" / "no privileged pods."
9. **Validation:** gitleaks/trivy exits non-zero and blocks (see lab).
10. **Validation:** `syft`/`docker sbom` produces an SBOM file.

> [!TIP]
> DevSecOps makes security **automatic and continuous**: scan everything (secrets, code, deps,
> images, IaC) as **risk-based gates**, prove integrity with **SBOM + signing**, enforce
> standards with **policy-as-code**, and — don't forget — **harden the pipeline itself** with
> OIDC, least privilege, and pinned actions. Security that runs on every commit and blocks bad
> changes beats any audit done after the fact.

## What's next

Next: **Lesson 1308 — Pipeline Troubleshooting & Best Practices.** Operate pipelines well:
debugging failing/flaky pipelines, speed optimization (caching, parallelism, right-sizing),
keeping pipelines maintainable (reusable workflows, DRY), observability of the pipeline, and a
production-readiness checklist tying the track together.
