---
title: "Reference: Create Server Statement"
linkTitle: "Create Server"
---

Create server adds a new remote server to the database catalog.
Those servers can then be used for remote tables (see [create table](/docs/references/objects/tables)).

{{< callout type="info" >}}
`CREATE SERVER` requires an enterprise license.
{{< /callout >}}

The following example defines a server that can later be referenced as `server_name`.

```sql
-- Create a server that stores the location (bucket) and credentials for accessing it
create server server_name foreign data wrapper s3 options (location 's3://bucketname:region', id '<key (AAA...)>', secret '<secret>');
```

## Foreign Data Wrapper

CedarDB currently supports S3 and S3-compatible object storage (e.g., MinIO, Ceph, or other self-hosted storage), and requires the following options.

## Options

* location: The bucket location of the data, in the form `s3://bucketname:region` for AWS S3, or `minio://host:port/bucketname:region` for S3-compatible storage.
* id: This is the access key.
* secret: This is the secret that belongs to the access key.

## S3-compatible storage

To use a self-hosted, S3-compatible storage such as MinIO or Ceph, use the `minio://` prefix and add the endpoint (host and port) in front of the bucket.
The region has to match the region configured on your storage server.
CedarDB connects to such endpoints via plain HTTP.

```sql
create server server_name foreign data wrapper s3 options (location 'minio://127.0.0.1:9000/bucketname:local', id '<access key>', secret '<secret key>');
```

## Creating access keys

For setting up a S3 server CedarDB needs AWS IAM credentials.
Please create an AWS IAM user that is allowed to access the S3 buckets.

For example if you want to create a user for us-east-1 region, you can do the following steps to grant it full access to all S3 buckets.

  1. Goto <https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/users>
  2. Create a new user and add it to the AmazonS3FullAccess group
  3. Click on the user and go to the security credentials tab
  4. Create a new access key, which looks similar to AKIA5CBDR…, and note down the secret that is shown

## Managing servers

`CREATE SERVER IF NOT EXISTS` skips the statement if a server with that name exists.
Without `IF NOT EXISTS`, a duplicate name raises `ERROR: remote storage already exists`.

The `pg_foreign_server` system table lists all servers. CedarDB masks the secret:

```sql
create server tree_archive foreign data wrapper s3 options (location 's3://tree-archive:eu-central-1', id 'AKIAEXAMPLE', secret 'example-secret');
select srvname, srvowner::regrole, srvoptions from pg_foreign_server;
```

```text
   srvname    | srvowner |                             srvoptions
--------------+----------+---------------------------------------------------------------------
 tree_archive | postgres | {location=s3://tree-archive:eu-central-1,id=AKIAEXAMPLE,secret=***}
(1 row)
```

You can change the owner of a server and drop it:

```sql
-- Assumes a role named forester exists
alter server tree_archive owner to forester;
drop server tree_archive;
```

`DROP SERVER` supports `IF EXISTS` and `CASCADE`.
Without `CASCADE`, dropping a server that tables still use fails with `cannot drop remoteserver ... because other objects depend on it`.
With `CASCADE`, CedarDB also drops these tables, like a regular `DROP TABLE`.

## Permissions

Only superusers can create servers.
Other roles, including roles with the `CREATEDB` attribute, get `ERROR: permission denied for non-superuser '<role>'`.

The owner of a server can drop it and grant the `USAGE` privilege on it:

```sql
grant usage on foreign server tree_archive to forester;
grant usage on foreign server tree_archive to forester with grant option;
revoke usage on foreign server tree_archive from forester cascade;
```

CedarDB records the privileges and their grantor in `pg_foreign_server.srvacl`.
A role without the grant option gets `ERROR: permission denied for remoteserver '<server>'` when it tries to grant `USAGE`.

To create a table on a server, you need the `USAGE` privilege on it, directly or through a role you are a member of.
The owner of the server has it by default, and superusers bypass the check.
Other roles get `ERROR: permission denied for remoteserver '<server>'`.
`USAGE` is only checked when you create a table: revoking it does not affect existing tables on the server.

## PostgreSQL Differences

* Only the foreign data wrappers `s3` and `gs` (see [Tables on Google Cloud Storage](../gs)) exist. `CREATE FOREIGN DATA WRAPPER` raises `CREATE FDW not implemented yet`.
* `ALTER SERVER ... OPTIONS` raises `ALTER SERVER not implemented yet`. To change the options, drop and re-create the server.
* `CREATE SERVER` requires superuser rights. PostgreSQL requires `USAGE` on the foreign data wrapper.
