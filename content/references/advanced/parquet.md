---
title: Importing Data from Parquet
weight: 10
---

CedarDB supports data imports from Parquet files.
Parquet files are compressed columnar files, that are space-efficient and type safe.
They can be used to import information from different data systems into CedarDB.

{{<callout type="info">}}
While interactive querying of Parquet files is also possible, CedarDB is optimized for its own storage engine.
You should use parquet mainly to import data into CedarDB.
{{</callout>}}

## Read a Parquet file

```sql
-- Autodetect based on file suffix
SELECT * FROM 'test.parquet';

-- Use parquet_view function
SELECT * FROM parquet_view('test.parquet');
```

```text {filename="test.parquet"}
 a  | b  
----+----
  1 |  1
  2 |  2
  3 |  3
 .. | ..
(100 rows)
```

## Import Parquet into CedarDB

You can either load parquet data directly into a table:

```sql
CREATE TABLE test AS (SELECT * FROM 'test.parquet');
```

Use `parquet_view` if the file name does not end in `.parquet`

```sql
CREATE TABLE test AS (SELECT * FROM parquet_view('test'));
```

Or you first create the table and insert afterward
Copy data into an existing table via psql

```sql
CREATE TABLE test (a integer, b integer);

-- Use COPY in SQL (relative path to server)
COPY test from 'test.parquet' (format parquet);

-- Or \copy in psql (relative path to client)
\COPY test from 'test.parquet' (format parquet);
```

You can also specify only some columns

```sql
-- Create a table with the columns you need
CREATE TABLE onecol (c integer);

-- Select the columns you need for import
INSERT INTO onecol (SELECT a FROM 'test.parquet')
```

## Inspect Parquet Metadata

Print the parquet file layout

```sql
SELECT * FROM parquet_schema('test.parquet');
```

```text {filename="test.parquet"}
  file_name   |  name  | cedar_type |  type   | type_length | repetition_type | num_children | converted_type | scale | precision | field_id | logical_type 
--------------+--------+------------+---------+-------------+-----------------+--------------+----------------+-------+-----------+----------+--------------
 test.parquet | schema | boolean    | BOOLEAN |             | REQUIRED        |            2 |                |       |           |          | 
 test.parquet | a      | bigint     | INT64   |             | OPTIONAL        |            0 |                |       |           |          | 
 test.parquet | b      | bigint     | INT64   |             | OPTIONAL        |            0 |                |       |           |          | 
(3 rows)
```

Print the parquet file metadata footer:

```sql
SELECT * FROM parquet_file('test.parquet');
```

```text {filename="test.parquet"}
  file_name   | file_size | file_meta_size |            created_by            | num_rows | num_row_groups | num_columns | format_version 
--------------+-----------+----------------+----------------------------------+----------+----------------+-------------+----------------
 test.parquet | 2029      | 554            | parquet-cpp-arrow version 21.0.0 | 100      | 1              | 3           |              2
(1 row)
```

Print all contained row groups:

```sql
SELECT * FROM parquet_rowgroups('test.parquet');
```

```text {filename="test.parquet"}
  file_name   | id | num_rows | num_cols | total_bytes | compressed_bytes 
--------------+----+----------+----------+-------------+------------------
 test.parquet |  0 |      100 |        2 |        1463 |             1463
```

Print all contained column chunks:

```sql
SELECT * FROM parquet_colchunks('test.parquet');
```

```text {filename="test.parquet"}
  file_name   | rg_id | col_id | type  | file_path | schema_path |         encodings          |    codec     | num_values | total_bytes | compressed_bytes 
--------------+-------+--------+-------+-----------+-------------+----------------------------+--------------+------------+-------------+------------------
 test.parquet |     0 |      0 | INT64 |           | {a}         | {PLAIN,RLE,RLE_DICTIONARY} | UNCOMPRESSED |        100 |         771 |              771
 test.parquet |     0 |      1 | INT64 |           | {b}         | {PLAIN,RLE,RLE_DICTIONARY} | UNCOMPRESSED |        100 |         692 |              692
```

## Performance Considerations

CedarDB's parquet scan is optimized for full parquet file imports.
The scan is fully multithreaded and only reads the columns that are queried by the user.
We do not yet push down filters into the parquet rowgroups to prune based on parquet statistics and metadata.
Thus, you should always prefer importing the columns you need into CedarDB over working on the parquet file directly.

## Implementation Status

This page summarizes the available features supported by the CedarDB Parser.

### Legend

- 🟢 **Supported**
- 🟡 **Partially supported**: Details for partial support
- 🔴 **Not yet supported**

### Physical Types

|       Data Type      |              Support               |
|:--------------------:|:----------------------------------:|
| BOOLEAN              |                 🟢                 |
| INT32                |                 🟢                 |
| INT64                |                 🟢                 |
| INT961               |                 🟢                 |
| FLOAT                |                 🟢                 |
| DOUBLE               |                 🟢                 |
| BYTE_ARRAY           |                 🟢                 |
| FIXED_LEN_BYTE_ARRAY | 🟡 (not for legacy string columns) |

### Logical Types

|            Data Type           |        Support        |
|:------------------------------:|:---------------------:|
| STRING                         |          🟢           |
| ENUM                           |  🟡 (parsed as text)  |
| UUID                           |          🟢           |
| Int8,16,32,64                  |          🟢           |
| UInt8,16,32,64                 |          🟢           |
| DECIMAL (INT32)                |          🟢           |
| DECIMAL (INT64)                |          🟢           |
| DECIMAL (BYTE_ARRAY)           |          🟢           |
| DECIMAL (FIXED_LEN_BYTE_ARRAY) |          🟢           |
| FLOAT16                        |          🔴           |
| DATE                           |          🟢           |
| TIME (INT32)                   |          🟢           |
| TIME (INT64)                   |          🟢           |
| TIMESTAMP (INT64)              |          🟢           |
| INTERVAL                       |          🔴           |
| JSON                           | 🟡 (use text instead) |
| BSON                           |          🔴           |
| VARIANT                        |          🔴           |
| GEOMETRY                       |          🔴           |
| GEOGRAPHY                      |          🔴           |
| LIST                           |          🔴           |
| MAP                            |          🔴           |
| UNKNOWN (always null)          |          🟢           |

### Encodings

|         Encoding        | Support  |
|:-----------------------:|:--------:|
| PLAIN                   |    🟢    |
| PLAIN_DICTIONARY        |    🟢    |
| RLE_DICTIONARY          |    🟢    |
| RLE                     |    🟢    |
| BIT_PACKED (deprecated) |    🔴    |
| DELTA_BINARY_PACKED     |    🔴    |
| DELTA_LENGTH_BYTE_ARRAY |    🔴    |
| DELTA_BYTE_ARRAY        |    🔴    |
| BYTE_STREAM_SPLIT       |    🔴    |

### Compression Codecs

|      Compression      | Support |
|:---------------------:|:-------:|
| UNCOMPRESSED          |   🟢    |
| BROTLI                |   🟢    |
| GZIP                  |   🟢    |
| LZ4 (deprecated)      |   🔴    |
| LZ4_RAW               |   🟢    |
| LZO                   |   🔴    |
| SNAPPY                |   🟢    |
| ZSTD                  |   🟢    |

### Enhanced Features

|        Feature        | Support  |
|:---------------------:|:--------:|
| Selective Column Read |    🟢    |
| Row-Group Skip        |    🔴    |
| DataPageHeaderV2      |    🟢    |
| Size Statistics       |    🔴    |
| Page Index            |    🔴    |
| Bloom Filter          |    🔴    |
| Nested Encodings      |    🔴    |
