---
title: "Reference: Functions and Procedures"
linkTitle: "Functions"
weight: 70
---

User-defined functions encapsulate logic that you can reuse in queries.
Procedures are similar, but you invoke them with `CALL` instead of using them in expressions.

```sql
CREATE FUNCTION times_two(x int) RETURNS int LANGUAGE sql AS
    'SELECT x * 2';

SELECT times_two(x::int) FROM generate_series(1, 3) s(x);
```

```text
 times_two
-----------
         2
         4
         6
(3 rows)
```

## CREATE FUNCTION

```text
CREATE [ OR REPLACE ] FUNCTION <name> ( [ [ IN | INOUT ] <arg_name> <arg_type> [ DEFAULT <default> ] [, ...] ] )
    { RETURNS <return_type> | RETURNS TABLE ( <column_name> <column_type> [, ...] ) }
    LANGUAGE { sql | cedarscript }
    [ IMMUTABLE | STABLE | VOLATILE ]
    [ PARALLEL { SAFE | RESTRICTED | UNSAFE } ]
    [ SECURITY { INVOKER | DEFINER } ]
    [ COST <cost> ]
    [ ROWS <rows> ]
    AS '<definition>'
```

| Option                            | Description                                                              |
|-----------------------------------|--------------------------------------------------------------------------|
| `OR REPLACE`                      | Replace an existing function with the same name and argument types.      |
| `<arg_name> <arg_type>`           | Arguments must be named. Reference them by name in the body.             |
| `DEFAULT <default>`               | A default value. Callers can omit arguments with defaults.               |
| `RETURNS <return_type>`           | A scalar function that returns one value.                                |
| `RETURNS TABLE (...)`             | A table function that returns a set of rows.                             |
| `LANGUAGE`                        | `sql` or `cedarscript`.                                                  |
| `IMMUTABLE`, `STABLE`, `VOLATILE` | Volatility of the function. The default is `VOLATILE`.                   |
| `SECURITY DEFINER`                | Run the function with the privileges of its owner instead of the caller. |
| `PARALLEL`, `COST`, `ROWS`        | Accepted and stored in `pg_proc`.                                        |

Use dollar quoting for bodies that contain quotes:

```sql
CREATE FUNCTION growth_label(height_m numeric) RETURNS text LANGUAGE sql AS $$
    SELECT CASE WHEN height_m > 20 THEN 'tall' ELSE 'small' END
$$;

SELECT growth_label(25.0);
```

```text
 growth_label
--------------
 tall
```

Functions can be overloaded: several functions can share a name if their argument types differ.
CedarDB picks the overload that matches the argument types:

```sql
CREATE FUNCTION leaf_kind(v int) RETURNS text LANGUAGE sql AS 'SELECT ''whole number''';
CREATE FUNCTION leaf_kind(v text) RETURNS text LANGUAGE sql AS 'SELECT ''text''';

SELECT leaf_kind(7), leaf_kind('fern');
```

```text
  leaf_kind   | leaf_kind
--------------+-----------
 whole number | text
```

Cast string literals for parameters of other types, for example `'2024-05-01'::date` or `'{"leaf": 3}'::jsonb`.

After creating a function, you can find it in `pg_proc`, `information_schema.routines`, and `information_schema.parameters`.
`pg_get_functiondef()` returns the full `CREATE FUNCTION` statement.

### Scalar SQL functions

The body of a scalar SQL function is a single `SELECT <expression>`.
The expression can use the arguments and call other functions, but it cannot read from tables or contain subqueries.
A function cannot call itself.

### Default arguments and named notation

```sql
CREATE FUNCTION crown_area(radius_m numeric, pi_approx numeric DEFAULT 3.14159)
    RETURNS numeric LANGUAGE sql AS 'SELECT pi_approx * radius_m * radius_m';

SELECT crown_area(2), crown_area(2, 3), crown_area(pi_approx => 3, radius_m => 2);
```

### Table functions

A function with `RETURNS TABLE` returns a set of rows.
Its body is a single `SELECT` query, which can read from tables.
The output columns of the query must have the same names as the columns in `RETURNS TABLE`:

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
INSERT INTO trees VALUES (1, 'Oak', 21.5), (2, 'Birch', 9.0);

CREATE FUNCTION trees_taller_than(min_height numeric)
    RETURNS TABLE (id int, species text)
    LANGUAGE sql AS
    'SELECT id, species FROM trees WHERE height_m > min_height';

SELECT * FROM trees_taller_than(10);
```

```text
 id | species
----+---------
  1 | Oak
```

### CedarScript functions

In addition to SQL, CedarDB supports functions in its own language `cedarscript`:

```sql
CREATE FUNCTION times_four(x int) RETURNS int LANGUAGE cedarscript AS $$
    return x * 4;
$$;
```

### Permissions

To create a function, you need the `CREATE` privilege on the schema.
The creator owns the function.

## Temporary functions

A function created in the `pg_temp` schema is temporary:
it exists only in the current session, and CedarDB drops it when the session ends.
Other sessions cannot call it, and each session can create its own temporary function with the same name.
You must always call a temporary function with its schema, `pg_temp`:

```sql
CREATE FUNCTION pg_temp.batch_size() RETURNS int LANGUAGE sql AS 'SELECT 500';

SELECT pg_temp.batch_size();  -- works
SELECT batch_size();          -- ERROR:  unknown function or overload batch_size()
```

Temporary procedures work the same way: `CALL pg_temp.<name>()`.
Creating a temporary function requires the `TEMPORARY` privilege on the database, which `PUBLIC` has by default.
The creator owns the temporary function.

A view that uses a temporary function is dropped at the end of the session, too.
`ALTER FUNCTION ... SET SCHEMA` cannot move a function into or out of `pg_temp`.

## CREATE PROCEDURE and CALL

```text
CREATE [ OR REPLACE ] PROCEDURE <name> ( [ <arg_name> <arg_type> [, ...] ] )
    LANGUAGE { sql | cedarscript }
    [ SECURITY { INVOKER | DEFINER } ]
    AS '<definition>'

CALL <name> ( [ <argument> [, ...] ] )
```

```sql
CREATE PROCEDURE check_tree_count(expected int) LANGUAGE sql AS 'SELECT expected > 0';
CALL check_tree_count(3);
```

Calling a procedure with `SELECT`, or a function with `CALL`, fails with `<name> is a procedure` or `<name> is not a procedure`.

The body of a SQL procedure is a single `SELECT <expression>`, like a scalar SQL function.
It cannot modify data.

### Permissions

To call a procedure, you need the `EXECUTE` privilege on it.

## ALTER FUNCTION

```text
ALTER { FUNCTION | PROCEDURE | ROUTINE } <name> [ ( <arg_type> [, ...] ) ]
    { RENAME TO <new_name>
    | SET SCHEMA <new_schema>
    | OWNER TO <new_owner>
    | { IMMUTABLE | STABLE | VOLATILE }
    | SECURITY { INVOKER | DEFINER }
    | PARALLEL { SAFE | RESTRICTED | UNSAFE }
    | COST <cost>
    | ROWS <rows> }
```

The argument types identify the function if its name is overloaded:

```sql
CREATE FUNCTION times_two(x int) RETURNS int LANGUAGE sql AS 'SELECT x * 2';
ALTER FUNCTION times_two(int) RENAME TO double_it;
```

You cannot rename a function or move it to another schema while a view uses it:
`cannot alter function "<name>" because other objects depend on it`.
Other `ALTER FUNCTION` forms work on such functions.

### Permissions

To alter a function, you must own it or be a superuser.
`RENAME TO` and `SET SCHEMA` require the `CREATE` privilege on the target schema.
`OWNER TO` requires that you can `SET ROLE` to the new owner, and that the new owner has the `CREATE` privilege on the schema.

## DROP FUNCTION

```text
DROP { FUNCTION | PROCEDURE | ROUTINE } [ IF EXISTS ] <name> [ ( <arg_type> [, ...] ) ] [, ...] [ CASCADE | RESTRICT ]
```

```sql
CREATE FUNCTION times_two(x int) RETURNS int LANGUAGE sql AS 'SELECT x * 2';
DROP FUNCTION times_two(int);
```

You cannot drop a function while a view uses it. Use `CASCADE` to drop such views as well.

### Permissions

To drop a function, you must own it, own its schema, or be a superuser.

## Function privileges

The `EXECUTE` privilege allows calling a function or procedure.
By default, `PUBLIC` has `EXECUTE` on every function and procedure.

{{< callout type="info" >}}
Granting and revoking privileges on functions requires an enterprise license.
{{< /callout >}}

Restrict a function to specific roles:

```sql
CREATE FUNCTION times_two(x int) RETURNS int LANGUAGE sql AS 'SELECT x * 2';
CREATE ROLE analyst LOGIN;

REVOKE EXECUTE ON FUNCTION times_two(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION times_two(int) TO analyst;
```

Other roles now fail with `permission denied for function 'times_two'`.

Use `ON FUNCTION` for functions, `ON PROCEDURE` for procedures, and `ON ROUTINE` for either.
`ON ALL FUNCTIONS IN SCHEMA`, `ON ALL PROCEDURES IN SCHEMA`, and `ON ALL ROUTINES IN SCHEMA` affect all existing functions, procedures, or both in a schema.

### SECURITY DEFINER

A function with `SECURITY DEFINER` runs with the privileges of its owner.
This lets you give roles controlled access to data they cannot read directly:

```sql
CREATE TABLE ledger (id int, amount int);
CREATE ROLE clerk LOGIN;

CREATE FUNCTION ledger_rows() RETURNS TABLE (id int, amount int)
    LANGUAGE sql SECURITY DEFINER AS 'SELECT id, amount FROM ledger';

-- clerk can call ledger_rows(), but cannot SELECT from ledger
```

The owner of the function needs the `SELECT` privilege on `ledger`.
Because scalar SQL functions cannot read tables, use a table function (`RETURNS TABLE`) for this.
Without `SECURITY DEFINER`, the function runs with the privileges of the caller, and `clerk` gets `permission denied for table 'ledger'`.

## PostgreSQL Differences

- PL/pgSQL (`LANGUAGE plpgsql`) and `DO` blocks are not supported.
- Arguments must be named; positional references (`$1`) are not supported. `VARIADIC` and `OUT` arguments are not supported. `INOUT` arguments are accepted, but the function returns NULL, and `CALL` of a procedure returns no row.
- `RETURNS SETOF`, `RETURNS void`, SQL-standard bodies (`RETURN ...`, `BEGIN ATOMIC`), the `SET` clause, `LEAKPROOF`, `WINDOW`, and `SUPPORT` are not supported.
- Scalar SQL functions cannot read from tables or contain subqueries, and cannot call themselves recursively. SQL functions and procedures contain exactly one `SELECT` statement.
- `STRICT` and `RETURNS NULL ON NULL INPUT` are accepted but not enforced: the function is still called with null arguments.
- `CREATE OR REPLACE FUNCTION` can change the return type, rename parameters, remove defaults, and replace a procedure with a function.
- Calling a function with an untyped `NULL` literal fails with `unknown function or overload`. Cast the literal, e.g., `NULL::int`. String literals are only matched to `text` parameters. Cast them for other types, e.g., `'2024-05-01'::date`.
- Renaming a function, or moving it to another schema, fails while a view uses it.
- `COMMENT ON FUNCTION` is not supported.
