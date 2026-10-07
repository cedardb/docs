---
title: "Reference: Databases"
linkTitle: "Databases"
weight: 50
---

A database is a named, logically separate collection of schemas, tables, and other objects on a CedarDB server.
When you connect to CedarDB, you choose the database to connect to.
All queries on that connection can only read and write objects in that database.
Roles are shared by all databases on the server.

```sql
CREATE DATABASE forestry;
```

Afterward, connect to the new database:

```shell
psql -h localhost -U postgres -d forestry
```

## CREATE DATABASE

`CREATE DATABASE` creates a new, empty database.

```text
CREATE DATABASE <name>
    [ [ WITH ] [ OWNER [=] <role_name> ]
               [ ENCODING [=] 'UTF8' ]
               [ TEMPLATE [=] { template0 | template1 | DEFAULT } ] ]
```

| Parameter  | Description                                                                                                     |
|------------|-----------------------------------------------------------------------------------------------------------------|
| `<name>`   | The name of the new database.                                                                                   |
| `OWNER`    | The role that owns the new database. Defaults to the role that runs the statement.                              |
| `ENCODING` | The character encoding. CedarDB always stores text as UTF-8.                                                    |
| `TEMPLATE` | Accepted for compatibility with `template0`, `template1`, and `DEFAULT` only. The new database is always empty. |

Create a database that belongs to another role:

```sql
CREATE ROLE forester LOGIN;
CREATE DATABASE forestry_reports OWNER forester;
```

```sql
SELECT datname, datdba::regrole AS owner FROM pg_database WHERE datname = 'forestry_reports';
```

```text
     datname      |  owner
------------------+----------
 forestry_reports | forester
```

### Permissions

To create a database, you must be a superuser or have the `CREATEDB` attribute.
The creator owns the new database, unless you specify `OWNER`.
With `OWNER`, you must be able to `SET ROLE` to the new owner, i.e., be a member of that role with the `SET` option.

## ALTER DATABASE

`ALTER DATABASE` renames a database, changes its owner, or sets default values for configuration parameters.

```text
ALTER DATABASE <name> RENAME TO <new_name>
ALTER DATABASE <name> OWNER TO { <new_owner> | CURRENT_USER | CURRENT_ROLE | SESSION_USER }
ALTER DATABASE <name> SET <parameter> { TO | = } { <value> | DEFAULT }
ALTER DATABASE <name> RESET { <parameter> | ALL }
```

### Rename a database

You cannot rename a database while any session, including your own, is connected to it:

```sql
CREATE DATABASE forestry;
ALTER DATABASE forestry RENAME TO forestry_archive;
```

### Set a default for a [configuration parameter](/docs/references/sessions/settings)

The default applies to every new session that connects to the database.
It does not affect sessions that are already running. Use an explicit `SET` for those.
[Role defaults](/docs/references/objects/roles#session-defaults) for the same parameter override the database default:

```sql
CREATE DATABASE forestry;
ALTER DATABASE forestry SET search_path = 'inventory';
```

```sql
SELECT setconfig FROM pg_db_role_setting;
```

```text
        setconfig
-------------------------
 {search_path=inventory}
```

Remove the default again with `RESET`:

```sql
ALTER DATABASE forestry RESET search_path;
ALTER DATABASE forestry RESET ALL;
```

### Permissions

To alter a database, you must own it or be a superuser.
In addition:

* `RENAME TO` requires the `CREATEDB` attribute.
* `OWNER TO` requires that you have the `CREATEDB` attribute and are a member of the new owner role with the `SET` option.

Superusers can always rename a database and change its owner.

## DROP DATABASE

`DROP DATABASE` removes a database and all objects in it.
This cannot be undone after the transaction executing it commited.

```text
DROP DATABASE [ IF EXISTS ] <name>
```

```sql
CREATE DATABASE forestry;
DROP DATABASE forestry;
```

Use `IF EXISTS` to avoid an error if the database does not exist:

```sql
DROP DATABASE IF EXISTS forestry;
```

You cannot drop the database you are connected to.
If other sessions are connected to the database, `DROP DATABASE` fails with the error `Cannot drop database because connections rely on it`.

### Permissions

To drop a database, you must own it or be a superuser.

## Database privileges

Database privileges control who can connect to a database and what they can create in it.

| Privilege           | Allows                                                                         |
|---------------------|--------------------------------------------------------------------------------|
| `CONNECT`           | Connecting to the database.                                                    |
| `CREATE`            | Creating schemas in the database.                                              |
| `TEMPORARY`, `TEMP` | Creating temporary tables and other temporary objects in the database.         |
| `ALL [PRIVILEGES]`  | All of the above.                                                              |

By default, every role can connect to a database and create temporary objects in it, because `PUBLIC` holds `CONNECT` and `TEMPORARY`.
Only the owner can create schemas in it.

{{< callout type="info" >}}
`GRANT` and `REVOKE` require an enterprise license.
{{< /callout >}}

Restrict a database to specific roles by revoking `CONNECT` from `PUBLIC` and granting it again to individual roles:

```sql
CREATE DATABASE forestry;
CREATE ROLE forester LOGIN;

REVOKE CONNECT ON DATABASE forestry FROM PUBLIC;
GRANT CONNECT ON DATABASE forestry TO forester;
```

Other roles now fail to connect with `FATAL: user not permitted to connect to database`.

Without an enterprise license, CedarDB still enforces privileges that were granted earlier.

For the full `GRANT` and `REVOKE` syntax, see [Roles](/docs/references/objects/roles).

## PostgreSQL Differences

* CedarDB does not support the `LOCALE`, `LC_COLLATE`, `LC_CTYPE`, `LOCALE_PROVIDER`, `ICU_LOCALE`, `COLLATION_VERSION`, `STRATEGY`, `OID`, `TABLESPACE`, `CONNECTION LIMIT`, `IS_TEMPLATE`, and `ALLOW_CONNECTIONS` options of `CREATE DATABASE`.
  Use the [`COLLATE`](/docs/references/datatypes/text/#unicode-collation-support) specifier for per-column collations.
* `TEMPLATE` only accepts `template0`, `template1`, and `DEFAULT`. CedarDB has no template databases, and new databases are always empty. Other template names fail with `database templates not supported`.
* `ENCODING` rejects encodings other than UTF-8, such as `LATIN1`.
* `ALTER DATABASE` does not support `SET TABLESPACE`, `SET <parameter> FROM CURRENT`, `REFRESH COLLATION VERSION`, or the `WITH` options `CONNECTION LIMIT`, `ALLOW_CONNECTIONS`, and `IS_TEMPLATE`.
* Per-role defaults for a single database (`ALTER ROLE ... IN DATABASE ... SET`) are not supported.
* `DROP DATABASE` does not support `WITH (FORCE)`.
* `CREATE DATABASE` and `DROP DATABASE` are allowed inside a transaction block. A `ROLLBACK` undoes them.
* `COMMENT ON DATABASE` is not supported.
