---
title: "Reference: Create Server Statement"
linkTitle: "Create Server"
---

Create server adds a new remote server to the database catalog.
Those servers can then be used for remote tables (see [create table](../createtable)).

The following example defines a server that can later be referenced as `server_name`.

```sql
-- Create a server that stores the location (bucket) and credentials for accessing it
create server server_name foreign data wrapper s3 options (location 's3://bucketname:region', id '<key (AAA...)>', secret '<secret>');
```

## Foreign Data Wrapper

CedarDB currently supports S3 and requires the following options.

## Options

* location: The bucket location of the data, in the form `s3://bucketname:region`.
* id: This is the access key.
* secret: This is the secret that belongs to the access key.

## Creating access keys

For setting up a S3 server CedarDB needs AWS IAM credentials.
Please create an AWS IAM user that is allowed to access the S3 buckets.

For example if you want to create a user for us-east-1 region, you can do the following steps to grant it full access to all S3 buckets.
  1. Goto https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/users
  2. Create a new user and add it to the AmazonS3FullAccess group
  3. Click on the user and go to the security credentials tab
  4. Create a new access key, which looks similar to AKIA5CBDR…, and note down the secret that is shown

## Permissions

To create a server, you need to have superuser or `createdb` permissions.
