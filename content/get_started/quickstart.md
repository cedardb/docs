---
title: "Quick Start"
linkTitle: "Quick Start"
weight: 10
---

Welcome to CedarDB! This quick start guide will help you get up and running with CedarDB within minutes.
It covers the essential setup steps and walks you through simple examples to begin interacting with CedarDB.

## Installation


To automatically download and decompress the appropriate CedarDB version, run:

```shell
curl https://get.cedardb.com | bash
```

Then start an interactive SQL shell connected to a temporary database:

```shell
./cedar/cedardb -interactive
```

## Create Tables

Let's define tables for a simple movie database using standard SQL DDL:

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

## Load data
Once the schema is in place, we can populate it using one of the following methods:

### Plain Inserts
Use standard [`INSERT`](../../references/sqlreference/statements/insert) statements:

```sql
insert into movies values
(1, 'Oppenheimer', 2023, 180, 'Biopic'),
(2, 'Everything Everywhere All at Once', 2022, 139, 'Science Fiction'),
(3, 'Das Boot', 1981, 149, 'Drama');
```

### Import from CSV
If your data is stored in a CSV file, like this:

```text {filename="stars.csv"}
1,Cilian Murphy,https://en.wikipedia.org/wiki/Cillian_Murphy,M,1976-05-25
2,Emily Blunt,https://en.wikipedia.org/wiki/Emily_Blunt,F,1983-02-23
3,Michelle Yeoh,https://en.wikipedia.org/wiki/Michelle_Yeoh,F,1962-08-06
4,Jürgen Prochnow,https://en.wikipedia.org/wiki/Jürgen_Prochnow,M,1941-06-10
```
You bulk import it:
```sql
copy stars from 'stars.csv' delimiter ',';
```
### Importing an SQL dump
To import a SQL dump file:

```sql {filename="dump.sql"}
insert into starsIn values (1, 1);
insert into starsIn values (1, 2);
insert into starsIn values (2, 3);
insert into starsIn values (3, 4);
```

Run it directly from the shell:

```sql
\i dump.sql
```

## Query your dataset
CedarDB supports standard SQL queries.

Example: The following query returns the average movie length:
```sql
select avg(length) from movies;
```

```sql
avg
156.00
```

You can also perform more complex operations.
For instance, compute the average age of actors by genre using joins and date functions:

```sql
select m.genre, avg(age(birthdate)) as age
from movies m 
    join starsIn si on m.id = si.movieId
    join stars s on s.id = si.starId
group by m.genre;
```

```sql
genre           age
Biopic          45 years 6 mons 27 days
Science Fiction 62 years 9 mons 1 day
Drama           83 years 10 mons 27 days
```

{{< callout type="info" >}}
**No tuning needed:** 
If you've worked with database systems before, you're probably familiar with techniques such as query decorrelation or schema denormalization to enhance query performance.
However, with CedarDB, these practices are unnecessary. CedarDB automatically handles query decorrelation, even with complex queries containing hundreds of joins. 
This means you can focus on the essential aspect: the business logic driving your queries.
{{< /callout >}}

## Modify data


### Updates
Update existing rows using the [`UPDATE`](../../references/sqlreference/statements/update) statement. For example:
```sql
update stars set name = '杨紫琼' where name = 'Michelle Yeoh';
```

### Deletes
Delete rows using [`DELETE`](../../references/sqlreference/statements/delete).
For instance, to remove movies not linked to any stars:
```sql
delete from movies m
where not exists 
    (select * from starsIn si where si.movieId = m.id);
```

## What's next?

* Want to go beyond basic examples? Explore the [Data Cookbook](../../cookbook) to import your own datasets.
* Curious about CedarDB's performance in complex scenarios? Check out our [sample datasets](../../example_datasets).
* Looking for detailed documentation? Visit the [reference section](../../references) to dive deeper into CedarDB's features.
