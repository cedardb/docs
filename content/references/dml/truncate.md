---
title: "Reference: Truncate Statement"
linkTitle: "Truncate"
---

Truncate allows clearing all data from a table.

Usage example:

```sql
truncate movies, stars, starsIn;
```

This removes all rows from the specified tables, similar to an unqualified
[delete](../delete).
`TRUNCATE` is transactional: a `ROLLBACK` restores the rows.

```text
TRUNCATE [ TABLE ] [ ONLY ] <name> [, ...] [ RESTART IDENTITY | CONTINUE IDENTITY ] [ CASCADE | RESTRICT ]
```

You cannot truncate a table that a foreign key of another table references, even if the referencing table is empty or listed in the same statement, and also not with `CASCADE`.
Use `DELETE` for such tables.

{{< callout type="warning" >}}
Truncate is a **destructive** operation and will cause all data in the specified tables to be lost.
{{< /callout >}}

## Permissions

To truncate a table, you need the `TRUNCATE` privilege on it.

## PostgreSQL Differences

- `RESTART IDENTITY` is accepted, but identity columns and sequences continue with their current value.
  Reset them with [`ALTER SEQUENCE <table>_<column>_seq RESTART`](/docs/references/objects/sequences#alter-sequence).
- Tables referenced by a foreign key cannot be truncated, even with `CASCADE` or when all referencing tables are truncated in the same statement.
