---
title: "Reference: Types"
linkTitle: "Types"
weight: 55
---

In addition to the built-in [data types](/docs/references/datatypes), you can define your own types.
CedarDB supports user-defined [enum types](/docs/references/datatypes/enums): static, ordered sets of labels.
This page covers creating, altering, and dropping them, and the privileges on types.

```sql
CREATE TYPE growth_stage AS ENUM ('seed', 'sapling', 'mature');

CREATE TABLE trees (id int, species text, stage growth_stage);
INSERT INTO trees VALUES (1, 'Oak', 'sapling'), (2, 'Birch', 'mature');

SELECT * FROM trees WHERE stage > 'seed' ORDER BY stage;
```

```text
 id | species |  stage
----+---------+---------
  1 | Oak     | sapling
  2 | Birch   | mature
```

For comparisons, casts, and other details on using enum values, see [Enum types](/docs/references/datatypes/enums).

## CREATE TYPE

```text
CREATE TYPE [ IF NOT EXISTS ] <name> AS ENUM ( [ '<label>' [, ...] ] )
```

The labels define the order of the values: the first label is the smallest.
Labels are case-sensitive and must be unique within the type.

```sql
CREATE TYPE bloom_color AS ENUM ('white', 'yellow', 'red');
```

After creating a type, you can find it in `pg_type` with `typtype = 'e'`, and its labels in `pg_enum`.
You can also use arrays of enum values, e.g., `bloom_color[]`.

A type created in the `pg_temp` schema, e.g., `CREATE TYPE pg_temp.batch_state AS ENUM (...)`, is temporary and dropped at the end of the session.
Other sessions cannot see it.
Unqualified type names are looked up in `pg_temp` first, so a temporary type hides a permanent type with the same name.

### Permissions

To create a type, you need the `CREATE` privilege on the schema.
To create a temporary type in `pg_temp`, you need the `TEMPORARY` privilege on the database, which `PUBLIC` has by default.
The creator owns the new type.

## ALTER TYPE

```text
ALTER TYPE <name> ADD VALUE [ IF NOT EXISTS ] '<label>' [ AFTER '<last_label>' ]
ALTER TYPE <name> RENAME TO <new_name>
ALTER TYPE <name> SET SCHEMA <new_schema>
ALTER TYPE <name> OWNER TO <new_owner>
```

Add a label to an enum type.
The new label sorts after all existing labels:

```sql
CREATE TYPE bloom_color AS ENUM ('white', 'yellow', 'red');
ALTER TYPE bloom_color ADD VALUE 'purple';
ALTER TYPE bloom_color ADD VALUE IF NOT EXISTS 'purple';
```

With `IF NOT EXISTS`, CedarDB skips existing labels with a notice instead of throwing an error.
`AFTER` is accepted only with the current last label.

You can run `ADD VALUE` inside a transaction block and use the new label in the same transaction.
`ROLLBACK` removes the label again.

Rename a type, move it to another schema, or change its owner:

```sql
CREATE TYPE bloom_color AS ENUM ('white', 'yellow', 'red');
ALTER TYPE bloom_color RENAME TO flower_color;
```

### Permissions

To alter a type, you must own it or be a superuser.
`SET SCHEMA` requires the `CREATE` privilege on the new schema.
`OWNER TO` requires that you can `SET ROLE` to the new owner, and that the new owner has the `CREATE` privilege on the schema.

## DROP TYPE

```text
DROP TYPE [ IF EXISTS ] <name> [, ...] [ CASCADE | RESTRICT ]
```

```sql
CREATE TYPE bloom_color AS ENUM ('white', 'yellow', 'red');
DROP TYPE bloom_color;
```

You cannot drop a type while tables, views, materialized views, or functions use it.
With `CASCADE`, CedarDB drops the dependent views and the table columns of that type:

```sql
CREATE TYPE bloom_color AS ENUM ('white', 'yellow', 'red');
CREATE TABLE flowers (name text, color bloom_color);

DROP TYPE bloom_color;
-- ERROR:  cannot drop enum bloom_color because other objects depend on it
-- DETAIL:  table flowers depends on it

DROP TYPE bloom_color CASCADE;  -- drops the column flowers.color
```

The table itself remains, even if the dropped column was its only column.

### Permissions

To drop a type, you must own it, own its schema, own the database, or be a superuser.

## Type privileges

The `USAGE` privilege on a type allows using it in table and view definitions.
By default, `PUBLIC` has `USAGE` on every type.

{{< callout type="info" >}}
Granting and revoking privileges on types requires an enterprise license.
{{< /callout >}}

Restrict who can create tables with a type:

```sql
CREATE TYPE bloom_color AS ENUM ('white', 'yellow', 'red');
CREATE ROLE gardener LOGIN;

REVOKE USAGE ON TYPE bloom_color FROM PUBLIC;
GRANT USAGE ON TYPE bloom_color TO gardener;
```

Other roles now get `permission denied for enum 'bloom_color'` when they use the type in `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN`, or similar statements.
The owner and superusers keep `USAGE`.

Casting to the type in a query, e.g., `SELECT 'red'::bloom_color`, does not require `USAGE`.

You cannot grant or revoke privileges on built-in types.
Check privileges with `pg_type.typacl`, `aclexplode(typacl)`, or `has_type_privilege()`.

## PostgreSQL Differences

- Only enum types are supported. Composite types (`CREATE TYPE ... AS (...)`), range types (`CREATE TYPE ... AS RANGE`), base types, and shell types are not.
- Domains (`CREATE DOMAIN`, `ALTER DOMAIN`, `DROP DOMAIN`) are not supported.
- `ALTER TYPE ... ADD VALUE` does not support `BEFORE`, and `AFTER` only with the last label. New labels always sort last.
- `ALTER TYPE ... RENAME VALUE` is not supported.
- `COMMENT ON TYPE` is not supported.
- `GRANT` and `REVOKE` on built-in types, e.g., `GRANT USAGE ON TYPE integer`, are not supported.
- In addition to PostgreSQL, CedarDB supports `CREATE TYPE IF NOT EXISTS`.
