---
title: "CedarDB as Server"
linkTitle: "CedarDB as Server"
prev: /quickstart
weight: 20
---

### `server`

This executes a server daemon that allows outside connections to the database.
As with any server process, you should be mindful how this process can
interact with the rest of the system and which users can use it.

After the initial startup, the CedarDB server does not allow arbitrary
connections.
During this state, you can only connect via a local domain socket as the same
OS user that also runs the server.

```shell
# Run the server interactively:
bin/server mydb/test.db
# Connect in a separate terminal as the postgres DB superuser:
psql -h /tmp -U postgres
```

Now you can manage DB users via SQL:

```sql
-- Create a user that can manage the database
create
user test superuser; -- You can also grant rights more fine-grained.
create
database test;
alter
user test with password '1234';
```

Afterward, you can connect with that DB user via IP:

```shell
# Run the server on one machine:
# '::' specifies all IPv4 and IPv6 connections, if you do not specify this,
# CedarDB only listens on localhost
bin/server mydb/test.db --address=::
# On the same machine, connect via:
psql -h localhost -U test
# But you can also connect over the network
psql -h CedarDB.example.com -U test
```

