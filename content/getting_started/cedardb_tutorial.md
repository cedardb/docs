---
title: "Tutorial: Creating a Standalone CedarDB"
linkTitle: "CedarDB Tutorial"
prev: /getting_started
weight: 10
---

## Installation

CedarDB can be run standalone without any system setup dependencies.
To run CedarDB, download and extract the archive, then you can execute the
binaries located in the `bin` directory.
The archive also contains all shared libraries in the `lib` directory, where
the linker can find them during startup.

CedarDB currently only supports linux.
As runtime environment, CedarDB only needs a glibc as shipped by debian
oldstable (glibc 2.31, released early 2020) or newer.

## Setup

CedarDB has two main binaries that users can use to interact with the database:
`sql` and `server`.

### `sql`

This tool provides a interactive shell to directly open a database and query
it using SQL.

```shell
# Create a new database in a subdirectory
mkdir mydb
bin/sql --createdb mydb/test.db
# For a list of options see:
bin/sql --help
```

In the shell you can directly enter SQL queries and commands.
To load a table into the database, you can use the copy command:

```sql
create table example
(
    i int
);
copy example from 'example.csv' delimiter '|' null 'null';
```

For an in-depth reference of the syntax, you can refer to the
[PostgreSQL documentation](https://www.postgresql.org/docs/current/sql-copy.html).

The REPL supports the common readline keyboard shortcuts, e.g., CTRL + R to
search the history.
It also supports backslash commands, e.g., to execute commands from a file:

```sql
\i
schema_definition.sql
-- For a list of options see:
\?
```

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

