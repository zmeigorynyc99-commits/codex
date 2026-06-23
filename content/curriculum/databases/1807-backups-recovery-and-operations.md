---
title: "Databases — Backups, Recovery & Operations"
slug: "databases-backups-recovery-and-operations"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Operations"
order: 1807
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Data"
tags: [databases, backups, recovery, point-in-time, maintenance, operations]
cover: "/covers/curriculum/databases.svg"
estMinutes: 60
status: "published"
summary: "Keeping data safe and the database healthy: logical vs physical backups and the 3-2-1 rule, point-in-time recovery with WAL, testing restores (the part everyone skips), monitoring database health, routine maintenance (vacuum, statistics, bloat), and operational practices that prevent data-loss disasters."
seoTitle: "Databases 7: Backups, Recovery & Operations (PITR, restore testing, vacuum)"
seoDescription: "Database operations: logical vs physical backups, 3-2-1 rule, point-in-time recovery (WAL), testing restores, health monitoring, and maintenance (vacuum/stats). Lab + assessment."
---

The database holds your most valuable, hardest-to-recreate asset: **data**. Losing it — to hardware
failure, a bad migration, ransomware, or a fat-fingered `DELETE` — can end a business. This lesson
covers keeping data **safe and the database healthy**: **backup types** and the **3-2-1 rule**,
**point-in-time recovery** (PITR), the crucial discipline of **testing restores**, **monitoring**
database health, and routine **maintenance** (vacuum, statistics, bloat). It's the operations side
that the earlier lessons depend on — and the one teams neglect until disaster strikes.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **logical vs physical** backups and apply the **3-2-1 rule**.
- Set up **point-in-time recovery** (PITR) with WAL/transaction logs.
- **Test restores** and explain why untested backups don't count.
- **Monitor** key database health signals.
- Perform routine **maintenance** (vacuum, statistics, bloat).

## Part 1 — Backup types

```text
LOGICAL backup   exports data as SQL/statements (pg_dump, mysqldump)
   + portable, selective (per-table/db), version-flexible
   - slow to create/restore for huge DBs; not point-in-time
PHYSICAL backup  copies the actual data files / a snapshot (pg_basebackup, filesystem/volume snapshot)
   + fast for large DBs, enables PITR with WAL
   - tied to the DB version/platform; whole-cluster
```

```bash
# Logical (Postgres)
pg_dump -U postgres mydb > mydb.sql            # one database to SQL
pg_dumpall -U postgres > all.sql                # whole cluster + roles
# Restore: psql -U postgres mydb < mydb.sql

# Physical / base backup (for PITR)
pg_basebackup -D /backup/base -U repl -X stream
```

Use **logical** backups for portability and selective restore (a single table), **physical** backups
for large databases and **point-in-time recovery**. Most production setups use **physical base backups
+ continuous WAL archiving** (Part 2) for fast, point-in-time-capable recovery, plus periodic logical
dumps for portability.

## Part 2 — The 3-2-1 rule and PITR

The backup discipline (recall the upcoming DR track) — **3-2-1**:

```text
3 copies of the data    2 different media/storage types    1 OFF-SITE (and offline/immutable)
   → survives disk failure, site disaster, AND ransomware (the off-site/immutable copy)
```

**Point-in-time recovery (PITR)** lets you restore to **any moment**, not just the last nightly backup
— essential for "undo" of a bad migration or accidental `DELETE`:

```text
   PHYSICAL BASE BACKUP (e.g. nightly) + continuous WAL (write-ahead log) ARCHIVING
   → restore the base backup, then REPLAY WAL up to a chosen timestamp
   "restore to 14:31:59, just before the DROP TABLE at 14:32"
```

The **WAL** (write-ahead log) records every change; archiving it continuously means you can replay to
**any second**. PITR is what turns "we lost everything since midnight" into "we lost nothing — restore
to one second before the mistake." Managed databases offer PITR as a setting (a retention window).

> [!IMPORTANT]
> **Replication is NOT a backup.** A replica faithfully copies the primary's changes — including the
> accidental `DELETE FROM users;` or the bad migration, which instantly replicates to every replica.
> Replication protects against **hardware/host failure**; it does **not** protect against **mistakes,
> corruption, or ransomware**. You need **real backups** (3-2-1, with an off-site immutable copy) and
> **point-in-time recovery** to undo logical errors. The database team that conflates "we have
> replicas" with "we have backups" is one fat-fingered query away from disaster.

## Part 3 — Testing restores

The most violated rule in all of operations: **a backup you haven't restored is not a backup.**

```text
✗ "we have nightly backups" → but never tried restoring → the night you need it:
   - the backup was corrupt / incomplete
   - the restore procedure was wrong / undocumented / took 18 hours
   - a critical table/schema/role was missing from the dump
✓ TEST RESTORES regularly: restore to a scratch instance, verify data integrity + row counts,
   measure the restore TIME (your real RTO), and document the procedure
```

Untested backups fail **exactly when you need them** — Schrödinger's backup is both valid and invalid
until you try to restore it. **Automate periodic restore tests**: restore to a throwaway environment,
run integrity checks, confirm row counts/critical tables, and **time it** (that's your true RTO).
Restore-testing is the single highest-value backup practice and the one most teams skip.

> [!IMPORTANT]
> **Test your restores on a schedule — an untested backup is a guess, not a guarantee.** Backups fail
> silently (corruption, missing objects, wrong procedure) and you discover it at the worst possible
> moment. Regularly restore to a scratch instance, **verify the data** (row counts, key tables,
> integrity checks), and **measure the restore time** so your RTO is real, not aspirational. Document
> the runbook so anyone can execute it under pressure. The discipline isn't "do we have backups?" —
> it's "have we **proven** we can restore them, recently?"

## Part 4 — Monitoring database health

Key signals to watch (applying the observability track to databases):

```text
□ CONNECTIONS    active vs max (approaching the limit → pooling/leaks)
□ QUERY PERF      slow query log; long-running queries; lock waits
□ REPLICATION LAG  how far replicas trail (stale reads / failover risk)
□ DISK/STORAGE    space (a full disk = the DB stops!); WAL/log growth
□ CACHE HIT RATIO  buffer/cache effectiveness (low → more disk I/O)
□ LOCKS/DEADLOCKS  blocking chains, deadlock rate
□ TRANSACTIONS     long-open transactions (block vacuum, hold locks)
□ ERRORS          failed connections, constraint violations, OOM
```

```sql
-- Postgres health snapshots
SELECT count(*) FROM pg_stat_activity;                     -- current connections
SELECT * FROM pg_stat_activity WHERE state='active' ORDER BY query_start;  -- long-running queries
SELECT * FROM pg_stat_replication;                          -- replica lag
SELECT pg_size_pretty(pg_database_size('mydb'));            -- DB size
```

The deadliest, simplest one: **disk full** — when the database's disk fills (often from unbounded WAL
or log growth), it **stops accepting writes** or crashes. Alert on disk space, connection count, and
replication lag at minimum. Slow-query logs surface the queries to optimize (the indexing lesson).

## Part 5 — Routine maintenance

Databases need upkeep to stay fast and stable:

```text
VACUUM (Postgres)    reclaim space from dead rows (MVCC leaves old row versions on update/delete)
   - autovacuum usually handles it; bloat/long transactions can block it → monitor
   - VACUUM ANALYZE also refreshes STATISTICS the query planner needs (indexing lesson!)
STATISTICS           ANALYZE keeps the planner's row estimates accurate → good query plans
BLOAT                tables/indexes grow with churn; reindex/vacuum to reclaim
PARTITION management  drop/archive old partitions (cheap deletes of old data)
PATCHING             keep the DB version patched (security/vuln-management track)
```

Postgres uses **MVCC** (each update creates a new row version, old ones become "dead") — **VACUUM**
reclaims that space, and **autovacuum** does it automatically, but **long-running transactions** and
churn can cause **bloat** (wasted space, slow queries) if vacuum can't keep up. **`ANALYZE`** refreshes
the **statistics** the planner relies on (stale stats → bad query plans, the indexing lesson's
pitfall). Monitor for bloat, long transactions blocking vacuum, and keep statistics fresh.

## Hands-on lab

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4; q() { docker exec -i pg psql -U postgres -tA -c "$1"; }

# Seed a database
q "CREATE DATABASE shop;"
docker exec -i pg psql -U postgres -d shop -c "CREATE TABLE users(id serial PRIMARY KEY, name text);"
docker exec -i pg psql -U postgres -d shop -c "INSERT INTO users(name) SELECT 'u'||g FROM generate_series(1,1000) g;"

# 1. LOGICAL backup
docker exec pg pg_dump -U postgres shop > shop.sql
echo "backup size: $(wc -l < shop.sql) lines"

# 2. Simulate disaster: drop the table
docker exec -i pg psql -U postgres -d shop -c "DROP TABLE users;"
echo "tables now: $(docker exec -i pg psql -U postgres -d shop -tAc '\dt' )"   # gone

# 3. TEST RESTORE: restore the backup and VERIFY (the step everyone skips)
docker exec -i pg psql -U postgres -d shop < shop.sql
restored=$(docker exec -i pg psql -U postgres -d shop -tAc "SELECT count(*) FROM users;")
echo "restored rows: $restored  $([ "$restored" = "1000" ] && echo '✓ verified' || echo '✗ MISMATCH')"

# 4. Health monitoring snapshots
echo "connections: $(q 'SELECT count(*) FROM pg_stat_activity;')"
echo "db size: $(docker exec -i pg psql -U postgres -d shop -tAc "SELECT pg_size_pretty(pg_database_size('shop'));")"

# 5. Maintenance: create dead rows, then VACUUM + ANALYZE
docker exec -i pg psql -U postgres -d shop -c "UPDATE users SET name=name; "   # churns rows (dead tuples)
docker exec -i pg psql -U postgres -d shop -c "VACUUM ANALYZE users;"          # reclaim + refresh stats
echo "vacuum+analyze done (reclaims dead rows, updates planner stats)"

rm -f shop.sql; docker rm -f pg
```

## Exercises

1. Compare logical and physical backups and when to use each.
2. Explain the 3-2-1 rule and why the off-site/immutable copy matters.
3. Explain PITR and how WAL enables restoring to a precise moment.
4. Explain why replication is not a backup with a concrete failure it doesn't cover.
5. Perform a backup, simulate data loss, restore, and **verify** the row count.
6. List the key database health metrics and why disk-full is the deadliest.

## Troubleshooting

- **"We have replicas" but lost data to a bad DELETE** — replication ≠ backup. *Fix:* real backups +
  PITR.
- **Backup won't restore when needed** — never tested. *Fix:* scheduled restore tests + verification +
  timing.
- **Can't undo a bad migration** — no PITR. *Fix:* base backup + WAL archiving; restore to a
  timestamp.
- **Database stopped / read-only** — disk full (often WAL/logs). *Fix:* alert on disk; archive/rotate
  WAL/logs; add space.
- **Queries slowing over time** — bloat/stale stats. *Fix:* vacuum/reindex; `ANALYZE`; check long
  transactions blocking autovacuum.
- **Backups missing roles/objects** — partial dump. *Fix:* `pg_dumpall` for cluster-wide;
  verify completeness in restore tests.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Logical vs physical backups — differences and uses?
2. State the 3-2-1 rule and what the off-site copy protects against.
3. What is PITR and how does WAL enable it?
4. Why is replication not a backup?
5. Why must you test restores, and what do you verify?
6. Name four database health metrics; which is deadliest and why?
7. What does VACUUM do, and why does Postgres need it?
8. Why keep statistics fresh with ANALYZE?
9. **Practical:** back up, lose data, restore, and verify.
10. **Practical:** run a health snapshot (connections, size).

## Solutions & validation

1. Logical = SQL export (portable/selective, slower); physical = data-file/snapshot (fast/large,
   enables PITR).
2. 3 copies, 2 media, 1 off-site; off-site/immutable survives site disaster and ransomware.
3. Restore to **any moment** via a base backup + replaying the **WAL** to a chosen timestamp.
4. It replicates mistakes/corruption too; protects only against hardware/host failure, not logical
   errors.
5. Untested backups fail when needed; verify integrity, row counts, key tables, and measure restore
   time (RTO).
6. Connections, query perf, replication lag, disk space, cache hit ratio, locks (any four);
   **disk-full** stops writes/crashes the DB.
7. Reclaims space from dead row versions (MVCC); needed because updates/deletes leave old versions.
8. The query planner relies on stats; stale stats → bad plans/slow queries.
9. **Validation:** restored row count = 1000, verified (see lab).
10. **Validation:** `pg_stat_activity` count + `pg_database_size`.

> [!TIP]
> Protecting data is non-negotiable and non-obvious: **replication is not a backup** (it copies your
> mistakes), so keep **3-2-1 backups with an off-site immutable copy** and **PITR** to undo logical
> errors, and — above all — **test your restores on a schedule and measure the time**. Then keep the
> database healthy with **monitoring** (disk, connections, lag) and **maintenance** (vacuum, fresh
> statistics). The teams that survive disasters are the ones who **proved** they could restore — long
> before they needed to.

## What's next

Next: **Lesson 1808 — Operating Databases in Production.** The capstone: running databases on
Kubernetes vs managed services, security and access control, connection management, schema-change
safety, capacity planning, the data-infrastructure landscape, and a production-readiness checklist
tying the whole track together.
