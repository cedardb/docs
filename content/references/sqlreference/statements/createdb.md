---
title: "Reference: Create Database Statement"
linkTitle: "Create Database"
---

Create database allows creating a new *logical* database.
Multiple databases can be used for logical separation of data.
When connection to CedarDB, you need to specify the database that you want to connect to.
All queries that execute in this connection can only read and write data in this database.

Usage example:

```sql
create database newdb owner postgres;
```

Afterward, you can connect to the freshly created database:

```shell
psql -h localhost -U postgres -d newdb
```

## Permissions

To create a database, you need to have superuser or `createdb` permissions.
