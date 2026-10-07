---
title: "Reference: Schemas"
linkTitle: "Schemas"
weight: 40
---

A schema is a namespace inside a database.
Tables, views, sequences, functions, and types always belong to exactly one schema.
Objects in different schemas can share a name without clashing.

```sql
CREATE SCHEMA inventory;
CREATE SCHEMA sales;

CREATE TABLE inventory.trees (id integer, species text);
CREATE TABLE sales.trees (id integer, price numeric);
```

Every new database contains the schema `public`, where objects end up if you don't specify a schema.
The system schemas `pg_catalog` and `information_schema` contain the [system tables](/docs/compatibility/system_table).

## Using Schemas

You can always refer to an object by its schema-qualified name, such as `inventory.trees`.
For unqualified names, CedarDB searches the schemas listed in the [`search_path` setting](/docs/references/sessions/settings), in order.
It creates new unqualified objects in the first schema of the list that exists.

```sql
SET search_path = inventory, public;

SELECT * FROM trees;             -- reads inventory.trees
CREATE TABLE saplings (id int);  -- creates inventory.saplings
```

The default `search_path` is `"$user", public`.
`"$user"` stands for a schema with the same name as the current role, if it exists.
`current_schema()` returns the schema CedarDB creates new objects in, and `current_schemas(true)` returns the effective search path including `pg_catalog`.

If none of the schemas in the search path exists, creating an unqualified object fails.

Each session that creates temporary objects gets its own temporary schema `pg_temp_<n>`, which CedarDB searches before the schemas in `search_path`.
The name `pg_temp` always refers to the temporary schema of the current session (see [Temporary tables](/docs/references/objects/tables#temporary-tables)).

## CREATE SCHEMA

`CREATE SCHEMA` creates a new, empty schema in the current database.

```text
CREATE SCHEMA [ IF NOT EXISTS ] <name>
    [ AUTHORIZATION { <role_name> | CURRENT_USER | CURRENT_ROLE | SESSION_USER } ]
```

| Parameter       | Description                                                                             |
|-----------------|-----------------------------------------------------------------------------------------|
| `IF NOT EXISTS` | Do not throw an error if a schema with the same name already exists.                    |
| `<name>`        | The name of the schema. Names starting with `pg_` are reserved for system schemas.      |
| `AUTHORIZATION` | The role that owns the schema. Defaults to the current role.                            |

Create a schema that belongs to another role:

```sql
CREATE ROLE forester LOGIN;
CREATE SCHEMA forestry AUTHORIZATION forester;
```

```sql
SELECT nspname, nspowner::regrole FROM pg_namespace WHERE nspname = 'forestry';
```

```text
 nspname  | nspowner
----------+----------
 forestry | forester
```

### Permissions

To create a schema, you need the `CREATE` privilege on the current database.
The owner of a database has this privilege by default.
With `AUTHORIZATION`, you must also be able to `SET ROLE` to the new owner, i.e., be a member of that role (see [Roles](/docs/references/objects/roles)).
Superusers can create any schema.

## ALTER SCHEMA

`ALTER SCHEMA` renames a schema or changes its owner.

```text
ALTER SCHEMA <name> RENAME TO <new_name>
ALTER SCHEMA <name> OWNER TO { <new_owner> | CURRENT_USER | CURRENT_ROLE | SESSION_USER }
```

```sql
CREATE SCHEMA inventory;
ALTER SCHEMA inventory RENAME TO stock;
```

Objects inside the schema move with it.
Queries that use the old name stop working.
As with `CREATE SCHEMA`, the new name must not start with `pg_`.

```sql
CREATE ROLE forester LOGIN;
ALTER SCHEMA stock OWNER TO forester;
```

### Permissions

To alter a schema, you must own it or be a superuser.
Members of the owning role count as owners.
In addition:

* `RENAME TO` requires the `CREATE` privilege on the current database.
* `OWNER TO` requires that you can `SET ROLE` to the new owner, and that the new owner has the `CREATE` privilege on the current database.

## DROP SCHEMA

`DROP SCHEMA` removes a schema.

```text
DROP SCHEMA [ IF EXISTS ] <name> [, ...] [ CASCADE | RESTRICT ]
```

```sql
CREATE SCHEMA inventory;
DROP SCHEMA inventory;
```

By default (`RESTRICT`), you can only drop an empty schema.
Use `CASCADE` to also drop all objects in the schema:

```sql
CREATE SCHEMA inventory;
CREATE TABLE inventory.trees (id integer, species text);

DROP SCHEMA inventory;
-- ERROR:  cannot drop schema inventory because other objects depend on it
-- DETAIL:  table trees depends on it

DROP SCHEMA inventory CASCADE;
```

Use `IF EXISTS` to avoid an error if the schema does not exist.

### Permissions

To drop a schema, you must own it, be a member of the owning role, or be a superuser.
The owner of a schema can drop it with `CASCADE`, even if it contains objects owned by other roles.
The owner of a schema can also drop any object in it.

## Schema privileges

Schema privileges control who can use and create objects in a schema.

| Privilege          | Allows                                                                                         |
|--------------------|------------------------------------------------------------------------------------------------|
| `USAGE`            | Referring to objects in the schema. Each object additionally checks its own privileges.        |
| `CREATE`           | Creating objects in the schema.                                                                |
| `ALL [PRIVILEGES]` | Both of the above.                                                                             |

The owner of a schema has all privileges on it.
Other roles have no privileges on a new schema.

The `public` schema is owned by the built-in role `pg_database_owner`, which always stands for the owner of the current database.
By default, every role has `USAGE` on `public`, but only the database owner can create objects in it.

```sql
SELECT nspacl FROM pg_namespace WHERE nspname = 'public';
```

```text
                            nspacl
---------------------------------------------------------------
 {=U/pg_database_owner,pg_database_owner=UC/pg_database_owner}
```

{{< callout type="info" >}}
Granting and revoking privileges on schemas requires an enterprise license.
{{< /callout >}}

Let a role read tables in a schema.
The role needs both `USAGE` on the schema and `SELECT` on the table:

```sql
CREATE SCHEMA inventory;
CREATE TABLE inventory.trees (id integer, species text);
CREATE ROLE forester LOGIN;

GRANT USAGE ON SCHEMA inventory TO forester;
GRANT SELECT ON inventory.trees TO forester;
```

Without `USAGE`, queries fail with `permission denied for schema 'inventory'`, even if the role has `SELECT` on the table.

For the full `GRANT` and `REVOKE` syntax, see [Roles](/docs/references/objects/roles).

## PostgreSQL Differences

* `CREATE SCHEMA` does not support schema elements, such as `CREATE SCHEMA s CREATE TABLE ...`. Create the objects with separate statements.
* `CREATE SCHEMA AUTHORIZATION <role>` without a schema name is not supported. Specify the schema name.
* `COMMENT ON SCHEMA` is not supported.
