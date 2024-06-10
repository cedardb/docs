---
title: "Reference: Discard Statement"
linkTitle: "Discard"
weight: 17
---

Discard allows resetting the current database session.

Usage example:

```sql
-- Reset the complete session state, allowing connection re-use
discard all;
```

## Options

* `all`
  Discard all session state. This includes [prepared statements](/docs/references/advanced/prepare),
  [temporary tables](/docs/references/sqlreference/statements/createtable/#options), and
  [session settings](/docs/references/statements/settings).
  After a discard all, the session behaves like a fresh connection.
  This is useful when a connection is shared between multiple client threads that all depend on having a pristine
  connection.
* `plans`
  Discard cached query plans for prepared statements.
  The prepared statements themselves remain valid.
  CedarDB automatically re-plans queries periodically, so you should not need to execute this manually.
* `sequences`
  Discard cached sequence state. This currently has no effect.
* `temp`
  Drop all temporary tables.
