---
title: "Reference: Json Types"
linkTitle: "Json Types"
weight: 20
---

CedarDB supports [JSON](https://datatracker.ietf.org/doc/html/rfc7159) as a flexible format to store embedded documents.
CedarDB has two storage types, `json` as a text representation and `jsonb` as a binary representation.

## Usage Example
```sql
create table example (
    doc jsonb
);
insert into example 
    values (jsonb '{"x":1}');
select doc, doc->'x' from example;
```

```
   doc   | ?column? 
---------+----------
 {"x":1} | 1
(1 row)
```
