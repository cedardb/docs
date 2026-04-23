---
title: "Reference: SELECT"
linkTitle: "SELECT"
---

```sql
-- Get all info about a specific movie
select * from movies where id = 42;
-- Selecting specific columns is more robust against schema changes and reduces I/O
select name, length from movies where id = 42;
```

{{< callout type="info" >}}
For fast single-element access with `where`, consider specifying `id` as primary key or adding an explicit index.
{{< /callout >}}

You can also use [expressions](../expressions) or [functions](/docs/references/functions) to transform your data:
```sql
select date_trunc('month', release_date) from movies;
```

For many data-specific operations, executing them in the database can be more efficient.
