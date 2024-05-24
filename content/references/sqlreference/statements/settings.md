---
title: "Reference: Set/Show Setting Statement"
linkTitle: "Set/Show Setting"
weight: 24
---

The `set` and `show` statements allow you to inspect and change database and session settings.

Usage example:

```sql
show TimeZone;
```

```
   timezone    
---------------
 Europe/Berlin
(1 row)
```

```sql
set timezone='US/Pacific';
```

```
SET 0
```

## Show all settings

```sql
show all;
```

{{< callout type="info" >}}
For compatibility to existing PostgreSQL clients, CedarDB has many settings which are currently not used.
{{< /callout >}}

