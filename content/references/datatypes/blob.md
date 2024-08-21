---
title: "Reference: Binary Data Types"
linkTitle: "Binary Data"
weight: 23
---

Binary data can be stored as `bytea` *byte arrays*.
Binary blobs can store arbitrary data in opaque *binary* strings, which differentiates them, e.g., from text.
Input data can be specified as hex or PostgreSQL compatible [`bytea` escape format](https://www.postgresql.org/docs/current/datatype-binary.html).

## Usage Example
```sql
create table example (
    data blob
);
insert into example
    values (bytea '\xDEADBEEF'), (bytea 'abc \153\154\155'), (blob '\xff');
select * from example;
```

```
       data       
------------------
 \xdeadbeef
 \x616263206b6c6d
 \xff
(3 rows)
```

While binary blobs can hold arbitrary data of up to 4GB, we recommend to avoid storing overly large data within your database.
For reading queries, CedarDB optimizes columns that are not accessed and blob columns that are not part of the query
have no performance impact.
However, such columns still come with downsides when modifying data due to the transactional consistency guarantees that
CedarDB provides.

As an alternative, consider storing large files (>1MB) on the file system or a cloud object store like S3, and only
store a file path or URL in a `text` field.
