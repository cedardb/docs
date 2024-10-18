---
title: "Reference: Alter Role Statement"
linkTitle: "Alter Role"
prev: references/sqlreference/statements/
---

Alter role allows modifying a database *role*.
A role in SQL is an abstraction over *users* (which can log in) and *groups* (which bundle permissions).

For example, you can give a role elevated privileges:

```sql
alter role admin with superuser;
```

For a full list of permissions, see [create role](../createrole).

## Permissions

Users are only allowed to change their own password without special permissions:

```sql
alter user current_user password '1234';
```

For all other role modifications, the user executing the alter either needs to be a superuser or have the `createrole`
permission.
