---
title: "Install CedarDB locally"
linkTitle: "Install locally"
weight: 30
---

This tutorial explains how to install and run the native CedarDB binary on your machine.

## Get the binary

CedarDB is distributed as a standalone binary. 
It runs out of the box on any Linux distribution with **glibc >= 2.27** (released in 2018).


To automatically download and decompress the appropriate version, run:
```shell
curl https://get.cedardb.com | bash
```

CedarDB supports two modes of operation:
- **Interactive mode:** A SQL shell for direct, manual interaction with the database.
- **Server mode:** A PostgreSQL-compatible server for external clients.

## Run interactively

Interactive mode launches a REPL-style SQL shell.
You can use it to create, explore, and manipulate a database locally.


### Create a new persistent database
To create and open a persistent database:
```shell
./cedardb --interactive --createdb mydb
```

This creates a new directory `mydb` in your current working directory where CedarDB stores its data files.

You can also specify an absolute or relative path:

```shell
./cedardb --interactive --createdb /opt/dbs/movies
```


{{< callout type="info" >}}
Ensure the database is stored on a reasonably fast SSD for optimal performance.
{{< /callout >}}

### Open an existing database

If the database already exists, you can open it like this:
```shell
./cedardb --interactive mydb
```

{{< callout type="info" >}} 
Using the `--createdb` flag will create the database if it doesn't exist.
If the database already exists, it will open the database instead.

Without the flag, CedarDB will only open an existing database and fail if none is found.
{{< /callout >}}

### Create a temporary in-memory database

To launch an ephemeral, in-memory database:
```shell
./cedardb --interactive
```
This database exists only for the duration of the session and will be discarded upon exit.

### Running SQL in the shell

Once in the SQL shell, you can run standard SQL:
```sql
create table example(i int);
insert into example values (42);
```
The REPL supports:
- Common readline keyboard shortcuts (e.g., CTRL + R to search the history)
- Backslash commands:
```sql
\i schema_definition.sql -- Run commands from a file
\?                       -- View available commands
```

For more details, see the [SQL Reference](/docs/references/sqlreference/).

## Run as Server

While interactive mode is great for development and testing, server mode is recommended for production use.

### Start in Server mode

By default (i.e., if you omit the `--interactive` flag), CedarDB runs in server mode:

```shell
./cedardb --createdb mydb
```

This starts the server and creates the `mydb` database directory if it doesn't already exist.


### Connect via domain socket

Initially, the server only accepts connections via local domain socket from the same OS user:
```shell
psql -h /tmp -U postgres
```

You can then create users and databases:

```sql
create user test superuser with password '1234'; -- Or use fine-grained privileges
create database test;
```

### Enable remote connections

To accept external connections (e.g., over TCP), run:
```shell
./cedardb mydb --address=::
```

Then connect using a PostgreSQL compatible client, e.g.:
```shell
psql -h localhost -U test
psql -h cedardb.example.com -U test
```

### Explore command line options
To see all available flags and options, run:
```shell
./cedardb --help
```

{{< callout type="info" >}}
If you have obtained an enterprise license, refer to the [licensing page](../../licensing) for a step-by-step guide on how to activate it.
{{< /callout >}}
