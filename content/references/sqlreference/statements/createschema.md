---
title: "Reference: Create Schema Statement"
linkTitle: "Create Schema"
weight: 10
---

Create Schema allows creating a new schema within a database.
Schemas are essentially namespaces to avoid name collisions between objects in the database.

Usage example:

```sql
create schema sales;
create schema sorting;
```

Within these distinct schemas, you can create tables with now no longer clashing names:

```sql
create table sales.orders(...);
create table sorting.orders(...);
```

## Using Schemas

You can always refer to tables with their fully schema-qualified name.
However, if you only operate in certain schemas, you can explicitly [set the `search_path` setting](../settings):

```sql
set search_path = 'sales';
select * from orders; -- now equivalent to "sales.orders"
```

## Permissions

To create a schema, you need to have superuser or `createdb` permissions.
