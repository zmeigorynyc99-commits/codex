---
title: "Databases — Replication, Scaling & High Availability"
slug: "databases-replication-scaling-and-high-availability"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Operations"
order: 1806
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "Data"
tags: [databases, replication, sharding, scaling, cap-theorem, high-availability]
cover: "/covers/curriculum/databases.svg"
estMinutes: 65
status: "published"
summary: "Growing beyond one server: read replicas and replication lag, primary-replica replication and failover, vertical vs horizontal scaling, sharding and partitioning, the CAP theorem, connection pooling, and scaling reads and writes while keeping the database available."
seoTitle: "Databases 6: Replication, Scaling & HA (replicas, sharding, CAP)"
seoDescription: "Database scaling: read replicas and lag, replication and failover, vertical/horizontal scaling, sharding/partitioning, CAP theorem, and connection pooling. Hands-on lab and assessment."
---

A single database server eventually hits limits — too many reads, too much data, or it becomes a
single point of failure. **Replication and scaling** are how you grow beyond one server while staying
**available**. This lesson covers **read replicas** (and the lag they introduce), **primary-replica
replication and failover** for HA, **vertical vs horizontal scaling**, **sharding/partitioning** for
huge data, the **CAP theorem** (the fundamental trade-off in distributed data), and **connection
pooling**. Scaling databases is genuinely hard — this lesson gives you the map and the trade-offs.

## Learning objectives

By the end of this lesson you will be able to:

- Use **read replicas** and reason about **replication lag**.
- Explain **primary-replica replication** and **failover** for HA.
- Compare **vertical vs horizontal** scaling.
- Describe **sharding/partitioning** and its trade-offs.
- State the **CAP theorem** and use **connection pooling**.

## Part 1 — Read replicas and lag

The most common first scaling step: **read replicas** — copies of the primary that serve **read**
queries, offloading the primary:

```text
   writes → PRIMARY ──replication──► REPLICA 1 (reads)
                       └─────────────► REPLICA 2 (reads)
   app sends WRITES to the primary, READS to replicas → primary handles less load
```

Most apps are **read-heavy**, so routing reads to replicas can scale read capacity hugely. But there's
a catch: **replication lag**. Replicas apply changes **after** the primary, so a replica may be
**milliseconds-to-seconds behind**:

```text
   user writes a comment (→ primary) → immediately reads it (→ replica) → it's NOT THERE YET!
   (the "read your own writes" problem)
```

> [!IMPORTANT]
> **Read replicas are eventually consistent — beware replication lag.** A replica lags the primary,
> so a user who just wrote data and immediately reads from a replica may **not see their own change**
> ("read-your-writes" violation). Route reads that **must be current** (just-written data, financial
> reads) to the **primary**; send reads that tolerate slight staleness (search, listings, analytics)
> to replicas. Synchronous replication eliminates lag but slows writes (the primary waits for the
> replica). Most setups use **asynchronous** replication (fast writes, small lag) and route
> consistency-sensitive reads to the primary.

## Part 2 — Replication and failover (HA)

Replication also provides **high availability**: if the primary dies, a replica is **promoted** to
become the new primary:

```text
   PRIMARY (fails!) ──► automatic FAILOVER ──► REPLICA promoted to PRIMARY
   - health checks detect the failure
   - a replica is promoted; the app reconnects to the new primary
   - RPO (data loss) depends on sync vs async replication; RTO = how fast failover completes
```

- **Synchronous replication** — the primary waits for a replica to confirm before committing → **no
  data loss** on failover (RPO≈0) but **slower writes**.
- **Asynchronous** — primary commits immediately → fast, but a crash can lose the last few
  unreplicated transactions (small RPO).
- **Automatic failover** (managed services, Patroni, etc.) promotes a replica and redirects traffic —
  this is how managed databases offer "multi-AZ" HA (recall the cloud lesson). **Quorum/consensus**
  (3+ nodes) avoids split-brain (two primaries).

This connects directly to RTO/RPO (the observability/DR tracks): your replication choice **is** your
data-loss and recovery-time profile.

## Part 3 — Vertical vs horizontal scaling

```text
VERTICAL (scale UP)    a bigger server (more CPU/RAM/IOPS)
   + simple, no app changes   - a ceiling (biggest machine), expensive, still ONE node (SPOF)
   → the easy first move; often enough for a long time

HORIZONTAL (scale OUT)  more servers
   + reads scale via replicas; near-limitless    - writes are HARD to scale out (one primary)
   → replicas scale READS; SHARDING scales WRITES (but adds big complexity)
```

The asymmetry that defines database scaling: **reads scale out easily (replicas), writes do not.** A
single primary handles all writes; you can make it bigger (vertical) but eventually you must **shard**
to scale writes horizontally — and sharding is hard. So the usual path is: **vertical first** (simple,
buys lots of headroom) → **read replicas** (scale reads) → **sharding** (only when write volume truly
demands it).

## Part 4 — Sharding and partitioning

**Partitioning** splits a big table; **sharding** spreads data across **multiple database servers** to
scale writes and storage:

```text
PARTITIONING  one DB, table split into pieces (by range/list/hash) — easier management/queries
   e.g. orders partitioned by month → queries/drops on recent data are faster
SHARDING       data split across SEPARATE servers by a SHARD KEY (e.g. user_id)
   shard 0: users 0–999k    shard 1: users 1M–2M    ... → each server holds a slice
   → scales writes + storage horizontally
   BUT: cross-shard queries/joins are hard, transactions across shards are hard,
        re-sharding is painful, the SHARD KEY choice is critical and hard to change
```

Sharding scales writes/storage but **gives up** easy cross-shard joins, transactions, and operational
simplicity. The **shard key** (how you split data) is a near-irreversible decision — a bad one causes
**hotspots** (one shard overloaded) or forces re-sharding. Many teams avoid sharding as long as
possible (vertical + replicas + caching) because of this complexity; some NoSQL/NewSQL systems
(Cassandra, DynamoDB, Spanner, CockroachDB) **shard automatically**.

> [!TIP]
> **Exhaust the simpler options before sharding: vertical scaling, read replicas, caching, and query/
> index optimization usually buy enormous headroom.** Sharding scales writes but introduces serious
> complexity — cross-shard joins/transactions become hard or impossible, and the **shard key is
> effectively permanent** (pick one that distributes evenly and matches your access pattern to avoid
> hotspots and re-sharding pain). If you truly need write-scale-out, consider an **auto-sharding
> NoSQL/NewSQL** system designed for it rather than hand-rolling sharding on a traditional database.

## Part 5 — CAP theorem and connection pooling

The **CAP theorem** governs distributed databases: during a **network partition**, you must choose
between **Consistency** and **Availability**:

```text
CAP: Consistency, Availability, Partition-tolerance — pick 2 (and partitions WILL happen, so really
     you're choosing C vs A when a partition occurs)
   CP systems  prefer CONSISTENCY: refuse/limit operations during a partition (e.g. HBase, traditional
               RDBMS with sync replication) — correct but may be unavailable
   AP systems  prefer AVAILABILITY: keep serving, reconcile later (e.g. Cassandra, DynamoDB) —
               available but EVENTUALLY consistent (stale reads possible)
```

This is the formal version of the replica-lag trade-off: you can't have perfect consistency **and**
availability when the network splits. Relational databases lean **CP** (correctness first); many NoSQL
stores lean **AP** (availability + eventual consistency). Choose based on whether **stale data** or
**unavailability** is worse for your use case.

**Connection pooling** — databases handle limited concurrent connections; a **pool** (PgBouncer, app-
side pools) reuses a small set of connections across many requests:

```text
   1000 app requests → CONNECTION POOL (e.g. 20 connections) → database
   without pooling: 1000 connections overwhelm the DB (each connection costs memory/process)
```

> [!TIP]
> **Use a connection pool** — opening a database connection per request exhausts the database (each
> connection costs memory and a backend process), causing "too many connections" outages under load.
> A pool (PgBouncer, or your framework's pool) maintains a small set of reusable connections shared
> across requests. This is one of the most common production database failures and one of the easiest
> to prevent: cap and reuse connections rather than opening one per request.

## Hands-on lab

```text
Architecture + reasoning exercise (real replication needs multiple nodes; concepts are the skill).

1. READ/WRITE ROUTING — for each, route to PRIMARY or a REPLICA:
   a) user posts a comment, then views the thread     → ______ (primary — read-your-writes)
   b) a public product listing page                    → ______ (replica — tolerates lag)
   c) updating an account balance                        → ______ (primary — write + must be current)
   d) a nightly analytics report                          → ______ (replica/warehouse)

2. SCALING PATH — order these as you'd apply them, and say what each scales:
   [ ] shard by user_id   [ ] add a read replica   [ ] scale up the instance   [ ] add caching
   (Typical: scale up → caching → read replica → shard, last resort)

3. CAP — your payment system suffers a network partition. Do you prefer C or A, and why?
   (Likely C — refuse rather than process inconsistent payments.)

4. SHARD KEY — you shard by `country`. Why might this cause hotspots, and what's a better key?
   (One country dominates → uneven load; a high-cardinality even key like user_id hashes better.)

5. CONNECTION POOL — your app opens a new DB connection per request and the DB hits its connection
   limit under load. Explain the fix.
```

```bash
# Demonstrate partitioning locally (a single-node taste of splitting a big table):
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4; q() { docker exec -i pg psql -U postgres -tA -c "$1"; }
q "CREATE TABLE events(id bigserial, created date NOT NULL, data text) PARTITION BY RANGE (created);"
q "CREATE TABLE events_2026_01 PARTITION OF events FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');"
q "CREATE TABLE events_2026_02 PARTITION OF events FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');"
q "INSERT INTO events(created,data) VALUES ('2026-01-15','a'),('2026-02-10','b');"
echo "partition pruning — query only Jan touches one partition:"
q "EXPLAIN SELECT * FROM events WHERE created = '2026-01-15';" | grep -i events
docker rm -f pg
```

## Exercises

1. Explain read replicas and the replication-lag/read-your-writes problem; how do you route reads?
2. Describe primary-replica failover and how sync vs async replication affects RPO.
3. Compare vertical and horizontal scaling and explain why writes are hard to scale out.
4. Explain sharding, the shard-key decision, and two of its hard problems.
5. State the CAP theorem and classify a CP and an AP system with a use case.
6. Explain connection pooling and the failure it prevents.

## Troubleshooting

- **User can't see their own just-written data** — replica lag. *Fix:* route read-your-writes to the
  primary.
- **Primary failure = outage** — no HA. *Fix:* replicas + automatic failover (multi-AZ).
- **Data loss on failover** — async replication. *Fix:* synchronous/semi-sync for RPO≈0 (slower
  writes).
- **Write bottleneck** — single primary. *Fix:* optimize/cache first; shard only if truly needed.
- **Hotspot shard** — bad shard key. *Fix:* high-cardinality, evenly-distributed key; re-shard
  (painful).
- **"too many connections" under load** — no pool. *Fix:* connection pooling (PgBouncer/app pool).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What do read replicas scale, and what problem does lag cause?
2. How do you handle read-your-writes consistency?
3. How does failover provide HA, and how does sync vs async affect data loss?
4. Why are reads easier to scale out than writes?
5. What is sharding, and why is the shard key critical?
6. Name two hard problems sharding introduces.
7. State the CAP theorem and the real choice during a partition.
8. What does connection pooling prevent?
9. **Practical:** route four reads/writes to primary or replica.
10. **Practical:** order a realistic scaling path.

## Solutions & validation

1. They scale **reads**; lag means replicas are slightly behind → stale/own-write reads.
2. Route consistency-sensitive reads (just-written data) to the **primary**.
3. A replica is **promoted** on primary failure; sync = no data loss (slower), async = small possible
   loss (faster).
4. Reads spread across replicas; all **writes** go to the single primary (must shard to scale out).
5. Splitting data across servers by a **shard key**; the key is near-permanent and determines load
   distribution.
6. Cross-shard joins/transactions, hotspots, painful re-sharding (any two).
7. Consistency, Availability, Partition-tolerance — pick 2; during a partition you choose **C vs A**.
8. Exhausting the database's connection limit (per-request connections) under load.
9. **Validation:** comment-then-read→primary, listing→replica, balance→primary, report→replica.
10. **Validation:** scale up → cache → read replica → shard (last).

> [!TIP]
> Scale databases in order of increasing pain: **optimize queries/indexes → scale up → cache → read
> replicas → (only if forced) shard.** Remember the asymmetry — **reads scale out, writes don't** —
> and the lag trade-off (route must-be-current reads to the primary). Use **replication + automatic
> failover** for HA (your RPO/RTO follows from sync vs async), respect **CAP** (consistency vs
> availability under partition), and **always pool connections**. Databases are the hardest tier to
> scale, so push the simple levers far before reaching for sharding.

## What's next

Next: **Lesson 1807 — Backups, Recovery & Operations.** Keeping data safe and the database healthy:
backup types and the 3-2-1 rule, point-in-time recovery, testing restores, monitoring database health,
maintenance (vacuum/stats), and the operational practices that prevent data-loss disasters.
