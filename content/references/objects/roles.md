---
title: "Reference: Roles"
linkTitle: "Roles"
weight: 60
---

## CREATE ROLE

Create role allows adding new database *roles*.
A role in SQL is an abstraction over *users* (which can log in) and *groups* (which bundle permissions).

Usage example:

```sql
-- Create a new user
create role dbuser login with password 'CorrectHorseBatteryStaple';
-- Create user implies a "login" role
create user admin with createdb createrole password 'CorrectHorseBatteryStaple';
```

### Options

The create role statement can be used with multiple of the following options.
Direct options can be specified for both create and alter role:

* `superuser`, `nosuperuser`
* `createdb`, `nocreatedb`
* `createrole`, `nocreaterole`
* `inherit`, `noinherit`
* `login`, `nologin`
* `replication`, `noreplication`
* `connection limit connlimit` (currently not enforced)
* `password 'password'`, `password null`

When creating a new role, you can additionally specify the hierarchy of its group memberships:

* `in role role_name, ...`
* `role role_name, ...`
* `admin role_name, ...`

### Permissions

To create a role, you need to have superuser or `createrole` permissions.

## ALTER ROLE

Alter role allows modifying a database *role*.
A role in SQL is an abstraction over *users* (which can log in) and *groups* (which bundle permissions).

For example, you can give a role elevated privileges:

```sql
alter role admin with superuser;
```

For a full list of permissions, see the [CREATE ROLE](#create-role) section above.

### Session defaults

`ALTER ROLE ... SET` stores a default value for a [setting](/docs/references/sessions/settings).
Every new session of this role starts with this value:

```sql
alter role dbuser set search_path = app, public;
alter role dbuser set statement_timeout = '30s';
```

Note that this does not affect currently running sessions, for this use an explicit `SET`.
Role defaults take precedence over [database defaults](/docs/references/objects/databases#session-defaults).

`RESET` removes defaults again:

```sql
alter role dbuser reset search_path;
alter role dbuser reset all;
```

### Permissions

Users are only allowed to change their own password or their session defaults without special permissions:

```sql
alter user current_user password 'CorrectHorseBatteryStaple';
alter role current_user set search_path = app;
```

For all other role modifications, the user executing the alter either needs to be a superuser or have the `createrole`
permission.
