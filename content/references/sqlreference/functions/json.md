---
title: "Reference: JSON Functions"
linkTitle: "JSON"
---

The following functions allow working with embedded `json` and `jsonb` documents.

```sql
create table json_data(data jsonb); -- json behaves similar, but is stored in plain text
insert into json_data
values ('{"id":1, "name": "philipp", "friends": [2, 3]}'),
       ('{"id":2, "name": "max", "friends": [1]}'),
       ('{"id":3, "name": "moritz", "friends": [1, 4]}'),
       ('{"id":4, "name": "christian", "friends": [3], "nick": "chris"}');
```

## Dictionary Access

The `->` operator retrieves the `json` element with the specified string key from a JSON dictionary.
When the key is not found, it returns `null`.

```sql
select data->'name' from json_data;
```

```
    name     
-------------
 "philipp"
 "max"
 "moritz"
 "christian"
(4 rows)
```

Note the double quotes (`"`) around the printed values.
This indicates that the results are JSON strings, not `text` columns.

## Array Access

The `->` also retrieves the `json` element with the specified integer index from a JSON array.
It returns `null` for out-of-bounds access.

```sql
select data->'friends'->0 from json_data;
```

```
 0 
---
 2
 1
 1
 3
(4 rows)
```

## Text Access

The `->>` operator is similar to `->`, but retrieves `text` columns instead of `json` columns.
This converts any value, especially JSON strings, but also integers and nested objects, to a text representation.

```sql
select data->>'name' from json_data;
```

```
  name   
---------
 philipp
 max
 moritz
 christian
(4 rows)
```

## Conversions

`Json` and `jsonb` columns can be converted to and from `text` using standard conversion functions.

```sql
select data::text from json_data limit 1;
```

```
                      text                       
-------------------------------------------------
 {"id": 1, "name": "philipp", "friends": [2, 3]}
(1 row)
```

For `jsonb` columns, CedarDB stores *semantically* equivalent documents, so you might get a *syntactically* different
text representation in a `text::jsonb::text` conversion.
In contrast, `json` columns are stored in a plain text representation, where such a conversion is character-by-character
equivalent, but the access operations are slower, since they need to re-parse the JSON string.

## Arrays

The `json_array_length()` function allows calculating the number of elements in a JSON array:

```sql
select json_array_length(data->'friends') from json_data;
```

```
 json_array_length 
-------------------
                 2
                 1
                 2
                 1
(4 rows)
```

JSON arrays can sometimes be hard to work with in SQL, since they are not in a normalized relational model.
To relationalize arrays, you can use the `json_array_elements()` function, which transforms a row with a JSON array to
multiple rows with the elements of the array.
This is similar to the `unnest()` function for SQL arrays.

For the example, you can get a `friends_with` relation from the json array:

```sql
select data->'id', json_array_elements(data->'friends')
from json_data;
```

```
 id | json_array_elements 
----+---------------------
 3  | 1
 3  | 4
 1  | 2
 1  | 3
 4  | 3
 2  | 1
(6 rows)
```

## Containment and Existence
The `jsonb_contains` function answers whether a given `jsonb` document is structurally contained within another `jsonb` document.

For example, the following query finds the name of the people that consider Max as a friend.
```sql
select data->'name' from json_data where jsonb_contains(data, '{"friends": [2]}');
```
```
   name    
-----------
 "philipp"
(1 row)
```

The `@>` operator performs the same operation when applied to json data. 

The `jsonb_exists` function and the equivalent `?` operator can determine if a given jsonb document has a given text as an object key or as an array value.

```sql
select data->'name', data->'nick' from json_data where data ? 'nick';
```
```
    name     |  nick   
-------------+---------
 "christian" | "chris"
(1 row)
```

Additionally, CedarDB supports the `jsonb_exists_all` (`?&` operator) and `jsonb_exists_any` (`?|`) variants, which check for the existence of all (or any) of a given set of keys. 
```sql
select data->'name', data->'nick' from json_data
where jsonb_exists_any(data, ARRAY['nick', 'name']);
```
```
    name     |  nick   
-------------+---------
 "philipp"   | 
 "max"       | 
 "moritz"    | 
 "christian" | "chris"
(4 rows)
```

```sql
select data->'name', data->'nick' from json_data
where jsonb_exists_all(data, ARRAY['nick', 'name']);
```
```
    name     |  nick   
-------------+---------
 "christian" | "chris"
(1 rows)
```
For the full semantics, refer to the PostgreSQL documentation: [PostgreSQL JSONB containment and existence](https://www.postgresql.org/docs/17/datatype-json.html#JSON-CONTAINMENT)

## Concatenation
The `jsonb_concat` operation concatenates two jsonb documents. To use it, call the `jsonb_concat` function or by providing `jsonb` as input to the `||` operator.
```sql
select data || '{"country": "Germany"}' from jsonb_data.
```
```
                                       ?column?                                        
---------------------------------------------------------------------------------------
 {"id": 1, "name": "philipp", "country": "Germany", "friends": [2, 3]}
 {"id": 2, "name": "max", "country": "Germany", "friends": [1]}
 {"id": 3, "name": "moritz", "country": "Germany", "friends": [1, 4]}
 {"id": 4, "name": "christian", "nick": "chris", "country": "Germany", "friends": [3]}
(4 rows)
```

```sql
select (data->'friends') || (data->>'id')::jsonb as me_and_my_friends from json_data;
```
```
 me_and_my_friends 
-------------------
 [2, 3, 1]
 [1, 2]
 [1, 4, 3]
 [3, 4]
(4 rows)
```
