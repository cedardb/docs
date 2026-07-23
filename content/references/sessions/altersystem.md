---
title: "Reference: Alter System Statement"
linkTitle: "Alter System"
---

`ALTER SYSTEM` changes a server-wide configuration parameter and persists the new value across restarts.
Instead of editing the [configuration file](/docs/references/configuration) by hand, you can write the value directly
from a SQL session, and CedarDB stores it in the configuration file for you.
Changes take effect the next time CedarDB starts.

Usage example:

```sql
ALTER SYSTEM SET buffersize = '8G';
```

The new value is only written to CedarDB's configuration file and applies after the next restart.
To inspect the current value of a setting, use [`SHOW`](/docs/references/sessions/settings).

To restore a setting to its default value and delete the explicitly set value from configuration file, use `RESET`:

```sql
ALTER SYSTEM RESET buffersize;
```

Like `ALTER SYSTEM SET`, this takes effect after the next restart.

## When changes take effect

`ALTER SYSTEM` only changes the persisted value, but does not change the behavior of the running server.
CedarDB reads its configuration once at startup, so a restart is required for any `ALTER SYSTEM` change to become active.

To change a setting for your current session without persisting it, use [`SET`](/docs/references/sessions/settings) instead.
`SET` applies immediately but is discarded when the session ends, whereas `ALTER SYSTEM` persists across restarts
but does not affect running sessions.

## Permissions

Only superusers can run `ALTER SYSTEM`, because it changes server-wide configuration.

## PostgreSQL Differences

- `ALTER SYSTEM` writes to CedarDB's [configuration file](/docs/references/configuration) (by default `~/.cedardb/config`).
- All changes require a restart. CedarDB does not reload configuration live.
