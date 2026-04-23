---
title: "Reference: Transactions"
linkTitle: "Transactions"
weight: 15
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

CedarDB uses [snapshot isolated (SI)](https://en.wikipedia.org/wiki/Snapshot_isolation) as the default isolation level, and is therefore able to detect dirty reads, non-repeatable reads, and phantom reads ([SQL 92 anomalies](https://en.wikipedia.org/wiki/Isolation_(database_systems)#Read_Phenomena)).
We prohibit all read phenomena, that are also prohibited by PostgreSQL's [default isolation level](https://www.postgresql.org/docs/current/transaction-iso.html).
In CedarDB, transactions read a consistent snapshot of the latest committed database state, and are isolated from other concurrent transactions.
In contrast to PostgreSQL, our snapshots even provide a consistent view of all previously commited transactions.
CedarDB implements this with an in-memory optimized multi-version concurrency control (MVCC) scheme
[[1](https://db.in.tum.de/~freitag/papers/p2797-freitag.pdf), [2](https://db.in.tum.de/~muehlbau/papers/mvcc.pdf)].

## Performance Considerations

For read-only transactions, transactions have negligible overhead, while providing a consistent snapshot across multiple statements.
Transactions that write data are more expensive, as they need to synchronize which transactions are globally visible, and additionally [flush data to disk](/docs/references/writecache).
We therefore recommend using larger transactions that batch data, and reduce the number of explicit commits.

We also advise against very long-running transactions.
Since transactions read the current snapshot when they start, CedarDB needs to keep the corresponding MVCC versions, which can cause high memory resource usage.
As a guideline for fast query performance, transactions shouldn't require user interaction, and your application should use relatively low timeouts when waiting for external resources.

## Bulk Write

CedarDB supports *bulk write* transactions.
Statements that operate on a large amount of data, e.g., alter table, automatically switch to bulk mode.
You can also use explicit transaction control in bulk mode:

```sql
BEGIN BULK WRITE;
```

Bulk writes allow efficient ingestion of large datasets.
Bulk operations take an exclusive write lock on the database system, which allows them to skip writing transaction-specific versions, which reduces CPU and memory overhead for large inserts.
Although, bulk operations do not block concurrent read transactions, which read the state of the database before the bulk operation started, concurrent writers have to wait until the bulk operation commits.
