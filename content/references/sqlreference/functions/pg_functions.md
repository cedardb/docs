---
title: "Reference: PostgreSQL Administration Functions"
linkTitle: "PostgreSQL Administration Functions"
---

CedarDB supports a variety of PostgreSQL administration functions. This page currently only describes a prominent subset of those functions.

## Advisory Locks

Similar to [PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS), CedarDB advisory locks provide a means for creating _application-defined locks_.  

A common example is their use in database migration tools such as *Flyway* or *Liquibase*.  
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

```
ERROR: deadlock_detected (40P01)
```

Transaction-level locks are automatically released when this occurs, but session-level locks remain held.  
It is the application’s responsibility to handle such errors correctly.  
Note that advisory locks can participate in deadlock cycles together with other types of locks, including table locks that are automatically held by transactions under MVCC rules.

---

## SQL Syntax

Below is an exhaustive list of all supported advisory lock functions in CedarDB:

#### pg_advisory_lock

Obtains an exclusive session-level advisory lock, waiting if necessary.

```
pg_advisory_lock (key Bigint) → Void
pg_advisory_lock (key1 Integer, key2 Integer) → Void
```

#### pg_advisory_lock_shared
Obtains a shared session-level advisory lock, waiting if necessary.
```
pg_advisory_lock_shared (key Bigint) → Void
pg_advisory_lock_shared (key1 Integer, key2 Integer) → Void
```


#### pg_advisory_unlock
Releases a previously acquired exclusive session-level advisory lock. Returns true if the lock is successfully released. If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server.
```
pg_advisory_unlock(key Bigint) → Boolean
pg_advisory_unlock(key1 Integer, key2 Integer) → Boolean
```

#### pg_advisory_unlock_all
Releases all session-level advisory locks held by the current session. (This function is implicitly invoked at session end, even if the client disconnects ungracefully.)
```
pg_advisory_unlock_all() → Void
```

#### pg_advisory_unlock_shared
Releases a previously acquired shared session-level advisory lock. Returns true if the lock is successfully released. If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server.
```
pg_advisory_unlock_shared(key Bigint) → Boolean
pg_advisory_unlock_shared(key1 Integer, key2 Integer) → Boolean
```

#### pg_advisory_xact_lock
Obtains an exclusive transaction-level advisory lock, waiting if necessary.
```
pg_advisory_xact_lock(key Bigint) → Void
pg_advisory_xact_lock(key1 Integer, key2 Integer) → Void
```


#### pg_advisory_xact_lock_shared
Obtains a shared transaction-level advisory lock, waiting if necessary.
```
pg_advisory_xact_lock_shared(key Bigint) → Void
pg_advisory_xact_lock_shared(key1 Integer, key2 Integer) → Void
```

#### pg_try_advisory_lock
Obtains an exclusive session-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.
```
pg_try_advisory_lock(key Bigint) → Boolean
pg_try_advisory_lock(key1 Integer, key2 Integer) → Boolean
```


#### pg_try_advisory_lock_shared
Obtains a shared session-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.
```
pg_try_advisory_lock_shared(key Bigint) → Boolean
pg_try_advisory_lock_shared(key1 Integer, key2 Integer) → Boolean
```


#### pg_try_advisory_lock_shared
Obtains an exclusive transaction-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

```
pg_try_advisory_xact_lock(key Bigint) → Boolean
pg_try_advisory_xact_lock(key1 Integer, key2 Integer) → Boolean
```

#### pg_try_advisory_xact_lock_shared
```
pg_try_advisory_xact_lock_shared(key Bigint) → Boolean
pg_try_advisory_xact_lock_shared(key1 Integer, key2 Integer) → Boolean
```
Obtains a shared transaction-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.