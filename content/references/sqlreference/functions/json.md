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
       ('{"id":3, "name": "moritz", "friends": [1]}');
```

## Dictionary Access

The `->` operator retrieves the `json` element with the specified string key from a JSON dictionary.
When the key is not found, it returns `null`.

```sql
select data->'name' from json_data;
```

```
   name
-----------
 "philipp"
 "max"
 "moritz"
(3 rows)
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
(3 rows)
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
(3 rows)
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
select json_array_length((data->'friends')::JSON) from json_data;
```

```
 json_array_length
-------------------
                 2
                 1
                 1
(3 rows)
```

JSON arrays can sometimes be hard to work with in SQL, since they are not in a normalized relational model.
To relationalize arrays, you can use the `json_array_elements()` or `jsonb_array_elements()` functions, which transforms a row with a JSON or JSONB array to
multiple rows with the elements of the array.
This is similar to the `unnest()` function for SQL arrays.

For the example, you can get a `friends_with` relation from the json array:

```sql
select data->'id', jsonb_array_elements(data->'friends')
from json_data;
```

```
 id | json_array_elements
----+---------------------
 1  | 2
 1  | 3
 3  | 1
 2  | 1
(4 rows)
```
