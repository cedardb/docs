---
title: "Reference: OID Type"
linkTitle: "OID"
weight: 25
---

OIDs ([Object Identifier Types](https://www.postgresql.org/docs/current/datatype-oid.html)) are PostgreSQL's internal primary keys for system tables.
CedarDB implements them as compatibility layer to mimic Postgres behavior.
As inherited from PostgreSQL, OIDs are four-byte-sized integers.

{{< callout type="info" >}}
CedarDB does not rely on OIDs internally.
Thus, while we aim for them to be unique and stable using different relation types, we cannot guarantee it.
Right now, OIDs are stable while using the same CedarDB version also upon restart. However, a version update may may change the value of the returned OIDs.
{{< /callout >}}

## Usage Example
```sql
-- Get the number of columns instead of pg_class
select count(*) from pg_attribute a, pg_class c where a.attrelid = c.oid and c.relname = 'pg_class';
```

```
count(*)
--------
33
(1 row)
```

