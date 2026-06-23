---
title: "Kubernetes — Pods, Deployments & ReplicaSets"
slug: "kubernetes-pods-deployments-and-replicasets"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Foundations"
order: 1202
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, pods, deployments, replicasets, rolling-update, scaling]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 65
status: "published"
summary: "The workload core: what a Pod actually is and why you rarely create bare Pods, how Deployments manage ReplicaSets for self-healing and scaling, writing a Deployment manifest, and performing zero-downtime rolling updates and instant rollbacks."
seoTitle: "Kubernetes 2: Pods, Deployments & ReplicaSets (rolling updates)"
seoDescription: "Kubernetes workloads: Pods, ReplicaSets, Deployments, scaling, rolling updates and rollbacks, labels/selectors, and declarative apply. Hands-on lab and assessment."
---

Now we run real workloads. The smallest deployable unit in Kubernetes is the **Pod** — but
you'll almost never create one directly. Instead you declare a **Deployment**, which manages
**ReplicaSets** to keep the right number of healthy Pods running, scale them, and roll out
new versions with **zero downtime** (and roll back instantly if something breaks). This
lesson makes that hierarchy concrete and gets you doing rolling updates and rollbacks — the
bread and butter of running apps on Kubernetes.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what a **Pod** is (and why it can hold more than one container).
- Describe how **Deployment → ReplicaSet → Pods** provides self-healing and scaling.
- Write and `apply` a **Deployment** manifest.
- **Scale** a Deployment and perform a **rolling update** + **rollback**.
- Understand **labels/selectors** linking Deployments to their Pods.

## Part 1 — Pods

A **Pod** is the smallest schedulable unit — **one or more containers** that share a
network namespace (same IP/port space) and can share storage. They're always scheduled
**together** on one node.

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web, labels: { app: web } }
spec:
  containers:
    - name: nginx
      image: nginx:1.27
      ports: [{ containerPort: 80 }]
```

Usually **one main container per Pod**. The multi-container case is a **sidecar** pattern: a
helper alongside the main app (log shipper, proxy) sharing the Pod's network/volumes. Pods
are **ephemeral and disposable** — they get a new IP each time, can die anytime, and are
**not self-healing on their own**.

> [!IMPORTANT]
> **Don't create bare Pods for real workloads.** A standalone Pod that dies stays dead —
> nothing recreates it, and it can't scale or roll out updates. Always use a **controller**
> (a Deployment for stateless apps) that *manages* Pods. You'll create Pods directly only
> for quick debugging (`kubectl run --rm -it`). The Pod is the unit Kubernetes *schedules*;
> the Deployment is what you *manage*.

## Part 2 — ReplicaSets and Deployments

The hierarchy:

```text
  Deployment   (you manage this — declares the desired app + version + replica count)
      │ creates/owns
  ReplicaSet   (ensures N identical Pods exist; one per version/template)
      │ creates/owns
  Pods         (the actual running containers)
```

- A **ReplicaSet** keeps exactly **N** identical Pods running (the self-healing/scaling
  controller). Delete a Pod → the ReplicaSet makes another.
- A **Deployment** manages ReplicaSets **over time** — for a new version it creates a *new*
  ReplicaSet and gradually shifts Pods from old to new (the rolling update), keeping history
  for rollback.

You almost always work with **Deployments**; the ReplicaSet is created/managed for you.

## Part 3 — A Deployment manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels: { app: web }
spec:
  replicas: 3                         # desired number of Pods
  selector:
    matchLabels: { app: web }         # which Pods this Deployment owns (MUST match template labels)
  template:                           # the Pod template (the "what to run")
    metadata:
      labels: { app: web }            # labels applied to each Pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports: [{ containerPort: 80 }]
          resources:                  # requests/limits (good practice from day one)
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { cpu: 250m, memory: 128Mi }
```

```bash
kubectl apply -f deploy.yaml          # declarative create/update
kubectl get deploy,rs,pods -l app=web # see the Deployment, its ReplicaSet, and Pods
kubectl get pods -l app=web -o wide
```

The **`selector.matchLabels`** must match the **`template.metadata.labels`** — that label
link is how the Deployment knows which Pods are "its." Get this wrong and the Deployment
won't manage any Pods.

> [!TIP]
> Prefer **`kubectl apply -f`** (declarative — store manifests in Git, apply repeatedly,
> idempotent) over imperative `kubectl create/run` for anything real. The manifest *is* your
> desired state; `apply` reconciles the cluster to it. Set **resource requests/limits** from
> the start — they drive scheduling and protect nodes (the cgroups idea from Docker, at
> cluster scale).

## Part 4 — Scaling and self-healing

```bash
kubectl scale deployment web --replicas=5     # imperative scale
# or edit replicas in the manifest and re-apply (declarative, preferred)
kubectl get pods -l app=web

# Self-healing: delete a Pod and watch the ReplicaSet replace it
kubectl delete pod <one-web-pod>
kubectl get pods -l app=web -w                 # a new Pod appears automatically
```

Scaling is just changing `replicas`; the ReplicaSet adds/removes Pods to match. Self-healing
is the same loop — actual < desired → create Pods. (Autoscaling on metrics, **HPA**, comes
in a later lesson.)

## Part 5 — Rolling updates and rollbacks

Update the image and Kubernetes does a **zero-downtime rolling update**: it brings up new
Pods and tears down old ones gradually, governed by `maxSurge`/`maxUnavailable`:

```bash
# Change the image (records a rollout revision)
kubectl set image deployment/web nginx=nginx:1.27.1
# (better: edit the manifest's image and `kubectl apply -f`)

kubectl rollout status deployment/web          # watch progress to completion
kubectl get rs -l app=web                       # old RS scales down, new RS scales up
kubectl rollout history deployment/web          # revisions

# Something broke? Roll back instantly to the previous revision
kubectl rollout undo deployment/web
kubectl rollout undo deployment/web --to-revision=2
```

```yaml
# Tune the rollout in the Deployment spec:
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1            # how many EXTRA pods during the update
      maxUnavailable: 0      # how many can be DOWN (0 = strict zero-downtime)
```

> [!IMPORTANT]
> A Deployment update creates a **new ReplicaSet** and shifts Pods gradually — old and new
> run **simultaneously** during the rollout, so your app **must tolerate two versions at
> once** (compatible APIs/DB schema). Set **`maxUnavailable: 0`** for strict zero-downtime,
> and **always pair rollouts with readiness probes** (next lesson) so traffic only hits Pods
> that are actually ready. If it goes wrong, **`kubectl rollout undo`** reverts in seconds
> because the old ReplicaSet is still there.

## Hands-on lab

```bash
# 1. Declarative Deployment
cat > deploy.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: { name: web, labels: { app: web } }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports: [{ containerPort: 80 }]
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { cpu: 250m, memory: 128Mi }
EOF
kubectl apply -f deploy.yaml
kubectl get deploy,rs,pods -l app=web

# 2. Self-healing
kubectl delete pod "$(kubectl get pod -l app=web -o jsonpath='{.items[0].metadata.name}')"
kubectl get pods -l app=web            # a replacement is created automatically

# 3. Scale up and down
kubectl scale deployment web --replicas=5; kubectl get pods -l app=web
kubectl scale deployment web --replicas=2

# 4. Rolling update with strict zero-downtime, then rollback
kubectl patch deployment web -p '{"spec":{"strategy":{"rollingUpdate":{"maxUnavailable":0,"maxSurge":1}}}}'
kubectl set image deployment/web nginx=nginx:1.27.1
kubectl rollout status deployment/web
kubectl rollout history deployment/web
kubectl set image deployment/web nginx=nginx:does-not-exist   # break it on purpose
kubectl rollout status deployment/web --timeout=20s || true    # stuck (ImagePullBackOff)
kubectl rollout undo deployment/web                            # instant recovery
kubectl get pods -l app=web

# cleanup
kubectl delete -f deploy.yaml
```

## Exercises

1. Explain what a Pod is and one legitimate reason to have two containers in a Pod.
2. Draw the Deployment → ReplicaSet → Pod ownership and what each controls.
3. Write and apply a Deployment with 3 replicas, resource requests/limits, and correct
   labels/selector.
4. Demonstrate self-healing by deleting a Pod and showing the replacement.
5. Perform a rolling update with `maxUnavailable: 0`, then roll back after introducing a bad
   image.
6. Explain why an app must tolerate two versions running during a rollout.

## Troubleshooting

- **Deployment manages 0 pods** — `selector` ≠ `template` labels. *Fix:* make them match.
- **Bare Pod didn't come back after delete** — no controller. *Fix:* use a Deployment.
- **Rollout stuck** — new Pods not ready (`ImagePullBackOff`/crash). *Fix:* `kubectl get
  pods`, `describe`; fix image; `rollout undo`.
- **Brief downtime during update** — `maxUnavailable` > 0 and/or no readiness probe. *Fix:*
  `maxUnavailable: 0` + readiness probe.
- **Old and new behaving inconsistently** — incompatible versions during rollout. *Fix:*
  ensure backward compatibility; consider blue-green/canary.
- **`kubectl scale` reverted** — a GitOps/HPA controller re-applies desired state. *Fix:*
  change the source manifest, not the live object.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a Pod, and what do its containers share?
2. Why not create bare Pods for real workloads?
3. What does a ReplicaSet guarantee?
4. What does a Deployment add over a ReplicaSet?
5. What must match between a Deployment's selector and its Pod template?
6. How do you scale, and how does self-healing relate to the same loop?
7. What happens during a rolling update at the ReplicaSet level?
8. How do you roll back, and why is it fast?
9. **Practical:** apply a Deployment and demonstrate self-healing.
10. **Practical:** do a rolling update and a rollback.

## Solutions & validation

1. Smallest schedulable unit; containers share **network namespace** (IP/ports) and can
   share storage.
2. A dead bare Pod isn't recreated and can't scale/roll out — no controller.
3. Exactly **N** identical Pods running (self-healing/scaling).
4. Manages ReplicaSets **over time**: rolling updates, revision history, rollbacks.
5. `selector.matchLabels` must equal the Pod `template.metadata.labels`.
6. Set `replicas`; self-healing is the same actual-vs-desired loop creating Pods.
7. A **new ReplicaSet** scales up while the old scales down (gradual shift).
8. `kubectl rollout undo` — the previous ReplicaSet still exists, so it just scales back up.
9. **Validation:** deleting a Pod yields an automatic replacement (see lab).
10. **Validation:** `set image` + `rollout status`, then `rollout undo` recovers.

> [!TIP]
> Manage **Deployments**, not Pods. Keep manifests in Git and **`kubectl apply`** them, set
> **resource requests/limits**, use **`maxUnavailable: 0` + readiness probes** for true
> zero-downtime rollouts, and trust **`rollout undo`** as your instant safety net. This
> Deployment workflow is 80% of running stateless apps on Kubernetes.

## What's next

Next: **Lesson 1203 — Services & Networking.** Pods are ephemeral with changing IPs — so how
does traffic find them? ClusterIP, NodePort, and LoadBalancer Services, DNS-based service
discovery, and an intro to Ingress for HTTP routing into the cluster.
