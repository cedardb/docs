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
[delete](/docs/references/sqlreference/statements/delete).

{{< callout type="warning" >}}
Truncate is a **destructive** operation and will cause all data in the specified tables to be lost.
{{< /callout >}}
