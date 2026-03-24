# Use AWS DMS to replicate data from RDS PostgreSQL to CedarDB

## Overview

* Set up a CedarDB instance in EC2 using whichever approach suits you.  I prefer CloudFormation
templates, for their repeatability.
* When the CedarDB instance is running, note its VPC and deploy the remaining components into that same VPC.
* Deploy an RDS Postgres instance, **or** enable logical replication for your existing instance.
* Create a schema in RDS and load it with some data.
* Verify that schema and data gets replicated from RDS Postgres to CedarDB.

## Deploy your CedarDB instance

Here, I've used two CloudFormation templates:

* [Networking setup](https://cedardb-public.s3.us-east-1.amazonaws.com/aws-ec2-networking.yaml)
* [CedarDB deployment](https://cedardb-public.s3.us-east-1.amazonaws.com/cedardb-x86-existing-vpc-cloudformation.yaml)

Note the following values for the CedarDB instance:

* _Private IPv4 addresses_ and _VPC ID_ values from the EC2 dashboard view for the resulting instance (see below)
* The values shown in the _Outputs_ tab in the CloudFormation UI

![CloudFormation outputs](./img/cloudformation_complete.jpg)

![EC2 instance details](./img/cedardb_ec2_note_vpc_and_private_ip.jpg)

## Create the DMS Replication instance

![Create replication instance step 1](./img/dms_create_replication_instance_1.jpg)

![Create replication instance step 2](./img/dms_create_replication_instance_2.jpg)

Finally, click the "Create replication instance" button. This process will take a while, so you can continue
and check on the replication instance later.

## Configure an RDS parameter group

This **RDS _parameter group_** which will enable logical replication to DMS.

![Create parameter group 1](./img/rds_parameter_group_1.jpg)

![Create parameter group 2](./img/rds_parameter_group_2.jpg)

![Select new parameter group](./img/rds_parameter_group_3.jpg)

![Edit new parameter group](./img/rds_parameter_group_4.jpg)

![Enable logical replication](./img/rds_parameter_group_5.jpg)

## Deploy a new RDS Postgres instance

**If you want to use your existing RDS Postgres instance**, skip this section and head down to
[Configure your existing RDS Postgres instance](#configure-your-existing-rds-postgres-instance).

![Navigate to RDS](./img/rds_create_postgres_0.jpg)

![Click Create](./img/rds_create_postgres_0a.jpg)

![Choose PostgreSQL](./img/rds_create_postgres_1.jpg)

![Version, dev test, single AZ](./img/rds_create_postgres_2.jpg)

![Credentials](./img/rds_create_postgres_3.jpg)

![Instance type and storage](./img/rds_create_postgres_4.jpg)

![Choose VPC, public access](./img/rds_create_postgres_5.jpg)

![Security group](./img/rds_create_postgres_6.jpg)

![More options](./img/rds_create_postgres_7.jpg)

![Apply parameter group](./img/rds_create_postgres_8.jpg)

![Create database](./img/rds_create_postgres_9.jpg)

Now, wait a while for the RDS Postgres instance to come up.

## Configure your existing RDS Postgres instance

![RDS Modify Step 1](./img/rds_modify_1.jpg)

![RDS Modify Step 2](./img/rds_modify_2.jpg)

![RDS Modify Step 3](./img/rds_modify_3.jpg)

![RDS Modify Step 4](./img/rds_modify_4.jpg)

## (optional) Load a data set into the RDS instance

If this is just an exercise or demo, you will need some data to migrate. I
chose [this data
set](https://github.com/neondatabase-labs/postgres-sample-dbs?tab=readme-ov-file#employees-database).

```bash
pg_restore -d postgres://postgres:pr3deb1tAmUSement@rds-pg.cfyqge68kqxu.us-east-1.rds.amazonaws.com/postgres \
  -Fc employees.sql.gz -c -v --no-owner --no-privileges
```

Verify the tables have been created and loaded:

```bash
$ psql "postgres://postgres:pr3deb1tAmUSement@rds-pg.cfyqge68kqxu.us-east-1.rds.amazonaws.com/postgres"
Timing is on.
psql (17.4, server 16.3)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off, ALPN: none)
Type "help" for help.
```
```sql
postgres=> \dn
```
```
        List of schemas
   Name    |       Owner       
-----------+-------------------
 employees | postgres
 public    | pg_database_owner
(2 rows)
```
```sql
postgres=> \dt employees.*
```
```
                 List of relations
  Schema   |        Name         | Type  |  Owner   
-----------+---------------------+-------+----------
 employees | department          | table | postgres
 employees | department_employee | table | postgres
 employees | department_manager  | table | postgres
 employees | employee            | table | postgres
 employees | salary              | table | postgres
 employees | title               | table | postgres
(6 rows)
```
```sql
postgres=> select count(*) from employees.department;
```
```
 count 
-------
     9
(1 row)

Time: 15.528 ms
```
```sql
postgres=> select count(*) from employees.department_employee;
```
```
 count  
--------
 331603
(1 row)

Time: 26.052 ms
```
```sql
postgres=> select count(*) from employees.department_manager;
```
```
 count 
-------
    24
(1 row)

Time: 18.947 ms
```
```sql
postgres=> select count(*) from employees.employee;
```
```
 count  
--------
 300024
(1 row)

Time: 23.509 ms
```sql
postgres=> select count(*) from employees.salary;
```
```
  count  
---------
 2844047
(1 row)

Time: 82.885 ms
```
```sql
postgres=> select count(*) from employees.title;
```
```
 count  
--------
 443308
(1 row)

Time: 27.676 ms
```

## Create the DMS source endpoint

![DMS source step 1](./img/dms_source_db_1.jpg)

![DMS source step 2](./img/dms_source_db_2.jpg)

![DMS source step 3](./img/dms_source_db_3.jpg)

## Create the DMS target endpoint

![DMS target step 1](./img/dms_target_db_1.jpg)

![DMS target step 2](./img/dms_target_db_2.jpg)

![DMS target step 3](./img/dms_target_db_3.jpg)

![DMS endpoints created](./img/dms_endpoints_created.jpg)

## Create the DMS migration task

![Create task step 1](./img/dms_create_migration_task.jpg)

![Create task step 2](./img/dms_create_migration_task_2.jpg)

![Create task step 3](./img/dms_create_migration_task_3.jpg)

![Create task step 4](./img/dms_create_migration_task_4.jpg)

![Create task step 5](./img/dms_create_migration_task_5.jpg)

## Monitor DMS migration

![Migration started](./img/dms_task_started.jpg)

![Migration finished](./img/dms_task_finished.jpg)

![Migration summary](./img/dms_task_summary.jpg)

## Verify tables and row counts on the CedarDB target

```bash
$ psql "postgresql://postgres:pr3deb1tAmUSement@ec2-100-26-195-182.compute-1.amazonaws.com:5432/postgres"
Timing is on.
psql (17.4, server 16.3 cedar v2025-06-20)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off, ALPN: none)
Type "help" for help.
```
```sql
postgres=# \dn
```
```
   List of schemas
   Name    |  Owner   
-----------+----------
 employees | postgres
 public    | postgres
(2 rows)
```

```sql
postgres=# \dt employees.*
```
```
                 List of relations
  Schema   |        Name         | Type  |  Owner   
-----------+---------------------+-------+----------
 employees | department          | table | postgres
 employees | department_employee | table | postgres
 employees | department_manager  | table | postgres
 employees | employee            | table | postgres
 employees | salary              | table | postgres
 employees | title               | table | postgres
(6 rows)
```

```sql
postgres=# select count(*) from employees.department;
```
```
 count 
-------
     9
(1 row)

Time: 17.725 ms
```

```sql
postgres=# select count(*) from employees.department_employee;
```
```
 count  
--------
 331603
(1 row)

Time: 15.559 ms
```

```sql
postgres=# select count(*) from employees.department_manager;
```
```
 count 
-------
    24
(1 row)

Time: 14.472 ms
```

```sql
postgres=# select count(*) from employees.employee;
```
```
 count  
--------
 300024
(1 row)

Time: 21.151 ms
```

```sql
postgres=# select count(*) from employees.salary;
```
```
  count  
---------
 2844047
(1 row)

Time: 15.671 ms
```

```sql
postgres=# select count(*) from employees.title;
```
```
 count  
--------
 443308
(1 row)

Time: 18.557 ms
```

If you intend to follow the next procedure, keep that CedarDB client connection open;
otherwise, you can close it.

## Verify that an UPDATE on the RDS Postgres instance is replicated to the CedarDB target

### Log into the RDS Postgres instance.

```bash
$ psql "postgresql://postgres:g3n0A3aRApaimA@rds-pg.ctkkwgwc2jnl.us-east-2.rds.amazonaws.com:5432/postgres?sslmode=require"
Timing is on.
psql (18.1, server 17.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off, ALPN: postgresql)
Type "help" for help.

postgres=>
```

### Using the employees.salary table, validate the initial state agrees both here on the source and on the CedarDB target.

On the RDS Postgres instance:

```sql
postgres=> select * from employees.salary where employee_id = 10004 order by from_date, to_date;
```
```
 employee_id | amount | from_date  |  to_date
-------------+--------+------------+------------
       10004 |  40054 | 1986-12-01 | 1987-12-01
       10004 |  42283 | 1987-12-01 | 1988-11-30
       10004 |  42542 | 1988-11-30 | 1989-11-30
       10004 |  46065 | 1989-11-30 | 1990-11-30
       10004 |  48271 | 1990-11-30 | 1991-11-30
       10004 |  50594 | 1991-11-30 | 1992-11-29
       10004 |  52119 | 1992-11-29 | 1993-11-29
       10004 |  54693 | 1993-11-29 | 1994-11-29
       10004 |  58326 | 1994-11-29 | 1995-11-29
       10004 |  60770 | 1995-11-29 | 1996-11-28
       10004 |  62566 | 1996-11-28 | 1997-11-28
       10004 |  64340 | 1997-11-28 | 1998-11-28
       10004 |  67096 | 1998-11-28 | 1999-11-28
       10004 |  69722 | 1999-11-28 | 2000-11-27
       10004 |  70698 | 2000-11-27 | 2001-11-27
       10004 |  74057 | 2001-11-27 | 9999-01-01
(16 rows)

Time: 33.390 ms
```

On the CedarDB instance:

```sql
postgres=# select * from employees.salary where employee_id = 10004 order by from_date, to_date;
```
```
 employee_id | amount | from_date  |  to_date
-------------+--------+------------+------------
       10004 |  40054 | 1986-12-01 | 1987-12-01
       10004 |  42283 | 1987-12-01 | 1988-11-30
       10004 |  42542 | 1988-11-30 | 1989-11-30
       10004 |  46065 | 1989-11-30 | 1990-11-30
       10004 |  48271 | 1990-11-30 | 1991-11-30
       10004 |  50594 | 1991-11-30 | 1992-11-29
       10004 |  52119 | 1992-11-29 | 1993-11-29
       10004 |  54693 | 1993-11-29 | 1994-11-29
       10004 |  58326 | 1994-11-29 | 1995-11-29
       10004 |  60770 | 1995-11-29 | 1996-11-28
       10004 |  62566 | 1996-11-28 | 1997-11-28
       10004 |  64340 | 1997-11-28 | 1998-11-28
       10004 |  67096 | 1998-11-28 | 1999-11-28
       10004 |  69722 | 1999-11-28 | 2000-11-27
       10004 |  70698 | 2000-11-27 | 2001-11-27
       10004 |  74057 | 2001-11-27 | 9999-01-01
(16 rows)

Time: 31.985 ms
```

### On the RDS Postgres instance, give the employee with ID 10004 a raise.

```sql
postgres=> begin;
BEGIN
Time: 28.403 ms
postgres=*> update employees.salary set to_date = now()::date where employee_id = 10004 and to_date = '9999-01-01'::date;
UPDATE 1
Time: 29.223 ms
postgres=*> insert into employees.salary (employee_id, amount, from_date, to_date) values (10004, 74057 + 5000, now()::date, '9999-01-01'::date);
INSERT 0 1
Time: 28.012 ms
postgres=*> commit;
COMMIT
Time: 113.268 ms
```

Verify that raise:

```sql
postgres=> select * from employees.salary where employee_id = 10004 and amount >= 74057 order by from_date;
```
```
 employee_id | amount | from_date  |  to_date
-------------+--------+------------+------------
       10004 |  74057 | 2001-11-27 | 2026-03-23
       10004 |  79057 | 2026-03-23 | 9999-01-01
(2 rows)

Time: 34.304 ms
```

### Back on the CedarDB instance, verify that transaction was replicated

```sql
postgres=# select * from employees.salary where employee_id = 10004 and amount >= 74057 order by from_date;
```
```
 employee_id | amount | from_date  |  to_date
-------------+--------+------------+------------
       10004 |  74057 | 2001-11-27 | 2026-03-23
       10004 |  79057 | 2026-03-23 | 9999-01-01
(2 rows)

Time: 26.653 ms
```

