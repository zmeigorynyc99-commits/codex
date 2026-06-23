---
title: "Kubernetes — Architecture & Core Concepts"
slug: "kubernetes-architecture-and-core-concepts"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Foundations"
order: 1201
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, architecture, control-plane, declarative, kubectl, pods]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 60
status: "published"
summary: "Why Kubernetes exists and how it works: the orchestration problem, the declarative reconciliation model, control-plane vs worker-node components (API server, etcd, scheduler, controllers, kubelet), the object model, and your first cluster with kubectl."
seoTitle: "Kubernetes 1: Architecture & Core Concepts (control plane, kubectl)"
seoDescription: "Intro to Kubernetes: orchestration, declarative reconciliation, control-plane vs node components (API server, etcd, scheduler, kubelet), objects, and kubectl basics. Lab + assessment."
---

You can package any app into a container now — but running **hundreds** of them across many
machines, with self-healing, scaling, rollouts, and service discovery, is a different
problem. **Kubernetes (K8s)** is the orchestration platform that solves it. Before any YAML,
you need the **model**: Kubernetes is **declarative** — you describe the desired state, and
**controllers continuously reconcile reality toward it**. This lesson covers the
orchestration problem, that reconciliation loop, the **control-plane and node components**,
the **object model**, and your first hands-on cluster with **kubectl**.

## Learning objectives

By the end of this lesson you will be able to:

- Explain the **orchestration** problem K8s solves and the **declarative** model.
- Describe the **reconciliation loop** (desired vs actual state).
- Name the **control-plane** (API server, etcd, scheduler, controllers) and **node**
  (kubelet, kube-proxy, runtime) components.
- Understand the **object/resource** model and namespaces.
- Use **`kubectl`** to talk to a cluster and read its state.

## Part 1 — The orchestration problem

A handful of containers you can run by hand. A real system needs answers to:

- A container crashes at 3 a.m. — who **restarts** it?
- Traffic spikes — who **scales** from 3 to 30 replicas and back?
- A node dies — who **reschedules** its containers elsewhere?
- You ship v2 — who does a **zero-downtime rollout** (and rollback if it fails)?
- 50 services need to **find each other** and **balance load** as instances come and go?

Doing this manually doesn't scale. **Kubernetes automates** scheduling, healing, scaling,
rollouts, networking, and configuration across a **cluster** of machines — you declare
*what* you want; it figures out *how* and keeps it true.

## Part 2 — The declarative, reconciliation model

This is the core idea that makes everything else make sense:

```text
You: "I want 3 replicas of nginx:1.27"   →  stored as DESIRED state (in etcd)
                                              │
Controllers loop forever:   observe ACTUAL state  →  compare to DESIRED  →  act to close the gap
   (a replica died → start one;  too many → kill one;  node gone → reschedule)
```

You don't run imperative commands like "start this container on that server." You submit a
**desired-state object** ("I want 3 healthy replicas") and **controllers** make it so —
and *keep* it so. Kill a pod and Kubernetes recreates it; that's not magic, it's the
**reconciliation loop** noticing actual ≠ desired and acting.

> [!IMPORTANT]
> Kubernetes is **declarative, not imperative**. You describe the **end state** you want;
> the system **continuously reconciles** toward it. This is why K8s self-heals: a controller
> is always comparing "what I have" to "what you asked for" and correcting drift. Internalize
> this loop and Kubernetes stops feeling random — every behavior is some controller closing
> a gap between desired and actual state.

## Part 3 — Cluster architecture

A cluster = a **control plane** (the brain) + **worker nodes** (where your containers run).

```text
            CONTROL PLANE                                WORKER NODES
  ┌───────────────────────────────┐        ┌─────────────┐   ┌─────────────┐
  │ kube-apiserver  (the only      │◄──────►│ kubelet     │   │ kubelet     │
  │   way in; REST API, validates) │        │ kube-proxy  │   │ kube-proxy  │
  │ etcd  (key-value store of ALL  │        │ container   │   │ container   │
  │   cluster state — the DB)      │        │  runtime    │   │  runtime    │
  │ kube-scheduler (places pods    │        │  + Pods     │   │  + Pods     │
  │   onto nodes)                  │        └─────────────┘   └─────────────┘
  │ controller-manager (the loops) │
  └───────────────────────────────┘
```

**Control plane:**
- **kube-apiserver** — the front door. *Everything* (kubectl, controllers, kubelets) talks
  to the cluster **only** through it; it validates and persists changes.
- **etcd** — the consistent key-value store holding **all** cluster state (the source of
  truth). Back this up — lose etcd, lose the cluster's brain.
- **kube-scheduler** — decides **which node** each new pod runs on (based on resources,
  constraints, affinity).
- **controller-manager** — runs the **reconciliation loops** (node, replicaset, deployment,
  etc.).

**Worker nodes:**
- **kubelet** — the node agent; ensures the pods assigned to it are running and healthy.
- **kube-proxy** — programs networking/routing so Services work.
- **container runtime** — runs containers (containerd/CRI-O) — the Docker concepts you
  already know.

## Part 4 — The object model

You manage K8s by creating **objects** (resources), usually as YAML, each with the same
shape:

```yaml
apiVersion: apps/v1        # which API group/version
kind: Deployment           # the resource type
metadata:
  name: web                # name (and namespace, labels, annotations)
  labels: { app: web }
spec:                      # DESIRED state (what you want)
  replicas: 3
  # ...
status:                    # ACTUAL state (filled in by Kubernetes — read-only to you)
  readyReplicas: 3
```

- **`spec`** = your desired state; **`status`** = the system's observed reality.
- **Labels** (key/value tags) + **selectors** are how objects find each other (a Service
  selects Pods by label) — this loose coupling is everywhere in K8s.
- **Namespaces** partition a cluster into virtual sub-clusters (e.g. `dev`, `prod`,
  per-team) for organization, quotas, and access control.

Common resources you'll meet: **Pod** (smallest unit), **Deployment** (manages replicas/
rollouts), **Service** (stable networking), **ConfigMap/Secret** (config), **Ingress**
(HTTP routing), and more — each a later lesson.

## Part 5 — kubectl: talking to the cluster

`kubectl` is the CLI that sends your intentions to the API server:

```bash
# Get a local cluster (pick one): minikube start | kind create cluster | k3d
kubectl cluster-info                 # control-plane endpoints
kubectl get nodes                    # the worker nodes
kubectl get pods -A                  # pods across ALL namespaces (system + yours)
kubectl get all                      # common resources in the current namespace

kubectl run web --image=nginx        # quick imperative pod (fine for learning)
kubectl describe pod web             # detailed state + events (great for debugging)
kubectl logs web                     # container logs (like docker logs)
kubectl get pods -o wide             # extra columns (node, IP)
kubectl explain deployment.spec      # built-in docs for any field
kubectl config get-contexts          # which cluster/namespace you're pointed at
```

`kubectl get`/`describe`/`logs`/`explain` are your daily verbs. Note your **context**
(cluster + namespace) so you don't act on the wrong cluster.

> [!TIP]
> Two habits prevent most beginner pain: always know **which context/namespace** you're in
> (`kubectl config current-context`, `kubectl get pods` shows only the current namespace),
> and use **`kubectl describe`** + the **Events** at the bottom of its output as your
> first debugging stop — they explain *why* a pod is pending, crashing, or unschedulable far
> better than `get` alone.

## Hands-on lab

```bash
# 1. Spin up a local cluster (kind shown; minikube/k3d also fine)
kind create cluster --name lab        # or: minikube start
kubectl cluster-info
kubectl get nodes -o wide

# 2. Explore the control plane (it runs as pods too)
kubectl get pods -n kube-system       # apiserver, etcd, scheduler, controller-manager, coredns
kubectl get namespaces

# 3. Run something and watch reconciliation/self-healing
kubectl run web --image=nginx
kubectl get pods -w &                  # watch (Ctrl-C later)
kubectl describe pod web | sed -n '/Events/,$p'   # the Events section
POD=$(kubectl get pod -l run=web -o name 2>/dev/null || echo pod/web)
kubectl delete pod web                 # delete it...
kubectl run web --image=nginx          # (a bare pod isn't recreated — that's a Deployment's job, next lesson)

# 4. Read object spec vs status as YAML
kubectl get pod web -o yaml | sed -n '1,40p'   # see metadata/spec/status

# 5. Use explain + describe as documentation/debugging
kubectl explain pod.spec.containers
kubectl logs web

# cleanup
kubectl delete pod web --ignore-not-found
# kind delete cluster --name lab
```

## Exercises

1. In your own words, list four things Kubernetes automates that you'd otherwise do by hand.
2. Explain the declarative reconciliation loop and give an example of self-healing.
3. Match each component to its job: api-server, etcd, scheduler, controller-manager,
   kubelet, kube-proxy.
4. Describe the spec-vs-status distinction in an object, and what labels/selectors are for.
5. Use `kubectl` to list nodes, show all pods across namespaces, and read the Events of one
   pod.
6. Explain what a namespace is and give two reasons to use them.

## Troubleshooting

- **`kubectl` "connection refused" / no cluster** — none running or wrong context. *Fix:*
  start a cluster; `kubectl config use-context`.
- **Pod stuck `Pending`** — can't be scheduled (resources/taints). *Fix:* `kubectl describe
  pod` → Events.
- **`ImagePullBackOff`** — bad image name/registry auth. *Fix:* check image; describe pod.
- **Acting on the wrong cluster/namespace** — context confusion. *Fix:* `kubectl config
  current-context`; `-n <ns>`.
- **Deleted a bare pod, it didn't come back** — pods aren't self-healing alone. *Fix:* use a
  Deployment (next lesson).
- **etcd/control-plane down = nothing works** — it's the brain. *Fix:* (ops) back up etcd;
  ensure control-plane HA.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What problem does container orchestration solve?
2. Declarative vs imperative — which is Kubernetes, and what is the reconciliation loop?
3. What is the only component everything talks to, and what stores all state?
4. What does the scheduler do vs the controller-manager?
5. What runs on each worker node?
6. What's the difference between an object's `spec` and `status`?
7. How do objects find each other loosely?
8. What is a namespace for?
9. **Practical:** show nodes and all-namespace pods with kubectl.
10. **Practical:** read a pod's Events via `describe`.

## Solutions & validation

1. Automated scheduling, self-healing, scaling, rollouts, service discovery across a
   cluster.
2. **Declarative**; controllers continuously compare **actual vs desired** and act to close
   the gap (self-healing).
3. **kube-apiserver** (front door); **etcd** (state store).
4. Scheduler **places pods on nodes**; controller-manager runs the **reconciliation loops**.
5. **kubelet** (node agent), **kube-proxy** (networking), **container runtime** (+ pods).
6. `spec` = desired state you set; `status` = actual state K8s reports (read-only).
7. **Labels + selectors** (loose coupling).
8. A virtual sub-cluster for organization, quotas, and access control.
9. **Validation:** `kubectl get nodes`; `kubectl get pods -A`.
10. **Validation:** `kubectl describe pod <name>` → Events section.

> [!TIP]
> Anchor everything on the **reconciliation loop**: you declare desired state via the
> **API server** (stored in **etcd**), and **controllers** + **kubelets** drive reality to
> match. Every Kubernetes feature in this track — Deployments, Services, autoscaling,
> rollouts — is just another controller reconciling another kind of object. Keep that mental
> model and the YAML becomes straightforward.

## What's next

Next: **Lesson 1202 — Pods, Deployments & ReplicaSets.** The workload core: what a Pod
really is, why you almost never create bare Pods, how Deployments manage ReplicaSets for
self-healing and scaling, and performing zero-downtime rolling updates and rollbacks.
