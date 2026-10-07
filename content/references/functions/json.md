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

```text
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

```text
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

```text
  name   
---------
 philipp
 max
 moritz
 christian
(4 rows)
```

## Path Access

The `#>` operator follows a path of object keys and array indexes, given as a `text[]`, and returns the `json` element at that path.
The `#>>` operator does the same, but returns `text`.
When the path does not exist, both return `null`.
Negative array indexes in a path count from the end of the array.

```sql
select data->>'name' as name,
       data #> '{friends,0}' as first_friend,
       data #>> '{friends,-1}' as last_friend
from json_data;
```

```text
   name    | first_friend | last_friend 
-----------+--------------+-------------
 philipp   | 2            | 3
 max       | 1            | 1
 moritz    | 1            | 4
 christian | 3            | 3
(4 rows)
```

## Conversions

`Json` and `jsonb` columns can be converted to and from `text` using standard conversion functions.

```sql
select data::text from json_data limit 1;
```

```text
                      text                       
-------------------------------------------------
 {"id": 1, "name": "philipp", "friends": [2, 3]}
(1 row)
```

For `jsonb` columns, CedarDB stores *semantically* equivalent documents, so you might get a *syntactically* different
text representation in a `text::jsonb::text` conversion.
In contrast, `json` columns are stored in a plain text representation, where such a conversion is character-by-character
equivalent, but the access operations are slower, since they need to reparse the JSON string.

## Arrays

The `json_array_length()` function allows calculating the number of elements in a JSON array:

```sql
select json_array_length(data->'friends') from json_data;
```

```text
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

For the example, you can get a `friends_with` relation from the JSON array:

```sql
select data->'id', json_array_elements(data->'friends')
from json_data;
```

```text
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

```text
   name    
-----------
 "philipp"
(1 row)
```

The `@>` operator performs the same operation when applied to JSON data.

The `jsonb_exists` function and the equivalent `?` operator can determine if a given jsonb document has a given text as an object key or as an array value.

```sql
select data->'name', data->'nick' from json_data where data ? 'nick';
```

```text
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

```text
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

```text
    name     |  nick   
-------------+---------
 "christian" | "chris"
(1 rows)
```

Containment is structural: an object contains another object if it has all of its keys with contained values, and an array contains another array if every element of the second array appears somewhere in the first one, regardless of order or duplicates.

## Concatenation

The `jsonb_concat` operation concatenates two jsonb documents. To use it, call the `jsonb_concat` function or by providing `jsonb` as input to the `||` operator.

```sql
select data::jsonb || '{"country": "Germany"}' from json_data;
```

```text
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

```text
 me_and_my_friends 
-------------------
 [2, 3, 1]
 [1, 2]
 [1, 4, 3]
 [3, 4]
(4 rows)
```

## Construction

Build JSON values from SQL values:

| Function                                               | Description                                                 | Example result           |
|--------------------------------------------------------|-------------------------------------------------------------|--------------------------|
| `json_build_object(k1, v1, ...)`, `jsonb_build_object` | Object from alternating keys and values.                    | `{"a" : 1}`              |
| `json_build_array(v1, ...)`, `jsonb_build_array`       | Array from the arguments.                                   | `[1, "a"]`               |
| `to_json(value)`                                       | JSON representation of any SQL value.                       | `"x"`                    |
| `row_to_json(record)`                                  | Object with one key per column of a row.                    | `{"f1" : 1, "f2" : "a"}` |
| `array_to_json(array)`                                 | JSON array from an SQL array.                               | `[1,2]`                  |
| `json_agg(value)`                                      | Aggregate: JSON array of all input values, including nulls. | `[1, null, 3]`           |
| `json_arrayagg(value)`                                 | Aggregate: JSON array of all non-null input values.         | `[1, 3]`                 |

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
INSERT INTO trees VALUES (1, 'Oak', 21.5), (2, 'Birch', 9.0);

SELECT json_agg(json_build_object('species', species, 'height', height_m)) FROM trees;
```

```text
                                        json_agg                                         
-----------------------------------------------------------------------------------------
 [{"species" : "Oak", "height" : 21.500000}, {"species" : "Birch", "height" : 9.000000}]
(1 row)
```

`json_agg` keeps null inputs as JSON `null`. `json_arrayagg` skips them by default; write `json_arrayagg(x ORDER BY x NULL ON NULL)` to keep them. Both aggregates accept an `ORDER BY` clause:

```sql
SELECT json_arrayagg(species ORDER BY species) FROM trees;
```

```text
     ?column?     
------------------
 ["Birch", "Oak"]
(1 row)
```

`jsonb_array_length()` and `jsonb_array_elements()` work like their `json` counterparts.

## PostgreSQL Differences

- The deletion operators `-` and `#-` and the JSON path operators `@?` and `@@` are not supported.
- `->` and `->>` with a negative array index return `null` instead of counting from the end of the array. Use `#>` or `#>>` with a negative index in the path, e.g., `data #> '{friends,-1}'`.
- `json_arrayagg` names its result column `?column?` instead of `json_arrayagg`.
- `jsonb` subscripting, e.g., `data['name']`, is not supported. Use `->` and `->>`.
- Not supported: `to_jsonb`, `jsonb_agg`, `json_object_agg`, `jsonb_object_agg`, `json_object`, `jsonb_object`, `json_each` and `jsonb_each` (also `_text`), `json_object_keys`, `jsonb_object_keys`, `json_array_elements_text`, `jsonb_array_elements_text`, `json_typeof`, `jsonb_typeof`, `jsonb_set`, `jsonb_set_lax`, `jsonb_insert`, `json_strip_nulls`, `jsonb_strip_nulls`, `jsonb_pretty`, the `json_populate_record` and `json_to_record` families, and the `jsonb_path_*` functions.
- Of the SQL/JSON constructors and functions, only `JSON_ARRAYAGG` is supported. `JSON_ARRAY`, `JSON_OBJECT`, `JSON_OBJECTAGG`, `IS JSON`, `JSON_QUERY`, `JSON_VALUE`, `JSON_EXISTS`, `JSON_SCALAR`, `JSON_SERIALIZE`, and `JSON_TABLE` are not supported.
