---
title: "Reference: Set/Show Setting Statement"
linkTitle: "Set/Show Setting"
---

The `SHOW`, `SET`, and `RESET` statements allow you to inspect and change database and session settings.
Changes made with `SET` are transient.
To persist a configuration change across restarts, use [`ALTER SYSTEM`](/docs/references/sessions/altersystem) instead.
To set defaults for a role or database, use
[`ALTER ROLE ... SET`](/docs/references/objects/roles#session-defaults) or
[`ALTER DATABASE ... SET`](/docs/references/objects/databases#alter-database).

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

To restore a setting to its default value, use `RESET` or `SET ... TO DEFAULT`:

```sql
RESET TimeZone;
SET timezone TO DEFAULT;
```

If a default for the setting is configured for the current role or database, `RESET` restores that default.

## Syntax

```text
SET [ SESSION ] <parameter> { TO | = } { <value> | '<value>' | DEFAULT }
SET TIME ZONE { '<time_zone>' | LOCAL | DEFAULT }
RESET { <parameter> | ALL }
SHOW { <parameter> | ALL }
```

A setting stays in effect until the end of the session, or until you change it again.
`RESET ALL` restores all session settings to their defaults.
`SET` is transactional: if the surrounding transaction or savepoint rolls back, the previous value is restored.

```sql
BEGIN;
SET statement_timeout = '3s';
ROLLBACK;
SHOW statement_timeout;
```

```text
 statement_timeout 
-------------------
 0ms
(1 row)
```

`SET TIME ZONE 'UTC'` is an alternative spelling of `SET timezone = 'UTC'`.

Some parameters are read-only, e.g., `server_version` or `standard_conforming_strings`, and fail with `cannot change configuration parameter "<name>"`.

## Functions and views

`current_setting('<parameter>')` returns the value of a setting, and `set_config('<parameter>', '<value>', false)` changes it, like `SET`:

```sql
SELECT set_config('search_path', 'public', false);
SELECT current_setting('search_path');
```

`current_setting('<parameter>', true)` returns an empty string instead of failing when the parameter does not exist.

The `pg_settings` system view lists all parameters with their current values.

## Timeouts

CedarDB enforces these timeouts:

| Parameter                             | Effect                                                                                        |
|---------------------------------------|-----------------------------------------------------------------------------------------------|
| `statement_timeout`                   | Cancels statements that run longer than the given time, with `canceled`. `0` disables it.     |
| `idle_in_transaction_session_timeout` | Terminates sessions that stay idle inside an open transaction for longer than the given time. |

```sql
SET statement_timeout = '30s';
```

Values without a unit are milliseconds. Both timeouts default to `0` (disabled).

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

## Permissions

Any role can change session settings such as `statement_timeout`, `search_path`, or `TimeZone`.
Changing CedarDB server settings, such as `verbosity` or `compilationmode`, requires superuser privileges.

## PostgreSQL Differences

- `SET LOCAL` and transaction-local `set_config(..., true)` are not supported.
- Custom parameters with a prefix, such as `SET myapp.tenant = '42'`, are not supported.
- `current_setting('<parameter>', true)` returns an empty string, not `NULL`, for unknown parameters.
- `SET NAMES` and `SET TIME ZONE INTERVAL ...` are not supported. `client_encoding` only supports `UTF8`.
- Some parameters cannot be changed per session and fail with `cannot change configuration parameter`, e.g., `work_mem`, `lock_timeout`, `default_transaction_isolation`, `transaction_isolation`, `enable_seqscan`, and `synchronous_commit`.
- `idle_session_timeout` is not supported.
- In `pg_settings`, the columns `category`, `vartype`, `source`, `unit`, `min_val`, `max_val`, `boot_val`, and `reset_val` are empty.
