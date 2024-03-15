---
title: "Tutorial: Importing Data from PostgreSQL into CedarDB"
linkTitle: "Importing from PostgreSQL"
weight: 30
---

## Import the schema of your data into CedarDB

### Dump the schema from Postgres
Make sure your Postgres instance is running.
Then use the Tool `pg_dump` (probably supplied together with PostgreSQL by your package manager):

```shell
pg_dump --schema-only postgres > schema.sql
```

NB: postgres is the default database into which new tables are inserted. Replace with other database in above command if applicable.

### Adapt the dumped schema
CedarDB does not support some settings PostgreSQL tries to set. Remove them from the schema dump for now by running the following three `sed` commands:
```shell
sed -i.bak 's/^SET.*$//g' schema.sql
sed -i.bak 's/.*set_config.*//g' schema.sql
sed -i.bak 's/^ALTER TABLE .* OWNER TO .*//g' schema.sql
```
### Remove unsupported data types
CedarDB doesn't support some data types yet, especially no auto generated series. For now remove them, by manually editing schema.sql.

For example, the statement

```sql
create table x(id integer generated always as identity);
```

generates the following lines in the dump file:
```sql
CREATE TABLE public.x (
    id integer NOT NULL
);

--
-- Name: x_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.x ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.x_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
```
In this case, remove the alter table statement.

**We're more than happy to help you adapt your exported schema, should you run into issues!**

## Dump the data out of PostgreSQL into CSV files
Connect with PostgreSQL via `psql`.

Execute the following statement against Postgres for each table you want to export to CedarDB
```sql
\copy {tablename} TO 'your/path/{tablename}.csv' DELIMITER '|' CSV NULL '';
```

## Import data from your freshly dumped files into CedarDB

Now make sure that CedarDB is running. Either let it run in parallel to Postgres and use a different port, or shut down Postgres and then start CedarDB. 
For the following commands, we assume CedarDB listens at port 5432. If you're using another port, please change the commands accordingly (via the argument ` -p {Portnumber}`). 

Import the schema you've exported from PostgreSQL and modified earlier

```shell
psql -h localhost -U postgres < schema.sql
```

If you get some error messages in the server log, that's okay for now, as long as your tables are created (psql answers with `CREATE TABLE`).

Connect with CedarDB via `psql`, e.g. via 
```shell
psql -h localhost -U postgres
```

Execute the following statement against CedarDB for each table you exported in the previous step
```sql
copy {tablename} from 'your/path/{tablename}.csv' DELIMITER '|' CSV NULL '';
```

Note that the path is relative to the **server**, i.e., if you run CedarDB inside the docker container, the location where the csv files resist must be mapped as docker volume.

If you want the path to be relative to the **client**, precede the command with a backslash:
```sql
\copy {tablename} from 'your/path/{tablename}.csv' DELIMITER '|' CSV NULL '';
```

Note that this incurs some network overhead as the data is sent via the PostgreSQL wire protocol over the psql connection.

The csv import is currently single-threaded, as CedarDB has to correctly handle newlines and escapes. If you are sure that your strings don't contain newlines **and** don't contain the delimiter, you can instead import in text mode which is multi-threaded and thus **much** faster:
```sql
copy {tablename} from 'your/path/{tablename}.csv' with(format text, delimiter '|', null '');
```

Note that multithreaded import does not yet work when using a backslash in front of copy (i.e. when importing relative to the client).


## Run your queries!
Your data is now imported into CedarDB. You can run your SQL queries against it. For an overview of the features, please refer to the [PostgreSQL documentation](https://www.postgresql.org/docs/current/queries.html).
