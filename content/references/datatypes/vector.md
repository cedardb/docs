---
title: "Reference: Vector Type"
linkTitle: "Vector"
weight: 27
---

CedarDB supports vectors for similarity search, which are compatible
with [pgvector](https://github.com/pgvector/pgvector).
Vectors allow representing data in a [vector space model](https://en.wikipedia.org/wiki/Vector_space_model), usually
as fixed-dimensional floating-point weights.

## Usage Example

```sql
create table example (
    word text,
    embedding vector(3)
);
insert into example
    values ('cat', '[1,2,3]'),
           ('dog', '[1,3,4]');
select * from example;
```

```
 word | embedding 
------+-----------
 cat  | [1,2,3]
 dog  | [1,3,4]
(2 rows)
```

This creates a basic [word embedding](https://en.wikipedia.org/wiki/Word_embedding), where you can quickly retrieve the
embedding vector for a specific word.
Vectors can be converted to and from [arrays](../array), but provide optimized vector search operations.
You can find details about the operations on vectors in the [advanced section](/docs/references/advanced/pgvector).

CedarDB also supports vectors with different dimensions in the same column as `vector` (without the dimension parameter
in `vector(3)`).

## Value Range

Vectors have a maximum data size of 4&nbsp;GiB per vector.
Because vectors internally store their values as single-precision 4 Byte floats, CedarDB supports a maximum dimension
of 2³⁰, which is about one billion.
For practical reasons, we recommend keeping vectors below 10k dimensions.

## Limitations

Currently, CedarDB only supports exact nearest neighbor search on vectors with perfect recall.
Support for approximate search with faster queries is planned for future versions.
