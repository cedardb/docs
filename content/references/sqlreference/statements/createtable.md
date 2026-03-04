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

The `unique`, `primary key`, and `foreign key` constraints can optionally be given a name using the `constraint` keyword:

```sql
create table orders (
    id        int,
    customer  int,
    item      int,
    constraint orders_pk primary key (id),
    constraint orders_customer_fk foreign key (customer) references customers (id),
    constraint orders_item_fk foreign key (item) references items (id),
    constraint orders_unique unique (customer, item)
);
```

The `constraint <name>` part can be omitted entirely, in which case CedarDB automatically assigns a default name using the same conventions as PostgreSQL:
- Primary key: `tablename_pkey`
- Unique: `tablename_colname_key`
- Foreign key: `tablename_colname_fkey`

These default names can be used just like explicit names, e.g., to drop a constraint with `alter table ... drop constraint <name>`.
Naming is not supported for `not null`.

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
