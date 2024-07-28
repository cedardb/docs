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

For most applications, JSONB is the preferred storage type.
JSONB guarantees round-trip safety of an arbitrary JSON input, but the order of elements.
This means, that CedarDB returns a semantically equivalent representation, that is allowed to syntactically differ from the input.
So for example, JSONB is allowed to produce only the following two semantically equivalent output objects (except for whitespaces outside strings).

```
   doc
---------
{"x":1, "y": "10.00"}
(1 row)

   doc
---------
{"y":"10.00", "x": 1}
(1 row)
```
Because JSONB can be processed much faster, applications, that do not require an explicit order of elements within documents, should use JSONB by default.

### Improving access performance

Because JSONB allows for a different order within documents, we sort the keys lexicographically.
With this order, we perform binary search and enable `O(log n)` key accesses.
Accessing arrays can always be performed in `O(1)`.

![Internal JSONB representation in CedarDB](/images/jsonbformat.svg "Internal JSONB representation.")


### Cast optimizations

A common use-case of JSONB analytics is to access specific fields in the JSONB objects.
The return types of accessing JSONB are either JSONB or Text.
So considering our previous example `{"x": 1}`, accessing `x` would either return a new JSONB object containing `1`, or the text string `"1"`.
However, most users would prefer an integer representation of this element and cast the resulting type to an `::Int`.
Because the data of `x` is stored as integer type of our JSONB format, CedarDB directly returns the low-level representation, reducing unnecessary transformations from and to a textual representation of this integer.
This enables much higher processing throughput, when for example, the element is used within a join condition.

### Numeric optimizations

To further improve our performance on JSONB analytics, we also detect hidden numerics within JSON strings.
These hidden numerics are then stored as native numeric format, similar to the integer types within the JSON documents.
Our representation allows CedarDB to always recreate the semantically and syntactically equivalent string.
In combination with our cast optimization, numerics, such as decimal-valued currency fields, can be processed much faster, because CedarDB minimizes the expensive transformations from text to numeric data during query runtime.
