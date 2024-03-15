---
title: "Tutorial: CedarDB as Postgres Read-Replica"
linkTitle: "Setting Up Read Replication"
weight: 30
---
# WIP!!

## Setup
Before replicating to CedarDB, you have to make a few configurations to your PostgreSQL replication source.

### Set the publisher's log level
The replication source must use *logical* write ahead logging.
Enable this by setting `wal_level = logical` in the `WRITE-AHEAD LOG` section of your `postgresql.conf`. This change requires a restart.


### Enable md5 password encryption
Ensure that your replication source uses the legacy **md5** authentification mode.
This can be easily checked by running the query 
```sql
SHOW password_encryption;
```
as the user you intend to use for replication. If the result is `md5` you do not need to do anything. Otherwise, change the password of your use to use md5 encryption like this:
```sql
SET password_encryption  = 'md5';
ALTER USER <your_username> with password <your_new_password>;
SET password_encryption = 'scram-sha-256'; -- or whatever else it was before
```
Finally, allow your user to authentificate from outside via `md5` by adding a line to your `pg_hba.conf`, e.g. like this:

```
# TYPE  DATABASE      USER               ADDRESS                 METHOD
host    replication   <your_username>    <cedardb_address>       md5
```

{{< callout type="warning" >}}
Support for SASL authentification will come in a future CedarDB release.
{{< /callout >}}


### Ensure correct privileges are set
The replication user needs some privileges. You can find an overview in the official [PostgreSQL documentation](https://www.postgresql.org/docs/current/logical-replication-security.html).

## Set up publication at the replication source
Next, we ensure the source PostgreSQL is correctly configured to publish changes to CedarDB.

### Create the tables you want to replicate
If not already existing, create the table(s) you want to replicate *from* in your PostgreSQL system like this:

```sql
create table foo(a integer, b integer);
``` 

### Create a publication
For each table you want to replicate, you need to create a *Publication*:
```sql
create publication foo;
```

{{< callout type="info" >}}
The publication interface allows for a rich set of customization on what to replicate, e.g., row filters, parts of tables, or only specific operations. Take a look at the [official documentation](https://www.postgresql.org/docs/current/sql-createpublication.html)!
{{< /callout >}}

### Create a replication slot
PostgreSQL needs to create a *replication slot* to store the state of the replication to CedarDB. We need to create this slot.

```sql
select * from  pg_create_logical_replication_slot ('foo_slot', 'pgoutput');
```

{{< callout type="warning" >}}
PostgreSQL's `subscription` abstraction normally deals with replication slots. This abstraction is not yet supported by CedarDB. A future version of CedarDB will make manually dealing with replication slots obsolete.
{{< /callout >}}



## Create your replication target
Within CedarDB create mirroring tables:

```sql
create table foo(a integer, b integer);
```