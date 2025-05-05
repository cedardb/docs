---
title: "Run CedarDB with Docker"
linkTitle: "Run with Docker"
---

This tutorial explains how to build, run, and configure the CedarDB docker image.

## Quickstart

Pull the official CedarDB image:

```shell
docker pull cedardb/cedardb
```
Start a container:

```shell
docker run --rm -p 5432:5432 -e CEDAR_PASSWORD=test cedardb/cedardb
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
docker run --rm -p 5432:5432 -v /opt/cedardb:/var/lib/cedardb/data -e CEDAR_PASSWORD=test cedardb/cedardb
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
docker run --rm -p 5432:5432 \
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


#### Domain socket authentication

To avoid passing credentials in the shell  (e.g., because you don't want it to appear in your history), you can run CedarDB in domain socket-only mode:
```shell
docker run --rm -p 5432:5432 \
  -e CEDAR_DOMAIN_SOCKET_ONLY=yes \
  --name cedardb \
  cedardb/cedardb
```

Then connect from the same host using the domain socket:
```shell
docker exec -it cedardb psql -U postgres
```
Once connected, you can [manually create users and databases](/docs/references/sqlreference/statements/createrole):
```sql
create user {{username}} superuser with password '1234';
create database {{username}};
```

#### Docker secrets

CedarDB can also read credentials from files, ideal for secret management:
```shell
docker run --rm -p 5432:5432 \
  -e CEDAR_USER_FILE=/run/secrets/user_file \
  -e CEDAR_PASSWORD_FILE=/run/secrets/password_file \
  -e CEDAR_DB=/run/secrets/db_file cedardb/cedardb
```
You can manage such files using [Docker secrets](https://docs.docker.com/engine/swarm/secrets/).

### Preloading data
CedarDB supports auto-initializing a new database with SQL and shell scripts.
Any file in `/docker-entrypoint-initdb.d/` is executed or sourced during container setup.

#### Example: Build a custom image

Create a `movies/` directory with the following files:

```shell {filename="movies/foo.sh"}
#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$CEDAR_USER" --dbname "$CEDAR_DB" <<-EOSQL
	CREATE TABLE foo(a int);
	INSERT INTO foo VALUES (7);
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

```Dockerfile {filename="movies/Dockerfile"}
FROM cedardb/cedardb
COPY movies.sql foo.sh /docker-entrypoint-initdb.d/
```

Then build and run:

```shell
docker build -t cedardb-movies movies/
docker run --rm -p 5432:5432 -e CEDAR_PASSWORD=test cedardb-movies
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
In addition to plain shell scripts and sql files, the CedarDB docker image also accepts `xz`, `gzip`, or `zstd` compressed sql files.
A file must have one of the following extensions: `.sql`, `.sql.gz`, `sql.xz`, `sql.zst`, or `.sh`.
{{< /callout >}}
