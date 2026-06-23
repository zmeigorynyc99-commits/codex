---
title: "Kubernetes — Storage & StatefulSets"
slug: "kubernetes-storage-and-statefulsets"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Workloads"
order: 1205
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, storage, persistent-volume, pvc, statefulset, storageclass]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 60
status: "published"
summary: "Persisting data in an ephemeral world: PersistentVolumes and PersistentVolumeClaims, StorageClasses and dynamic provisioning, access modes, and StatefulSets for stable network identity and per-replica storage — how to run databases and other stateful workloads on Kubernetes."
seoTitle: "Kubernetes 5: Storage & StatefulSets (PV, PVC, StorageClass)"
seoDescription: "Kubernetes storage: PersistentVolumes/Claims, StorageClasses and dynamic provisioning, access modes, and StatefulSets for stable identity and storage for databases. Lab + assessment."
---

Pods are ephemeral, but databases and queues need **durable, stable storage**. Kubernetes
separates the **request** for storage (a **PersistentVolumeClaim**) from the **actual
storage** (a **PersistentVolume**), and uses **StorageClasses** to provision disks
on-demand. For workloads that need a **stable identity** and their **own** persistent disk
per replica — databases, clustered systems — you use a **StatefulSet** instead of a
Deployment. This lesson covers PV/PVC/StorageClass and StatefulSets, the patterns for
running stateful apps reliably on Kubernetes.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **PersistentVolume (PV)** vs **PersistentVolumeClaim (PVC)** and the binding model.
- Use **StorageClasses** for **dynamic provisioning** and pick **access modes**.
- Attach persistent storage to a Pod/Deployment via a PVC.
- Explain why **Deployments are wrong** for stateful apps and what **StatefulSets** add.
- Use a StatefulSet with **volumeClaimTemplates** for per-replica storage.

## Part 1 — The PV/PVC model

Kubernetes decouples *who needs storage* from *what provides it*:

```text
   app/Pod  ──►  PersistentVolumeClaim (PVC)   "I need 10Gi, ReadWriteOnce"
                          │ binds to
                 PersistentVolume (PV)          actual disk (cloud EBS/PD, NFS, etc.)
```

- A **PV** is a piece of real storage in the cluster (provisioned by an admin or
  dynamically).
- A **PVC** is a **request** for storage by a workload (size + access mode + class).
- Kubernetes **binds** a PVC to a suitable PV. The Pod mounts the **PVC**, never the PV
  directly — this indirection means the app doesn't care what the underlying storage is.

This is the same separation as Docker volumes, but cluster-wide and pluggable across many
storage backends (via **CSI** drivers).

## Part 2 — StorageClasses and dynamic provisioning

Manually pre-creating PVs doesn't scale. A **StorageClass** lets the cluster **dynamically
provision** a PV the moment a PVC asks for one:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: data }
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: standard        # which StorageClass (often a default exists)
  resources:
    requests: { storage: 10Gi }
```

```bash
kubectl get storageclass            # available classes (one is usually default)
kubectl apply -f pvc.yaml
kubectl get pvc,pv                  # PVC Pending -> Bound once a PV is provisioned
```

With a default StorageClass, you just create a PVC and a real disk appears, bound and ready.
**Reclaim policy** (`Delete` vs `Retain`) decides whether the underlying disk is deleted
when the PVC is removed — set `Retain` for data you must not lose.

> [!IMPORTANT]
> Prefer **dynamic provisioning** via a StorageClass — create a PVC and let the cluster
> make the disk; don't hand-manage PVs. Watch the **reclaim policy**: the default may be
> **`Delete`**, which **destroys the underlying disk** when the PVC is deleted. For
> databases, use **`Retain`** (or backups) so an accidental `kubectl delete pvc` doesn't
> vaporize your data. Storage is the one place in K8s where a mistake is genuinely
> irreversible.

## Part 3 — Access modes

Access modes describe how many nodes can mount the volume:

```text
ReadWriteOnce (RWO)   one NODE can mount read-write   (most block storage: EBS, PD) — common
ReadOnlyMany  (ROX)   many nodes mount read-only
ReadWriteMany (RWX)   many nodes mount read-write     (needs NFS/CephFS/file storage)
ReadWriteOncePod      exactly one POD read-write       (stricter than RWO)
```

Most cloud block disks are **RWO** — fine for a single database Pod, but you **can't** spread
an RWO volume across many Pods on different nodes. Need shared read-write across Pods? You
need an **RWX**-capable backend (NFS/CephFS). Choosing the wrong access mode is a classic
"my second replica is stuck Pending" cause.

## Part 4 — Why Deployments fail for stateful apps

A Deployment treats Pods as **interchangeable and anonymous** — random names, shared
template, no stable identity, and (with an RWO volume) replicas can't all mount the same
disk. That's perfect for stateless web servers and **wrong** for databases, which need:

- **Stable, predictable network identity** (a primary that's always reachable at the same
  name).
- **Their own persistent disk per replica** (each DB node has its own data).
- **Ordered, controlled** startup/scaling (don't start replica-2 before replica-0).

Enter the **StatefulSet**.

## Part 5 — StatefulSets

A **StatefulSet** gives each replica a **stable identity** and its **own PVC**:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: pg }
spec:
  serviceName: pg                     # a headless Service for stable DNS per Pod
  replicas: 3
  selector: { matchLabels: { app: pg } }
  template:
    metadata: { labels: { app: pg } }
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports: [{ containerPort: 5432 }]
          volumeMounts: [{ name: data, mountPath: /var/lib/postgresql/data }]
  volumeClaimTemplates:               # each replica gets its OWN PVC (pg-0, pg-1, pg-2)
    - metadata: { name: data }
      spec:
        accessModes: ["ReadWriteOnce"]
        resources: { requests: { storage: 10Gi } }
```

What StatefulSets provide:

- **Stable names**: Pods are `pg-0`, `pg-1`, `pg-2` (not random) — and persist across
  reschedules.
- **Stable DNS**: with a **headless Service** (`clusterIP: None`), each Pod is addressable at
  `pg-0.pg`, `pg-1.pg`, … — perfect for clustering/replication.
- **Per-replica storage**: `volumeClaimTemplates` creates a **separate PVC** per Pod, kept on
  reschedule (`pg-0` always reattaches its own `data-pg-0`).
- **Ordered** create/scale/delete (0,1,2 up; reverse down).

> [!TIP]
> Reach for a **StatefulSet** only when you genuinely need **stable identity + per-Pod
> persistent storage** (databases, Kafka, ZooKeeper, Elasticsearch). For everything
> stateless, **Deployments are simpler and better**. And know your limits: running a
> production database *well* on Kubernetes is hard (failover, backups, upgrades) — many teams
> use a managed database or a database **operator** (next lesson) rather than hand-rolling a
> StatefulSet. Always have **backups** independent of the cluster.

## Hands-on lab

```bash
# 1. Dynamic provisioning: a PVC binds to an auto-created PV
kubectl get storageclass
cat > pvc.yaml <<'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: data }
spec:
  accessModes: ["ReadWriteOnce"]
  resources: { requests: { storage: 1Gi } }
EOF
kubectl apply -f pvc.yaml
kubectl get pvc data            # Pending -> Bound

# 2. Attach the PVC to a Pod and prove persistence across Pod deletion
cat > pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata: { name: writer }
spec:
  containers:
    - name: c
      image: busybox
      command: ["sh","-c","echo persisted-$(date +%s) >> /data/log.txt; sleep 3600"]
      volumeMounts: [{ name: d, mountPath: /data }]
  volumes:
    - name: d
      persistentVolumeClaim: { claimName: data }
EOF
kubectl apply -f pod.yaml; sleep 3
kubectl exec writer -- cat /data/log.txt
kubectl delete pod writer
kubectl apply -f pod.yaml; sleep 3
kubectl exec writer -- cat /data/log.txt    # OLD line still there -> data persisted

# 3. StatefulSet with per-replica storage + stable identity
cat > sts.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata: { name: web }
spec: { clusterIP: None, selector: { app: web }, ports: [{ port: 80 }] }
---
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: web }
spec:
  serviceName: web
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          volumeMounts: [{ name: data, mountPath: /usr/share/nginx/html }]
  volumeClaimTemplates:
    - metadata: { name: data }
      spec: { accessModes: ["ReadWriteOnce"], resources: { requests: { storage: 1Gi } } }
EOF
kubectl apply -f sts.yaml
kubectl get pods -l app=web        # web-0, web-1, web-2 (stable, ordered names)
kubectl get pvc                    # data-web-0, data-web-1, data-web-2 (one each)

# cleanup
kubectl delete -f sts.yaml; kubectl delete pod writer --ignore-not-found
kubectl delete pvc data            # NOTE: with Delete reclaim policy this destroys the disk
```

## Exercises

1. Explain the PV/PVC relationship and why a Pod mounts the PVC, not the PV.
2. Create a PVC with dynamic provisioning and show it binds; identify the StorageClass used.
3. Attach a PVC to a Pod, write data, delete and recreate the Pod, and show the data
   survived.
4. Compare the access modes and give a workload that needs RWX.
5. Explain three reasons a Deployment is unsuitable for a database.
6. Deploy a StatefulSet and show each replica gets a stable name and its own PVC.

## Troubleshooting

- **PVC stuck `Pending`** — no matching PV/StorageClass, or no default class. *Fix:* set
  `storageClassName`; ensure a provisioner exists.
- **Second replica `Pending` on an RWO volume** — RWO can't attach to multiple nodes. *Fix:*
  per-replica PVCs (StatefulSet) or an RWX backend.
- **Data gone after deleting PVC** — `Delete` reclaim policy destroyed the disk. *Fix:* use
  `Retain`; keep backups.
- **StatefulSet Pod won't reschedule with its data** — volume zone/affinity. *Fix:* ensure
  the PV is reachable from the new node (topology).
- **Random Pod names where you needed stable ones** — used a Deployment. *Fix:* StatefulSet
  for identity.
- **Database broke on Kubernetes** — DIY statefulness is hard. *Fix:* use an operator or
  managed DB; always back up.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What's the difference between a PV and a PVC?
2. What does a StorageClass enable?
3. What does the reclaim policy control, and which is safe for databases?
4. Name the access modes and which is typical for cloud block storage.
5. Why is a Deployment wrong for a stateful database?
6. What three guarantees does a StatefulSet add?
7. What does `volumeClaimTemplates` do?
8. Why use a headless Service with a StatefulSet?
9. **Practical:** show data persisting across Pod deletion via a PVC.
10. **Practical:** deploy a StatefulSet and show stable names + per-replica PVCs.

## Solutions & validation

1. **PV** = actual storage; **PVC** = a request that **binds** to a PV; Pods mount the PVC
   (abstraction).
2. **Dynamic provisioning** — a real disk is created automatically when a PVC asks.
3. Whether the underlying disk is **Deleted or Retained** when the PVC is removed; **Retain**
   for DBs.
4. RWO (one node, common for block), ROX, RWX (many nodes RW, needs NFS/CephFS),
   ReadWriteOncePod.
5. Anonymous interchangeable Pods, no stable identity, RWO can't be shared, unordered start.
6. **Stable names**, **stable DNS** (headless Service), **per-replica persistent storage**
   (+ ordered ops).
7. Creates a **separate PVC per replica**, retained across reschedules.
8. Gives each Pod a **stable DNS name** (`pg-0.pg`) for clustering/replication.
9. **Validation:** old log line present after Pod recreate (see lab).
10. **Validation:** `web-0/1/2` Pods and `data-web-0/1/2` PVCs.

> [!TIP]
> Storage rules: **request with a PVC, provision dynamically via a StorageClass, and respect
> the reclaim policy** (Retain + backups for anything precious). Use **Deployments for
> stateless** and **StatefulSets only when you need stable identity + per-Pod disks**. And be
> humble about databases on Kubernetes — operators or managed services exist for good reasons;
> never rely solely on the cluster to keep your data safe.

## What's next

Next: **Lesson 1206 — Health, Scheduling & Autoscaling.** Make workloads resilient and
efficient: liveness/readiness/startup probes, resource requests/limits and QoS, how the
scheduler places Pods (nodeSelector, affinity, taints/tolerations), and the Horizontal Pod
Autoscaler.
