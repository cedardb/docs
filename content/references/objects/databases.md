---
title: "Reference: Databases"
linkTitle: "Databases"
weight: 50
---

Create database allows creating a new *logical* database.
Multiple databases can be used for logical separation of data.
When connection to CedarDB, you need to specify the database that you want to connect to.
All queries that execute in this connection can only read and write data in this database.

Usage example:

```sql
create database newdb owner postgres;
```

Afterward, you can connect to the freshly created database:

```shell
psql -h localhost -U postgres -d newdb
```

## Session defaults

`ALTER DATABASE ... SET` stores a default value for a [setting](/docs/references/sessions/settings).
Every new session connecting to this database starts with this value:

```sql
alter database newdb set statement_timeout = '30s';
```

Note that this does not affect currently running sessions, for this use an explicit `SET`.
[Role defaults](/docs/references/objects/roles#session-defaults) for the same setting, override this default.

`RESET` removes defaults again:

```sql
alter database newdb reset statement_timeout;
alter database newdb reset all;
```

## Permissions

To create a database, you need to have superuser or `createdb` permissions.
To change the session defaults of a database, you need to be its owner or a superuser.
