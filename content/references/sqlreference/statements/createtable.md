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

Create a table that stores all compressed data on remote server, which was created with name `remote_storage` (see [create server](../createserver) for more infos):

```sql
create table table_name (...) with (server = remote_storage);
```



## Permissions

To create a role, you need to have superuser or `createrole` permissions.
