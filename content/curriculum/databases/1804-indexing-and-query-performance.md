---
title: "Databases — Indexing & Query Performance"
slug: "databases-indexing-and-query-performance"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Operations"
order: 1804
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Data"
tags: [databases, indexing, b-tree, explain, query-performance, optimization]
cover: "/covers/curriculum/databases.svg"
estMinutes: 65
status: "published"
summary: "Making queries fast: how B-tree indexes work, when they help and when they hurt, reading EXPLAIN plans, avoiding full table scans, composite and covering indexes, index selectivity, and the common performance pitfalls that turn fast queries slow."
seoTitle: "Databases 4: Indexing & Query Performance (B-tree, EXPLAIN, indexes)"
seoDescription: "Database performance: how B-tree indexes work, EXPLAIN plans, full scans vs index scans, composite/covering indexes, selectivity, and common pitfalls. Hands-on lab and assessment."
---

The #1 database performance problem is **missing or misused indexes** — a query that scans millions
of rows when it could jump to a handful. This lesson demystifies **indexing**: how **B-tree indexes**
work, when they **help and hurt**, reading **EXPLAIN plans** to see what the database actually does,
**composite and covering** indexes, **selectivity**, and the **common pitfalls** (functions on
indexed columns, leading wildcards, over-indexing). With these skills you can turn a query from
seconds to milliseconds — the single highest-leverage database tuning you can do.

## Learning objectives

By the end of this lesson you will be able to:

- Explain how a **B-tree index** speeds lookups.
- Read an **EXPLAIN (ANALYZE)** plan: scan types and cost.
- Distinguish **full table scan** vs **index scan** and when each is right.
- Use **composite** and **covering** indexes and understand **selectivity**.
- Avoid common **index pitfalls** and over-indexing.

## Part 1 — How indexes work

Without an index, finding rows means a **full table scan** — read every row. An **index** is a
separate sorted data structure (usually a **B-tree**) that lets the database **jump** to matching
rows:

```text
   no index:  SELECT * FROM users WHERE email = 'a@x.io'
              → SCAN all 10,000,000 rows checking each  (slow, O(n))
   with index on email:
              → B-tree lookup: O(log n) → find the entry → jump to the row(s)  (fast)
```

A **B-tree** keeps keys **sorted** in a balanced tree, so lookups, range scans (`>`, `BETWEEN`), and
`ORDER BY` on the indexed column are fast (logarithmic). It's like the index at the back of a book —
instead of reading every page, you look up the term and jump to the right page. Indexes power
**WHERE filters, JOIN conditions, ORDER BY, and uniqueness**.

```sql
CREATE INDEX idx_users_email ON users(email);     -- speeds WHERE email = / ORDER BY email
CREATE UNIQUE INDEX ON users(email);              -- also enforces uniqueness
```

## Part 2 — Reading EXPLAIN

**`EXPLAIN`** shows the database's **query plan** — how it intends to execute; **`EXPLAIN ANALYZE`**
actually runs it and shows real timings:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'a@x.io';
```

```text
Key things to look for:
   Seq Scan        → reading the WHOLE table (bad for selective lookups → add an index)
   Index Scan       → using an index to find rows (good for selective queries)
   Index Only Scan  → answered entirely from the index (best — no table fetch)
   Bitmap Heap Scan → index for many matches, then fetch (in between)
   rows= / actual time= → estimated vs real row counts and timing (big gap = stale stats)
   cost=  → the planner's estimated effort
```

The workflow: **find the slow query → `EXPLAIN ANALYZE` it → look for a `Seq Scan` on a big table
with a selective filter → add the right index → re-check the plan shows an Index Scan.** `EXPLAIN` is
the single most important performance tool — it tells you *why* a query is slow instead of guessing.

> [!IMPORTANT]
> **`EXPLAIN ANALYZE` is your database performance debugger — use it before adding any index.** Don't
> guess which index to add; run the query through `EXPLAIN ANALYZE`, find the **`Seq Scan` on a large
> table** with a selective `WHERE`/`JOIN`, and add an index on that column. Then re-run and confirm
> the plan switched to an **Index Scan** and the time dropped. Adding indexes blindly wastes space
> and slows writes; reading the plan tells you exactly what's needed. A big gap between estimated and
> actual rows means **stale statistics** — run `ANALYZE` to refresh them.

## Part 3 — When indexes help and hurt

Indexes aren't free — they speed reads but **cost on writes and storage**:

```text
INDEXES HELP:                        INDEXES HURT:
   selective WHERE/JOIN/ORDER BY        every INSERT/UPDATE/DELETE must update each index
   uniqueness enforcement                more storage; more to maintain
   range scans, sorting                  too many indexes → slow writes, wasted space
                                         low-selectivity columns (e.g. boolean) rarely help
```

**Selectivity** is key: an index on a column with **many distinct values** (email, user_id) is very
useful (filters to few rows); an index on a **low-cardinality** column (a boolean, a status with 3
values) often **isn't worth it** — the database may scan anyway because the index returns most of the
table. Index the columns you **filter/join/sort on frequently** and that are **selective**; don't
index everything.

## Part 4 — Composite and covering indexes

```sql
-- COMPOSITE index: multiple columns, order matters!
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
   -- helps: WHERE user_id = ? [AND created_at ...]   and ORDER BY within a user
   -- the LEFTMOST prefix rule: this index helps queries on (user_id) or (user_id, created_at),
   --   but NOT a query on created_at alone (column order matters!)

-- COVERING index: includes all columns a query needs → Index Only Scan (no table fetch)
CREATE INDEX idx_orders_cover ON orders(user_id) INCLUDE (total, created_at);
   -- SELECT total, created_at FROM orders WHERE user_id = ?  → answered from the index alone
```

- **Composite index** — one index on several columns; great for queries filtering on a **leftmost
  prefix** of those columns. Order matters: `(user_id, created_at)` helps `user_id` lookups (and
  combined), not `created_at`-only queries.
- **Covering index** — includes every column the query needs, so the database answers from the
  **index alone** (an **Index Only Scan**) without touching the table — very fast for hot queries.

Design composite indexes to match your **most common multi-column query patterns**, putting the
most-filtered (equality) column first.

## Part 5 — Common pitfalls

```text
✗ FUNCTION on an indexed column:  WHERE lower(email) = 'a@x.io'  → index NOT used (unless a
    functional index on lower(email) exists). Fix: store normalized / use an expression index.
✗ LEADING wildcard:  WHERE name LIKE '%son'  → can't use a B-tree (no prefix). Fix: trigram/full-text.
✗ Type mismatch / implicit cast:  WHERE id = '123'  (id is int) → may skip the index.
✗ OR across different columns      → sometimes can't use indexes well; consider UNION/refactor.
✗ Over-indexing                    → every write maintains all indexes; remove unused ones.
✗ Not the RIGHT index             → index exists but on the wrong column/order; check EXPLAIN.
✗ Stale statistics                → run ANALYZE; the planner picks bad plans on outdated stats.
```

The classic surprise: **you added an index but the query still scans** — almost always because a
**function/cast on the column** or a **leading wildcard** prevents the index from being used, the
column **order** in a composite index is wrong, or the column **isn't selective** enough. `EXPLAIN`
reveals which. Remove **unused indexes** too — they silently tax every write.

## Hands-on lab

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4
q() { docker exec -i pg psql -U postgres -tA -c "$1"; }

# 1. Make a big table so scans actually hurt
q "CREATE TABLE events(id bigserial PRIMARY KEY, user_id int, kind text, created timestamptz DEFAULT now());"
q "INSERT INTO events(user_id,kind) SELECT (random()*100000)::int, (ARRAY['click','view','buy'])[1+floor(random()*3)] FROM generate_series(1,500000);"
q "ANALYZE events;"

# 2. Slow: full table scan (no index on user_id)
echo "=== BEFORE index (expect Seq Scan) ==="
q "EXPLAIN ANALYZE SELECT * FROM events WHERE user_id = 42;" | grep -E "Scan|Time"

# 3. Add the index, re-check the plan (Index Scan now)
q "CREATE INDEX idx_events_user ON events(user_id);"
q "ANALYZE events;"
echo "=== AFTER index (expect Index Scan, much faster) ==="
q "EXPLAIN ANALYZE SELECT * FROM events WHERE user_id = 42;" | grep -E "Scan|Time"

# 4. Pitfall: function on the column defeats the index
echo "=== function on column (index NOT used) ==="
q "EXPLAIN ANALYZE SELECT * FROM events WHERE user_id::text = '42';" | grep -E "Scan"
#   fix: don't cast; or build an expression index

# 5. Composite index + leftmost-prefix rule
q "CREATE INDEX idx_events_user_kind ON events(user_id, kind);"
echo "uses composite (user_id, kind):"; q "EXPLAIN SELECT * FROM events WHERE user_id=42 AND kind='buy';" | grep Scan
echo "kind alone canNOT use it (wrong prefix):"; q "EXPLAIN SELECT * FROM events WHERE kind='buy';" | grep Scan

# 6. Low selectivity: indexing 'kind' (3 values) often won't help
q "CREATE INDEX idx_events_kind ON events(kind);"
q "EXPLAIN SELECT * FROM events WHERE kind='view';" | grep Scan   # may STILL seq scan (not selective)

docker rm -f pg
```

## Exercises

1. Explain how a B-tree index turns an O(n) scan into an O(log n) lookup.
2. Run EXPLAIN ANALYZE before/after adding an index; identify Seq Scan vs Index Scan.
3. Explain index selectivity with a high- and a low-cardinality example.
4. Create a composite index and demonstrate the leftmost-prefix rule.
5. Create a covering index and show an Index Only Scan.
6. Reproduce two pitfalls (function-on-column, leading wildcard) where an index isn't used; fix one.

## Troubleshooting

- **Query slow / Seq Scan on big table** — missing index. *Fix:* index the filtered/joined column;
  verify with EXPLAIN.
- **Added an index, still scans** — function/cast/wildcard or wrong order. *Fix:* expression index;
  fix the query; correct column order.
- **Writes got slow** — over-indexing. *Fix:* remove unused indexes; index only what's queried.
- **Planner picks a bad plan** — stale stats. *Fix:* `ANALYZE`; check estimated vs actual rows.
- **Composite index unused for some queries** — wrong prefix. *Fix:* order columns by query pattern
  (equality first).
- **Index on a boolean does nothing** — low selectivity. *Fix:* don't index it (or use a partial
  index).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. How does a B-tree index speed up lookups?
2. What does EXPLAIN ANALYZE tell you, and what scan type signals a missing index?
3. When do indexes hurt?
4. What is selectivity and why does it matter?
5. What's the leftmost-prefix rule for composite indexes?
6. What is a covering index / Index Only Scan?
7. Name two reasons an existing index isn't used.
8. Why remove unused indexes?
9. **Practical:** show a query going from Seq Scan to Index Scan after adding an index.
10. **Practical:** demonstrate the leftmost-prefix rule.

## Solutions & validation

1. A sorted balanced tree lets the DB jump to matching keys in O(log n) instead of scanning all rows.
2. The execution plan + real timings; **Seq Scan** on a large table with a selective filter signals a
   missing index.
3. They cost on every write (must be maintained) and use storage; too many slow writes.
4. The fraction of rows a value matches; high-selectivity columns benefit from indexes, low ones
   often don't.
5. A composite index helps queries filtering on a **leftmost prefix** of its columns (order matters).
6. An index containing all columns a query needs → answered from the index alone (no table fetch).
7. Function/cast on the column, leading wildcard, wrong column order, low selectivity, stale stats
   (any two).
8. They tax every INSERT/UPDATE/DELETE and waste space for no read benefit.
9. **Validation:** EXPLAIN shows Index Scan + lower time after `CREATE INDEX` (see lab).
10. **Validation:** `(user_id, kind)` used for user_id queries, not kind-only.

> [!TIP]
> Performance tuning is mostly **the right indexes, verified with `EXPLAIN ANALYZE`.** Index the
> **selective** columns you filter/join/sort on, design **composite** indexes to match your common
> query patterns (equality column first), use **covering** indexes for hot read paths, and watch for
> the pitfalls (functions/casts/wildcards defeating indexes). Don't over-index — every index taxes
> writes. Read the plan, add what's needed, confirm the Seq Scan became an Index Scan: that loop is
> the highest-leverage database skill you have.

## What's next

Next: **Lesson 1805 — Transactions & ACID.** The guarantees that keep data correct under concurrency:
ACID properties, isolation levels and the anomalies they prevent, locking and deadlocks, optimistic
vs pessimistic concurrency, and writing transactions that are both correct and performant.
