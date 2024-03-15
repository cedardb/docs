---
title: "Quick Start"
linkTitle: "Quick Start"
prev: /getting_started
weight: 10
---

Welcome to CedarDB! This quick start guide is designed to get you up and running with CedarDB within minutes.
In this guide, we will cover the essential steps to get CedarDB running on your system and provide some simple examples to demonstrate how to interact with CedarDB.



## Prerequisites



CedarDB currently supports Linux. It can be run standalone without any system setup dependencies.


{{< callout type="info" >}}
We have extensively tested CedarDB on Ubuntu, Debian, and Arch Linux.
As runtime environment, CedarDB only needs a glibc as shipped by Debian
oldstable (glibc 2.31, released early 2020) or newer.
{{< /callout >}}



CedarDB has two main executables that users can use to interact with the database, located in the `bin` directory:
`sql` and `server`.
For this guide, we will use the `sql` executable. 
It provides an interactive shell to directly open a database and query it using SQL.

{{< callout type="info" >}}
If you want to learn how to use CedarDB in a more traditional client/server setup, refer to [CedarDB as Server](../clientserver)
{{< /callout >}}


## Setup

{{% steps %}}

### Create a database directory

CedarDB stores all files of a user's database within a single directory. Create a new one:
```shell
mkdir mydb
```
{{< callout type="info" >}}
CedarDB is optimized for modern storage hardware. To make sure you get CedarDB's full performance, place this directory on a reasonably modern SSD.
{{< /callout >}}

### Initialize the database

Start CedarDB, instructing it to initialize a new database called `test`:
```shell
bin/sql --createdb mydb/test.db
```
You're now in the SQL shell and ready to enter SQL queries and commands!

{{< callout type="info" >}}
If you exit the SQL shell (e.g., via `CTRL-D`) you can reconnect to your database by supplying the database file as argument when restarting the shell: 
`bin/sql mydb/test.db`

{{< /callout >}}

{{% /steps %}}

## Create a table

Let's create a 

```sql
create table example
(
    i int
);
copy example from 'example.csv' delimiter '|' null 'null';
```

## Load some data



## Query your dataset
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

## What's next?