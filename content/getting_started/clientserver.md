---
title: "CedarDB as Server"
linkTitle: "CedarDB as Server"
prev: /quickstart
weight: 20
---

This guide will show you how you can launch CedarDB as a server, create users and configure it to accept outside connections.

## Prerequisites

CedarDB currently supports Linux. You can run it standalone without any system setup dependencies.

{{< callout type="info" >}}
We have extensively tested CedarDB on Ubuntu, Debian, and Arch Linux.
As runtime environment, CedarDB only needs a glibc as shipped by Debian
oldstable (glibc 2.31, released early 2020) or newer.
{{< /callout >}}

The CedarDB distribution comes with a binary called `server`, located in the `bin` directory.
This binary launches a server daemon that allows outside connections to the database.

{{< callout type="warning" >}}
As with any server process, you should be mindful how this process can
interact with the rest of the system and which users can use it.
{{< /callout >}}

## Launching the server
{{% steps %}}

### Create a database
The server needs to connect to an existing database. If you have followed the [Quick Start Guide](../quickstart) you did already create a database and can skip this step.

Otherwise, create a new database directory:
```shell
mkdir mydb
```
{{< callout type="info" >}}
CedarDB is optimized for modern storage hardware. To ensure you get CedarDB's best performance, place this directory on a reasonably modern SSD.
{{< /callout >}}

Then start the sql shell, instructing it to initialize a new database (called `test`, for example):
```shell
bin/sql --createdb mydb/test.db
```
finally exit the shell with `CTRL-D`.

### Launch the server process

Run the server interactively:
```shell
bin/server mydb/test.db
```

After this initial startup, the CedarDB server does not allow arbitrary connections.
During this state, you can only connect via a local domain socket as the same OS user that also launched the server process.

### Connect to the server via the `psql` shell
The server speaks the [PostgreSQL wire protocol](https://www.postgresql.org/docs/current/protocol.html) making it compatible with a wide array of PostgreSQL supporting tools, the most important being `psql`, the default terminal-based front-end to PostgreSQL.

{{< callout type="info" >}}
All major Linux distributions provide packages containing `psql`. On Ubuntu, for example, it is provided by the `postgresql-client` package.
{{< /callout >}}

Connect to the server in a separate terminal via a local domain socket as the postgres DB super user:

```shell
psql -h /tmp -U postgres
```

### Create a new user
You probably do not want to execute all your queries as the default superuser, or only connect via domain socket, so create a new user and initialize it from within the `psql` shell:
```sql
-- Create a user that can manage the database
create user test superuser; -- You can also grant rights more fine-grained.
create database test; -- By default the user will use the database with its name, so let's create one.
alter user test with password '1234';
```

{{% /steps %}}



## Connecting to the server

You can now connect to CedarDB with your newly created user over IP:
```shell
psql -h localhost -U test
```

If you want to connect from a different machine, you have to instruct CedarDB to accept non-local connections:

```shell
# '::' specifies all IPv4 and IPv6 connections
bin/server mydb/test.db --address=::
```


Afterward, you can connect remotely:

```shell
psql -h CedarDB.example.com -U test
```

## Manage CedarDB with systemd
You can optionally let systemd automatically launch the CedarDB server whenever a new connection request comes in using its `Socket Activation` feature.

First create the following service and socket file, replacing the path to the CedarDB server binary and database file with your own values.

```shell {filename="cedardb-server.service"}
[Unit]
Description=CedarDB server
After=network.target

[Service]
Type=simple
Environment=COMPILATIONMODE=a
ExecStart=path/to/bin/server -verbose path/to/your/db/dbname.db
```

```shell {filename="cedardb-server.socket"}
[Unit]
Description=Socket activation unit for CedarDB server
PartOf=cedardb-server.service

[Socket]
ListenStream=/tmp/.s.PGSQL.5432
ListenStream=127.0.0.1:5432
ListenStream=[::1]:5432
```

You can now use the following script to create an CedarDB service and register it with systemd:


```shell {filename="installServices.sh"}
#!/usr/bin/env bash
set -euo pipefail

SYSTEMD_PATH="${1:-$HOME/.config/systemd/user}"
install <(< cedardb-server.service sed "s:XXX:$PWD:g") "$SYSTEMD_PATH/cedardb-server.service"
install cedardb-server.socket "$SYSTEMD_PATH/cedardb-server.socket"
systemctl --user daemon-reload
```
You have now installed the CedarDB systemd service.
Start socket activation with:
```shell
systemctl --user start cedardb-server.socket"
```
