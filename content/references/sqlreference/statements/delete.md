---
title: "Reference: Delete Statement"
linkTitle: "Delete"
weight: 16
---

With delete, you can delete rows of a table.

Usage example:

```sql
delete from orders
where status = 'canceled';
```

We recommend always specifying a `where` clause for delete statements.
If you want to delete all rows of a table, consider using `truncate` instead.

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
where n.reciever_id = $1
  and n.channel_id = c.id
returning *;
```
