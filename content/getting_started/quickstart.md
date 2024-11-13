---
title: "Quick Start"
linkTitle: "Quick Start"
prev: /getting_started
weight: 10
---

Welcome to CedarDB! This quick start guide is designed to get you up and running with CedarDB within minutes.
This guide will cover the essential steps to get CedarDB running on your system and provide some simple examples to demonstrate how to interact with CedarDB.


## Prerequisites

You need [Docker](https://docs.docker.com/engine/install/) and the `psql` command line tool to run CedarDB.

On Ubuntu, you can install the `psql` command line tool with `apt install postgresql-client`.


## Setup

{{% steps %}}

### Get the docker file

{{% waitlist %}}


### Build the docker image

Go to the path where you have downloaded the CedarDB docker file and run 
```shell
docker build -t cedardb .
```

### Launch the docker container

```shell
# Start the container
docker run --rm -p 5432:5432 -e CEDAR_PASSWORD=test --name cedardb_test cedardb
```
This will create a temporary database that is automatically wiped when the docker container is stopped.

{{< callout type="info" >}}
If you want to create a permanent database surviving docker container restarts, take a look at the [Docker documentation page](./running_docker_image#make-the-database-persistent)
{{< /callout >}}

### Connect to CedarDB

```shell
psql -h localhost -U postgres
# <Enter the CEDAR_PASSWORD (test) as password>

postgres= SELECT 1 as foo;
 foo 
-----
   1
(1 row)
```
Congrats, you're now ready to process some data!
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
1,Cilian Murphy,https://en.wikipedia.org/wiki/Cillian_Murphy,M,1976-05-25
2,Emily Blunt,https://en.wikipedia.org/wiki/Emily_Blunt,F,1983-02-23
3,Michelle Yeoh,https://en.wikipedia.org/wiki/Michelle_Yeoh,F,1962-08-06
4,Jürgen Prochnow,https://en.wikipedia.org/wiki/Jürgen_Prochnow,M,1941-06-10
```
You can do a bulk import:
```sql
\copy stars from 'stars.csv' delimiter ',';
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