---
title: "Quick Start"
linkTitle: "Quick Start"
prev: /getting_started
weight: 10
---

Welcome to CedarDB! This quick start guide is designed to get you up and running with CedarDB within minutes.
This guide will cover the essential steps to get CedarDB running on your system and provide some simple examples to demonstrate how to interact with CedarDB.


## Prerequisites

CedarDB currently supports Linux. You can run it standalone without any system setup dependencies.

{{< callout type="info" >}}
We have extensively tested CedarDB on Ubuntu, Debian, and Arch Linux.
As runtime environment, CedarDB only needs a glibc as shipped by Debian
oldstable (glibc 2.31, released early 2020) or newer.
{{< /callout >}}



CedarDB has two main executables that users can use to interact with the database, located in the `bin` directory:
`sql` and `server`.
For this guide, we will use the `sql` executable. 
It provides an interactive shell to directly open and query a database using SQL.

## Setup

{{% steps %}}

### Create a database directory

CedarDB stores all files of a user's database within a single directory. Create a new one:
```shell
mkdir mydb
```
{{< callout type="info" >}}
CedarDB is optimized for modern storage hardware. To ensure you get CedarDB's best performance, place this directory on a reasonably modern SSD.
{{< /callout >}}

### Initialize the database

Start CedarDB, instructing it to initialize a new database called `test`:
```shell
bin/sql --createdb mydb/test.db
```
You're now in the SQL shell and ready to enter SQL queries and commands!

{{< callout type="info" >}}
The SQL shell supports common keyboard shortcuts, e.g., `CTRL-R` to
search the history or `TAB` for auto-completion.
{{< /callout >}}



{{< callout type="info" >}}
If you exit the SQL shell (e.g., via `CTRL-D`), you can reconnect to your database by supplying the database file as an argument when restarting the shell: 
`bin/sql mydb/test.db`

{{< /callout >}}

{{% /steps %}}

## Create some tables

Let's create some tables to store a small movie database. You can use normal SQL DDL statements:

```sql
create table movies (
    id integer primary key,
    title text,
    year integer,
    length integer,
    genre text
);

create table stars (
    id integer primary key,
    name text,
    wikiLink text,
    gender char,
    birthdate date
);

create table starsIn (
    movieId integer references movies,
    starId integer references stars
);
```

## Load some data
After we have created our database, we can fill it with data. For loading data, you have multiple options:

### Plain Inserts
For this, use the `INSERT` statement:

```sql
insert into movies values
(1, 'Oppenheimer', 2023, 180, 'Biopic'),
(2, 'Everything Everywhere All at Once', 2022, 139, 'Science Fiction'),
(3, 'Das Boot', 1981, 149, 'Drama');
```

### Importing from CSV
If you have already stored your data as CSV format like such:

```text {filename="stars.csv"}
1, 'Cilian Murphy','https://en.wikipedia.org/wiki/Cillian_Murphy', 'M', '1976-05-25'
2, 'Emily Blunt','https://en.wikipedia.org/wiki/Emily_Blunt', 'F', 'F', '1983-02-23'
3, 'Michelle Yeoh', 'https://en.wikipedia.org/wiki/Michelle_Yeoh', 'F', '1962-08-06'
4, 'Jürgen Prochnow', 'https://en.wikipedia.org/wiki/Jürgen_Prochnow', 'M', '1941-06-10'
```
You can do a bulk import:
```sql
copy stars from 'stars.csv' delimiter ',';
```
### Importing an SQL dump
You might have exported your data from another database system as SQL dump:

```sql {filename="dump.sql"}
insert into starsIn values (1, 1);
insert into starsIn values (1, 2);
insert into starsIn values (2, 3);
insert into starsIn values (3, 4);
```

CedarDB can directly import and execute such a file from the shell:
```sql
\i dump.sql
```

## Query your dataset
CedarDB supports standard SQL for querying data.

The following query returns the average length of all movies:
```sql
select avg(length) from movies;
```

```sql
avg
156.00
```


CedarDB also supports all the features you might expect from a modern SQL database system.
For example, the following query calculating the average age of actors by genre utilizes joins and complex date calculations:

```sql
select m.genre, avg(extract(year from justify_interval(current_date - birthdate))) as age
from movies m 
    join starsIn si on m.id = si.movieId
    join stars s on s.id = si.starId
group by m.genre;
```

```sql
genre           age
Biopic          44.50
Science Fiction 62.00
Drama           83.00
```

{{< callout type="info" >}}
If you've worked with database systems before, you're probably familiar with techniques such as query decorrelation or schema denormalization to enhance query performance.
However, with CedarDB, these practices are usually unnecessary. CedarDB automatically handles query decorrelation, even with complex queries containing hundreds of joins. 
This means you can focus on the essential aspect: the business logic driving your queries.
{{< /callout >}}


{{% details title="Teaser: CedarDB thrives on complex queries" closed="true" %}}

Take, for example, the following query determining the oldest star of each movie.
Many database systems struggle with such nested queries.
CedarDBs sophisticated query optimizer efficiently evaluates such nested queries.

```sql
select m.title, s.name 
from movies m, starsIn si, stars s -- For each movie/star pair ...
where m.id = si.movieId 
and s.id = si.starId
and s.birthdate = ( 
    select min(s2.birthdate)     -- ... check all other stars to see whether they are older
    from stars s2, starsIn si2   -- This is a dependent join with quadratic runtime in most database systems
    where s2.id = si2.starId     -- CedarDB can unnest it and evaluate it in linear runtime
    and si2.movieId = si.movieId
);
```

```sql
title                               name
Oppenheimer                         Cilian Murphy
Everything Everywhere All at Once   Michelle Yeoh
Das Boot                            Jürgen Prochnow
```

{{% /details %}}

## Modify your dataset


### Updates
You can update existing rows with the `update` command. The following command updates Michelle Yeoh's name to its simplified chinese spelling:
```sql
update stars set name = '杨紫琼' where name = 'Michelle Yeoh';
```

### Deletes
Similarly, you can delete rows with the `delete` command. The following command deletes all movies which are not associated with any stars:
```sql
delete from movies m
where not exists 
    (select * from starsIn si where si.movieId = m.id);
```

## What's next?

* Ready to move beyond simplistic examples? Navigate to the recipes in the [Data Cookbook](../../cookbook) to import your own substantial datasets.
* Seeking further inspiration or aiming to benchmark CedarDB in complex scenarios? Delve into our curated [sample datasets](../../guides/exampledatasets).
* For an in-depth understanding of CedarDB's features and utilization guidelines, refer to the detailed explanations in the [guide](../../guides) section.