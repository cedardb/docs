---
title: "Reference: Sequences"
linkTitle: "Sequences"
weight: 45
---

A sequence is a database object that generates a series of unique integers.
Sequences are typically used to generate primary key values.
CedarDB also creates sequences automatically for `serial` columns and identity columns.

```sql
CREATE SEQUENCE planting_ids;

SELECT nextval('planting_ids'), nextval('planting_ids');
```

```text
 nextval | nextval
---------+---------
       1 |       2
```

## CREATE SEQUENCE

```text
CREATE [ { TEMPORARY | TEMP } ] SEQUENCE [ IF NOT EXISTS ] <name>
    [ AS { smallint | integer | bigint } ]
    [ INCREMENT [ BY ] <increment> ]
    [ MINVALUE <minvalue> | NO MINVALUE ]
    [ MAXVALUE <maxvalue> | NO MAXVALUE ]
    [ START [ WITH ] <start> ]
    [ OWNED BY { <table_name>.<column_name> | NONE } ]
```

| Option          | Default                                            | Description                                                                           |
|-----------------|----------------------------------------------------|---------------------------------------------------------------------------------------|
| `TEMPORARY`     |                                                    | Create a [temporary sequence](#temporary-sequences).                                  |
| `IF NOT EXISTS` |                                                    | Do not throw an error if a relation with the same name already exists.                |
| `AS`            | `bigint`                                           | The data type of the sequence. Determines the default bounds.                         |
| `INCREMENT`     | `1`                                                | The step between two values. Negative values create a descending sequence.            |
| `MINVALUE`      | `1`, or the type minimum for descending sequences  | The lowest value of the sequence.                                                     |
| `MAXVALUE`      | the type maximum, or `-1` for descending sequences | The highest value of the sequence.                                                    |
| `START`         | `MINVALUE`, or `MAXVALUE` for descending sequences | The first value that `nextval` returns.                                               |
| `OWNED BY`      | `NONE`                                             | Link the sequence to a table column. Dropping the column or table drops the sequence. |

When a sequence reaches its bound, `nextval` fails with `nextval: reached bounds for sequence`.

```sql
CREATE SEQUENCE ticket_numbers AS integer INCREMENT BY 10 START WITH 100;

SELECT nextval('ticket_numbers'), nextval('ticket_numbers');
```

```text
 nextval | nextval
---------+---------
     100 |     110
```

After creating a sequence, you can find it in the `pg_sequences` system view, in `information_schema.sequences`, and in `pg_class` with `relkind = 'S'`.

### Permissions

To create a sequence, you need the `CREATE` privilege on the schema.
To create a temporary sequence, you need the `TEMPORARY` privilege on the database.
The creator owns the new sequence.
With `OWNED BY`, the table must be in the same schema as the sequence.

## Sequence functions

| Function                                   | Description                                                                     |
|--------------------------------------------|---------------------------------------------------------------------------------|
| `nextval(<sequence>)`                      | Advance the sequence and return the new value.                                  |
| `setval(<sequence>, <value>)`              | Set the current value. The next `nextval` returns `<value>` plus the increment. |
| `setval(<sequence>, <value>, <is_called>)` | With `is_called = false`, the next `nextval` returns `<value>` itself.          |
| `pg_sequence_last_value(<sequence>)`       | Return the last value, or `NULL` if the sequence has not been used yet.         |

The sequence argument is the sequence name as text, optionally schema-qualified, e.g., `'public.planting_ids'`.
You can also pass a `regclass` value, e.g., `'planting_ids'::regclass`.

```sql
CREATE SEQUENCE planting_ids;
SELECT setval('planting_ids', 100);
SELECT nextval('planting_ids');
```

```text
 nextval
---------
     101
```

`setval` with `is_called = false` is only allowed when `<value>` is the start value of the sequence.

`nextval` is not transactional: a `ROLLBACK` does not return the value to the sequence, so the next call returns a new value.

Read the current state of a sequence by selecting from it. After the example above:

```sql
SELECT last_value, is_called FROM planting_ids;
```

```text
 last_value | is_called
------------+-----------
        101 | t
```

`nextval` and `setval` require privileges on the sequence, see [Sequence privileges](#sequence-privileges).
`pg_sequence_last_value` requires either `SELECT` or `USAGE`.

## Serial and identity columns

The `serial`, `bigserial`, and `smallserial` types create an `integer`, `bigint`, or `smallint` column with a sequence named `<table>_<column>_seq`.
The column default is `nextval('<table>_<column>_seq')`.
[Identity columns](/docs/references/objects/tables#identity-columns) also use a sequence named `<table>_<column>_seq`.

```sql
CREATE TABLE plantings (id serial, species text);
INSERT INTO plantings (species) VALUES ('Oak'), ('Ash');

SELECT pg_get_serial_sequence('plantings', 'id');
```

```text
 pg_get_serial_sequence
------------------------
 public.plantings_id_seq
```

A sequence used in a column default cannot be dropped while the table exists.
Use `DROP SEQUENCE ... CASCADE` to also remove the column default of a table that uses `nextval()` in a `DEFAULT` expression.
This does not work for the sequence of a `serial` column, drop the column or the table instead.

## ALTER SEQUENCE

```text
ALTER SEQUENCE [ IF EXISTS ] <name>
    [ AS { smallint | integer | bigint } ]
    [ INCREMENT [ BY ] <increment> ]
    [ MINVALUE <minvalue> | NO MINVALUE ]
    [ MAXVALUE <maxvalue> | NO MAXVALUE ]
    [ START [ WITH ] <start> ]
    [ RESTART [ [ WITH ] <start> ] ]
    [ OWNED BY { <table_name>.<column_name> | NONE } ]
ALTER SEQUENCE [ IF EXISTS ] <name> RENAME TO <new_name>
ALTER SEQUENCE [ IF EXISTS ] <name> SET SCHEMA <new_schema>
ALTER SEQUENCE [ IF EXISTS ] <name> OWNER TO <new_owner>
```

Change the increment:

```sql
CREATE SEQUENCE planting_ids;
ALTER SEQUENCE planting_ids INCREMENT BY 10;
```

Reset a sequence to its start value:

```sql
ALTER SEQUENCE planting_ids RESTART;
```

`RESTART WITH` only accepts the start value of the sequence.
To continue from another value, use `setval()`, or change the start value first:

```sql
ALTER SEQUENCE planting_ids START WITH 500;
ALTER SEQUENCE planting_ids RESTART;
```

### Permissions

To alter a sequence, you must own it or be a superuser, and you need the `USAGE` privilege on its schema.
`SET SCHEMA` requires the `CREATE` privilege on the new schema.
`OWNER TO` requires that you can `SET ROLE` to the new owner, and that the new owner has the `CREATE` privilege on the schema.

## DROP SEQUENCE

```text
DROP SEQUENCE [ IF EXISTS ] <name> [, ...] [ CASCADE | RESTRICT ]
```

```sql
CREATE SEQUENCE planting_ids;
DROP SEQUENCE planting_ids;
```

### Permissions

To drop a sequence, you must own it, own its schema, or be a superuser.

## Temporary sequences

A temporary sequence exists only in the current session.
Other sessions cannot see it, and CedarDB drops it when the session ends.

```sql
CREATE TEMP SEQUENCE batch_numbers START 1000;
SELECT nextval('batch_numbers');
```

Temporary sequences follow the same rules as [temporary tables](/docs/references/objects/tables#temporary-tables):

* They live in the session's temporary schema `pg_temp_<n>`. `CREATE SEQUENCE pg_temp.<name>` also creates a temporary sequence.
* A temporary sequence hides a permanent sequence with the same name. Use the schema name, e.g., `nextval('public.batch_numbers')`, to reach the permanent one.
* `serial` and identity columns of a temporary table use temporary sequences.
* `DISCARD TEMP` and `DISCARD ALL` drop them.

## Sequence privileges

| Privilege          | Allows                                                  |
|--------------------|---------------------------------------------------------|
| `USAGE`            | `nextval` and reading the sequence.                     |
| `SELECT`           | Reading the sequence with `SELECT ... FROM <sequence>`. |
| `UPDATE`           | `nextval` and `setval`.                                 |
| `ALL [PRIVILEGES]` | All of the above.                                       |

{{< callout type="info" >}}
Granting and revoking privileges on sequences requires an enterprise license.
Without a license, only the owner of a sequence and superusers can use it.
{{< /callout >}}

```sql
CREATE SEQUENCE planting_ids;
CREATE ROLE gardener LOGIN;

GRANT USAGE ON SEQUENCE planting_ids TO gardener;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO gardener;
```

As in PostgreSQL, `GRANT` and `REVOKE` of `USAGE`, `SELECT`, or `UPDATE` also accept a sequence with `ON TABLE` or without an object keyword, e.g., `GRANT SELECT ON TABLE planting_ids TO gardener`.
For `ALL`, use `ON SEQUENCE`.
`ON ALL TABLES IN SCHEMA` does not include sequences.

Inserting into a table with a `serial` or identity column also requires `USAGE` or `UPDATE` on its sequence:

```sql
CREATE TABLE plantings (id serial, species text);
GRANT INSERT ON plantings TO gardener;
GRANT USAGE ON SEQUENCE plantings_id_seq TO gardener;
```

`WITH GRANT OPTION` and `REVOKE ... CASCADE` work as for [tables](/docs/references/objects/tables#table-privileges).
Check privileges with `has_sequence_privilege()`.

## PostgreSQL Differences

* `currval()` and `lastval()` are not supported.
* `CYCLE` is accepted by `CREATE SEQUENCE`, but ignored: the sequence stops at its bound. `ALTER SEQUENCE ... CYCLE` is not supported.
* `CACHE` is accepted by `CREATE SEQUENCE`, but ignored. `ALTER SEQUENCE ... CACHE` is not supported.
* `ALTER SEQUENCE ... RESTART WITH` only accepts the start value, and `setval(..., false)` only accepts the start value.
* The default maximum of a `bigint` sequence is `9223372036854775806`, one less than in PostgreSQL. The default minimum of a descending `bigint` sequence is `-9223372036854775807`. `MAXVALUE 9223372036854775807` and `MINVALUE -9223372036854775808` are rejected as out of range.
* Inserting into a table with an identity column requires `USAGE` on the identity sequence. PostgreSQL only requires `INSERT` on the table.
* The `USAGE` privilege also allows `SELECT ... FROM <sequence>`. PostgreSQL requires `SELECT` for this.
* `GRANT ALL ON TABLE <sequence>` and `REVOKE ALL ON TABLE <sequence>` fail with `invalid privilege type`. Use `ON SEQUENCE`. `GRANT INSERT ON TABLE <sequence>` and other table-only privileges fail instead of only raising a warning.
* `ALTER TABLE` cannot be used on sequences. Use `ALTER SEQUENCE`.
* `COMMENT ON SEQUENCE` is not supported.
