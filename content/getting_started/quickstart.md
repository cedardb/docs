---
title: "Quick Start"
linkTitle: "Quick Start"
prev: /getting_started
weight: 10
---

Welcome to CedarDB! This quick start guide is designed to get you up and running with CedarDB within minutes.
In this guide, we will cover the essential steps to get CedarDB running on your system and provide some simple examples to demonstrate how to interact with CedarDB.



## Prerequisites



CedarDB currently supports Linux. It can be run standalone without any system setup dependencies.


{{< callout type="info" >}}
We have extensively tested CedarDB on Ubuntu, Debian, and Arch Linux.
As runtime environment, CedarDB only needs a glibc as shipped by Debian
oldstable (glibc 2.31, released early 2020) or newer.
{{< /callout >}}



CedarDB has two main executables that users can use to interact with the database, located in the `bin` directory:
`sql` and `server`.
For this guide, we will use the `sql` executable. 
It provides an interactive shell to directly open a database and query it using SQL.

{{< callout type="info" >}}
If you want to learn how to use CedarDB in a more traditional client/server setup, refer to [CedarDB as Server](../clientserver)
{{< /callout >}}


## Setup

{{% steps %}}

### Create a database directory

CedarDB stores all files of a user's database within a single directory. Create a new one:
```shell
mkdir mydb
```
{{< callout type="info" >}}
CedarDB is optimized for modern storage hardware. To make sure you get CedarDB's full performance, place this directory on a reasonably modern SSD.
{{< /callout >}}

### Initialize the database

Start CedarDB, instructing it to initialize a new database called `test`:
```shell
bin/sql --createdb mydb/test.db
```
You're now in the SQL shell and ready to enter SQL queries and commands!

{{< callout type="info" >}}
The SQL shell supports common keyboard shortcuts, e.g., `CTRL-R` to
search the history or `TAB` for auto completion.
{{< /callout >}}



{{< callout type="info" >}}
If you exit the SQL shell (e.g., via `CTRL-D`) you can reconnect to your database by supplying the database file as argument when restarting the shell: 
`bin/sql mydb/test.db`

{{< /callout >}}

{{% /steps %}}

## Create some tables

Let's create some tables to store a small movie database. You can use normal SQL DDL statements:

```sql
create table movies (
    title text,
    year integer,
    length integer,
    genre text,
    primary key(title, year)
);

create table stars (
    name text primary key,
    wikiLink text,
    gender char,
    birthdate date
);

create table starsIn (
    movieTitle text,
    year integer,
    starName text references stars(name),
    foreign key (movieTitle, year) references movies(title, year)
);
```

## Load some data
After we have created our database, we can fill it with data. For loading data, you have multiple options:

### Plain Inserts
For this, use the `INSERT` statement:

```sql
insert into movies values
('Oppenheimer', 2023, 180, 'Biopic'),
('Everything Everywhere All at Once', 2022, 139, 'Science Fiction'),
('Das Boot', 1981, 149, 'Drama');
```

### Importing from CSV
If you have already stored your data as CSV format like such:

```text {filename="stars.csv"}
'Cilian Murphy','https://en.wikipedia.org/wiki/Cillian_Murphy', 'M', '1976-05-25'
'Emily Blunt','https://en.wikipedia.org/wiki/Emily_Blunt', 'F', 'F', '1983-02-23'
'Michelle Yeoh', 'https://en.wikipedia.org/wiki/Michelle_Yeoh', 'F', '1962-08-06'
'Jürgen Prochnow', 'https://en.wikipedia.org/wiki/Jürgen_Prochnow', 'M', '1941-06-10'
```
You can do a bulk import:
```sql
copy stars from 'stars.csv' delimiter ',';
```
### Importing an SQL dump
You might have exported your data from another database system as SQL dump:

```sql {filename="dump.sql"}
insert into starsIn values ('Oppenheimer', 2023, 'Cilian Murphy');
insert into starsIn values ('Oppenheimer', 2023, 'Emily Blunt');
insert into starsIn values ('Everything Everywhere All at Once', 2022, 'Michelle Yeoh');
insert into starsIn values ('Das Boot', 1981, 'Jürgen Prochnow');
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


CedarDB also supports all features you might expect from a modern SQL database system.
The following query calculating the average age of actors by genre for example utilizes joins and complex date calculations:

```sql
select m.genre, avg(extract(year from justify_interval(current_date - birthdate)))
from movies m 
    join starsIn si on m.title = si.movieTitle and m.year = si.year
    join stars s on s.name = si.starName
group by m.genre;
```

```sql
genre           avg
Biopic          44.50
Science Fiction 62.00
Drama           83.00
```

CedarDBs sophisticated query optimizers can also efficiently evaluate nested queries that other database systems struggle with:

```sql
select m.title from movies m -- find the oldest movie
where not exists (
    select * from movies m2 where m2.year < m.year
);
```

```sql
title
Das Boot
```

## Modify your dataset
* Add/Drop columns
* Delete data (referential integrity)

## What's next?

* How to run with server?
* Insert a big dataset into CedarDB
* Test out our example datasets
* More in-depth SQL guide