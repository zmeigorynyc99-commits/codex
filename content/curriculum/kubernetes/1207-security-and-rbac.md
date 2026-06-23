---
title: "Kubernetes — Security & RBAC"
slug: "kubernetes-security-and-rbac"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Operations"
order: 1207
level: "Senior"
difficulty: "Senior"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, rbac, security, serviceaccount, networkpolicy, pod-security]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 65
status: "published"
summary: "Lock down the cluster: authentication and authorization with RBAC (Roles, RoleBindings, ServiceAccounts), namespaces as boundaries, default-deny NetworkPolicies, Pod Security Standards and securityContext, secrets handling, and the least-privilege principles from the security track applied to Kubernetes."
seoTitle: "Kubernetes 7: Security & RBAC (Roles, ServiceAccounts, NetworkPolicy)"
seoDescription: "Kubernetes security: RBAC Roles/RoleBindings/ServiceAccounts, namespaces, default-deny NetworkPolicies, Pod Security Standards, securityContext, and least privilege. Lab + assessment."
---

A Kubernetes cluster runs everyone's workloads on shared infrastructure, with a powerful API
that can create, read, and delete anything — so **securing it is non-negotiable**. This
lesson applies the security track's principles (least privilege, defense in depth, zero
trust) to Kubernetes: **authentication vs authorization**, **RBAC** (Roles, RoleBindings,
ServiceAccounts), **namespaces** as boundaries, **NetworkPolicies** for default-deny
networking, **Pod Security Standards** and **securityContext** to constrain workloads, and
secret handling. These are the controls that keep a compromised Pod from becoming a
compromised cluster.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish cluster **authentication** from **authorization (RBAC)**.
- Write **Roles/ClusterRoles** and bind them with **RoleBindings** to users/ServiceAccounts.
- Use **ServiceAccounts** for workload identity (least privilege).
- Apply **default-deny NetworkPolicies** to segment traffic.
- Constrain Pods with **securityContext** and **Pod Security Standards**.

## Part 1 — AuthN then AuthZ in the cluster

Every request to the API server is **authenticated** (who are you?) then **authorized**
(may you do this?):

- **Authentication** — certificates, tokens, OIDC (humans via your IdP), or
  **ServiceAccount** tokens (for in-cluster workloads). Kubernetes has **no built-in user
  database** — humans authenticate via external means.
- **Authorization** — almost always **RBAC**: rules that say which **verbs** (get, list,
  create, delete…) a subject may perform on which **resources** in which **namespaces**.

```bash
kubectl auth can-i create deployments              # am I allowed? (great for testing RBAC)
kubectl auth can-i delete pods --as=system:serviceaccount:dev:ci   # impersonate to test
```

## Part 2 — RBAC: Roles and bindings

Four objects, two pairs:

```text
Role         permissions WITHIN one namespace
ClusterRole  permissions cluster-wide (or reusable across namespaces / for cluster resources)
RoleBinding         grants a Role (or ClusterRole) to subjects IN a namespace
ClusterRoleBinding  grants a ClusterRole cluster-wide
   subjects = User | Group | ServiceAccount
```

```yaml
# Role: read-only on pods in namespace "dev"
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { namespace: dev, name: pod-reader }
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { namespace: dev, name: read-pods }
subjects:
  - kind: ServiceAccount
    name: ci
    namespace: dev
roleRef: { kind: Role, name: pod-reader, apiGroup: rbac.authorization.k8s.io }
```

RBAC is **additive and allow-only** — there are no deny rules; a subject can do exactly what
some binding grants, nothing more. Build **narrow Roles** and bind them to specific subjects.

> [!IMPORTANT]
> **Default to least privilege and prefer namespaced `Role`s over `ClusterRole`s.** The most
> common cluster-security failure is over-broad RBAC — binding `cluster-admin` or wildcard
> verbs/resources "to make it work." Grant the **specific verbs on specific resources in a
> specific namespace** a subject needs, and test with **`kubectl auth can-i`**. Avoid the
> built-in `cluster-admin` for anything but real cluster administration. Wildcards
> (`*`) in RBAC are a red flag in a review.

## Part 3 — ServiceAccounts: workload identity

Every Pod runs as a **ServiceAccount** (the `default` one unless you specify), and its token
is mounted into the Pod — that token *is* the Pod's identity to the API. So an over-permissioned
ServiceAccount means a compromised Pod can attack the cluster:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata: { name: app-sa, namespace: app }
automountServiceAccountToken: false     # don't mount a token if the app doesn't call the API
---
# In the Pod spec:
spec:
  serviceAccountName: app-sa
```

> [!TIP]
> Give each workload its **own ServiceAccount** with **only** the RBAC it needs (most apps
> need **none** — they never call the Kubernetes API). Set
> **`automountServiceAccountToken: false`** when the app doesn't talk to the API, so a
> compromised Pod has no cluster credentials to abuse. Never let workloads use the `default`
> ServiceAccount with broad permissions — that's a direct path from "popped a Pod" to "owned
> the namespace."

## Part 4 — NetworkPolicies: default-deny networking

Recall: by default **every Pod can talk to every Pod**. **NetworkPolicies** let you segment
that — apply the security track's **default-deny** here:

```yaml
# Default-deny ALL ingress in a namespace (then explicitly allow what's needed)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: app }
spec:
  podSelector: {}            # all pods in the namespace
  policyTypes: ["Ingress"]
  # no ingress rules = deny all inbound
---
# Allow only the web tier to reach the db on 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: web-to-db, namespace: app }
spec:
  podSelector: { matchLabels: { app: db } }
  policyTypes: ["Ingress"]
  ingress:
    - from: [{ podSelector: { matchLabels: { app: web } } }]
      ports: [{ port: 5432 }]
```

NetworkPolicies require a **CNI that enforces them** (Calico, Cilium — Flannel alone does
not). Start with **default-deny**, then allow specific flows — microsegmentation inside the
cluster, limiting lateral movement if a Pod is compromised.

## Part 5 — Constraining Pods: securityContext & Pod Security Standards

Apply container hardening (from the Docker security lesson) at the Pod level:

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: ["ALL"] }
        privileged: false
```

**Pod Security Standards (PSS)** are three built-in profiles enforced per-namespace via the
**Pod Security Admission** controller:

```text
privileged   no restrictions (system/trusted workloads only)
baseline     blocks known privilege escalations (a sane minimum)
restricted   hardened: non-root, no privilege escalation, drop caps, seccomp, etc.
```

```bash
# Enforce "restricted" on a namespace via a label:
kubectl label namespace app \
  pod-security.kubernetes.io/enforce=restricted
```

> [!IMPORTANT]
> Run Pods as **non-root**, **drop all capabilities**, set **`readOnlyRootFilesystem`** and
> **`allowPrivilegeEscalation: false`**, and **never** use `privileged: true` unless truly
> required — these are the least-privilege controls that contain a container breakout.
> Enforce them cluster-wide with **Pod Security Admission** (`restricted` profile) or a policy
> engine (OPA Gatekeeper / Kyverno) so insecure Pods are **rejected at admission**, not
> caught later. Combine with **encryption-at-rest for Secrets** and tight RBAC for defense in
> depth.

## Hands-on lab

```bash
# 1. RBAC: a least-privilege ServiceAccount that can only read pods in "dev"
kubectl create namespace dev
kubectl create serviceaccount ci -n dev
cat > rbac.yaml <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { namespace: dev, name: pod-reader }
rules: [{ apiGroups: [""], resources: ["pods","pods/log"], verbs: ["get","list","watch"] }]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { namespace: dev, name: read-pods }
subjects: [{ kind: ServiceAccount, name: ci, namespace: dev }]
roleRef: { kind: Role, name: pod-reader, apiGroup: rbac.authorization.k8s.io }
EOF
kubectl apply -f rbac.yaml

# 2. Test the permissions with impersonation
kubectl auth can-i list pods   -n dev --as=system:serviceaccount:dev:ci   # yes
kubectl auth can-i delete pods -n dev --as=system:serviceaccount:dev:ci   # no
kubectl auth can-i create deployments -n dev --as=system:serviceaccount:dev:ci  # no

# 3. securityContext: a hardened, non-root Pod
cat > secure-pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata: { name: secure, namespace: dev }
spec:
  securityContext: { runAsNonRoot: true, runAsUser: 10001 }
  containers:
    - name: app
      image: nginxinc/nginx-unprivileged:stable
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: ["ALL"] }
EOF
kubectl apply -f secure-pod.yaml
kubectl exec -n dev secure -- id   # non-root uid

# 4. Enforce Pod Security 'restricted' and watch an insecure Pod get REJECTED
kubectl label ns dev pod-security.kubernetes.io/enforce=restricted --overwrite
kubectl run rooty -n dev --image=nginx   # should be DENIED by admission (runs as root)

# 5. Default-deny NetworkPolicy (requires an enforcing CNI like Calico/Cilium)
kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: dev }
spec: { podSelector: {}, policyTypes: ["Ingress"] }
EOF

# cleanup
kubectl delete ns dev
```

## Exercises

1. Explain AuthN vs AuthZ in Kubernetes and how humans vs workloads authenticate.
2. Write a Role + RoleBinding granting read-only pod access in one namespace to a
   ServiceAccount; verify with `auth can-i`.
3. Explain why RBAC has no deny rules and how that shapes your design.
4. Create a dedicated ServiceAccount for a workload, disable token automount, and explain the
   benefit.
5. Write a default-deny ingress NetworkPolicy and a single allow rule; note the CNI
   requirement.
6. Harden a Pod with securityContext and enforce the `restricted` Pod Security Standard;
   show an insecure Pod being rejected.

## Troubleshooting

- **`Forbidden` errors** — RBAC denies it. *Fix:* `kubectl auth can-i`; add a narrow Role/
  binding for the exact verb/resource.
- **App has cluster-admin "to make it work"** — over-privileged. *Fix:* scope down to needed
  verbs/resources; least privilege.
- **Compromised Pod could hit the API** — default SA token mounted. *Fix:* dedicated SA,
  `automountServiceAccountToken: false`, minimal RBAC.
- **NetworkPolicy has no effect** — non-enforcing CNI. *Fix:* use Calico/Cilium.
- **Pod rejected after enabling restricted** — image runs as root / needs caps. *Fix:* use a
  non-root image; set securityContext; or relax the namespace profile deliberately.
- **Secrets readable by many** — broad RBAC + base64. *Fix:* restrict `get secrets`,
  encryption at rest, external store.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Order the two checks every API request goes through.
2. How do human users authenticate, vs workloads?
3. Difference between Role and ClusterRole; RoleBinding and ClusterRoleBinding?
4. Why does RBAC being allow-only matter for design?
5. What is a ServiceAccount and why give each workload its own?
6. Why set `automountServiceAccountToken: false`?
7. What does a default-deny NetworkPolicy do, and what's required to enforce it?
8. Name three securityContext settings and the `restricted` PSS goal.
9. **Practical:** create least-privilege RBAC and verify it with `auth can-i`.
10. **Practical:** enforce `restricted` and show an insecure Pod rejected.

## Solutions & validation

1. **Authentication** then **authorization (RBAC)**.
2. Humans via external means (certs/tokens/OIDC — no built-in user DB); workloads via
   **ServiceAccount** tokens.
3. Role = namespaced; ClusterRole = cluster-wide/reusable. RoleBinding grants in a namespace;
   ClusterRoleBinding cluster-wide.
4. No deny rules — you must grant **only** what's needed; broad grants can't be "subtracted."
5. A workload identity to the API; per-workload SAs limit blast radius via least privilege.
6. So a compromised Pod with no API need has **no cluster token** to abuse.
7. Denies all inbound to selected Pods (allow specific flows after); needs an enforcing CNI
   (Calico/Cilium).
8. e.g. `runAsNonRoot`, `allowPrivilegeEscalation:false`, `capabilities.drop:[ALL]`,
   `readOnlyRootFilesystem`; `restricted` = hardened non-root baseline enforced at admission.
9. **Validation:** `auth can-i list pods` yes / `delete pods` no (see lab).
10. **Validation:** `kubectl run rooty` denied once `enforce=restricted` is set.

> [!TIP]
> Cluster security is the security track in Kubernetes form: **least-privilege RBAC**
> (narrow Roles, per-workload ServiceAccounts, no wildcards), **default-deny NetworkPolicies**
> (microsegmentation), and **hardened, non-root Pods enforced at admission** (PSS/Gatekeeper/
> Kyverno) — plus encrypted Secrets. Assume any Pod can be compromised and design so that it
> **can't** become a cluster takeover.

## What's next

Next: **Lesson 1208 — Helm, Operators & Troubleshooting.** Packaging and operating at scale:
Helm charts for templated, versioned releases, the Operator pattern for stateful/automated
apps, and a systematic cluster-troubleshooting method (events, describe, logs, exec) that
ties the whole track together.
