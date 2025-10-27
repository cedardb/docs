---
title: "Reference: Alter Table Statement"
linkTitle: "Alter Table"
---

Alter table allows modifying the definition of a table.
See [PostgreSQL: ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) for the PostgreSQL documentation.

## Column statememts

#### `RENAME COLUMN`
```sql
ALTER TABLE IF EXISTS movies RENAME COLUMN runlength TO duration;
```
Rename column of table with `table_name` and `current_column_name` to the `new_column_name`. 
If exists checks if the table exists and only tries to rename in the case of existence.

