---
title: "Reference: Create Table Statement"
linkTitle: "Create Table"
---

Create table creates a new relation with the specified columns.

Usage example:

```sql
create table species (
    id int primary key,
    common_name text,
    botanical_name text not null,
    genus_id int foreign key references genus
);
```

After executing this statement, you can find the created table in the `pg_tables` system view.

## Columns

Column definitions are specified as: `name type constraint`.
Column names can be any identifier; however, for arbitrary character sequences, you need to enclose them in double
quotes: `"complex name""`.
You can find a list of supported types in the [data types reference](/docs/references/datatypes).

CedarDB supports the following constraints, which can either be specified per-column, or separately when referencing
multiple columns:

* `unique(...)`
* `primary key(...)`
* `foreign key(...) references other_table(...)`
* `not null`

## Options

Create a temporary table that will be dropped when the current client disconnects:

```sql
create temp table table_name (...);
```

Do not throw an error if a table with the same name already exists:

```sql
create table table_name if not exists (...);
```

Hash-partition the table by one of its columns.
Partitioning can make data access for queries using a fixed `partition_id` faster, but will slow down any access where
the partition is not known.

```sql
create table table_name (...) partition by hash (partition_id);
```

## Permissions

To create a role, you need to have superuser or `createrole` permissions.
