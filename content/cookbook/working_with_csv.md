---
title: "Tutorial: Working with CSV files in CedarDB"
linkTitle: "Working with CSV files"
weight: 30
---
CedarDB allows you to import CSVs into database relations for permanent storage, harness them as temporary external sources for dynamic data manipulation, and effortlessly export query results to CSV files.


## Importing Data from CSV sources
Importing CSV files into your database relations before querying allows you to make the most of CedarDB's query engine, as it allows CedarDB to scan data more efficiently and make use of collected statistics for query optimization.

{{% steps %}}

### Create a table for each CSV file
Before copying your data into CedarDB, you first need to create a database relation with the schema of your data. To start with your own movie database, you might want to start with some movie information.


Connect with CedarDB via `psql`, e.g. via 
```shell
psql -h localhost -U postgres
```

and create a table with a schema matching your CSV file.

```sql
create table movies (
    id integer primary key,
    title text,
    year integer,
    length integer,
    genre text
);
```

### Copy data into CedarDB

Execute the following statement against CedarDB to import your external movie database from csv. Feel free to get started with our example [movies.csv](https://cedardb.com/data/movies/movies.csv) to play around with.
```sql
copy movies from 'your/path/movies.csv' DELIMITER ',' CSV NULL '' HEADER;
```

The `header` option tells CedarDB to treat the first line as the column names and ignore it as a data point.

Note that the path is relative to the **server**, which might differ from the path, or even the system, from which you connect to CedarDB.

If you want the path to be relative to the **client**, precede the command with a backslash:
```sql
\copy movies from 'your/path/movies.csv' DELIMITER ',' CSV NULL '' HEADER;
```

Note that this incurs some network overhead as the data is sent via the PostgreSQL wire protocol over the psql connection.

The csv import is currently single-threaded, as CedarDB has to correctly handle newlines and escapes. If you are sure that your strings don't contain newlines **and** don't contain the delimiter, as is the case for our example dataset, you can instead import in text mode which is multi-threaded and thus **much** faster:
```sql
copy movies from 'your/path/movies.csv' with(format text, delimiter ',', null '', header);
```

{{< callout type="warning" >}}
Multithreaded import does not yet work when using a backslash in front of copy (i.e. when importing relative to the client).
{{< /callout >}}

### Start working with your data
Once you have successfully copied your data into CedarDB, you can get to work. Modify or query your data however you like. For example, find a good and long fantasy movie for a rainy day:

```sql
select title, length, year from movies where genre = 'Fantasy' and length > 180;
```

For an overview of the features available for querying data, please refer to the [PostgreSQL documentation](https://www.postgresql.org/docs/current/queries.html).
{{% /steps %}}

## Working with external CSV sources

If you do not want to import the CSV into your database permanently, you can also work with CSVs as an external data view only. For one time analysis, this promises faster results as you do not need to copy it to storage first. However, a full import will amortize quickly, making importing the data worthwhile if you run more than one query on it.

{{% steps %}}

### Familiarize yourself with the schema of your CSV file

Assuming you want to enrich your movie selection process with information on the actors staring in a movie, but do not want to store all actors in your database for GDPR reasons, you might want to keep them externally. For actors, you keep the following information in [stars.csv](https://cedardb.com/data/movies/stars.csv):

```text {filename="stars.csv"}
id,name,wikiLink,gender,birthdate
1,Morgan Freeman,https://en.wikipedia.org/wiki/Morgan_Freeman,M,1937-06-01
2,Marlon Brando,https://en.wikipedia.org/wiki/Marlon_Brando,M,1924-04-03
3,Heath Ledger,https://en.wikipedia.org/wiki/Heath_Ledger,M,1979-04-04
4,Liam Neeson,https://en.wikipedia.org/wiki/Liam_Neeson,M,1952-06-07
5,Elijah Wood,https://en.wikipedia.org/wiki/Elijah_Wood,M,1981-01-28
...
```

Finally, you need the necessary information connecting your stars with the movies they star in, which you might keep in [starsIn.csv](https://cedardb.com/data/movies/starsIn.csv):

```text {filename="starsIn.csv"}
movieId,starId
1,1
1,7
2,2
3,3
...
```

### Querying a CSV view
You can query external CSV files efficiently using the `cedar.csvview` function. Similar to the data import, you need to specify both the delimiter and the schema, this time as arguments of the function. You can read all data in the `starsIn.csv` like this:

```sql
select * from cedar.csvview('your/path/starsIn.csv', 'delimiter ",", header', 'movieId integer not null, starId integer not null');
```

The `header` option again tells CedarDB to treat the first line as the column names and ignore it as a data point.


### Start working with your external CSV view

To include these csv views in a query, it is best to include them as a common table expression. Finding any movie starring an actor born after 1970 can then be achieved like this:

```sql
with starsIn as (select * from cedar.csvview('your/path/starsIn.csv', 'delimiter ",", header', 'movieId integer not null, starId integer not null')),
     stars   as (select * from cedar.csvview('your/path/stars.csv', 'delimiter ",", header', 'id integer, name text, wikiLink text, gender char, birthdate date'))
select movies.title, movies.year from movies, stars, starsIn where starsIn.starId = stars.id and starsIn.movieId = movies.id and extract(year from stars.birthdate) > 1970;
```
{{% /steps %}}


## Writing query results to CSV
CedarDB not only allows you to read from CSV files, but write them as well. This allows you to export results of individual queries, or whole tables, with ease.
You can create a separate CSV file for you movie collection containing only Thrillers with a simple `COPY` statement:

```sql
copy (select * from movies where genre = 'Thriller') TO 'your/path/thrillers.csv' DELIMITER ',' CSV NULL '' HEADER;
```

The `header` option tells CedarDB to include the column names in the CSV file as the first line.



