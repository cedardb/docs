---
title: "psql Terminal Client"
linkTitle: "psql"
weight: 100
---

[psql](https://www.postgresql.org/docs/current/app-psql.html) is a terminal based interactive client for your database,
developed for PostgreSQL.
Connecting with psql to CedarDB gives you an interactive SQL shell for your database.
It is also useful for scripting your favorite system shell like bash, and can read in `.sql` files with commands.

## Connecting

To start, connect psql with CedarDB with your connection parameters:

```shell
psql -h localhost -d $DBNAME -U $USERNAME
```

```
psql (16.3 (Ubuntu 16.3-0ubuntu0.24.04.1))
Type "help" for help.

example=# 
```

When connecting, psql will prompt for a password.
For scripting, you can also set up a [`.pgpass`](https://www.postgresql.org/docs/current/libpq-pgpass.html) file, in
which you can store a password for each database connection.

Afterward, you have an open connection to your database, where you can enter any SQL.

## Creating a database

psql is a handy too for one-time setup tasks like to create your database, set up user accounts, and to create schemas.
See [here](/docs/get_started/quickstart).
Nevertheless, we recommend to keep such configuration in a separate `.sql` file in your version control system.
In interactive mode, you can execute all SQL commands from such a file with the `\i` command:

```sql
\i schema.sql
```

Alternatively, you can also use shell redirection for more complex scripts.

```shell
# Execute all commands from schema.sql
psql -h localhost -d $DBNAME -U $USERNAME < schema.sql
# Execute commands from the output of another command
echo "create table example1(i int);" | psql -h localhost -d $DBNAME -U $USERNAME
# Execute commands from am inline heredoc
psql -h localhost -d $DBNAME -U $USERNAME <<EOF
create table example2(i int);
EOF
```

psql is also a good tool to copy data [from CSV](/docs/cookbook/working_with_csv), or
from [PostgreSQL dumps](/docs/cookbook/importing_from_postgresql).

## Inspecting a database

When connecting to a database, psql has functionality to inspect the current database state from system tables.
You can show a list of all databases within the current system:

```sql
\l
```

```
                                                List of databases
   Name   |  Owner   | Encoding | Locale Provider | Collate | Ctype | ICU Locale | ICU Rules | Access privileges 
----------+----------+----------+-----------------+---------+-------+------------+-----------+-------------------
 example  | postgres | UTF8     | libc            |         |       |            |           | 
 postgres | postgres | UTF8     | libc            |         |       |            |           | 
(2 rows)
```

You can also show a list of all tables in the current database:

```sql
\d
```

```
          List of relations
 Schema |   Name   | Type  |  Owner   
--------+----------+-------+----------
 public | example1 | table | postgres
 public | example2 | table | postgres
(2 rows)
```

Most commands also have a more verbose variant with a `+` (e.g., `\d+`), which will show more details like the table
size in bytes.
For a full list of psql backslash commands, see the
[psql docs]((https://www.postgresql.org/docs/current/app-psql.html)).

## Using psql interactively

Similar to bash, psql has tab completion, where some SQL commands and table names can be autocompleted.
E.g., you can enter:

```sql
select * from exa<tab><tab>
```

And psql will list all tables starting with "exa".

psql also uses [readline](https://en.wikipedia.org/wiki/GNU_Readline) for some convenient editing features.
Withing the psql shell, you can use emacs-like keyboard shortcuts for navigation and editing.
E.g., try using `ctrl` + `r` to search your recently used psql commands:

```sql
(reverse-i-search)`exam': select * from example;
```

To end your psql session, you can either use:

```sql
\q
```

Or you can use the `ctrl` + `d` keyboard shortcut.
