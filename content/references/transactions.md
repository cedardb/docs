---
title: "Reference: Transactions"
linkTitle: "Transactions"
weight: 15
---

For explicit transactions, use `BEGIN` (or `START TRANSACTION`) and `COMMIT` (or `END`).

```sql
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric);
INSERT INTO accounts VALUES (1, 100), (2, 50);

BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;
UPDATE accounts SET balance = balance + 10 WHERE id = 2;
COMMIT;
```

Without an explicit `BEGIN`, CedarDB executes every statement in *autocommit* mode: each statement runs in its own transaction and is committed implicitly.
When you explicitly `BEGIN` a transaction, you also need to explicitly `COMMIT`, otherwise your changes will not be visible.
Use `ROLLBACK` (or `ABORT`) to discard all uncommitted changes.

## Transaction Semantics

CedarDB uses [snapshot isolation](https://en.wikipedia.org/wiki/Snapshot_isolation) for all transactions.
A transaction reads a consistent snapshot of the latest committed database state, taken when the transaction starts, and is isolated from other concurrent transactions.
Dirty reads, non-repeatable reads, and phantom reads cannot occur:
changes of other transactions only become visible to transactions that start after these changes have been committed.
In contrast to PostgreSQL, the snapshots also provide a consistent view of all previously committed transactions.
CedarDB implements this with an in-memory optimized multi-version concurrency control (MVCC) scheme
[[1](https://db.in.tum.de/~freitag/papers/p2797-freitag.pdf), [2](https://db.in.tum.de/~muehlbau/papers/mvcc.pdf)].

### Write conflicts

CedarDB never waits for another transaction.
If a transaction tries to modify a row that another transaction has modified, but not yet committed, or that was modified after the transaction's snapshot was taken, the statement fails immediately:

```text
ERROR:  conflict with concurrent transaction: Row was concurrently modified before its update
```

The transaction is then aborted.
Your application needs to retry it, see also [Update](/docs/references/dml/update#serialization-errors) and [Upsert](/docs/references/dml/upsert#caveats).

### Row locks

`SELECT ... FOR UPDATE` and `SELECT ... FOR NO KEY UPDATE` lock the selected rows until the end of the transaction.
While a row is locked, other transactions that update, delete, or lock it fail immediately with the conflict error described above instead of waiting:

```sql
CREATE TABLE plants (id int PRIMARY KEY, name text, height int);
INSERT INTO plants VALUES (1, 'oak', 10), (2, 'birch', 5);

-- Session 1
BEGIN;
SELECT * FROM plants WHERE id = 1 FOR UPDATE;
```

```text
 id | name | height
----+------+--------
  1 | oak  |     10
(1 row)
```

While session 1 holds the lock, a second session cannot modify or lock the row:

```sql
-- Session 2
UPDATE plants SET height = 11 WHERE id = 1;
-- ERROR:  conflict with concurrent transaction: Row was concurrently modified before its update
BEGIN;
SELECT * FROM plants WHERE id = 1 FOR UPDATE;
-- ERROR:  conflict with concurrent transaction: Row in relation "plants" is locked or modified by a concurrent transaction
ROLLBACK;
SELECT * FROM plants WHERE id = 1 FOR UPDATE NOWAIT;
-- ERROR:  could not obtain lock on row in relation "plants"
SELECT * FROM plants FOR UPDATE SKIP LOCKED;   -- returns only birch
```

Plain `SELECT` statements still read the row.
Session 1 can then update the row safely, and `COMMIT` or `ROLLBACK` releases the lock:

```sql
-- Session 1
UPDATE plants SET height = 20 WHERE id = 1;
COMMIT;
```

`FOR UPDATE` and `FOR NO KEY UPDATE` behave the same.
They accept `NOWAIT`, `SKIP LOCKED`, and `OF <table>` to lock the rows of only some tables of a join. Without `OF`, the rows of all tables in the `FROM` clause are locked.

With `NOWAIT`, the error is `could not obtain lock on row in relation ...` instead. With `SKIP LOCKED`, rows locked by other transactions are left out of the result.
If a row was modified by a transaction that committed after your snapshot was taken, `FOR UPDATE` fails with a conflict error, like `UPDATE`. This also applies to `SKIP LOCKED`.
`ORDER BY` and `LIMIT` can be combined with `FOR UPDATE`.
`FOR UPDATE` cannot be combined with aggregates, `DISTINCT`, `GROUP BY`, or `UNION`/`INTERSECT`/`EXCEPT`, and fails in a `READ ONLY` transaction.

## BEGIN

```text
BEGIN [ WORK | TRANSACTION ] [ <transaction_mode> [, ...] ]
START TRANSACTION [ <transaction_mode> [, ...] ]

<transaction_mode>:
      ISOLATION LEVEL { REPEATABLE READ | READ COMMITTED | READ UNCOMMITTED }
    | READ WRITE | READ ONLY
    | [ NOT ] DEFERRABLE
```

| Mode              | Effect                                                                                                                                                                    |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ISOLATION LEVEL` | Accepted for compatibility. Transactions always run with snapshot isolation, which `transaction_isolation` reports as `repeatable read`. `SERIALIZABLE` is not supported. |
| `READ ONLY`       | The transaction cannot modify data. Write statements fail with `current transaction is read-only, but requires write access`.                                             |
| `READ WRITE`      | The transaction can modify data. This is the default.                                                                                                                     |
| `DEFERRABLE`      | Accepted and ignored in `BEGIN`. `SET TRANSACTION DEFERRABLE` fails.                                                                                                      |

```sql
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric);

BEGIN READ ONLY;
SELECT sum(balance) FROM accounts;
COMMIT;
```

`BEGIN` inside a transaction block fails with `there is already an active transaction`.

`BEGIN READ WRITE` does not override a read-only session default (`default_transaction_read_only = on` or `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY`): the transaction stays read-only.
Run `SET TRANSACTION READ WRITE` inside the transaction instead.

## SET TRANSACTION

`SET TRANSACTION` sets the mode of the current transaction.
`SET SESSION CHARACTERISTICS AS TRANSACTION` sets the default for all later transactions of the session.
You can also set the `default_transaction_read_only` setting:

```sql
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric);

BEGIN;
SET TRANSACTION READ ONLY;
SELECT count(*) FROM accounts;
COMMIT;

SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;
SET default_transaction_read_only = off;
```

Outside of a transaction block, `SET TRANSACTION` has no effect and prints a warning.
`SET TRANSACTION READ WRITE` makes the current transaction writable, even if the session default is read-only.
`SET TRANSACTION DEFERRABLE` and `SET SESSION CHARACTERISTICS AS TRANSACTION DEFERRABLE` are not yet supported and will fail.
The `default_transaction_isolation` setting cannot be changed.

## COMMIT and ROLLBACK

```text
{ COMMIT | END } [ WORK | TRANSACTION ]
{ ROLLBACK | ABORT } [ WORK | TRANSACTION ]
```

After an error in a transaction block, CedarDB rejects all further statements with `current transaction is aborted, commands ignored until end of transaction block`, until you end the transaction with `ROLLBACK` (or `COMMIT`, which then also rolls back).
Use savepoints to recover from errors without losing the whole transaction.

## Savepoints

A savepoint marks a point in a transaction that you can roll back to, without discarding the changes made before it:

```sql
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric);

BEGIN;
UPDATE accounts SET balance = 0 WHERE id = 1;
SAVEPOINT before_bonus;
UPDATE accounts SET balance = balance + 1000 WHERE id = 1;
ROLLBACK TO SAVEPOINT before_bonus;   -- undoes the bonus, keeps balance = 0
RELEASE SAVEPOINT before_bonus;
COMMIT;
```

`ROLLBACK TO SAVEPOINT` also recovers a transaction that failed after the savepoint:

```sql
BEGIN;
SAVEPOINT attempt;
SELECT 1 / 0;                 -- ERROR:  division by zero
ROLLBACK TO SAVEPOINT attempt;
SELECT 'still in the transaction';
COMMIT;
```

`RELEASE SAVEPOINT` discards the savepoint, but keeps its changes.
Savepoints can be nested. Rolling back to an outer savepoint also discards all inner savepoints.
Savepoints can only be used in transaction blocks.

## DDL in transactions

Most DDL statements, such as `CREATE TABLE`, `CREATE INDEX`, and `DROP TABLE`, are transactional: a `ROLLBACK` undoes them, and you can mix them with DML in one transaction.

`ALTER TABLE`, and `CREATE INDEX` on a table that existed before the transaction, are exceptions.
Inside a transaction block, they must come before any statement that reads or writes data (including `SELECT 1` and `SHOW`):

```sql
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric);

BEGIN;
INSERT INTO accounts VALUES (3, 0);
ALTER TABLE accounts ADD COLUMN owner text;
-- ERROR:  ALTER TABLE is not supported in a transaction block after other statements have accessed data.
ROLLBACK;
```

`CREATE INDEX` fails the same way.
`SET`, `SAVEPOINT`, and `CREATE TABLE` do not count as data access as they do not affect other sessions.

`CREATE INDEX` on a table created earlier in the same transaction works at any point.

## Permissions

`BEGIN`, `START TRANSACTION`, `COMMIT`, `ROLLBACK`, `SET TRANSACTION`, and the savepoint statements require no privileges.

`SELECT ... FOR UPDATE` and `FOR NO KEY UPDATE` require both the `SELECT` and the `UPDATE` privilege on the locked table.

## Performance Considerations

For read-only transactions, transactions have negligible overhead, while providing a consistent snapshot across multiple statements.
Transactions that write data are more expensive, as they need to synchronize which transactions are globally visible, and additionally [flush data to disk](/docs/references/writecache).
Use larger transactions that batch data, and reduce the number of explicit commits.

Avoid very long-running transactions.
Since transactions read the snapshot from when they start, CedarDB needs to keep the corresponding MVCC versions, which can cause high memory usage.
As a guideline for fast query performance, transactions shouldn't require user interaction, and your application should use relatively low timeouts when waiting for external resources.

## PostgreSQL Differences

- All transactions run with snapshot isolation. `READ COMMITTED` and `READ UNCOMMITTED` are accepted, but behave like `REPEATABLE READ`: a transaction does not see changes committed by others after it started.
- CedarDB does not wait for row locks. Concurrent modifications of the same row fail immediately with a serialization error.
- `LOCK TABLE` only accepts `ACCESS SHARE MODE`, which is a noop in CedarDBs snapshot isolation. All other lock modes fail with `LOCK with access mode ... is not implemented yet`.
- `SELECT ... FOR UPDATE` and `FOR NO KEY UPDATE` do not wait for a lock held by another transaction. They fail immediately with a conflict error. `FOR SHARE` and `FOR KEY SHARE` are not supported. `FOR UPDATE` on a subquery in `FROM` is not supported.
- `BEGIN READ WRITE` does not override a read-only session default.
- `SET TRANSACTION DEFERRABLE` fails, and `default_transaction_isolation` cannot be set.
- `SET CONSTRAINTS`, `COMMIT AND CHAIN`, `ROLLBACK AND CHAIN`, and prepared transactions (`PREPARE TRANSACTION`) are not supported.
- `BEGIN` inside a transaction block is an error, not a warning.
- `ALTER TABLE` and `CREATE INDEX` on existing tables in a transaction block must come before statements that access data.
