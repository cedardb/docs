---
title: "Run CedarDB with Docker"
linkTitle: "Run with Docker"
weight: 20
---

This tutorial explains how to build, run, and configure the CedarDB docker image.

## Quickstart

Pull the official CedarDB image:

```shell
docker pull cedardb/cedardb
```

{{< callout type="info" >}}
By using CedarDB, you agree to our [Terms and Conditions]({{< relref "/licensing.md" >}}).
{{< /callout >}}

Start a container:

```shell
docker run -p 127.0.0.1:5432:5432 -e CEDAR_PASSWORD=test cedardb/cedardb
```

Connect using a PostgreSQL client:

```shell
PGPASSWORD=test psql -h localhost -U postgres

postgres= SELECT 1 as foo;
 foo
-----
   1
(1 row)
```

## Configuration

The above setup is perfrect for quick testing, but you'll likely want more control.
Here are a few ways to configure CedarDB in Docker.

### Make the database persistent

To retain your database across container restarts, mount a host directory to store the database files in:

```shell
mkdir -p /opt/cedardb
docker run --rm -p 127.0.0.1:5432:5432 -v /opt/cedardb:/var/lib/cedardb/data -e CEDAR_PASSWORD=test cedardb/cedardb
```

This stores the database in `/opt/cedardb` on your host.

{{< callout type="info" >}}
The docker image will **never** overwrite an existing database.
If the directory already contains a database, CedarDB will connect to it:

`[INFO] CedarDB Database directory appears to contain a database; Skipping initialization.`

In this case, CedarDB ignores the `CEDAR_USER` and `CEDAR_PASSWORD` environment variables and expect
the existing credentials to be used.
{{< /callout >}}

{{< callout type="info" >}}
Ensure the mounted database directory resides on a reasonably fast SSD for best performance.
{{< /callout >}}

### Custom credentials

You can configure the initial user and database using environment variables, domain sockets, or secrets.

#### Environment variables

```shell
docker run -p 127.0.0.1:5432:5432 \
  -e CEDAR_USER=test \
  -e CEDAR_PASSWORD=test \
  -e CEDAR_DB=db \
  cedardb/cedardb
```

This command creates a superuser `test` with password `test` and a a database named `db`.

Connect like this:

```shell
psql -h localhost -U test -d db
```

The parameters `CEDAR_USER` and `CEDAR_DB` are optional:

- If `CEDAR_USER` is not set, it defaults to `postgres`.
- If `CEDAR_DB` is not set, it defaults to the value of `CEDAR_USER`.

#### Docker secrets

CedarDB can also read credentials from files, ideal for secret management:

```shell
docker run -p 127.0.0.1:5432:5432 \
  -e CEDAR_USER_FILE=/run/secrets/user_file \
  -e CEDAR_PASSWORD_FILE=/run/secrets/password_file \
  -e CEDAR_DB=/run/secrets/db_file cedardb/cedardb
```

You can manage such files using [Docker secrets](https://docs.docker.com/engine/swarm/secrets/).

### Initialization scripts

CedarDB supports auto-initializing a new database with SQL and shell scripts. Additionally, the docker image accepts `xz` or `gzip` compressed SQL files.
Files in `/docker-entrypoint-initdb.d/` are executed or sourced during container setup. Supported file extensions are `.sh`, `.sql`, `.sql.xz` and `sql.gz`.

`.sh` files can use the `process_sql` function to run modified SQL statements that need shell pre-processing, e.g. by expanding shell or env variables.

#### Example: Creating an additional user at DB initialization

Initialization files let you create additional [users and databases](/docs/references/sqlreference/statements/createrole) during first-time setup. Provide usernames and passwords via environment variables or Docker secrets.

```shell {filename="users/create-user.sh"}
#!/bin/bash
set -e

process_sql <<-EOSQL
  create role ${NEW_USER} login with password '${NEW_USER_PWD}';
  create database ${NEW_USER};
EOSQL
```

Then run:

```shell
docker run -v ./users/:/docker-entrypoint-initdb.d/ \
  -p 127.0.0.1:5432:5432 -e CEDAR_PASSWORD=test \
  -e NEW_USER=nonroot -e NEW_USER_PWD=1234 \
  cedardb/cedardb
```

Connect with the new user:

```shell
# Connect to CedarDB
psql -h localhost -U nonroot -d nonroot
# Enter '1234' as password
```

#### Example: Preloading data with .sh and .sql files

Create a `movies/` directory with the following files:

```shell {filename="movies/foo.sh"}
#!/bin/bash
set -e
TABLE_NAME=foo
VALUE=7

process_sql <<-EOSQL
  CREATE TABLE ${TABLE_NAME}(a int);
  INSERT INTO ${TABLE_NAME} VALUES (${VALUE});
EOSQL
```

```sql {filename="movies/movies.sql"}
create table movies (
    id integer primary key,
    title text,
    year integer,
    length integer,
    genre text
);

insert into movies values
(1, 'Oppenheimer', 2023, 180, 'Biopic'),
(2, 'Everything Everywhere All at Once', 2022, 139, 'Science Fiction'),
(3, 'Das Boot', 1981, 149, 'Drama');
```

Then run:

```shell
docker run -v ./movies/:/docker-entrypoint-initdb.d/ \
  -p 127.0.0.1:5432:5432 -e CEDAR_PASSWORD=test \
  cedardb/cedardb
```

Connect and inspect the data:

```shell
# Connect to CedarDB
psql -h localhost -U postgres
# Enter 'test' as password

postgres= \d
         List of relations
 Schema |  Name  | Type  |  Owner
--------+--------+-------+----------
 public | foo    | table | postgres
 public | movies | table | postgres
(2 rows)


postgres= select * from movies;
 id |               title               | year | length |      genre
----+-----------------------------------+------+--------+-----------------
  1 | Oppenheimer                       | 2023 |    180 | Biopic
  2 | Everything Everywhere All at Once | 2022 |    139 | Science Fiction
  3 | Das Boot                          | 1981 |    149 | Drama
(3 rows)

postgres= select * from foo;
 a
---
 7
(1 row)

```

{{< callout type="info" >}}
If you have obtained an enterprise license, refer to the [licensing page](../../licensing) for a step-by-step guide on how to activate it.
{{< /callout >}}
