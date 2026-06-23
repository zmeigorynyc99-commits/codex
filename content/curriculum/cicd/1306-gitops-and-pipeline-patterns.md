---
title: "CI/CD — GitOps & Pipeline Patterns"
slug: "cicd-gitops-and-pipeline-patterns"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "Delivery & Operations"
order: 1306
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, gitops, argocd, flux, declarative, reconciliation]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 60
status: "published"
summary: "The declarative deployment model: Git as the single source of truth for desired state, pull-based reconciliation with Argo CD/Flux, separating CI from CD, drift detection and self-healing, handling secrets in GitOps, and the patterns that make deployments auditable and recoverable."
seoTitle: "CI/CD 6: GitOps & Pipeline Patterns (Argo CD, Flux, reconciliation)"
seoDescription: "GitOps: Git as source of truth, pull-based reconciliation with Argo CD/Flux, CI/CD separation, drift detection, secrets management, and deployment patterns. Lab + assessment."
---

The deployment strategies you just learned still beg a question: **what is the source of
truth for what's running, and who applies it?** **GitOps** answers both — the desired state of
your system lives in **Git**, and an in-cluster **agent continuously reconciles** the live
system to match it (the Kubernetes reconciliation model, extended to deployments). This makes
deployments **declarative, auditable, self-healing, and easy to roll back** (just revert a
commit). This lesson covers GitOps principles, **pull-based** tools (Argo CD/Flux),
separating **CI from CD**, **drift detection**, and **secrets** in GitOps.

## Learning objectives

By the end of this lesson you will be able to:

- State the **GitOps principles** and why Git as source of truth helps.
- Contrast **push** (pipeline applies) vs **pull** (agent reconciles) deployment.
- Use **Argo CD/Flux** concepts: Application, sync, drift, self-heal.
- **Separate CI** (build/test) from **CD** (deploy via Git).
- Handle **secrets** safely in a GitOps repo.

## Part 1 — GitOps principles

GitOps applies the reconciliation idea to **operations**: the entire desired state of your
infrastructure/apps is **declared in Git**, and software keeps reality matching it.

```text
1. DECLARATIVE   — the whole system's desired state is described declaratively (YAML/manifests).
2. VERSIONED     — that state lives in Git: versioned, immutable history, single source of truth.
3. PULLED        — an agent automatically PULLS the desired state and applies it.
4. RECONCILED    — the agent continuously detects DRIFT and converges actual → desired.
```

The payoff: **Git is the source of truth**. Want to know what's deployed? Read the repo. Want
to deploy? Merge a commit. Want to roll back? Revert the commit. Every change is **reviewed
(PR), audited (git history), and reversible** — and the system **self-heals** if someone
hand-edits the cluster.

## Part 2 — Push vs pull deployment

```text
PUSH (traditional CI/CD):
   pipeline has cluster credentials → runs `kubectl apply`/`helm upgrade` from CI → into prod
   - simple, but CI holds prod creds; no continuous drift correction; cluster trusts outside

PULL (GitOps):
   an AGENT INSIDE the cluster watches the Git repo → pulls desired state → applies it
   - cluster creds never leave the cluster; continuous reconciliation; drift auto-corrected
```

**Pull-based GitOps** is more secure (the cluster's credentials stay **in** the cluster — CI
never needs prod access) and more robust (the agent constantly corrects drift, not just at
deploy time). The CI pipeline's job shrinks to **build + test + update Git**; the **agent**
does the deploying.

> [!IMPORTANT]
> In GitOps, **CI never touches the cluster** — it builds/tests the artifact and **commits a
> manifest change** (e.g. bump the image tag). An in-cluster agent (Argo CD/Flux) notices the
> Git change and applies it. This removes prod credentials from your CI system (a major attack
> surface), gives **continuous drift correction**, and makes the **git history your deployment
> audit log**. Rollback becomes `git revert`. It's the declarative model end-to-end.

## Part 3 — Argo CD / Flux concepts

Both are popular GitOps agents. The core object is an **Application** that maps a Git path to
a cluster target:

```yaml
# Argo CD Application (simplified)
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: web, namespace: argocd }
spec:
  source:
    repoURL: https://github.com/org/deploy
    path: apps/web/overlays/prod          # Kustomize/Helm/plain YAML here
    targetRevision: main
  destination: { server: https://kubernetes.default.svc, namespace: web }
  syncPolicy:
    automated: { prune: true, selfHeal: true }   # auto-apply, delete removed, fix drift
```

Key behaviors:
- **Sync** — apply the Git state to the cluster (auto or manual).
- **Drift detection** — the agent shows when live state differs from Git (someone `kubectl
  edit`ed something).
- **Self-heal** — if `selfHeal: true`, it **reverts** manual changes back to Git's state.
- **Prune** — deletes resources removed from Git (so Git is truly authoritative).

Argo CD adds a UI/diff view; Flux is more CLI/GitOps-toolkit oriented. Both reconcile
continuously.

## Part 4 — Separating CI and CD repos

A common, clean pattern is **two repos** (or two clearly separated directories):

```text
   app repo        (source code)
      │ CI: build + test + push image  →  produces ghcr.io/org/app:9f3a1c2
      │ then: open a PR to the DEPLOY repo bumping the image tag
      ▼
   deploy repo     (manifests / Helm values / Kustomize) — the desired state
      │ merge the tag bump
      ▼
   Argo CD/Flux watches deploy repo → syncs the new tag → rolling/canary update in cluster
```

This separates **"what the software is"** (app repo, changes often) from **"what's deployed
where"** (deploy repo, the audited desired state). Promotion = a PR moving the image tag from
the `staging` overlay to the `prod` overlay — reviewable, with full history.

> [!TIP]
> Keep a dedicated **deploy/manifests repo** as the source of truth for desired state, and
> have CI **open a PR** to it (bump the image digest) rather than deploy directly. Then
> environment promotion (dev→staging→prod) is just **merging PRs** across overlays — each a
> reviewable, revertible, audited change. The deploy repo's git log becomes a precise,
> human-readable record of every production change and who approved it.

## Part 5 — Secrets in GitOps

The obvious problem: **you can't commit plaintext secrets to Git**. Solutions:

```text
Sealed Secrets   encrypt secrets so ONLY the cluster's controller can decrypt → safe in Git
SOPS + age/KMS   encrypt values in the YAML; the agent decrypts at apply time
External Secrets Operator   Git holds a REFERENCE; the real secret comes from Vault/cloud KMS
                            at runtime (nothing sensitive in Git at all) — often preferred
```

The principle (from the K8s security lesson): the **real secret never sits in Git as
recoverable plaintext**. Either it's encrypted such that only the cluster can read it
(SealedSecrets/SOPS), or Git holds only a **pointer** to an external secrets manager (External
Secrets Operator). Combine with encryption-at-rest and tight RBAC.

> [!IMPORTANT]
> GitOps means *config* lives in Git — **secrets do not**, at least not in plaintext. Use
> **SealedSecrets/SOPS** (encrypted-at-rest, only the cluster decrypts) or, better, an
> **External Secrets Operator** that keeps the real secret in **Vault/cloud KMS** and puts
> only a reference in Git. A plaintext secret in a GitOps repo is the same critical leak as
> any committed credential — and worse, it's now in your "source of truth." Design secrets out
> of the repo from day one.

## Hands-on lab

```bash
# Conceptual GitOps loop you can run locally with a kind cluster + Argo CD (or just read)

# 1. Install Argo CD (or Flux) — the in-cluster agent
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server

# 2. A "deploy repo" structure (the desired state in Git)
mkdir -p deploy/apps/web && cd deploy
cat > apps/web/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 2
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec: { containers: [{ name: web, image: nginx:1.26 }] }   # <- the version, controlled by Git
EOF
git init -q && git add . && git commit -qm "deploy web nginx:1.26"

# 3. Point Argo CD at the repo (Application) — it pulls + syncs
#    (apply an Application manifest like Part 3, targeting this repo/path)

# 4. GitOps deploy = a Git change. Bump the image and commit:
sed -i 's/nginx:1.26/nginx:1.27/' apps/web/deployment.yaml
git commit -qam "release web nginx:1.27"
#    -> Argo CD detects the change and rolls it out automatically.

# 5. Drift + self-heal demo: hand-edit the cluster, watch GitOps revert it
# kubectl scale deployment web --replicas=5     # manual drift
#   -> with selfHeal, Argo CD reverts replicas back to 2 (Git's desired state)

# 6. Rollback = git revert
git revert --no-edit HEAD                         # back to nginx:1.26; agent re-syncs
```

## Exercises

1. State the four GitOps principles and what "Git as source of truth" gives you.
2. Contrast push vs pull deployment, focusing on credentials and drift.
3. Explain the role of an Argo CD/Flux Application, and what sync/self-heal/prune do.
4. Describe the app-repo vs deploy-repo pattern and how promotion works in it.
5. Explain why you can't commit plaintext secrets and name two GitOps-safe approaches.
6. Show how a rollback is performed in GitOps and why it's clean.

## Troubleshooting

- **Manual `kubectl edit` keeps reverting** — self-heal is working as designed. *Fix:* change
  Git, not the cluster.
- **Deploy not happening** — agent not watching/synced, or wrong path/revision. *Fix:* check
  Application status; sync; verify repo path.
- **CI holds prod credentials** — push-based risk. *Fix:* move to pull-based GitOps; CI only
  updates Git.
- **Secret committed in plaintext** — leak. *Fix:* SealedSecrets/SOPS/External Secrets;
  rotate the secret.
- **Drift between envs** — different manual changes. *Fix:* all state in Git; prune enabled.
- **Hard to audit who changed prod** — *Fix:* GitOps — the deploy repo's history is the audit
  log.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. List the GitOps principles.
2. What is the source of truth in GitOps, and how do you deploy/rollback?
3. Push vs pull — which keeps cluster credentials in the cluster?
4. What does a GitOps agent's self-heal do?
5. What does prune do, and why does it matter for "Git is authoritative"?
6. Why separate the app repo from the deploy repo?
7. How is environment promotion done in GitOps?
8. How do you handle secrets without committing plaintext?
9. **Practical:** make a GitOps "deployment" by changing and committing a manifest.
10. **Practical:** perform a GitOps rollback via `git revert`.

## Solutions & validation

1. **Declarative, versioned (in Git), pulled by an agent, continuously reconciled.**
2. **Git** is the source of truth; deploy by **merging a commit**, roll back by **reverting**
   one.
3. **Pull** (the agent runs in the cluster; CI never gets prod creds).
4. Reverts manual/drifted changes back to **Git's declared state**.
5. Deletes resources removed from Git — so Git fully defines what exists (authoritative).
6. Separates **what the software is** (app, frequent) from **what's deployed** (audited
   desired state).
7. **Merge a PR** moving the image tag/digest across env overlays (dev→staging→prod).
8. **SealedSecrets/SOPS** (encrypted, cluster-only decrypt) or **External Secrets Operator**
   (reference to Vault/KMS).
9. **Validation:** commit bumping the image triggers the agent to sync (see lab).
10. **Validation:** `git revert` returns desired state; agent re-syncs to the prior version.

> [!TIP]
> GitOps is the reconciliation model applied to delivery: **declare desired state in Git, let
> an in-cluster agent pull and converge to it**. You gain a **secure** pipeline (no prod creds
> in CI), a **self-healing** system (drift auto-corrected), a perfect **audit log** (git
> history), and **trivial rollback** (`git revert`). Keep secrets out of Git via encryption or
> external stores, and your deployments become as reviewable and reversible as your code.

## What's next

Next: **Lesson 1307 — Pipeline Security (DevSecOps).** Shift security left into the pipeline:
SAST/DAST, dependency and container scanning as gates, secret scanning, SBOM and signing,
securing the pipeline itself (least-privilege runners, OIDC), and policy-as-code — making
security automatic, not an afterthought.
