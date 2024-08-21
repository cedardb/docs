---
title: Join Order Benchmark
linkTitle: "Join Order Benchmark"
prev: /example_datasets
weight: 10
---
Aside from the well-known industry benchmarks for analytical systems, TPC-H and TPC-DS, the
[Join Order Benchmark (JOB)](https://www.vldb.org/pvldb/vol9/p204-leis.pdf) is an excellent choice to evaluate the
capabilities of a database system, especially its optimizer.
In contrast to the generated datasets of TPC-H and TPC-DS, which generate a predictable data distribution to allow
scaling the dataset arbitrarily, JOB is derived from the [Internet Movie Database](https://www.imdb.com) and contains real-world data
full of correlations, leading to a wide variety of data distributions.
This makes ordering joins in queries over this dataset challenging, hence the name, as the optimizer cannot simply
assume uniform data distribution and instead has to rely on collected samples and statistics for join ordering.

## The Dataset
The dataset comprises a total of 21 tables extracted from IMDB, containing information about the movie industry, such
as movies, studios, actors, and their connections, such as roles of actors in movies.
The full schema with information on all tables is available as an SQL file [schema.sql](https://www.cedardb.com/data/job/schema.sql).
E.g., the `cast_info` table, which comprises the most rows by far, can be created as:

```sql
CREATE TABLE cast_info (
    id integer NOT NULL PRIMARY KEY,
    person_id integer NOT NULL,
    movie_id integer NOT NULL,
    person_role_id integer,
    note text,
    nr_order integer,
    role_id integer NOT NULL
);
```

{{% steps %}}

### Obtain the data
An excerpt of the IMDB dataset is available for non-commercial purposes through the [JOB paper](https://www.vldb.org/pvldb/vol9/p204-leis.pdf).
To obtain the relevant data simply run

```shell
mkdir jobdata && cd jobdata
curl -O https://bonsai.cedardb.com/job/imdb.tgz
tar -zxvf imdb.tgz
```

{{< callout type="info" >}}
The compressed tarball is about 1.2&nbsp;GB to download, which decompresses to about 3.7&nbsp;GB.
{{< /callout >}}

### Import the schema to CedarDB

To create the full schema inside CedarDB, download the [schema.sql](https://www.cedardb.com/data/job/schema.sql) file and load it, either on a new connection using:

```shell
psql -h localhost -U {{username}} < your/path/schema.sql
```

or in an existing psql session:

```shell
\i your/path/schema.sql
```

This will create all necessary relations for the JOB dataset.

### Import the data to CedarDB

Once you have created all necessary relations, you can import the previously extracted CSV files.
Each CSV file can be imported using the `COPY` command.

```sql
copy cast_info from 'your/path/cast_info.csv' DELIMITER ',' CSV NULL '' ESCAPE '\' HEADER;
```

{{< callout type="warning" >}}
Some strings in the IMDB dataset contain the separator `,`, so you have to use the `CSV` format option instead of the
more performant `TEXT` when importing the data.
{{< /callout >}}

For convenience, we provide an SQL file will all necessary copy commands [load.sql](https://www.cedardb.com/data/job/load.sql).
Please note that you need to modify the include paths from `your/path` to the correct location relative to the CedarDB
server.

{{< callout type="info" >}}
For more information and alternative options to server-relatives paths for CSV imports, please refer to the
[CSV Cookbook]({{< ref "//content/cookbook/working_with_csv.md" >}}).
{{< /callout >}}

{{% /steps %}}

## The Query Workload
The queries of the Join Order Benchmarks were created, as the name already reveals, to contain challenging join order
decisions for the optimizer.
Queries in the join order benchmark, therefore, join at least 4 and up to 17 tables, with an average of 8 joins in a query.
These queries where designed to include meaningful connection between tables and mimic real analytical task one might
want to know about movies.

{{% steps %}}

### Run the benchmark queries
All 113 JOB queries are available for [download](https://bonsai.cedardb.com/job/job.tgz).
You can either run these queries manually one by one using the usual query interface.
E.g., the first query, `1a`, tries to find movies in the top 250 that were not produced by Metro-Goldwyn-Mayer Pictures.

```sql {filename="1a.sql"}
SELECT MIN(mc.note) AS production_note, MIN(t.title) AS movie_title, MIN(t.production_year) AS movie_year
FROM company_type AS ct, info_type AS it, movie_companies AS mc, movie_info_idx AS mi_idx, title AS t
WHERE ct.kind = 'production companies'
    AND it.info = 'top 250 rank'
    AND mc.note  not like '%(as Metro-Goldwyn-Mayer Pictures)%'
    AND (mc.note like '%(co-production)%' or mc.note like '%(presents)%')
    AND ct.id = mc.company_type_id
    AND t.id = mc.movie_id
    AND t.id = mi_idx.movie_id
    AND mc.movie_id = mi_idx.movie_id
    AND it.id = mi_idx.info_type_id;
```

Alternatively, you can also include the query directly from the SQL file from within an active `psql` session:

```shell
\i your/path/1a.sql
```

### Get started with your own queries
In addition, you can of course play around with the dataset on your own however you like.
Collect information on your favorite movies, update potentially outdated information, or enrich the data with external
sources.

{{% /steps %}}
