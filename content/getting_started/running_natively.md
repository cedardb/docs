---
title: "Tutorial: Native CedarDB"
linkTitle: "Running native CedarDB"
weight: 40
---

This tutorial explains how to run the native CedarDB binary.

CedarDB supports two modes of operation: [`server`](#server) and [`interactive`](#interactive).

## Get the binary

{{% waitlist %}}


## Interactive

Interactive mode launches a SQL shell to work directly with a database.

To create a new database and open it:
```shell
./cedardb --interactive --createdb mydb
```

If you've already created the database before:
```shell
./cedardb --interactive mydb
```
To create a temporary in-memory database:
```shell
./cedardb --interactive
```
This launches an ephemeral database that disappears once CedarDB exits.


In the shell, you can run SQL directly:
```sql
create table example(i int);
insert into example values (42);
```

For full syntax details, see the [SQL Reference](/docs/references/sqlreference/).

The REPL supports the common readline keyboard shortcuts (e.g., CTRL + R to
search the history) and backslash commands:
```sql
\i schema_definition.sql -- Run commands from a file
\?                       -- View available commands
```

## Server

Interactive mode is great for testing, but for longer-term use, you'll want to run CedarDB as a PostgreSQL-compatible server.

By default (without the --interactive flag), CedarDB starts in server mode, allowing external connections.


{{< callout type="info" >}} 
As with any server process, be mindful of system access and user permissions.
{{< /callout >}}

After the initial startup, the CedarDB server does not allow arbitrary
connections.

To start the server (assuming a database already exists):
```shell
./cedardb mydb
```

If the database doesn't exist yet:
```shell
./cedardb -createdb mydb
```

Initially, the server only accepts connections via local domain socket from the same OS user:
```shell
psql -h /tmp -U postgres
```

Then, you can manage DB users via SQL:

```sql
create user test superuser with password '1234'; -- Or use fine-grained privileges
create database test;
```


To accept external connections, run:
```shell
./cedardb mydb/test.db --address=::
```

Then connect locally or remotely:
```shell
psql -h localhost -U test
psql -h cedardb.example.com -U test
```

For an overview of further options, run
```shell
./cedardb --help
```
