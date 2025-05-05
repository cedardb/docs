---
title: "Functions: Advanced Functions"
linkTitle: "Advanced Functions"
weight: 40
---

In addition to type specific and aggregate functions, CedarDB offers additional functionality for IO, advanced analytics, as well as utility functions.

## IO Functionality

### csvview
CSV Views allow you to work with temporary data in external CSV files without first copying them into the database.

Example:
```sql
select * from csvview('movies.csv', 'delimiter \",\",header', 'id integer not null, title text');
```

The `csvview` function takes 3 arguments, the last being optional:
  1. Filename
  2. CSV Options
  3. Schema (optional)

The filename is relative to the execution path of the CedarDB server, not to the connecting client.

CSV options need to be encoded into a single string, with special characters, e.g. the `"` surrounding delimiters, encoded.

The optional third parameter allows to specify the schema of the CSV file, which is autodetected by default.
This can be useful if the user has additional information on the properties of the csv file, such as non-nullable colunms.


## Advanced Analytical Functions
### kmeans

CedarDB provides an optimized implementation to cluster points with any number of dimensions using the k-Means clustering algorithm with an euclidean distance.

Example:
```sql
select * from kmeans(table (select id, title, year, length from movies), 5 order by char_length(title), year, length);
```

The `kmeans` table function takes two arguments and an `order by` clause. The two arguments are the input and the number of clusters.

The input is a subquery or the name of a table whose values are used in the k-Means clustering.
The `table` keyword is necessary to tell the database system that the argument should be treated as a set of values instead of just a single value.
You can either write an entire subquery as in the example above or just use the name of an existing table, e.g., `kmeans(table (movies), ...)`.

The number of clusters must be a constant integer. It specifies the number of different clusters into which the k-Means algorithm will cluster the input. Generally, only low numbers of clusters (but more than one) will lead to meaningful results.

The `oder by` clause specifies which attributes the k-Means algorithm should use as dimensions. You need to specify this, since a table generally contains more data than just the dimension values. All expressions in the `oder by` clause are treated as double precision numbers.

The `kmeans` function returns an entire table, so you can only use it anywhere you could also write a subquery. The returned table contains all attributes and tuples of the input and one additional column with the name `cluster_id` which contains an integer between 0 and the specified number of clusters (exclusive). For each tuple the `cluster_id` attribute specifies the cluster the tuple was assigned to.


## Utility Functions

### hash
The `hash` function allows to calculate efficient 64-bit hash values over an arbitrary number of input arguments.

Example:
```sql
select title, hash(id, title, genre) from movies;
```

### normalize_datetime
`normalize_datetime` is a helper function to cast all date types to the timestamp type.

Example:
```sql
select normalize_datetime(birthdate) from stars;
```

For times without date, such as `TIME` and `INTERVAL`, the date is set to `01.01.1970`.

### split_part
`split_part` allows to split text types by a separator string and access the result of the split by index.

Example:
```sql
select split_part('abbcdbbef', 'bb', 2);
```

It takes 3 arguments:

1. Input
2. Separator
3. Index

The index starts at 1, so the example above will return `cd`.
