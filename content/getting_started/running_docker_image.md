---
title: "Tutorial: CedarDB Docker Image"
linkTitle: "Running inside Docker"
next: /cookbook
weight: 30
---

This tutorial explains how to build, run, and configure the CedarDB docker image.


## Quick start

{{< callout type="info" >}}
For the quick start follow the [Quick Start](./quickstart.md) page.
{{< /callout >}}

## Configuration

While the above setup is fine for a quick test, it's probably not the behavior you want long term.
Here's a few ways to customize the CedarDB docker image for your specific use case.

### Make the database persistent

If you want your database to survive beyond the lifetime of your docker container, 
you can mount a directory of the host system for CedarDB to store the database files in:

```shell
mkdir -p /opt/dbs/docker
docker run --rm -p 5432:5432 -v /opt/dbs/docker:/var/lib/cedardb/data -e CEDAR_PASSWORD=test --name cedardb_test cedardb
```
This command tells CedarDB to create a database in `/opt/dbs/docker`.

{{< callout type="info" >}}
The docker image will **never** overwrite an existing database.
If the directory already contains a database, CedarDB will start the existing one instead:

`[INFO] CedarDB Database directory appears to contain a database; Skipping initialization.`

In this case, it expects you to use the credentials of the existing database 
and **will not** use the username or password passed via the environment variable.
{{< /callout >}}


{{< callout type="info" >}}
Please make sure that CedarDB stores its database on a reasonably fast SSD.
{{< /callout >}}

### Using your own credentials
You have three ways to initialize the database with your credentials: Via environment variables, via domain socket, or via secrets files.

#### Via environment variables
```shell
docker run --rm -p 5432:5432 -e CEDAR_USER=test -e CEDAR_PASSWORD=test -e CEDAR_DB=db --name cedardb_test cedardb
```
This command initializes a new superuser with the name `test`, the password `test` and a logical database with named `db`. 

You can then connect as follows:
```shell
psql -h localhost -U test -d db
```

The parameters `CEDAR_USER` and `CEDAR_DB` are optional:
- If `CEDAR_USER` isn't set, the default `postgres` is used instead.
- If `CEDAR_DB` isn't set, the value of `CEDAR_USER` is used instead. 


#### Via domain socket

If you don't want to to specify a password via environment variable (e.g., because you don't want it to appear in your shell history), you can also start the container like this:
```shell
docker run --rm -p 5432:5432 -e CEDAR_DOMAIN_SOCKET_ONLY=yes --name cedardb_test cedardb
```
You can then connect as user `postgres` to the docker-internal domain socket of CedarDB:
```shell
docker exec -it cedardb_test psql -U postgres
```
and then [manually create a user](/docs/references/sqlreference/statements/createrole):
```sql
create user {{username}} superuser;
create database {{username}};
-- Set a password to connect from outside the container
alter user {{username}} with password '1234';
```

#### Via secrets

The CedarDB image also allows you to read the credentials from a file inside the docker container:
```shell
docker run --rm -p 5432:5432 -e CEDAR_USER_FILE=/run/secrets/user_file -e CEDAR_PASSWORD_FILE=/run/secrets/password_file -e CEDAR_DB=/run/secrets/db_file --name cedardb_test cedardb
```
You can manage such files e.g. via [Docker secrets](https://docs.docker.com/engine/swarm/secrets/).

### Preloading data

You may want to pre-populate your database with some data. 
Whenever a CedarDB Docker container initializes a new database, it considers all files in the `/docker-entrypoint-initdb.d/` for preloading.
You can use this to create your own Docker image with your own data that inherits from the CedarDB image.

Let's see it in action!

Create the following three files in a separate directory named `movies`:

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
FROM cedardb
COPY movies.sql foo.sh /docker-entrypoint-initdb.d/
```

Let's build this image:

```shell
docker build -t cedardb-movies movies/
```

Let's run the container:

```shell
docker run --rm -p 5432:5432 -e CEDAR_PASSWORD=test --name cedardb_movies cedardb-movies
```

Finally, we can connect to the database and query it:
```shell
# Connect to CedarDB
psql -h localhost -U postgres
# <Enter test as password>

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