---
title: "Reference: Policies (Row Level Security)"
linkTitle: "Policies"
weight: 80
---

Row level security (RLS) lets you define policies on tables that restrict which rows a user can see or modify.
RLS must be enabled per table and is not applied to the table owner by default.

```sql
CREATE TABLE secrets (
    secret         text,
    security_level int
);

INSERT INTO secrets VALUES
    ('not so secret', 1),
    ('more secret',   2),
    ('super secret',  3);

CREATE ROLE normal_user;
GRANT SELECT ON secrets TO normal_user;

-- normal_user may only see rows with security_level = 1
CREATE POLICY secrets_normal_user ON secrets FOR SELECT TO normal_user USING (security_level = 1);

-- RLS must be enabled on the table before policies are applied
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

SET ROLE normal_user;
SELECT * FROM secrets;
--  secret        | security_level
-- ---------------+----------------
--  not so secret |              1
```

{{< callout type="info" >}}
Row level security is an enterprise feature and requires an enterprise license to create or alter policies.
{{< /callout >}}

## CREATE POLICY

```sql
CREATE POLICY name ON table_name
    [ AS { PERMISSIVE | RESTRICTIVE } ]
    [ FOR { ALL | SELECT | INSERT | UPDATE | DELETE } ]
    [ TO { role_name | PUBLIC | CURRENT_ROLE | CURRENT_USER | SESSION_USER } [, ...] ]
    [ USING ( using_expression ) ]
    [ WITH CHECK ( check_expression ) ]
```

The policy name must be unique within the table but can be reused across different tables.

`PERMISSIVE` and `RESTRICTIVE` control how multiple policies on the same table are combined. See [Evaluation of policies](#evaluation-of-policies) for details.

`ALL`, `SELECT`, `INSERT`, `UPDATE`, and `DELETE` specify which statements the policy applies to.

If no role is specified, `PUBLIC` is used. The table owner is exempt from policies by default; use `ALTER TABLE ... FORCE ROW LEVEL SECURITY` to override this.

`USING` expressions filter rows when scanning (`ALL`, `SELECT`, `UPDATE`, `DELETE` policies). `WITH CHECK` expressions validate rows before writing (`ALL`, `INSERT`, `UPDATE` policies).

## ALTER POLICY

```sql
ALTER POLICY name ON table_name
    [ TO { role_name | PUBLIC | CURRENT_ROLE | CURRENT_USER | SESSION_USER } [, ...] ]
    [ USING ( using_expression ) ]
    [ WITH CHECK ( check_expression ) ]
```

Only the role, `USING`, and `WITH CHECK` expressions can be changed with `ALTER POLICY`. To change other attributes, drop and recreate the policy.

## DROP POLICY

```sql
DROP POLICY [ IF EXISTS ] name ON table_name
```

Dropping the last policy on a table does not disable RLS — the default-deny behavior remains active until `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` is called.

## row_security_active

`row_security_active(table_name)` returns whether RLS policies will be applied for the given table and the current user. Policies are active when:

- RLS is enabled on the table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), and
- the current user is not a superuser, does not have `bypassrls`, and is not the table owner — or the owner has forced RLS with `FORCE ROW LEVEL SECURITY`.

```sql
SET ROLE postgres;          -- superuser
SELECT row_security_active('secrets');
-- false

SET ROLE normal_user;       -- non-owner, no bypassrls
SELECT row_security_active('secrets');
-- true
```

## row_security session setting

Setting `row_security = off` causes CedarDB to throw an error if any table in the query has active RLS, rather than silently filtering rows. This is useful for full-database dumps where filtered output would produce an incomplete backup.

## Evaluation of policies

For each statement, policies are evaluated on tables where `row_security_active` is true.

When multiple policies apply to the same table and command:

- All `PERMISSIVE` policies are combined with `OR`. At least one permissive policy must pass for the row to be accessible.
- All `RESTRICTIVE` policies are combined with `AND`. Every restrictive policy must pass.
- The result of the permissive combination and the result of the restrictive combination are combined with `AND`.
- With no matching policy, the default is `false` (deny all).

`ALL` policies apply to every command type.

`USING` expressions silently filter rows on reads. `WITH CHECK` violations raise an error and abort the statement.

### SELECT policies

Select policies apply whenever a table is scanned, including during expression evaluation inside other policies. In `UPDATE` and `DELETE` statements, the table is only scanned when there is a `RETURNING` clause, a `WHERE` condition, or the old value is referenced in the new value expression.

Select policies also apply to the output of `RETURNING` clauses in `INSERT`, `UPDATE`, and `DELETE`, and always to `INSERT ... ON CONFLICT` output. In those output contexts a violation raises an error rather than silently filtering.

### INSERT policies

Insert policies check new rows before they are written. If the policy expression references the same table, it is possible to insert rows that violate the policy when only the new batch is considered:

```sql
CREATE TABLE books (id integer, author text, title text);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY books_select ON books FOR SELECT USING (true);
CREATE POLICY books_insert ON books FOR INSERT WITH CHECK (id NOT IN (SELECT id FROM books));

SET ROLE normal_user;
-- Both rows share id = 1; the self-referencing check does not catch this
INSERT INTO books VALUES (1, 'Antoine de Saint-Exupéry', 'The Little Prince'),
                         (1, 'Hedwig Munck',             'The Little King');
```

When the policy is violated by the existing table contents, the entire statement is rolled back:

```sql
DROP POLICY books_insert ON books;
CREATE POLICY books_insert ON books FOR INSERT WITH CHECK (id < 5);

INSERT INTO books VALUES (4, 'Lewis Carroll', 'Alice''s Adventures in Wonderland'),
                         (5, 'J. R. R. Tolkien', 'The Hobbit');
-- ERROR: new row violates row-level security policy for table "books"
-- Neither row is inserted.
```

Insert policies also apply in upserts for all new values, regardless of whether the insert or update path is taken.

### UPDATE policies

Update policies may have both a `USING` and a `WITH CHECK` expression. The `USING` expression silently filters rows that may not be updated (or raises an error in upserts). The `WITH CHECK` expression validates the new row values and raises an error on violation. All `USING` expressions are evaluated before `WITH CHECK` expressions.

### DELETE policies

Delete policies silently skip rows that the current user is not permitted to delete.
