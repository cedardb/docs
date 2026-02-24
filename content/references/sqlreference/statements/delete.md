---
title: "Reference: Delete Statement"
linkTitle: "Delete"
---

With delete, you can delete rows of a table.

Usage example:

```sql
delete from orders
where status = 'canceled';
```

We recommend always specifying a `where` clause for delete statements.
If you want to delete all rows of a table, consider using
[`truncate`](/docs/references/sqlreference/statements/truncate) instead.

## Returning Deleted Rows

Delete queries are similar in their expressiveness to [read-only select queries](/docs/references/sqlreference/queries).
You can use arbitrary CTEs in a `with` clause, and you can specify additional tables to be joined in a `using` clause.
This can be combined with a `returning` clause to get data out of the database *exactly once*, while simultaneously
enriching it with related data.

The following example extracts pending notifications from a database table, and returns them combined with their
corresponding channel information.

```sql
delete from pending_notifications n
using channels c
where n.receiver_id = $1
  and n.channel_id = c.id
returning *;
```

Scans in the returning clause read the database after the delete is completed.
That is why the exists statement in the returning clause does not match the deleted row with itself in the following example.
```sql
delete from users
where users.user_id = 42
returning users.user_id, exists (select * from users where users.user_id=42);

user_id | ?column? 
--------+----------
  42     | f
```
