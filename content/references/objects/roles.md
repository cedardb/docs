---
title: "Reference: Roles"
linkTitle: "Roles"
weight: 60
---

A role is a database identity that can own objects and hold privileges.
Roles with the `LOGIN` attribute act as *users* that can connect to CedarDB.
Roles without `LOGIN` usually act as *groups* that bundle privileges for their members.
Roles are shared by all databases on a server.

```sql
-- A group role that bundles read access
CREATE ROLE analysts;

-- A user that can log in and is a member of the group (IN ROLE requires an enterprise license)
CREATE ROLE maple LOGIN PASSWORD 'Leaf!2024x' IN ROLE analysts;
```

```sql
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname IN ('analysts', 'maple');
```

```text
 rolname  | rolcanlogin
----------+-------------
 analysts | f
 maple    | t
```

## CREATE ROLE

`CREATE ROLE` adds a new role.
`CREATE USER` is the same, but implies `LOGIN`.
`CREATE GROUP` is an alias for `CREATE ROLE`.

```text
CREATE ROLE <name> [ [ WITH ] <option> [ ... ] ]
CREATE USER <name> [ [ WITH ] <option> [ ... ] ]

<option>:
      SUPERUSER | NOSUPERUSER
    | CREATEDB | NOCREATEDB
    | CREATEROLE | NOCREATEROLE
    | INHERIT | NOINHERIT
    | LOGIN | NOLOGIN
    | REPLICATION | NOREPLICATION
    | BYPASSRLS | NOBYPASSRLS
    | CONNECTION LIMIT <connlimit>
    | [ ENCRYPTED ] PASSWORD '<password>' | PASSWORD NULL
    | VALID UNTIL '<timestamp>'
    | IN ROLE <role_name> [, ...]
    | ROLE <role_name> [, ...]
    | ADMIN <role_name> [, ...]
```

| Option                         | Default          | Description                                                                                |
|--------------------------------|------------------|--------------------------------------------------------------------------------------------|
| `SUPERUSER`                    | `NOSUPERUSER`    | The role bypasses all permission checks.                                                   |
| `CREATEDB`                     | `NOCREATEDB`     | The role can create [databases](/docs/references/objects/databases).                       |
| `CREATEROLE`                   | `NOCREATEROLE`   | The role can create roles and manage the roles it has the `ADMIN` option on.               |
| `INHERIT`                      | `INHERIT`        | New memberships of this role inherit the privileges of the granted role by default.        |
| `LOGIN`                        | `NOLOGIN`        | The role can connect. `CREATE USER` defaults to `LOGIN`.                                   |
| `REPLICATION`                  | `NOREPLICATION`  | The role can use replication connections.                                                  |
| `BYPASSRLS`                    | `NOBYPASSRLS`    | The role bypasses [row level security policies](/docs/references/objects/policies).        |
| `CONNECTION LIMIT <connlimit>` | `-1` (unlimited) | Maximum concurrent connections. `0` blocks logins. Superusers are not limited.             |
| `PASSWORD '<password>'`        | none             | The password for password authentication. `PASSWORD NULL` removes the password.            |
| `VALID UNTIL '<timestamp>'`    | forever          | After this time, password authentication for the role fails.                               |
| `IN ROLE <role_name>`          |                  | Make the new role a member of the listed roles.                                            |
| `ROLE <role_name>`             |                  | Make the listed roles members of the new role.                                             |
| `ADMIN <role_name>`            |                  | Like `ROLE`, but the listed roles get the `ADMIN` option on the new role.                  |

`IN ROLE`, `ROLE`, and `ADMIN` require an enterprise license, like [`GRANT`](#role-membership) of a role.

The names `public` and `none`, and names starting with `pg_`, are reserved and cannot be used for new roles.

### Passwords

CedarDB stores passwords as SCRAM-SHA-256 hashes.
You can also pass a password that is already hashed in SCRAM-SHA-256 or MD5 format.

Plaintext passwords must meet these requirements:

* at least 8 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character, or
* at least 20 characters from at least two of these categories.

Otherwise, CedarDB rejects the password with `password does not satisfy security requirements`.

```sql
CREATE ROLE maple LOGIN PASSWORD 'Leaf!2024x';
```

### Permissions

To create a role, you must be a superuser or have the `CREATEROLE` attribute.
A role with `CREATEROLE` that is not a superuser has these restrictions:

* To create a role with `SUPERUSER`, `CREATEDB`, `REPLICATION`, or `BYPASSRLS`, it must have that attribute itself.
  `SUPERUSER` always requires a superuser.
* To use `IN ROLE`, it must have the `ADMIN` option on the listed roles.
* The creating role automatically gets the `ADMIN` option on each role it creates, so it can manage that role afterward.

```sql
CREATE ROLE team_lead LOGIN CREATEROLE;
SET ROLE team_lead;
CREATE ROLE intern LOGIN;
RESET ROLE;

SELECT m.rolname AS member, r.rolname AS role, am.admin_option
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname = 'intern';
```

```text
  member   |  role  | admin_option
-----------+--------+--------------
 team_lead | intern | t
```

## ALTER ROLE

`ALTER ROLE` changes the attributes of a role, renames it, or sets defaults for configuration parameters.
`ALTER USER` is an alias.

```text
ALTER ROLE <role_spec> [ WITH ] <option> [ ... ]
ALTER ROLE <name> RENAME TO <new_name>
ALTER ROLE <role_spec> SET <parameter> { TO | = } { <value> | DEFAULT }
ALTER ROLE <role_spec> RESET { <parameter> | ALL }

<role_spec>: <name> | CURRENT_USER | CURRENT_ROLE | SESSION_USER
```

The options are the same as for [`CREATE ROLE`](#create-role), except `IN ROLE`, `ROLE`, and `ADMIN`.
To change memberships, use [`GRANT` and `REVOKE`](#role-membership).

Give a role elevated privileges:

```sql
CREATE ROLE maple LOGIN;
ALTER ROLE maple CREATEDB CONNECTION LIMIT 10;
```

### Session defaults

`ALTER ROLE ... SET` stores a default value for a [configuration parameter](/docs/references/sessions/settings).
The default applies to every new session of the role.
It does not affect sessions that are already running.
To change settings for running sessions, use an explicit `SET`.
Role defaults take precedence over [database defaults](/docs/references/objects/databases#alter-database).

Set a default `search_path` for all future sessions of a role:

```sql
CREATE ROLE maple LOGIN;
ALTER ROLE maple SET search_path = 'forestry';
```

```sql
SELECT setrole::regrole, setconfig FROM pg_db_role_setting;
```

```text
 setrole |       setconfig
---------+------------------------
 maple   | {search_path=forestry}
```

Remove the defaults again with `RESET`:

```sql
ALTER ROLE maple RESET search_path;
ALTER ROLE maple RESET ALL;
```

### Permissions

Every role can change its own password, and set or reset its own configuration defaults:

```sql
ALTER ROLE CURRENT_USER PASSWORD 'N3w!Leaf2024';
ALTER ROLE CURRENT_USER SET search_path = 'forestry';
```

For all other changes, you must be a superuser, or have the `CREATEROLE` attribute and the `ADMIN` option on the target role.
A role with `CREATEROLE` that is not a superuser also has these restrictions:

* It cannot change superuser roles.
* To set `CREATEDB`, `REPLICATION`, or `BYPASSRLS`, it must have that attribute itself.

## DROP ROLE

`DROP ROLE` removes roles.
`DROP USER` and `DROP GROUP` are aliases.

```text
DROP ROLE [ IF EXISTS ] <name> [, ...]
```

```sql
CREATE ROLE intern;
DROP ROLE intern;
```

Dropping a role removes all its memberships.
You cannot drop a role that owns objects or holds privileges on objects.
CedarDB lists these objects in the error:

```text
ERROR:  role "maple" cannot be dropped because some objects depend on it
DETAIL:  trees depends on it
```

Transfer or drop the objects, and revoke the privileges, before you drop the role.

### Permissions

To drop a role, you must be a superuser, or have the `CREATEROLE` attribute and the `ADMIN` option on the role.
Only superusers can drop superuser roles.

## Role membership

Granting a role to another role makes the second role a *member* of the first.
Members can use the privileges of the granted role, depending on the membership options.

{{< callout type="info" >}}
`GRANT` and `REVOKE` of role memberships require an enterprise license.
So do the `IN ROLE`, `ROLE`, and `ADMIN` options of `CREATE ROLE`, which also create memberships.
`SET ROLE` does not.
{{< /callout >}}

```text
GRANT <role_name> [, ...] TO <role_spec> [, ...]
    [ WITH { ADMIN | INHERIT | SET } { OPTION | TRUE | FALSE } [, ...] ]
    [ GRANTED BY <role_spec> ]

REVOKE [ { ADMIN | INHERIT | SET } OPTION FOR ] <role_name> [, ...] FROM <role_spec> [, ...]
    [ GRANTED BY <role_spec> ]
    [ CASCADE | RESTRICT ]
```

| Option    | Default                               | Description                                                       |
|-----------|---------------------------------------|-------------------------------------------------------------------|
| `ADMIN`   | `FALSE`                               | The member can grant and revoke the role to and from other roles. |
| `INHERIT` | the `INHERIT` attribute of the member | The member automatically has the privileges of the granted role.  |
| `SET`     | `TRUE`                                | The member can switch to the granted role with `SET ROLE`.        |

Grant read access through a group role:

```sql
CREATE TABLE trees (id integer, species text);
CREATE ROLE analysts;
CREATE ROLE maple LOGIN;

GRANT SELECT ON trees TO analysts;
GRANT analysts TO maple;
```

`maple` can now read `trees`.
With `WITH INHERIT FALSE`, `maple` could only read `trees` after `SET ROLE analysts`.
With `WITH SET FALSE`, `maple` inherits the privileges but cannot switch to `analysts`.

Let a member manage the group:

```sql
GRANT analysts TO maple WITH ADMIN OPTION;
```

Check memberships and their options in `pg_auth_members`, or with `pg_has_role()`:

```sql
SELECT pg_has_role('maple', 'analysts', 'MEMBER') AS member,
       pg_has_role('maple', 'analysts', 'USAGE')  AS inherits,
       pg_has_role('maple', 'analysts', 'SET')    AS can_set;
```

```text
 member | inherits | can_set
--------+----------+---------
 t      | t        | t
```

CedarDB rejects memberships that would create a cycle, such as granting a role to itself.

### Grantors

CedarDB records the grantor of each membership in `pg_auth_members.grantor`.
A role can hold the same membership from several grantors, and each grant is revoked separately.
`REVOKE` only removes the memberships granted by the current role, unless you specify `GRANTED BY`.
`GRANTED BY` must name the current role or a role it is a member of and that has the `ADMIN` option.

If a member with the `ADMIN` option has granted the role to others, revoking the membership or the `ADMIN` option fails with `dependent privileges exist`.
Use `CASCADE` to also revoke the memberships that the member granted.
These memberships are removed, too, so grant them again afterward if the other roles should keep them:

```sql
REVOKE ADMIN OPTION FOR analysts FROM maple CASCADE;
```

`REVOKE INHERIT OPTION FOR` and `REVOKE SET OPTION FOR` turn off the corresponding option but keep the membership.

### Permissions

To grant or revoke a role, you must be a superuser, or have the `ADMIN` option on the role.

## SET ROLE

`SET ROLE` changes the current role of the session.
CedarDB checks privileges against the current role.
The session role, which you logged in as, stays the same.

```text
SET [ SESSION ] ROLE { <role_name> | NONE }
RESET ROLE

SET SESSION AUTHORIZATION { <role_name> | DEFAULT }
RESET SESSION AUTHORIZATION
```

```sql
CREATE ROLE analysts;
SET ROLE analysts;
SELECT current_user, session_user;
```

```text
 current_user | session_user
--------------+--------------
 analysts     | postgres
```

`RESET ROLE` and `SET ROLE NONE` switch back to the session role.

`SET SESSION AUTHORIZATION` changes both the session role and the current role.
Only superusers can use it to switch to another role.
`RESET SESSION AUTHORIZATION` returns to the role you logged in as.

### Permissions

You can `SET ROLE` to any role you are a member of with the `SET` option, or to any role if you are a superuser.

## Object privileges

`GRANT` and `REVOKE` give roles privileges on individual database objects.
The privileges that apply depend on the object type and are described on the object pages:
[databases](/docs/references/objects/databases#database-privileges),
[schemas](/docs/references/objects/schemas#schema-privileges),
[tables, views, and materialized views](/docs/references/objects/tables#table-privileges),
[sequences](/docs/references/objects/sequences#sequence-privileges),
[functions and procedures](/docs/references/objects/functions#function-privileges), and
[types](/docs/references/objects/types#type-privileges).

{{< callout type="info" >}}
`GRANT`, `REVOKE`, and `ALTER DEFAULT PRIVILEGES` require an enterprise license.
{{< /callout >}}

```text
GRANT { <privilege> [, ...] | ALL [ PRIVILEGES ] }
    ON { [ TABLE ] <name> [, ...]
       | ALL TABLES IN SCHEMA <schema_name> [, ...]
       | SEQUENCE <name> [, ...] | ALL SEQUENCES IN SCHEMA <schema_name> [, ...]
       | { FUNCTION | PROCEDURE | ROUTINE } <name> [ ( <arg_type> [, ...] ) ] [, ...]
       | ALL { FUNCTIONS | PROCEDURES | ROUTINES } IN SCHEMA <schema_name> [, ...]
       | SCHEMA <name> [, ...] | DATABASE <name> [, ...] | TYPE <name> [, ...] }
    TO { <role_name> | PUBLIC | CURRENT_USER | CURRENT_ROLE | SESSION_USER } [, ...]
    [ WITH GRANT OPTION ]
    [ GRANTED BY { CURRENT_USER | CURRENT_ROLE | SESSION_USER } ]

REVOKE [ GRANT OPTION FOR ] { <privilege> [, ...] | ALL [ PRIVILEGES ] }
    ON <object> [, ...]
    FROM { <role_name> | PUBLIC | CURRENT_USER | CURRENT_ROLE | SESSION_USER } [, ...]
    [ GRANTED BY { CURRENT_USER | CURRENT_ROLE | SESSION_USER } ]
    [ CASCADE | RESTRICT ]
```

`ALL TABLES IN SCHEMA` covers tables, views, and materialized views, but not sequences.
`ALL FUNCTIONS IN SCHEMA` covers only functions, `ALL PROCEDURES IN SCHEMA` only procedures, and `ALL ROUTINES IN SCHEMA` both.
These forms only affect objects that exist when you run the statement. Use [`ALTER DEFAULT PRIVILEGES`](#alter-default-privileges) for future objects.

`PUBLIC` stands for all roles, including roles created later.
A role has all privileges granted to itself, to `PUBLIC`, and to the roles it is a member of (with the `INHERIT` option).
Owners have all privileges on their objects, and superusers bypass all privilege checks.
An owner can revoke privileges from itself, e.g., to protect a table from accidental writes.

### Grant options and grantors

CedarDB records the grantor of every privilege, and shows it in the access control lists of the catalogs, such as `pg_class.relacl`.
Each entry has the form `grantee=privileges/grantor`; an empty grantee means `PUBLIC`, and `*` marks a privilege with grant option.
Each privilege is shown as a single letter:

| Letter | Privilege    |
|--------|--------------|
| `r`    | `SELECT`     |
| `a`    | `INSERT`     |
| `w`    | `UPDATE`     |
| `d`    | `DELETE`     |
| `D`    | `TRUNCATE`   |
| `x`    | `REFERENCES` |
| `t`    | `TRIGGER`    |
| `X`    | `EXECUTE`    |
| `U`    | `USAGE`      |
| `C`    | `CREATE`     |
| `c`    | `CONNECT`    |
| `T`    | `TEMPORARY`  |

A `NULL` access control list means that the object still has its built-in privileges, which `acldefault()` returns.
For example, after a chain of grants:

```sql
CREATE TABLE trees (id int, species text);
CREATE ROLE maple LOGIN;
CREATE ROLE birch LOGIN;

GRANT SELECT ON trees TO maple WITH GRANT OPTION;
SET ROLE maple;
GRANT SELECT ON trees TO birch;
RESET ROLE;

SELECT relacl FROM pg_class WHERE relname = 'trees';
```

```text
                           relacl
-------------------------------------------------------------
 {postgres=arwdDxt/postgres,maple=r*/postgres,birch=r/maple}
```

Use `aclexplode()` to turn an access control list into rows of grantor, grantee, privilege, and grant option.
Call it with `CROSS JOIN LATERAL` to list the entries of a table:

```sql
SELECT a.grantor::regrole, a.grantee::regrole, a.privilege_type, a.is_grantable
FROM pg_class c CROSS JOIN LATERAL aclexplode(c.relacl) a
WHERE c.relname = 'trees' AND a.grantee <> c.relowner;
```

```text
 grantor  | grantee | privilege_type | is_grantable
----------+---------+----------------+--------------
 postgres | maple   | SELECT         | t
 maple    | birch   | SELECT         | f
```

Who can grant a privilege, and which grantor CedarDB records:

* The owner of an object, and members of the owning role (with the `INHERIT` option), grant as the owner.
* A superuser who does not own the object also grants as the owner.
* A role that holds a privilege `WITH GRANT OPTION`, directly or through an inherited membership, grants as the role that holds the option.
* A role without the grant option gets `WARNING: no privileges were granted`.
  If it has only some of the requested grant options, `WARNING: not all privileges were granted`.
  This also applies if the role holds other privileges on the object with grant option.
  A role without any privilege on the object gets `permission denied`.

Granting or revoking privileges on an object in a schema also requires the `USAGE` privilege on that schema.

`GRANTED BY` only accepts the current role.

### Revoking privileges

`REVOKE` only removes privileges that the current role granted (or the owner, for owners and superusers).
If two roles granted the same privilege to a grantee, the grantee keeps it until both grants are revoked.

If the grantee has passed a privilege on to other roles, `REVOKE` fails with `dependent privileges exist`.
`CASCADE` also revokes the dependent privileges, recursively.
`REVOKE GRANT OPTION FOR` keeps the privilege but removes the grant option, and also requires `CASCADE` when dependent privileges exist.

A role cannot grant a privilege with grant option back to the role that granted it, so revoking the root grant always removes the whole chain.

When you change the owner of an object with `ALTER ... OWNER TO`, CedarDB rewrites the privileges granted by the old owner so that the new owner is their grantor.

## ALTER DEFAULT PRIVILEGES

`ALTER DEFAULT PRIVILEGES` defines privileges that CedarDB grants automatically when objects are created in the future.
Existing objects are not affected.

```text
ALTER DEFAULT PRIVILEGES
    [ FOR { ROLE | USER } <target_role> [, ...] ]
    [ IN SCHEMA <schema_name> [, ...] ]
    { GRANT <privileges> ON <object_class> TO <grantee> [, ...] [ WITH GRANT OPTION ]
    | REVOKE [ GRANT OPTION FOR ] <privileges> ON <object_class> FROM <grantee> [, ...] [ CASCADE | RESTRICT ] }

<object_class>: TABLES | SEQUENCES | FUNCTIONS | ROUTINES | TYPES | SCHEMAS
```

Let `analysts` read all tables that `etl_user` creates in the schema `reports` from now on:

```sql
CREATE ROLE etl_user LOGIN;
CREATE ROLE analysts;
CREATE SCHEMA reports AUTHORIZATION etl_user;

ALTER DEFAULT PRIVILEGES FOR ROLE etl_user IN SCHEMA reports
    GRANT SELECT ON TABLES TO analysts;
```

| Clause                  | Description                                                                                                                  |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `FOR ROLE`              | The defaults apply to objects created by these roles. Defaults to the current role. Requires membership in the target roles. |
| `IN SCHEMA`             | The defaults apply only to objects created in these schemas. Without it, they apply in all schemas.                          |
| `TABLES`                | Tables, views, and materialized views, including tables created with `CREATE TABLE AS` and `SELECT INTO`.                    |
| `SEQUENCES`             | Sequences, including the sequences of `serial` and identity columns.                                                         |
| `FUNCTIONS`, `ROUTINES` | Functions and procedures.                                                                                                    |
| `TYPES`                 | Types.                                                                                                                       |
| `SCHEMAS`               | Schemas. Cannot be combined with `IN SCHEMA`.                                                                                |

Rules:

* Defaults only apply to objects created afterward by the target role, not to objects created by other members of that role.
* Schema-specific defaults add to the global defaults. They cannot remove privileges granted by global defaults.
* With `WITH GRANT OPTION`, the new objects carry the grant option, with the creating role as grantor.
* `CREATE OR REPLACE` on an existing object does not apply the defaults again.
* Defaults also apply to temporary tables, views, sequences, and functions.

Remove built-in defaults, such as the `EXECUTE` privilege of `PUBLIC` on new functions:

```sql
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
```

The `pg_default_acl` catalog lists all default privileges.
You cannot drop a role while default privileges mention it.
Find the entries, and remove them with `ALTER DEFAULT PRIVILEGES FOR ROLE ... REVOKE`:

```sql
SELECT defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl
FROM pg_default_acl;

ALTER DEFAULT PRIVILEGES FOR ROLE etl_user IN SCHEMA reports
    REVOKE ALL ON TABLES FROM analysts;
```

## Inspecting privileges

| Function or view                                                         | Returns                                                                                |
|--------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `has_table_privilege`, `has_schema_privilege`, `has_database_privilege`  | Whether a role has a privilege on a table, schema, or database.                        |
| `has_sequence_privilege`, `has_function_privilege`, `has_type_privilege` | The same for sequences, functions, and types.                                          |
| `has_column_privilege`, `has_any_column_privilege`                       | Whether a role has a privilege on a column, or on any column of a table.               |
| `pg_has_role`                                                            | Whether a role is a member of another role.                                            |
| `aclexplode(<acl>)`                                                      | The entries of an access control list as rows.                                         |
| `acldefault(<type>, <owner>)`                                            | The built-in privileges of a new object, e.g., `acldefault('r', 'postgres'::regrole)`. |
| `information_schema.table_privileges`, `role_table_grants`               | Table privileges per grantee.                                                          |
| `information_schema.column_privileges`, `role_column_grants`             | Table privileges per grantee, with one row per column.                                 |
| `information_schema.routine_privileges`, `role_routine_grants`           | Function and procedure privileges per grantee.                                         |
| `information_schema.usage_privileges`, `role_usage_grants`               | `USAGE` privileges on sequences, collations, and foreign-data wrappers.                |

Without a role argument, the `has_*_privilege` functions check the current role, e.g., `has_table_privilege('trees', 'SELECT')`.
Append `WITH GRANT OPTION` to the privilege to check for the grant option, e.g., `'SELECT WITH GRANT OPTION'`.

## Predefined roles

CedarDB creates these roles in every installation:
`pg_checkpoint`, `pg_create_subscription`, `pg_database_owner`, `pg_execute_server_program`, `pg_maintain`, `pg_monitor`, `pg_read_all_data`, `pg_read_all_settings`, `pg_read_all_stats`, `pg_read_server_files`, `pg_signal_backend`, `pg_stat_scan_tables`, `pg_use_reserved_connections`, `pg_write_all_data`, and `pg_write_server_files`.

`pg_database_owner` always stands for the owner of the current database.
It owns the [`public` schema](/docs/references/objects/schemas#schema-privileges) and cannot have explicit members.
Members of `pg_read_all_data` can read all tables, views, and sequences, and have `USAGE` on all schemas.
Members of `pg_write_all_data` can insert, update, and delete in all tables, and have `USAGE` on all schemas.

Grant predefined roles like any other role (this requires an enterprise license, like every role `GRANT`):

```sql
CREATE ROLE auditor LOGIN;
GRANT pg_read_all_data TO auditor;
```

## PostgreSQL Differences

* `REASSIGN OWNED` and `DROP OWNED` are not yet supported.
* `ALTER ROLE ... IN DATABASE ... SET`, `ALTER ROLE ALL ... SET`, and `ALTER ROLE ... SET ... FROM CURRENT` are not yet supported.
* `ALTER GROUP ... ADD USER` and `ALTER GROUP ... DROP USER` are not yet supported. Use `GRANT` and `REVOKE`.
* `SET LOCAL ROLE` is not supported.
* `SHOW role` and `SHOW session_authorization` are not yet supported. Use `current_user` and `session_user`.
* CedarDB enforces password complexity requirements for plaintext passwords.
* `ALTER ROLE ... RENAME TO` can safely rename the current user and the session user. PostgreSQL rejects this with `session user cannot be renamed`.
* `COMMENT ON ROLE` is not supported.
* Column privileges, such as `GRANT SELECT (species) ON trees`, are not supported.
* The privileges of system objects cannot be changed: `GRANT` and `REVOKE` on system tables such as `pg_class`, on built-in functions and types, and on the schemas `pg_catalog` and `information_schema` fail.
* `has_table_privilege` with a sequence name fails with `table ... does not exist`. Use `has_sequence_privilege`, or pass the sequence to `has_table_privilege` as `regclass`, e.g., `'seedling_ids'::regclass`.
* `has_tablespace_privilege`, `has_language_privilege`, `has_parameter_privilege`, `makeaclitem`, and `aclcontains` are not available.
* `DROP OWNED` is not available to remove default privileges before dropping a role. Use `ALTER DEFAULT PRIVILEGES FOR ROLE ... REVOKE`.
