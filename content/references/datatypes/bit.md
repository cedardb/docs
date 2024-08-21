---
title: "Reference: Bit String Types"
linkTitle: "Bit String"
weight: 22
---

CedarDB supports the standard SQL bit-string data types `bit(n)` and `bit varying(n)`, where `n` specifies the number of
*bits* in the bit string.
Bit strings can be specified with binary or hex digits: `b'1010' == x'a'`.

## Usage Example
```sql
create table example (
    bits bit varying
);
insert into example 
    values (b'00000000'), (x'ff'), (b'10101010'), (x'cafebabe');
select * from example;
```

```
               bits               
----------------------------------
 00000000
 11111111
 10101010
 11001010111111101011101010111110
(4 rows)
```
