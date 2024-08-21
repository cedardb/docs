---
title: "Reference: JSON Types"
linkTitle: "JSON"
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

For more information on how to work with JSON, take a look at our
[JSON function reference](/docs/references/sqlreference/functions/json).

## JSONB

You should prefer the JSONB storage type over JSON for most applications.
It guarantees round-trip safety of an arbitrary JSON input (i.e., storing and then retrieving will yield the same document), except for the order of elements within the JSON object.
This means, that CedarDB returns a semantically equivalent representation, that may syntactically differ from the input.
For example, JSONB is allowed to produce the following two semantically equivalent output objects.

```
   doc
---------
{"x": 1, "y": "10.00"}
(1 row)

   doc
---------
{"y": "10.00", "x": 1}
(1 row)
```
Because JSONB can be processed much faster, applications that do not require an explicit order of elements within documents, should use JSONB.

### Improving access performance

Because JSONB allows for a different order within documents, CedarDB sorts the keys lexicographically, allowing it to access keys in `O(log n)` runtime.
Accessing arrays can always be performed in `O(1)`.

### Cast optimizations

CedarDB further optimizes casts of JSONB values:
A common operation when accessing, for example the key `x` the document `{"x": 1}` is to cast `x` to an Integer via `x::Int`.
CedarDB can do such casts for free as it can leverage its internal binary representation of JSONB documents.
In particular, using `x::Int` is faster than using `x` without this cast.

### Numeric optimizations

CedarDB introspects JSONB values for common patterns.
For example, if you store the following JSONB document `{"y": "10.00"}`, CedarDB will parse and store the value of `y` as numeric, saving an expensive cast to `numeric` and will only recreate it as `text` value on demand.
Similar to the previous example, accessing `y` as `numeric` is faster than using the textual representation of `y`.
