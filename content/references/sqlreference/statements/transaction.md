---
title: "Reference: Transaction Statements"
linkTitle: "Transactions"
weight: 25
---

For explicit transactions, you can use start/begin and commit/end transaction.

Usage example:

```sql
begin;
update accounts set balance = balance - 10 where id = $1;
update accounts set balance = balance + 10 where id = $2;
commit;
```

Without explicit `begin`, all statements are executed in *autocommit* mode, i.e., each statement is executed in a
separate transaction and implicitly committed.
When you explicitly `begin` a transaction, you also need to explicitly `commit`, otherwise your changes will not be
visible.
Alternatively, you can also use `rollback` to discard any uncommitted changes.

## Transaction Semantics

CedarDB's transactions are [snapshot isolated](https://en.wikipedia.org/wiki/Snapshot_isolation).
This means that transactions read a consistent snapshot of the latest committed database state, and are isolated from
other concurrent transactions.
CedarDB implements this with an in-memory optimized multi-version concurrency control (MVCC) scheme
[[1](https://db.in.tum.de/~freitag/papers/p2797-freitag.pdf), [2](https://db.in.tum.de/~muehlbau/papers/mvcc.pdf)].

## Performance Considerations

For read-only transactions, transactions have negligible overhead, but you can still use a transaction to read a
consistent snapshot across multiple statements.
Committing transactions that write data are more expensive, as they need to synchronize which transactions are globally
visible, and additionally [flush data to disk](/docs/references/writecache).
We therefore recommend using larger transactions that batch data, and reduce the number of explicit commits.

We also advise against long-running transactions.
Since the transaction reads versions before it was started, CedarDB needs to keep the corresponding MVCC versions, which
can cause high resource usage.
As a guideline, transactions should never require user interaction, and your application should use relatively low
timeouts when waiting for external resources.

## Bulk Write

CedarDB has *bulk write* transactions.
Statements that operate on a large amount of data, e.g., alter table, automatically switch to bulk mode.
You can also use explicit transaction control in bulk mode:

```sql
BEGIN BULK WRITE;
```

Bulk writes allow efficient ingestion of large datasets.
Bulk operations take an exclusive write lock on the database system, which allows them to skip writing
transaction-specific versions, which reduces CPU and memory overhead for inserts.
However, bulk operations block concurrent writes to the database, but not concurrent reads, which still read the last
version before the bulk operation.

