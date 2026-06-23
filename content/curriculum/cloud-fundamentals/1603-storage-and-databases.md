---
title: "Cloud — Storage & Databases"
slug: "cloud-storage-and-databases"
track: "cloud-fundamentals"
trackName: "Cloud Fundamentals"
module: "Cloud Foundations"
order: 1603
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Cloud"
tags: [cloud, storage, object-storage, databases, durability, managed]
cover: "/covers/curriculum/cloud-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Where data lives in the cloud: object storage (buckets) vs block vs file storage, durability and availability guarantees, storage classes/tiers, and the managed-database landscape — relational, NoSQL, caches, and warehouses — with guidance on choosing the right store."
seoTitle: "Cloud 3: Storage & Databases (object/block/file, managed DBs)"
seoDescription: "Cloud storage types: object (buckets), block, file; durability/availability and tiers; and managed databases (relational, NoSQL, cache, warehouse). Hands-on lab and assessment."
---

Compute is ephemeral; **data is what you must never lose**. The cloud offers distinct **storage
types** for different access patterns and a rich landscape of **managed databases** so you rarely
run your own. This lesson covers the three storage types (**object, block, file**), the
**durability and availability** guarantees that make cloud storage trustworthy, **storage classes/
tiers** for cost, and the **managed-database** options (relational, NoSQL, caches, warehouses) —
with guidance on **choosing** the right store for a workload.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **object, block, and file** storage and their use cases.
- Explain **durability vs availability** and what "11 nines" means.
- Use **storage classes/tiers** and **lifecycle** policies for cost.
- Compare **managed database** types (relational, NoSQL, cache, warehouse).
- **Choose** appropriate storage/database for a workload.

## Part 1 — The three storage types

```text
OBJECT storage (S3, GCS, Blob)   files ("objects") in flat "buckets", accessed via HTTP API
   → unlimited scale, cheap, durable; NOT a filesystem (no in-place edits, no POSIX)
   → use for: backups, images/video, static sites, data lakes, logs, artifacts
BLOCK storage (EBS, Persistent Disk)  raw virtual disks attached to ONE VM, like a hard drive
   → low latency, formatted with a filesystem; use for: VM OS disks, databases
FILE storage (EFS, Filestore)    a shared network filesystem (NFS/SMB) many VMs can mount
   → POSIX, shared access; use for: shared app data, lift-and-shift apps needing a filesystem
```

- **Object** — the cloud's signature storage: massively scalable, cheap, HTTP-accessed, durable.
  You PUT/GET whole objects by key; you don't mount it as a disk.
- **Block** — a virtual disk for **one** instance (like the disk in a laptop); fast, formatted,
  for OS and databases.
- **File** — a **shared** network filesystem multiple instances mount simultaneously.

Pick by access pattern: HTTP API + huge scale → object; one VM's disk → block; shared POSIX
filesystem → file.

## Part 2 — Durability and availability

Two different guarantees people conflate:

```text
DURABILITY    will my data survive? (not be lost/corrupted)
   object storage advertises ~"11 nines" (99.999999999%) durability —
   data is redundantly replicated across devices/AZs automatically
AVAILABILITY  can I access it right now? (uptime of the service)
   e.g. 99.9% / 99.99% — the SLA for reachability
```

- **Durability** is about **not losing data** — cloud object storage replicates across multiple
  facilities, so the chance of losing an object is astronomically small (you'd statistically lose
  one object every ~10 million years for "11 nines").
- **Availability** is about **uptime** — whether you can reach it at a given moment.

High durability ≠ infinite availability ≠ a backup of *your mistakes*. Replication protects
against **hardware** failure, not against **you** deleting the wrong thing — hence **versioning**
and separate **backups** still matter.

> [!IMPORTANT]
> **Durable ≠ backed up.** Cloud object storage's "11 nines" durability protects against
> hardware/facility failure via automatic replication — but it faithfully replicates **your
> deletes and overwrites** too. If you `rm` the wrong file or ransomware encrypts it, replication
> doesn't save you. Enable **versioning** and **object-lock**, and keep **separate backups** (the
> backup/DR track's 3-2-1 rule). The cloud guarantees it won't lose your data; it doesn't
> guarantee you won't.

## Part 3 — Storage classes and lifecycle

Object storage has **tiers** trading access speed/cost for cheaper storage:

```text
Hot / Standard      frequent access, low latency, higher storage cost
Infrequent access   cheaper storage, retrieval fee, for monthly-ish access
Archive / Glacier   very cheap storage, slow (minutes–hours) retrieval — backups/compliance
```

```text
LIFECYCLE policy (automate tiering + cleanup):
  objects > 30 days old   → move to Infrequent Access
  objects > 180 days old  → move to Archive
  objects > 7 years old   → delete (compliance retention then purge)
```

**Lifecycle rules** automatically move data to cheaper tiers as it ages and delete it when no
longer needed — a major cost lever for logs, backups, and old data. Match the tier to **access
frequency**: don't pay hot prices for cold archival data.

## Part 4 — The managed database landscape

The cloud's biggest convenience: **managed databases** handle provisioning, patching, backups,
replication, and failover — so you rarely run your own (recall the K8s lesson's caution about
DIY databases):

```text
RELATIONAL (SQL)   managed Postgres/MySQL (RDS/Cloud SQL), and cloud-native (Aurora/Spanner)
   → structured data, transactions, joins; the default for most apps
NoSQL document/KV  DynamoDB, Firestore, Cosmos DB — flexible schema, massive scale, fast KV
   → high-scale, simple-access-pattern, flexible-schema workloads
IN-MEMORY cache    managed Redis/Memcached (ElastiCache, Memorystore) — sub-ms reads
   → caching, sessions, leaderboards, rate limiting
DATA WAREHOUSE     Redshift, BigQuery, Snowflake — analytics over huge datasets (OLAP)
   → reporting/BI/aggregations, separate from your transactional DB (OLTP)
SEARCH / other     OpenSearch/Elasticsearch, time-series, graph, etc. — purpose-built engines
```

Managed databases give you **automated backups, point-in-time recovery, multi-AZ failover, and
read replicas** out of the box — exactly the hard parts you'd struggle to operate yourself.

> [!TIP]
> **Use a managed database** unless you have a strong reason not to. The provider handles
> patching, automated backups, **multi-AZ failover**, and read replicas — the operationally
> hardest and highest-stakes parts of running a database. And choose the **right kind**:
> relational for transactional app data (the safe default), a **cache** in front for hot reads, a
> **NoSQL** store for huge-scale simple access, and a **warehouse** for analytics (never run heavy
> reporting queries against your production transactional DB). Right store + managed = less toil,
> fewer 3 a.m. pages.

## Part 5 — Choosing storage and databases

```text
QUESTION                          → LIKELY CHOICE
Store user uploads / backups / logs / static assets?  → OBJECT storage (+ lifecycle tiers)
A disk for a VM or a self-run DB?                      → BLOCK storage
Shared filesystem across many VMs?                     → FILE storage
Transactional app data (orders, users)?               → managed RELATIONAL (SQL)
Huge scale, simple key lookups, flexible schema?       → NoSQL
Speed up reads / sessions / counters?                  → in-memory CACHE
Analytics/reporting over big data?                     → DATA WAREHOUSE
```

Most real apps use **several**: a relational DB for core data, a cache for hot reads, object
storage for files/backups, and a warehouse for analytics. Match each store to its **access
pattern** — that's the whole skill.

## Hands-on lab

```text
Mapping + design exercise (real provisioning needs an account).

1. STORAGE TYPE — pick object / block / file for each:
   a) The boot disk of a Linux VM                         → ______
   b) 50 TB of user-uploaded photos served over HTTPS     → ______
   c) A shared directory mounted by 10 app servers        → ______
   d) Nightly database backups kept for 7 years           → ______ (+ which tier?)
   (Answers: block; object; file; object + Archive tier)

2. DURABILITY vs AVAILABILITY — your bucket is "11 nines durable, 99.9% available."
   - Can you lose data? (essentially never from hardware)
   - Could it be briefly unreachable? (yes, ~0.1% of the time)
   - Does durability protect against an accidental delete? (NO — enable versioning)

3. LIFECYCLE — write a policy for application logs: hot 30 days, archive to 1 year, delete after.

4. DATABASE choice — for each, pick relational / NoSQL / cache / warehouse:
   a) Orders + customers with transactions      → ______
   b) Session store for a web app                → ______
   c) A product catalog at massive scale, KV     → ______
   d) Quarterly revenue analytics over billions of rows → ______
   (Answers: relational; cache; NoSQL; warehouse)
```

```bash
# Read-only exploration with a cloud CLI if configured:
# aws s3 ls ;  aws s3api get-bucket-versioning --bucket <b>
# gcloud storage buckets list ;  az storage account list -o table
echo "object=scalable HTTP storage; block=VM disk; file=shared FS; managed DB=less toil."
```

## Exercises

1. Compare object, block, and file storage with a use case for each.
2. Explain durability vs availability and what "11 nines" means; why isn't durability a backup?
3. Design a lifecycle policy that tiers and expires log data; justify the tiers.
4. Compare relational, NoSQL, cache, and warehouse with a workload for each.
5. For an e-commerce app, list which stores you'd use for which data and why.
6. Explain why you'd use a managed database over running your own.

## Troubleshooting

- **Tried to mount object storage as a disk** — it's not a filesystem. *Fix:* use block/file for
  disk semantics; object via API.
- **Lost data after a delete despite "durable" storage** — replication ≠ backup. *Fix:*
  versioning, object-lock, separate backups.
- **Huge storage bill** — everything in hot tier. *Fix:* lifecycle policies to archive/expire by
  age.
- **Slow analytics crushing the app DB** — OLAP on OLTP. *Fix:* a data warehouse for analytics.
- **DB ops toil / failed failover** — self-run DB. *Fix:* managed DB (multi-AZ, auto-backup).
- **Cache used as source of truth** — data loss on eviction. *Fix:* cache is ephemeral; keep the
  durable store authoritative.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Differentiate object, block, and file storage.
2. What's the difference between durability and availability?
3. Why isn't high durability the same as a backup?
4. What do storage classes/lifecycle policies achieve?
5. When use relational vs NoSQL?
6. What is a cache for, and why isn't it a source of truth?
7. Why separate a data warehouse from your transactional DB?
8. Why prefer a managed database?
9. **Practical:** map four data items to the right storage type.
10. **Practical:** choose databases for four workloads.

## Solutions & validation

1. Object = HTTP-accessed scalable buckets; block = a VM's disk; file = shared network
   filesystem.
2. Durability = won't lose data; availability = can access it now (uptime).
3. Replication faithfully copies your **deletes/overwrites** too — it's not protection from
   mistakes.
4. Move data to cheaper tiers by age and expire it — cost optimization.
5. Relational for transactional/structured data; NoSQL for huge-scale, flexible-schema, simple
   access.
6. Speed/sessions/counters; it's **ephemeral** (evictable) so not authoritative.
7. Analytics (OLAP) would overload the transactional DB (OLTP); separate engines, separate
   workloads.
8. Provider handles patching, backups, **multi-AZ failover**, replicas — the hardest ops.
9. **Validation:** boot disk=block, photos=object, shared dir=file, backups=object/Archive (see
   lab).
10. **Validation:** orders=relational, sessions=cache, catalog=NoSQL, analytics=warehouse.

> [!TIP]
> Match storage to **access pattern**: object for scalable HTTP blobs (backups/media/logs, tiered
> by age), block for VM/DB disks, file for shared filesystems. For databases, lean on **managed**
> services and pick the right engine — relational as the default, cache for speed, NoSQL for
> scale, warehouse for analytics. And never forget: **durable is not backed up** — versioning and
> real backups protect against *your* mistakes.

## What's next

Next: **Lesson 1604 — Cloud Networking & IAM.** Connecting and securing it all: virtual networks
(VPCs), subnets, security groups, load balancers and DNS, and Identity & Access Management — the
roles, policies, and least-privilege practices that are the #1 cloud-security concern.
