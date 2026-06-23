---
title: "Databases — Transactions & ACID"
slug: "databases-transactions-and-acid"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Operations"
order: 1805
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Data"
tags: [databases, transactions, acid, isolation, locking, concurrency]
cover: "/covers/curriculum/databases.svg"
estMinutes: 60
status: "published"
summary: "The guarantees that keep data correct under concurrency: ACID properties, the isolation levels and the read anomalies they prevent, locking and deadlocks, optimistic vs pessimistic concurrency control, and writing transactions that are both correct and performant."
seoTitle: "Databases 5: Transactions & ACID (isolation levels, locking, deadlocks)"
seoDescription: "Database transactions: ACID, isolation levels and anomalies (dirty/non-repeatable/phantom), locking, deadlocks, optimistic vs pessimistic concurrency. Hands-on lab and assessment."
---

When many users hit a database at once, **correctness under concurrency** becomes the hard problem —
two people buying the last item, a transfer that debits but doesn't credit, a report reading
half-applied changes. **Transactions** and the **ACID** properties are how relational databases keep
data correct despite concurrency and failures. This lesson covers **ACID**, the **isolation levels**
and the **read anomalies** they prevent, **locking and deadlocks**, and **optimistic vs pessimistic**
concurrency — so you can write transactions that are both **correct** and **performant**.

## Learning objectives

By the end of this lesson you will be able to:

- Explain the **ACID** properties.
- Use **transactions** (BEGIN/COMMIT/ROLLBACK) correctly.
- Choose **isolation levels** and know the anomalies each prevents.
- Recognize and avoid **deadlocks**.
- Compare **optimistic vs pessimistic** concurrency control.

## Part 1 — ACID

A **transaction** is a group of operations treated as a single unit. **ACID** defines its
guarantees:

```text
ATOMICITY    all-or-nothing — either every operation commits, or none do (no partial transfer)
CONSISTENCY  the DB moves from one valid state to another (constraints upheld)
ISOLATION    concurrent transactions don't interfere — results as if they ran in some order
DURABILITY   once committed, it survives crashes (written to durable storage / WAL)
```

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;   -- debit
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;   -- credit
COMMIT;     -- both apply together; if anything fails before COMMIT, ROLLBACK undoes the debit
```

**Atomicity** is the classic example: a money transfer must **both** debit and credit or **neither** —
never just the debit (money vanishes) or just the credit (money created). Without transactions, a
crash between the two updates corrupts your data. ACID is what lets you reason about correctness
despite failures and concurrency — the bedrock of relational databases.

## Part 2 — Using transactions

```sql
BEGIN;                              -- start
  -- ... statements ...
COMMIT;                            -- make permanent
-- or
ROLLBACK;                          -- undo everything since BEGIN

-- SAVEPOINT for partial rollback within a transaction
BEGIN;
  INSERT ...;
  SAVEPOINT s1;
  UPDATE ...;        -- if this is wrong:
  ROLLBACK TO s1;    -- undo to the savepoint, keep the INSERT
COMMIT;
```

Wrap **related changes that must succeed/fail together** in a transaction. Keep transactions **short**
(they hold locks/resources). Common mistakes: leaving a transaction open (holding locks), or doing
multi-step business logic without a transaction so a crash leaves inconsistent state. In app code, the
framework's transaction block ensures `COMMIT`/`ROLLBACK` even on exceptions.

## Part 3 — Isolation levels and anomalies

Full isolation (every transaction as if alone) is expensive, so SQL defines **isolation levels**
trading isolation for concurrency. Each prevents certain **read anomalies**:

```text
ANOMALIES (what can go wrong with concurrent reads):
   DIRTY READ        read another transaction's UNcommitted changes (it might roll back!)
   NON-REPEATABLE READ  re-read a row, get a DIFFERENT value (another txn committed an update)
   PHANTOM READ      re-run a query, get DIFFERENT ROWS (another txn inserted/deleted)

ISOLATION LEVELS (each prevents more, costs more concurrency):
   READ UNCOMMITTED  allows dirty reads          (rarely used)
   READ COMMITTED    no dirty reads               (common DEFAULT — Postgres/Oracle)
   REPEATABLE READ   + no non-repeatable reads    (snapshot of data at txn start)
   SERIALIZABLE      + no phantoms — as if fully serial (strongest, most contention)
```

Most databases default to **READ COMMITTED** (you never read uncommitted data, but values can change
between reads in your transaction). Step up to **REPEATABLE READ** or **SERIALIZABLE** when your logic
needs a stable view or must avoid write conflicts (e.g. inventory, financial invariants) — at the cost
of more locking/retries.

> [!IMPORTANT]
> **Pick the isolation level your invariant requires — the default (READ COMMITTED) does NOT prevent
> all anomalies.** Under READ COMMITTED, a value you read can change before you write (the classic
> "read balance, then update" race → lost update / overselling). If correctness depends on a stable
> view or no write conflicts (inventory counts, financial transfers, "check-then-act"), use
> **REPEATABLE READ/SERIALIZABLE** or explicit locking (`SELECT ... FOR UPDATE`). Higher isolation
> trades concurrency for correctness — and SERIALIZABLE transactions can be **aborted** on conflict,
> so your code must **retry**. Choose deliberately; don't assume the default is safe for every
> invariant.

## Part 4 — Locking and deadlocks

To enforce isolation, databases use **locks**. A transaction locks rows it modifies; others wait. This
can cause **deadlocks** — two transactions each holding a lock the other needs:

```text
   Txn A:  locks row 1 → wants row 2
   Txn B:  locks row 2 → wants row 1      → DEADLOCK (each waits forever)
   → the database DETECTS this and ABORTS one transaction (a deadlock error) → it must retry
```

```sql
-- Explicit row locks (pessimistic): reserve rows you're about to update
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;   -- lock this row; others wait
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
```

Avoid deadlocks by: **acquiring locks in a consistent order** (always lock the lower id first),
**keeping transactions short**, and **retrying** on deadlock (they're expected, not exceptional). The
classic deadlock pattern is two transactions touching the same rows in **opposite order** — enforce a
canonical order and it disappears.

> [!TIP]
> **Deadlocks are normal under concurrency — design for them: acquire locks in a consistent order,
> keep transactions short, and retry on the deadlock error.** A deadlock isn't a bug to be horrified
> by; it's the database protecting correctness by aborting one transaction. The fix is almost always
> **ordering** (always lock rows/tables in the same sequence, e.g. by ascending id) plus
> **short transactions** (hold locks briefly) and a **retry loop** in your app. Long transactions that
> lock many rows in varying orders are the deadlock factory.

## Part 5 — Optimistic vs pessimistic concurrency

Two strategies for handling concurrent updates to the same data:

```text
PESSIMISTIC (lock first):  SELECT ... FOR UPDATE → block others while you work
   + simple correctness   - locks/contention; doesn't scale under high concurrency
   → good when conflicts are FREQUENT (hot rows)

OPTIMISTIC (check at write):  read a VERSION, update WHERE version = old_version, bump it
   UPDATE items SET qty = qty-1, version = version+1 WHERE id = ? AND version = ?;
   → if 0 rows updated, someone else changed it → RETRY with fresh data
   + no locks, scales well  - wasted work + retries when conflicts happen
   → good when conflicts are RARE
```

**Pessimistic** locking blocks conflicting access up front (simple, but serializes hot rows).
**Optimistic** concurrency assumes conflicts are rare: it reads a version/timestamp and only commits
if nothing changed (`WHERE version = ?`), retrying otherwise — no locks, scales better, but does
wasted work under contention. Choose by **how often conflicts actually occur**: frequent → pessimistic;
rare → optimistic.

## Hands-on lab

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4
q() { docker exec -i pg psql -U postgres -tA -c "$1"; }

q "CREATE TABLE accounts(id int PRIMARY KEY, balance numeric NOT NULL CHECK(balance>=0));"
q "INSERT INTO accounts VALUES (1,100),(2,0);"

# 1. ATOMICITY: a transfer commits both sides or neither
docker exec -i pg psql -U postgres <<'SQL'
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
SQL
echo "balances: $(q 'SELECT id||\"=\"||balance FROM accounts ORDER BY id;')"   # 1=0, 2=100

# 2. ROLLBACK undoes everything; CHECK prevents overdraft
docker exec -i pg psql -U postgres <<'SQL'
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 2;   -- ok (2 has 100)
  UPDATE accounts SET balance = balance - 100 WHERE id = 2;   -- would go negative -> CHECK fails
COMMIT;
SQL
echo "after failed txn (should be unchanged 2=100): $(q 'SELECT balance FROM accounts WHERE id=2;')"

# 3. OPTIMISTIC concurrency with a version column
q "CREATE TABLE items(id int PRIMARY KEY, qty int, version int DEFAULT 0);"
q "INSERT INTO items VALUES (1,5,0);"
# read version=0, then update only if still 0:
q "UPDATE items SET qty=qty-1, version=version+1 WHERE id=1 AND version=0;"   # succeeds (1 row)
echo "second update with the OLD version fails (0 rows = conflict -> retry):"
q "UPDATE items SET qty=qty-1, version=version+1 WHERE id=1 AND version=0;"   # 0 rows: stale version

# 4. PESSIMISTIC lock
q "BEGIN; SELECT * FROM accounts WHERE id=1 FOR UPDATE; COMMIT;"   # FOR UPDATE locks the row

docker rm -f pg
```

```text
5. ISOLATION reasoning — which level prevents each, and which is the common default?
   dirty read → ______   non-repeatable read → ______   phantom → ______   default → ______
   (READ COMMITTED / REPEATABLE READ / SERIALIZABLE / READ COMMITTED)
```

## Exercises

1. Explain each ACID property with the money-transfer example.
2. Write a transaction with a SAVEPOINT and partial rollback.
3. Define dirty, non-repeatable, and phantom reads, and which isolation level prevents each.
4. Reproduce (conceptually) a lost-update race and fix it with locking or optimistic concurrency.
5. Explain how a deadlock occurs and three ways to avoid it.
6. Compare optimistic and pessimistic concurrency and when to use each.

## Troubleshooting

- **Money/data corrupted on crash** — no transaction. *Fix:* wrap related writes in BEGIN/COMMIT.
- **Lost update / overselling** — default isolation race. *Fix:* `FOR UPDATE`, higher isolation, or
  optimistic version check.
- **Deadlock errors** — opposite lock ordering. *Fix:* consistent lock order, short txns, retry.
- **App hangs** — long-held locks / open transaction. *Fix:* keep transactions short; commit promptly.
- **SERIALIZABLE transactions failing** — serialization conflicts. *Fix:* add a retry loop (expected).
- **High contention on a hot row** — *Fix:* reduce lock time; consider optimistic or sharding the
  counter.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does each ACID letter guarantee?
2. Why is atomicity essential for a transfer?
3. Name the three read anomalies.
4. Which isolation level is the common default, and what does it still allow?
5. When do you need REPEATABLE READ or SERIALIZABLE?
6. How does a deadlock happen and how do you avoid it?
7. What does `SELECT ... FOR UPDATE` do?
8. Compare optimistic and pessimistic concurrency.
9. **Practical:** show a transaction's atomicity (rollback leaves data unchanged).
10. **Practical:** demonstrate optimistic concurrency with a version column.

## Solutions & validation

1. Atomicity (all-or-nothing), Consistency (valid states/constraints), Isolation (no interference),
   Durability (survives crashes).
2. Both debit and credit must apply together — never just one (no lost/created money).
3. Dirty read, non-repeatable read, phantom read.
4. **READ COMMITTED**; values can still change between reads (non-repeatable reads/phantoms).
5. When you need a stable view across reads or to prevent write conflicts (inventory/financial
   invariants).
6. Two txns hold locks the other needs (opposite order); avoid via consistent lock order, short txns,
   retry.
7. Locks the selected rows so other transactions wait (pessimistic).
8. Pessimistic locks up front (good for frequent conflicts); optimistic checks a version at write
   (good for rare conflicts).
9. **Validation:** the over-draft transaction fails and balance stays 100 (see lab).
10. **Validation:** the second update with the stale version affects 0 rows (conflict → retry).

> [!TIP]
> Correctness under concurrency comes from **transactions + the right isolation**: wrap related
> writes so they're **atomic**, pick an **isolation level** that matches your invariant (the default
> doesn't prevent everything — guard "check-then-act" with `FOR UPDATE`/higher isolation/optimistic
> versions), **expect deadlocks** and design for them (consistent lock order, short transactions,
> retry), and choose **optimistic vs pessimistic** concurrency by how often conflicts actually
> happen. ACID is what lets you reason about a database full of concurrent users without losing your
> mind — or your data.

## What's next

Next: **Lesson 1806 — Replication, Scaling & High Availability.** Growing beyond one server:
read replicas, primary-replica replication and failover, sharding/partitioning, the CAP theorem,
connection pooling, and scaling reads and writes while keeping the database available.
