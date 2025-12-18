---
title: Importing Data from Parquet
weight: 10
---

CedarDB supports data imports from Parquet files.
Parquet files are compressed columnar files, that are space-efficient and type safe.
They can be used to import information from different data systems into CedarDB.

{{<callout type="info">}}
While interactive querying of Parquet files is also possible, CedarDB is optimized for it's own storage engine.
You should use parquet mainly to import data into CedarDB.
{{</callout>}}


## Examples
Read a parquet file
```sql
SELECT * FROM 'test.parquet';
```

Print the parquet file layout
```sql
SELECT * FROM parquet_schema('test.parquet');
```

Import the parquet file into a new table
```sql
CREATE TABLE test AS (SELECT * FROM 'test.parquet');
```

Use `parquet_view` if the file name does not end in `.parquet`
```sql
CREATE TABLE test AS (SELECT * FROM parquet_view('test'));
```

Print the parquet file meta data footer:
```sql
SELECT * FROM parquet_file('test.parquet');
```

Print all contained Row Groups:
```sql
SELECT * FROM parquet_rowgroups('test.parquet');
```

Print all contained Column Chunks:
```sql
SELECT * FROM parquet_rowgroups('test.parquet');
```

## Creating a Table from parquet

Either you can load parquet data directly into a table:
```sql
-- Create a table using the server defined above
CREATE TABLE test (a integer, b text);
```

Or you first create the table and insert afterward
```sql
-- Create a table with the columns you need
CREATE TABLE test (a integer, b text);

-- Select the columns you need for import
INSERT INTO test (SELECT a, b FROM 'test.parquet')
```


## Performance Considerations

CedarDB's parquet scan is optimized for full parquet file imports.
The scan is fully multi-threaded and only reads the columns that are queried by the user.
We do not yet push-down filters into the parquet rowgroups to prune based on statistics.
You should always prefer importing the columns you

## Implementation Status

This page summarizes the available features supported by the CedarDB Parser.

### Legend
- 🟢 **Supported**
- 🟡 **Partially suported**: Details for partial support
- 🔴 **Not yet supported**

### Physical Types
|       Data Type      | Support |
|:--------------------:|:-------:|
| BOOLEAN              | 🟢       |
| INT32                | 🟢       |
| INT64                | 🟢       |
| INT961               | 🟢       |
| FLOAT                | 🟢       |
| DOUBLE               | 🟢       |
| BYTE_ARRAY           | 🟢       |
| FIXED_LEN_BYTE_ARRAY | 🟡 (not for legacy string columns)   |

### Logical Types
|            Data Type           |        Support       |
|:------------------------------:|:--------------------:|
| STRING                         | 🟢                    |
| ENUM                           | 🟡 (parsed as text)   |
| UUID                           | 🟢                    |
| Int8,16,32,64                  | 🟢                    |
| UInt8,16,32,64                 | 🟢                    |
| DECIMAL (INT32)                | 🟢                    |
| DECIMAL (INT64)                | 🟢                    |
| DECIMAL (BYTE_ARRAY)           | 🟢                    |
| DECIMAL (FIXED_LEN_BYTE_ARRAY) | 🟢                    |
| FLOAT16                        | 🔴                    |
| DATE                           | 🟢                    |
| TIME (INT32)                   | 🟢                    |
| TIME (INT64)                   | 🟢                    |
| TIMESTAMP (INT64)              | 🟢                    |
| INTERVAL                       | 🔴                    |
| JSON                           | 🟡 (use text instead) |
| BSON                           | 🔴                    |
| VARIANT                        | 🔴                    |
| GEOMETRY                       | 🔴                    |
| GEOGRAPHY                      | 🔴                    |
| LIST                           | 🔴                    |
| MAP                            | 🔴                    |
| UNKNOWN (always null)          | 🟢                    |

### Encodings
|         Encoding        |        Support       |
|:-----------------------:|:--------------------:|
| PLAIN                   | 🟢                    |
| PLAIN_DICTIONARY        | 🟢                    |
| RLE_DICTIONARY          | 🟢                    |
| RLE                     | 🟢                    |
| BIT_PACKED (deprecated) | 🔴                    |
| DELTA_BINARY_PACKED     | 🔴                    |
| DELTA_LENGTH_BYTE_ARRAY | 🔴                    |
| DELTA_BYTE_ARRAY        | 🔴                    |
| BYTE_STREAM_SPLIT       | 🔴                    |

### Compression Codecs
|      Compression      |        Support       |
|:---------------------:|:--------------------:|
| UNCOMPRESSED          | 🟢                    |
| BROTLI                | 🔴                    |
| GZIP                  | 🟢                    |
| LZ4 (deprecated)      | 🔴                    |
| LZ4_RAW               | 🟢                    |
| LZO                   | 🔴                    |
| SNAPPY                | 🟢                    |
| ZSTD                  | 🟢                    |

### Enhanced Features
|        Feature        |        Support       |
|:---------------------:|:--------------------:|
| Selective Column Read | 🟢                    |
| Row-Group Skip        | 🔴                    |
| DataPageHeaderV2      | 🟢                    |
| Size Statistics       | 🔴                    |
| Page Index            | 🔴                    |
| Bloom Filter          | 🔴                    |
| Nested Encodings      | 🔴                    |

