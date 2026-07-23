---
title: "Reference: Set/Show Setting Statement"
linkTitle: "Set/Show Setting"
---

The `SHOW`, `SET`, and `RESET` statements allow you to inspect and change database and session settings.
Changes made with `SET` are transient.
To persist a configuration change across restarts, use [`ALTER SYSTEM`](/docs/references/sessions/altersystem) instead.

Usage example:

```sql
SHOW TimeZone;
```

```text
   timezone    
---------------
 Europe/Berlin
(1 row)
```

```sql
SET timezone='US/Pacific';
```

To restore a setting to its default value, use `RESET`:

```sql
RESET TimeZone;
```

## Show all settings

```sql
SHOW ALL;
```

```text
              name              |        setting        |                       description
--------------------------------+-----------------------+---------------------------------------------------------
 allow_system_table_mods        | off                   | Allows modifications of the structure of system tables.
 ...
 default_transaction_isolation  | repeatable read       | Sets the transaction isolation level of each new transaction.
 ...
 timezone                       | Europe/Berlin         | Sets the time zone for displaying and interpreting time stamps.
 ...
(n rows)
```

{{< callout type="info" >}}
For compatibility with existing PostgreSQL clients, CedarDB accepts many settings that are currently silently ignored.
{{< /callout >}}
