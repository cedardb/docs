---
title: "Reference: Upsert Statement"
linkTitle: "Upsert"
next: references/sqlreference/expressions/
---

Upserts allow [inserting](../insert) values into tables with a custom [update](../update) logic that will be applied to
conflicting existing values.
This allows, e.g., idempotent inserts, or to keep track of stateful data without knowledge of the previous state.

## Usage examples:

A sparse table with a per-user credit balance:

```sql
insert into credit_balance(userId, amount)
values (1, 12.34), (2, 56.78)
on conflict (userId) do update
-- Sum the old and new (excluded) amount 
set amount = amount + excluded.amount;
```

Maintaining a count of the users of a resource:

```sql
insert into resource_users(id, refcount)
values (42, 1)
on conflict (id) do update
set refcount = refcount + 1;
```

## On Conflict Resolution

Conflicting values can be resolved in two different ways:
Either by skipping existing values, or with an explicit update logic.
Depending on your application logic, either conflict resolution strategy might be helpful.

### Skip Existing Values

One possible conflict resolution is to skip already existing values with an `on conflict do nothing` clause.
The conflicting values will then simply be discarded.
A corresponding `returning` clause will return only the actually inserted values:

```sql
insert into employees(id, name)
values (1, 'Chris'), (2, 'Philipp')
on conflict do nothing
-- Determine which of the rows were new by returning them
returning id;
```

### Do Update

In the general case, you can either do an insert, or an update if the value already exists.
For this, you need to specify the constraint defining the conflict, e.g., an `on conflict (userId)`, when you have a
primary key on that id.
Alternatively, you can specify the constraint using its name, e.g., `userId_pkey`.

A query can reference both the existing value and the not-inserted value in the `do update` clause.
The non-inserted value can be accessed via the temporary `excluded` table, and can be combined with an arbitrary
expression, including subselects (similar to [Updates](../update)).

A trailing `returning` clause will then return final value in the table, so either the inserted one, or the result of
the update.
For the `credit_balance` example, this would be the current credit amount of a user.

## Caveats

Upserts can and will still conflict with concurrent transactions:

```
ERROR:   conflict with concurrent transaction
```

This might sound counterintuitive at first, since we have an execution path even for conflicts.
However, the problem for upserts are *uncommitted* changes of other concurrent transactions.
Since we don't know if these changes will be committed or rolled back, the upsert can neither proceed with inserting
or updating the row.

In contrast to PostgreSQL, CedarDB does not lock the values for writes, since this might indefinitely block the
transaction.
Instead, this situation is immediately reported to the client as a serialization error, and clients are expected to
handle this situation.
Note that conflicting upserts are still either fully committed or rolled back.
Therefore, most applications can simply retry the upsert with exactly the same values at a later time.

{{< callout type="info" >}}
Your application needs to handle serialization failures and retry upserts!
{{< /callout >}}
