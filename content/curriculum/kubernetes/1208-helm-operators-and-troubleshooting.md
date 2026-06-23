---
title: "Kubernetes — Helm, Operators & Troubleshooting"
slug: "kubernetes-helm-operators-and-troubleshooting"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Operations"
order: 1208
level: "Senior"
difficulty: "Senior"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, helm, operators, crd, troubleshooting, debugging]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 70
status: "published"
summary: "Package and operate at scale: Helm charts for templated, versioned, repeatable releases; Custom Resources and the Operator pattern for automating stateful apps; and a systematic cluster-troubleshooting method (events, describe, logs, exec, common failure states) that ties the whole track together."
seoTitle: "Kubernetes 8: Helm, Operators & Troubleshooting (CRDs, debugging)"
seoDescription: "Kubernetes packaging and ops: Helm charts/values/releases, Custom Resources and the Operator pattern, and a systematic debugging method for CrashLoopBackOff, Pending, ImagePullBackOff. Capstone lab + assessment."
---

This capstone covers how teams **package**, **extend**, and **operate** Kubernetes in the
real world. Hand-writing dozens of YAML files per app per environment doesn't scale — **Helm**
templates and versions them as installable **charts**. For complex, stateful apps, the
**Operator pattern** encodes human operational knowledge into a controller that manages
**Custom Resources**. And when things break — they will — you need a **systematic
troubleshooting method**. Master these and you can deploy, customize, and debug anything on a
cluster.

## Learning objectives

By the end of this lesson you will be able to:

- Use **Helm** to install, template, version, and roll back releases.
- Customize charts with **values** and understand the chart structure.
- Explain **CRDs** and the **Operator pattern** for automated, stateful apps.
- Apply a **systematic debugging method** to cluster problems.
- Diagnose the common failure states (CrashLoopBackOff, Pending, ImagePullBackOff, OOMKilled).

## Part 1 — Helm: the package manager for Kubernetes

**Helm** packages a set of K8s manifests into a **chart** you can install, upgrade, version,
and roll back — like apt/npm for the cluster:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgres
helm install mydb bitnami/postgresql            # install a "release" named mydb
helm list                                       # installed releases
helm upgrade mydb bitnami/postgresql --set auth.database=app
helm rollback mydb 1                             # revert to a previous revision
helm uninstall mydb
```

A **release** is an installed instance of a chart; Helm tracks **revisions** so upgrades are
versioned and reversible. This is how you install complex off-the-shelf software (databases,
ingress controllers, monitoring) in one command instead of applying dozens of YAMLs.

## Part 2 — Chart structure and values

```text
mychart/
├── Chart.yaml         # name, version, appVersion
├── values.yaml        # DEFAULT configuration (the knobs)
├── templates/         # manifests with {{ }} templating
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl
└── charts/            # dependencies (subcharts)
```

```yaml
# templates/deployment.yaml (templated)
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

```bash
helm create mychart                  # scaffold a chart
helm install web ./mychart --values prod-values.yaml   # override defaults per environment
helm install web ./mychart --set replicaCount=5
helm template ./mychart              # render manifests locally WITHOUT installing (debug!)
helm lint ./mychart                  # validate
```

> [!TIP]
> Keep **one chart**, override per environment with **`values.yaml` files** (`-f
> dev-values.yaml` / `-f prod-values.yaml`) — same chart, different configuration, the
> 12-factor idea again. Use **`helm template`** to render and review the *actual* YAML before
> installing (catch templating bugs locally), and **`helm diff`** (plugin) before upgrades.
> Helm releases are versioned, so **`helm rollback`** is your instant undo when an upgrade
> misbehaves.

## Part 3 — CRDs and the Operator pattern

Kubernetes is **extensible**: a **CustomResourceDefinition (CRD)** adds a *new kind* of
object to the API (e.g. `kind: PostgresCluster`). An **Operator** is a **custom controller**
that watches those resources and reconciles them — encoding the operational knowledge a human
SRE would apply:

```text
You create:   kind: PostgresCluster, spec: { replicas: 3, version: 16, backup: daily }
Operator:     watches PostgresClusters → provisions StatefulSets, Services, PVCs,
              configures replication, runs backups, handles failover & upgrades — automatically
```

This is the **reconciliation loop** (Lesson 1201) applied to *your* domain objects. Operators
exist for databases (CloudNativePG, Zalando Postgres), Kafka (Strimzi), Prometheus, cert
management (cert-manager), and more — turning "run a database on Kubernetes" from a fragile
DIY StatefulSet into a managed, automated experience.

> [!IMPORTANT]
> For complex **stateful** systems, prefer a mature **Operator** over hand-built StatefulSets.
> The operator encodes the hard parts — replication, failover, backups, safe upgrades — that
> are easy to get catastrophically wrong by hand. CRDs + operators are also how you'd extend
> Kubernetes to manage your *own* higher-level abstractions. The same controller/reconcile
> model you learned for built-in resources powers the entire ecosystem.

## Part 4 — A systematic troubleshooting method

When something's wrong, work **outside-in** with the same four verbs every time:

```bash
kubectl get pods                       # 1. STATE: Running? Pending? CrashLoopBackOff? Restarts?
kubectl describe pod <p>               # 2. WHY: read the EVENTS at the bottom (scheduling, pulls, probes)
kubectl logs <p>                       # 3. APP: container output / stack trace
kubectl logs <p> --previous            #    logs from the PREVIOUS crashed container (key for CrashLoop!)
kubectl exec -it <p> -- sh             # 4. INSIDE: poke around (env, connectivity, files)

# Cluster-wide context:
kubectl get events --sort-by=.lastTimestamp -A | tail -20
kubectl top pods ; kubectl top nodes   # resource pressure (needs metrics-server)
kubectl get pod <p> -o yaml            # full spec/status
```

The single most useful command is **`kubectl describe`** — its **Events** explain *why* a Pod
is stuck. For crash loops, **`kubectl logs --previous`** shows why the *last* attempt died.

## Part 5 — The common failure states

```text
Pending            can't be scheduled → describe Events: insufficient cpu/mem, taints,
                   unbound PVC, affinity unsatisfiable.  Fix the constraint or add capacity.
ImagePullBackOff   bad image name/tag or registry auth.  Fix image; add imagePullSecrets.
ErrImagePull       same family — registry can't be reached / not authorized.
CrashLoopBackOff   container starts then exits repeatedly → logs --previous: app error,
                   missing config/env, failed dependency, or a too-aggressive LIVENESS probe.
OOMKilled (137)    exceeded memory limit → raise limit or fix the leak.
CreateContainerConfigError   missing ConfigMap/Secret referenced by the Pod.  Create it.
Init:0/1           an initContainer is failing/blocking → logs of the init container.
Completed/Error    a Job/one-shot finished (Completed = success).
```

> [!TIP]
> Memorize the failure-state → cause map. **CrashLoopBackOff** almost always means "read
> **`kubectl logs --previous`**" (the app is dying — config, dependency, or a bad liveness
> probe). **Pending** means "read **`describe` Events**" (scheduling/PVC). **ImagePullBackOff**
> = image/registry. **137 = OOM**. Pattern-matching the status to its handful of root causes
> turns most Kubernetes debugging into a 60-second exercise.

## Hands-on lab — capstone

```bash
# 1. Helm: install something real, customize, roll back
helm repo add bitnami https://charts.bitnami.com/bitnami && helm repo update
helm install web bitnami/nginx --set service.type=ClusterIP --set replicaCount=2
helm list
kubectl get pods -l app.kubernetes.io/instance=web
helm upgrade web bitnami/nginx --set replicaCount=3
helm history web
helm rollback web 1
helm template bitnami/nginx --set replicaCount=2 | head -40   # render without installing
helm uninstall web

# 2. Scaffold + inspect your own chart
helm create demo
helm lint ./demo
helm template ./demo --set replicaCount=4 | grep -A1 replicas

# 3. Deliberately break things, then diagnose with the method
kubectl run badimage --image=nginx:no-such-tag
kubectl get pod badimage                       # ImagePullBackOff
kubectl describe pod badimage | sed -n '/Events/,$p'

kubectl run crasher --image=busybox -- sh -c 'echo starting; exit 1'
kubectl get pod crasher                        # CrashLoopBackOff
kubectl logs crasher --previous                # see the exit

kubectl run oom --image=busybox --limits=memory=16Mi -- \
  sh -c 'a=0; while true; do a=$a$a$a$a$a$a; done' 2>/dev/null || true
kubectl describe pod oom | grep -i -E 'OOMKilled|Reason'

# 4. Missing config -> CreateContainerConfigError
kubectl run needsconfig --image=busybox --overrides='
{"spec":{"containers":[{"name":"needsconfig","image":"busybox","command":["sh","-c","sleep 60"],
"envFrom":[{"configMapRef":{"name":"does-not-exist"}}]}]}}' --restart=Never
kubectl get pod needsconfig
kubectl describe pod needsconfig | sed -n '/Events/,$p'

# cleanup
kubectl delete pod badimage crasher oom needsconfig --ignore-not-found
rm -rf ./demo
```

## Exercises

1. Install a chart with Helm, override two values, upgrade, view history, and roll back.
2. Use `helm template` to render a chart's manifests without installing, and explain why
   that's useful.
3. Scaffold a chart with `helm create`, change a value, and confirm it propagates via
   `helm template`.
4. Explain CRDs and the Operator pattern, and give two real operators and what they automate.
5. Diagnose a `CrashLoopBackOff` and an `ImagePullBackOff` using the systematic method; state
   the root cause of each.
6. Map five Pod failure states to their typical root cause and first debugging command.

## Troubleshooting

- **Helm upgrade broke the app** — bad values/template. *Fix:* `helm rollback`; review with
  `helm template`/`helm diff`.
- **Chart installs but values ignored** — wrong key path / not under `.Values`. *Fix:* check
  `values.yaml` structure; `helm template` to verify.
- **CrashLoopBackOff** — app exits repeatedly. *Fix:* `kubectl logs --previous`; fix config/
  dependency/liveness probe.
- **Pending forever** — unschedulable. *Fix:* `describe` Events; resources/taints/PVC/
  affinity.
- **ImagePullBackOff** — image/registry. *Fix:* correct tag; `imagePullSecrets`.
- **Operator not reconciling my CR** — operator not installed/healthy or CRD missing. *Fix:*
  check the operator pod logs and that the CRD is registered.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is Helm, and what is a "release"?
2. How do you customize a chart per environment?
3. What does `helm template` do and why use it?
4. How do you undo a bad Helm upgrade?
5. What is a CRD, and what is an Operator?
6. Why prefer an operator over a DIY StatefulSet for complex stateful apps?
7. Name the four-command troubleshooting method.
8. For CrashLoopBackOff, Pending, ImagePullBackOff, and OOMKilled — give the first thing to
   check.
9. **Practical:** install, upgrade, and roll back a Helm release.
10. **Practical:** diagnose a CrashLoopBackOff with `logs --previous`.

## Solutions & validation

1. The K8s package manager; a **release** is an installed instance of a chart (with versioned
   revisions).
2. Override **values** with `-f values.yaml` files or `--set`.
3. Renders the chart's manifests locally **without installing** — to review/debug templating.
4. `helm rollback <release> <revision>`.
5. CRD adds a **new resource type** to the API; an **Operator** is a controller that
   reconciles those custom resources.
6. The operator encodes failover/backup/upgrade knowledge that's easy to get catastrophically
   wrong by hand.
7. `get` (state) → `describe` (events/why) → `logs [--previous]` (app) → `exec` (inside).
8. CrashLoop → `logs --previous`; Pending → `describe` Events; ImagePullBackOff → image/
   registry; OOMKilled → memory limit/leak.
9. **Validation:** `helm install`/`upgrade`/`history`/`rollback` succeed (see lab).
10. **Validation:** `kubectl logs crasher --previous` shows the exit cause.

> [!TIP]
> You've reached operational fluency: **Helm** to install/version/roll back releases (one
> chart, per-env values), the **Operator/CRD** pattern to automate complex stateful systems
> with the same reconcile model, and a **systematic debugging method** (`get → describe →
> logs --previous → exec`) that maps each failure state to its root cause. With these, you can
> deploy, customize, and rescue real workloads on any cluster.

## What's next

You've completed the **Kubernetes** track — from architecture and the reconciliation model
through Deployments, Services, configuration, storage, health/scaling, security/RBAC, and
operations with Helm and operators. You can now orchestrate containerized applications at
scale. Next in the roadmap: **CI/CD** — automating the build → test → deploy pipeline that
ships your images to these clusters — followed by **Infrastructure as Code** and
**configuration management**, completing the modern delivery toolchain.
