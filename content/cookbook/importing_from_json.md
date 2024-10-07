---
title: "Tutorial: Importing JSON Data into CedarDB"
linkTitle: "Importing from JSON"
weight: 12
---

CedarDB natively supports storing JSON documents in tables and working with JSON in SQL.
Two data types: `json` that stores the documents as text, and `jsonb` which stores a binary representation to allow 
efficient access to fields of the document.

## Importing JSON

You can import data from a [JSON Lines](https://jsonlines.org/) file:

```json lines {filename="stars.json"}
{"name": "Cilian Murphy", "wikiLink": "https://en.wikipedia.org/wiki/Cillian_Murphy", "gender": "M", "birthdate": "1976-05-25"}
{"name": "Emily Blunt", "wikiLink": "https://en.wikipedia.org/wiki/Emily_Blunt", "gender": "F", "birthdate": "1983-02-23"}
{"name": "Michelle Yeoh", "wikiLink": "https://en.wikipedia.org/wiki/Michelle_Yeoh", "gender": "F", "birthdate": "1962-08-06"}
{"name": "Jürgen Prochnow", "wikiLink": "https://en.wikipedia.org/wiki/Jürgen_Prochnow", "gender": "M", "birthdate": "1941-06-10"}
```

Load the data into a table:
```sql
create table stars_json (star json);
copy stars_json from 'stars.json';
```

Now you can use the json documents in SQL queries:
```sql
select star->>'name' as name from stars_json where star->>'gender' = 'F';
```
```sql
     name      
---------------
 Emily Blunt
 Michelle Yeoh
(2 rows)
```

CedarDB supports the [PostgreSQL syntax](https://www.postgresql.org/docs/current/functions-json.html) for JSON attribute
access with `->` and text with `->>`.
Additionally, the `json_array_elements()` function to transforms JSON arrays to SQL tables.

{{< callout type="info" >}}
Support for path expressions (the `#>` operator) and [SQL/JSON path expressions](https://www.postgresql.org/docs/current/functions-json.html#FUNCTIONS-SQLJSON-PATH)
is planned for a future CedarDB release.
{{< /callout >}}

## Relationalize JSON

To efficiently execute queries on data, we recommend to transform JSON documents to relational tables.
When storing data in CedarDB's native storage format, it uses advanced statistics and columnar data storage for 
efficient execution.  

For the previous example, you can relationalize by creating a table with explicit [data types](/references/datatypes).

{{< callout type="info" >}}
JSON field access returns `null` when a key is not present.
Depending on your JSON schema, you can also mark columns as `not null`.
{{< /callout >}}


```sql
create table stars (
    id integer primary key generated always as identity,
    name text,
    wikiLink text,
    gender char,
    birthdate date
);

insert into stars(name, wikiLink, gender, birthdate) 
    select star->>'title', star->>'wikiLink', star->>'gender', star->>'birthdate' from stars_json;
```
