---
title: "Reference: PostgreSQL Functions"
linkTitle: "PostgreSQL Functions"
---

CedarDB supports a variety of PostgreSQL functions. This page currently only describes a prominent subset of those functions.

## Session information

| Function                                | Returns                                                            |
|-----------------------------------------|--------------------------------------------------------------------|
| `current_database()`, `current_catalog` | The name of the current database.                                  |
| `current_schema()`                      | The first existing schema of the search path.                      |
| `current_schemas(include_implicit)`     | The schemas of the search path, optionally including `pg_catalog`. |
| `current_user`, `current_role`, `user`  | The current role.                                                  |
| `session_user`                          | The role you logged in as.                                         |
| `pg_backend_pid()`                      | The process ID of the current session.                             |
| `pg_my_temp_schema()`                   | The session's temporary schema as `regnamespace`, or `-` if none.  |
| `pg_postmaster_start_time()`            | The time when the server started.                                  |
| `pg_is_in_recovery()`                   | Whether the server is a replica in recovery mode.                  |
| `inet_client_addr()`                    | The client's IP address, or null for Unix socket connections.      |
| `txid_current()`                        | The ID of the current transaction.                                 |
| `version()`                             | The CedarDB version string.                                        |

```sql
SELECT current_database(), current_user, version();
```

## Object size functions

| Function                           | Returns                                                  |
|------------------------------------|----------------------------------------------------------|
| `pg_table_size(regclass)`          | Size of a table in bytes, without indexes.               |
| `pg_indexes_size(regclass)`        | Size of all indexes of a table in bytes.                 |
| `pg_total_relation_size(regclass)` | Size of a table including its indexes in bytes.          |
| `pg_relation_size(regclass)`       | Size of a table in bytes.                                |
| `pg_database_size(name)`           | Size of a database in bytes.                             |
| `pg_size_pretty(bigint)`           | A size in bytes, formatted with a unit, e.g., `3584 kB`. |

```sql
CREATE TABLE trees (id int, species text);
INSERT INTO trees SELECT g, 'Oak' FROM generate_series(1, 100000) g;

SELECT pg_size_pretty(pg_total_relation_size('trees'));
```

```text
 pg_size_pretty 
----------------
 3584 kB
(1 row)
```

Any role can call the size functions, also for tables it cannot read.

## Privilege and visibility functions

`has_table_privilege`, `has_schema_privilege`, `has_database_privilege`, `has_column_privilege`, `has_any_column_privilege`, `has_sequence_privilege`, `has_function_privilege`, `has_type_privilege`, and `pg_has_role` check privileges, e.g., `has_table_privilege('trees', 'SELECT')` for the current role or `has_table_privilege('forester', 'trees', 'SELECT')` for another role; see [Roles](/docs/references/objects/roles#inspecting-privileges).
Any role can call these functions, also to check the privileges of other roles. Privileges granted through membership in a role, including `pg_read_all_data` and `pg_write_all_data`, count. Because CedarDB does not support column privileges, `has_column_privilege` and `has_any_column_privilege` return the table-level result.

`pg_table_is_visible`, `pg_function_is_visible`, and `pg_type_is_visible` check whether an object is visible in the search path.
`row_security_active(table)` returns whether row level security applies to the current role; see [Policies](/docs/references/objects/policies).

## Catalog information functions

| Function                                                                                    | Returns                                                       |
|---------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| `pg_typeof(any)`                                                                            | The data type of a value.                                     |
| `format_type(type_oid, typemod)`                                                            | The SQL name of a data type.                                  |
| `pg_get_viewdef(view)`                                                                      | The query of a view or materialized view.                     |
| `pg_get_functiondef(function)`                                                              | The `CREATE FUNCTION` statement of a function.                |
| `pg_get_function_arguments(function)`, `pg_get_function_result(function)`                   | The argument list and result type of a function.              |
| `pg_get_indexdef(index)`, `pg_get_constraintdef(constraint)`, `pg_get_expr(expr, relation)` | Definitions of indexes, constraints, and default expressions. |
| `pg_get_serial_sequence(table, column)`                                                     | The sequence of a `serial` or identity column.                |
| `pg_get_userbyid(role_oid)`                                                                 | The name of a role.                                           |
| `to_regtype(text)`                                                                          | The OID of a type, or null if it doesn't exist.               |
| `obj_description`, `col_description`, `shobj_description`                                   | Always null, because CedarDB does not support comments.       |

## PostgreSQL Differences

- `pg_reload_conf`, `pg_sleep`, `pg_blocking_pids`, `pg_conf_load_time`, `pg_current_logfile`, `pg_trigger_depth`, `pg_listening_channels`, `pg_notification_queue_usage`, `inet_client_port`, `inet_server_addr`, `inet_server_port`, `pg_current_xact_id`, `pg_column_size`, `pg_tablespace_size`, `pg_size_bytes`, `pg_describe_object`, and `pg_identify_object` are not supported.
- `to_regclass`, `to_regproc`, `to_regnamespace`, and `to_regrole` are not supported. Use casts such as `'trees'::regclass` instead.
- `pg_my_temp_schema()` returns `regnamespace` instead of `oid`. Cast it with `pg_my_temp_schema()::oid` to get the OID; without a temporary schema, the OID is 0.

## Advisory Locks

Like in PostgreSQL, CedarDB advisory locks provide a means for creating _application-defined locks_.  

A common example is their use in database migration tools such as _Flyway_ or _Liquibase_.  
When multiple instances of an application start simultaneously, they might all attempt to apply schema migrations at once.  
To prevent race conditions or conflicting DDL changes, these tools use advisory locks to ensure that only one process runs migrations at a time.  

There are two ways to acquire an advisory lock in CedarDB: _at the session level_ or _at the transaction level_.

- _Session_-level advisory locks are held until explicitly released or the session ends. When a client disconnects, the session is closed and all locks held by it are automatically released.
  They are not subject to transaction semantics—if a transaction that acquired a session-level lock is rolled back, the lock remains held.  
  Likewise, an unlock operation remains effective even if the transaction later fails.  
  A lock can be acquired multiple times by the same session; each acquisition must be matched by a corresponding unlock before the lock is fully released.

- _Transaction_-level advisory locks behave more like regular lock requests:  
  they are automatically released at the end of the transaction, and there is no explicit unlock function.  
  This behavior is often more convenient for short-term usage.

Session-level and transaction-level lock requests for the same advisory lock identifier will block each other as expected.  
If a session already holds a given advisory lock, additional requests by the same session will always succeed—even if other sessions are waiting for the same lock—regardless of whether the existing and new requests are at session or transaction level.

---

### Lock Key

A lock is identified by a _key_. Similar to PostgreSQL, CedarDB supports two distinct key spaces:

- A single 64-bit key (`Bigint`)
- Two 32-bit keys (`Integer, Integer`)

For example:

```sql
pg_advisory_lock(0::Bigint)
pg_advisory_lock(0::Integer, 0::Integer)
```

These two calls refer to different lock namespaces and therefore do not conflict.

---

### Lock Modes

CedarDB supports both _shared_ and _exclusive_ advisory locks. A client cannot atomically change a lock from one mode to another (e.g., shared → exclusive). It must first release the current lock and then reacquire it in the desired mode.
A session or transaction cannot hold the same lock in different modes simultaneously.

---

### Conflict Resolution Strategy: Wait-Die

Each locking function comes in two variants:

- _Non-blocking_: prefixed with `pg_try_advisory_*`, which attempts to acquire the lock immediately and returns a boolean indicating success.
- _Blocking_: prefixed with `pg_advisory_*`, which waits until the lock becomes available.

If waiting would lead to a deadlock, CedarDB automatically aborts the request with the runtime error:

```text
ERROR: deadlock_detected (40P01)
```

Transaction-level locks are automatically released when this occurs, but session-level locks remain held.  
It is the application's responsibility to handle such errors correctly.  
Note that advisory locks can participate in deadlock cycles together with other types of locks, including table locks that are automatically held by transactions under MVCC rules.

---

## SQL Syntax

Below is an exhaustive list of all supported advisory lock functions in CedarDB:

### pg_advisory_lock

Obtains an exclusive session-level advisory lock, waiting if necessary.

```text
pg_advisory_lock (key Bigint) → Void
pg_advisory_lock (key1 Integer, key2 Integer) → Void
```

### pg_advisory_lock_shared

Obtains a shared session-level advisory lock, waiting if necessary.

```text
pg_advisory_lock_shared (key Bigint) → Void
pg_advisory_lock_shared (key1 Integer, key2 Integer) → Void
```

### pg_advisory_unlock

Releases a previously acquired exclusive session-level advisory lock. Returns true if the lock is successfully released. If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server.

```text
pg_advisory_unlock(key Bigint) → Boolean
pg_advisory_unlock(key1 Integer, key2 Integer) → Boolean
```

### pg_advisory_unlock_all

Releases all session-level advisory locks held by the current session. (This function is implicitly invoked at session end, even if the client disconnects ungracefully.)

```text
pg_advisory_unlock_all() → Void
```

### pg_advisory_unlock_shared

Releases a previously acquired shared session-level advisory lock. Returns true if the lock is successfully released. If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server.

```text
pg_advisory_unlock_shared(key Bigint) → Boolean
pg_advisory_unlock_shared(key1 Integer, key2 Integer) → Boolean
```

### pg_advisory_xact_lock

Obtains an exclusive transaction-level advisory lock, waiting if necessary.

```text
pg_advisory_xact_lock(key Bigint) → Void
pg_advisory_xact_lock(key1 Integer, key2 Integer) → Void
```

### pg_advisory_xact_lock_shared

Obtains a shared transaction-level advisory lock, waiting if necessary.

```text
pg_advisory_xact_lock_shared(key Bigint) → Void
pg_advisory_xact_lock_shared(key1 Integer, key2 Integer) → Void
```

### pg_try_advisory_lock

Obtains an exclusive session-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

```text
pg_try_advisory_lock(key Bigint) → Boolean
pg_try_advisory_lock(key1 Integer, key2 Integer) → Boolean
```

### pg_try_advisory_lock_shared

Obtains a shared session-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

```text
pg_try_advisory_lock_shared(key Bigint) → Boolean
pg_try_advisory_lock_shared(key1 Integer, key2 Integer) → Boolean
```

### pg_try_advisory_xact_lock

Obtains an exclusive transaction-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

```text
pg_try_advisory_xact_lock(key Bigint) → Boolean
pg_try_advisory_xact_lock(key1 Integer, key2 Integer) → Boolean
```

### pg_try_advisory_xact_lock_shared

```text
pg_try_advisory_xact_lock_shared(key Bigint) → Boolean
pg_try_advisory_xact_lock_shared(key1 Integer, key2 Integer) → Boolean
```

Obtains a shared transaction-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.
