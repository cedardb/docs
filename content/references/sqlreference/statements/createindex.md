---
title: "Reference: Create Index Statement"
linkTitle: "Create Index"
---

Indexes speed up finding indexed values in a table.
This is usually very beneficial, since using an index can avoid a full table scan, which improves the asymptotic runtime
from O(n) to O(log(n)).
Building and maintaining indexes, however, is not free; the index occupies some space in storage, and write operations
on indexed tables are a bit slower.

Usage example:

```sql
create index on sales(customer_id, article_id);
```

This indexes the sales table on customer and articles, which might be beneficial to quickly find the corresponding order
for a customer complaint.
CedarDB automatically chooses the best index to execute any query.
We recommend inspecting the query plan if your queries are actually using the index.

After creating an index, you can find it in the `pg_indexes` system view.

## Index Options

CedarDB automatically creates readable names for indexes to, e.g., display them in query plans.
The automatically generated name is based on the table name and the indexed columns,
e.g., `sales_customer_id_article_id`.
Alternatively, you can explicitly name indexes:

```sql
create index complaints_index on sales(...);
```

CedarDB currently exclusively supports B-tree indexes.
All indexes, thus, support range and prefix lookup.
E.g., the example index on sales can be used for queries with predicates like:
```sql
... where customer_id = 42;
... where customer_id between 5 and 10;
... where customer_id = 42 and article_id > 100;
```

Additionally, you can declare an index to be `unique`, which will create a corresponding constraint.

## Column Order

You can also specify the ordering of columns within the index:
* `asc`, `desc`
* `nulls first`, `nulls last`

The default matches the order by specification: ascending with nulls last.
Specifying the sort order is useful to support top-k queries.
When the order of the top-k query matches an index, CedarDB will use a matching index:

```sql
-- this query will be eligable to use the index 
... order by customer_id, article_id limit 10;
```

## Automatic indexes

CedarDB automatically creates indexes for `primary key`, `foreign key`, and `unique` constraints.

