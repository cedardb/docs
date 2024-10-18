---
title: Core SQL Compatibility
prev: /compatibility
weight: 91
---
CedarDB implements the SQL dialect of PostgreSQL. While we are able to syntactically parse any PostgreSQL-compliant statement, not all underlying functionality is implemented yet.

This page gives a **non-exhaustive** overview of currently supported core SQL functionality.
CedarDB strives for full PostgreSQL compatibility, and features not currently supported will be added over time.

For PostgreSQL-specific functionality, such as system table support, see the [backend compatibility](../backend) page.

## Data Definition
### Table Creation & Deletion
| **Feature**           | **Support State** | **Details**                                                                                 |
|-----------------------|-------------------|---------------------------------------------------------------------------------------------|
| CREATE TABLE          | Yes               | [Documentation](/docs/references/sqlreference/statements/createtable/)                      |
| DROP TABLE            | Yes               |                                                                                             |
| Default Values        | Yes               |                                                                                             |
| GENERATED             | Yes               | only AS IDENTITY                                                                            |
| Check Constraints     | No                |                                                                                             |
| Not-Null Constraints  | Yes               | [Documentation](/docs/references/sqlreference/statements/createtable/)                      |
| Unique Constraints    | Yes               | [Documentation](/docs/references/sqlreference/statements/createtable/)                      |
| Primary Keys          | Yes               | [Documentation](/docs/references/sqlreference/statements/createtable/)                      |
| Foreign Keys          | Yes               | Without ON DELETE<br>[Documentation](/docs/references/sqlreference/statements/createtable/) |
| Named Constraints     | No                |                                                                                             |
| Exclusion Constraints | No                |                                                                                             |
| System Columns        | Yes               | Only meaningful for tableoid and ctid                                                       |

### Table Modification (ALTER TABLE)
| **Feature**     | **Support State** | **Details** |
|-----------------|-------------------|-------------|
| ADD COLUMN      | Yes               |             |
| DROP COLUMN     | Yes               |             |
| ADD CHECK       | No                |             |
| ADD CONSTRAINT  | Yes               |             |
| ADD FOREIGN KEY | Yes               |             |
| DROP CONSTRAINT | No                |             |
| ALTER COLUMN    | No                |             |
| SET DEFAULT     | No                |             |
| DROP DEFAULT    | No                |             |
| COLUMN TYPE     | No                |             |
| RENAME COLUMN   | Yes               |             |
| RENAME TO       | Yes               |             |

### Privileges
| **Feature**           | **Support State** | **Details**                                                           |
|-----------------------|-------------------|-----------------------------------------------------------------------|
| CREATE ROLE           | Yes               | [Documentation](/docs/references/sqlreference/statements/createrole)  |
| OWNER TO              | Yes               |                                                                       |
| ALTER ROLE            | Yes               | [Documentation](/docs/references/sqlreference/statements/alterrole)   |
| GRANT                 | Yes               | Only GRANT role to other_role                                         |
| REVOKE                | No                |                                                                       |
| SET ROLE              | No                |                                                                       |
| INHERIT               | Yes               | [Documentation](/docs/references/sqlreference/statements/createrole/) |
| Row Security Policies | No                |                                                                       |


### Indexes
| **Feature**            | **Support State** | **Details**                                                                                |
|------------------------|-------------------|--------------------------------------------------------------------------------------------|
| CREATE INDEX           | Yes               | Only B-Tree Indexes [Documentation](/docs/references/sqlreference/statements/createindex/) |
| GIN                    | No                |                                                                                            |
| BRIN                   | No                |                                                                                            |
| Multicolumn Indexes    | Yes               | [Documentation](/docs/references/sqlreference/statements/createindex/)                     |
| Ordered Indexes        | Yes               | [Documentation](/docs/references/sqlreference/statements/createindex/#column-order)        |
| Unique Indexes         | Yes               |                                                                                            |
| Indexes on Expressions | No                |                                                                                            |
| Partial Indexes        | No                |                                                                                            |

### Misc
| **Feature**            | **Support State** | **Details**                                                                                                  |
|------------------------|-------------------|--------------------------------------------------------------------------------------------------------------|
| CREATE SCHEMA          | Yes               | [Documentation](/docs/references/sqlreference/statements/createschema/)                                      |
| DROP SCHEMA            | No                |                                                                                                              |
| search_path            | Yes               | [Documentation](/docs/references/sqlreference/statements/createschema/#using-schemas)                        |
| Table Inheritance      | No                |                                                                                                              |
| Table Partitioning     | Yes               | Only at creation, only by hash                                                                               |
| Foreign Data Wrappers  | No                |                                                                                                              |
| Views                  | Yes               | [Documentation](/docs/references/sqlreference/statements/createview/)                                        |
| Databases              | Yes               | [Documentation](/docs/references/sqlreference/statements/createdb/)                                          |
| Functions & Procedures | Yes               | [Documentation](/docs/references/sqlreference/statements/createfunction/) <br> Also in cedar_script language |
| Custom Types           | No                |                                                                                                              |
| Triggers               | No                |                                                                                                              |
| Prepared Statements    | Yes               |                                                                                                              |

## Data Manipulation
| **Feature** | **Support State** | **Details**                                                                 |
|-------------|-------------------|-----------------------------------------------------------------------------|
| INSERT      | Yes               | [Documentation](/docs/references/sqlreference/statements/insert/)           |
| UPDATE      | Yes               | [Documentation](/docs/references/sqlreference/statements/update/)           |
| DELETE      | Yes               | [Documentation](/docs/references/sqlreference/statements/delete/)           |
| TRUNCATE    | Yes               | [Documentation](/docs/references/sqlreference/statements/truncate/)         |
| RETURNING   | Yes               | [Documentation](/docs/references/sqlreference/statements/insert/#returning) |
| COPY FROM   | Yes               | [Documentation](/docs/references/sqlreference/statements/copy/)             |
| COPY TO     | Yes               | [Documentation](/docs/references/sqlreference/statements/copy/)             |
| ON CONFLICT | Yes               | [Documentation](/docs/references/sqlreference/statements/upsert/)           |

## Queries
| **Feature**               | **Support State** | **Details**                                                                      |
|---------------------------|-------------------|----------------------------------------------------------------------------------|
| Table & View References   | Yes               |                                                                                  |
| Inner Joins               | Yes               | [Documentation](/docs/references/sqlreference/queries/#joins)                    |
| Outer Joins               | Yes               | [Documentation](/docs/references/sqlreference/queries/#joins)                    |
| Semijoins                 | Yes               | [Documentation](/docs/references/sqlreference/queries/#joins)                    |
| Antijoins                 | Yes               |                                                                                  |
| Table Functions           | Yes               |                                                                                  |
| Lateral Subqueries        | Yes               |                                                                                  |
| User-Specified Aliases    | Yes               |                                                                                  |
| GROUP BY                  | Yes               | [Documentation](/docs/references/sqlreference/queries/#group-by)                 |
| HAVING                    | Yes               | [Documentation](/docs/references/sqlreference/queries/#group-by)                 |
| GROUPING SETS             | Yes               |                                                                                  |
| CUBE                      | Yes               |                                                                                  |
| ROLLUP                    | Yes               |                                                                                  |
| WINDOW Functions          | Yes               | [Documentation](/docs/references/sqlreference/queries/#window-functions)         |
| WITH                      | Yes               | [Documentation](/docs/references/sqlreference/queries/#common-table-expressions) |
| WITH RECURSIVE            | Yes               |                                                                                  |
| UNION                     | Yes               |                                                                                  |
| UNION ALL                 | Yes               |                                                                                  |
| INTERSECT                 | Yes               |                                                                                  |
| EXCEPT                    | Yes               |                                                                                  |
| ORDER BY                  | Yes               |                                                                                  |
| LIMIT                     | Yes               |                                                                                  |
| OFFSET                    | Yes               |                                                                                  |
| Table Generating Function | Yes               |                                                                                  |


## Data Types

### Types

| **Feature**                             | **Support State** |                                                     **Details** |
|-----------------------------------------|-------------------|----------------------------------------------------------------:|
| array                                   | Yes               | [Array Documentation](/docs/references/datatypes/array)         |
| bigint                                  | Yes               | [Integer Documentation](/docs/references/datatypes/integer)     |
| bigserial                               | No                |                                                                 |
| bit [ (n) ]                             | Yes               | [Bit Documentation](/docs/references/datatypes/bit)             |
| bit varying [ (n) ]                     | Yes               | [Bit Documentation](/docs/references/datatypes/bit)             |
| boolean                                 | Yes               | [Boolean Documentation](/docs/references/datatypes/boolean)     |
| box                                     | No                |                                                                 |
| bytea                                   | Yes               | [Blob Documentation](/docs/references/datatypes/blob)           |
| character [ (n) ]                       | Yes               | [Text Documentation](/docs/references/datatypes/text)           |
| character varying [ (n) ]               | Yes               | [Text Documentation](/docs/references/datatypes/text)           |
| cidr                                    | No                |                                                                 |
| circle                                  | No                |                                                                 |
| date                                    | Yes               | [Date Documentation](/docs/references/datatypes/date)           |
| double precision                        | Yes               | [Double Documentation](/docs/references/datatypes/double)       |
| inet                                    | No                |                                                                 |
| integer                                 | Yes               | [Integer Documentation](/docs/references/datatypes/integer)     |
| interval [ fields ] [ (p) ]             | Yes               | [Interval Documentation](/docs/references/datatypes/interval)   |
| json                                    | Yes               | [JSON Documentation](/docs/references/datatypes/json)           |
| jsonb                                   | Yes               | [JSON Documentation](/docs/references/datatypes/json)           |
| line                                    | No                |                                                                 |
| lseg                                    | No                |                                                                 |
| macaddr                                 | No                |                                                                 |
| macaddr8                                | No                |                                                                 |
| money                                   | No                |                                                                 |
| numeric [ (p, s) ]                      | Yes               | [Numeric Documentation](/docs/references/datatypes/numeric)     |
| path                                    | No                |                                                                 |
| pg_lsn                                  | No                |                                                                 |
| pg_snapshot                             | No                |                                                                 |
| point                                   | No                |                                                                 |
| polygon                                 | No                |                                                                 |
| real                                    | Yes               | [Double Documentation](/docs/references/datatypes/double)       |
| smallint                                | Yes               | [Integer Documentation](/docs/references/datatypes/integer)     |
| smallserial                             | No                |                                                                 |
| serial                                  | No                |                                                                 |
| text                                    | Yes               | [Text Documentation](/docs/references/datatypes/text)           |
| time [ (p) ] [ without time zone ]      | Yes               | [Time Documentation](/docs/references/datatypes/time)           |
| time [ (p) ] with time zone             | Yes               | [Time Documentation](/docs/references/datatypes/time)           |
| timestamp [ (p) ] [ without time zone ] | Yes               | [Timestamp Documentation](/docs/references/datatypes/timestamp) |
| timestamp [ (p) ] with time zone        | Yes               | [Timestamp Documentation](/docs/references/datatypes/timestamp) |
| tsquery                                 | No                |                                                                 |
| tsvector                                | No                |                                                                 |
| txid_snapshot                           | No                |                                                                 |
| uuid                                    | Yes               | [UUID Documentation](/docs/references/datatypes/uuid)           |
| xml                                     | No                |                                                                 |

### Operators & Functions

#### Logical
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| AND         | Yes               |             |
| OR          | Yes               |             |
| NOT         | Yes               |             |

#### Comparison
| **Feature**     | **Support State** | **Details** |
|-----------------|-------------------|-------------|
| <               | Yes               |             |
| >               | Yes               |             |
| <=              | Yes               |             |
| >=              | Yes               |             |
| =               | Yes               |             |
| <>              | Yes               |             |
| !=              | Yes               |             |
| BETWEEN         | Yes               |             |
| NOT BETWEEN     | Yes               |             |
| IS DISTINCT     | Yes               |             |
| IS NOT DISTINCT | Yes               |             |
| IS NULL         | Yes               |             |
| IS NOT NULL     | Yes               |             |
| IS TRUE         | Yes               |             |
| IS NOT TRUE     | Yes               |             |
| IS FALSE        | Yes               |             |
| IS NOT FALSE    | Yes               |             |
| IS UNKNOWN      | Yes               |             |
| IS NOT UNKNOWN  | Yes               |             |

#### Mathematical
| **Feature**   | **Support State** |         **Details** |
|---------------|-------------------|--------------------:|
| +             | Yes               |                     |
| -             | Yes               |                     |
| *             | Yes               |                     |
| /             | Yes               |                     |
| %             | Yes               |                     |
| ^             | Yes               |                     |
| \|/           | Yes               |                     |
| \|\|/         | Yes               |                     |
| @             | Yes               |                     |
| &             | Yes               |                     |
| \|            | Yes               |                     |
| #             | Yes               |                     |
| ~             | Yes               |                     |
| \<\<          | Yes               |                     |
| \>\>          | Yes               |                     |
| abs           | Yes               |                     |
| cbrt          | Yes               |                     |
| ceil          | Yes               |                     |
| degrees       | Yes               |                     |
| div           | Yes               |                     |
| erf           | No                |                     |
| erfc          | No                |                     |
| exp           | Yes               |                     |
| factorial     | No                | Exists as ! operand |
| floor         | Yes               |                     |
| gcd           | No                |                     |
| lcm           | No                |                     |
| ln            | Yes               |                     |
| log           | Yes               |                     |
| log10         | Yes               |                     |
| min_scale     | No                |                     |
| mod           | Yes               |                     |
| pi            | Yes               |                     |
| power         | Yes               |                     |
| radians       | No                |                     |
| round         | Yes               |                     |
| scale         | No                |                     |
| sign          | Yes               |                     |
| sqrt          | Yes               |                     |
| trim_scale    | No                |                     |
| trunc         | Yes               |                     |
| width_bucket  | Yes               |                     |
| random        | Yes               |                     |
| random_normal | No                |                     |
| setseed       | No                |                     |
| acos          | Yes               |                     |
| acosd         | No                |                     |
| asin          | Yes               |                     |
| asind         | No                |                     |
| atan          | Yes               |                     |
| atand         | No                |                     |
| atan2         | Yes               |                     |
| atan2d        | No                |                     |
| cos           | Yes               |                     |
| cosd          | No                |                     |
| cot           | Yes               |                     |
| cotd          | No                |                     |
| sin           | Yes               |                     |
| sind          | No                |                     |
| tan           | Yes               |                     |
| tand          | No                |                     |
| sinh          | No                |                     |
| cosh          | No                |                     |
| tanh          | No                |                     |
| asinh         | No                |                     |
| acosh         | No                |                     |
| atanh         | No                |                     |

#### String
| **Feature**           | **Support State** |                                           **Details** |
|-----------------------|-------------------|------------------------------------------------------:|
| \|\|                  | Yes               |                                                       |
| btrim                 | Yes               |                                                       |
| bit_length            | Yes               |                                                       |
| char_length           | Yes               |                                                       |
| lower                 | Yes               |                                                       |
| lpad                  | Yes               |                                                       |
| ltrim                 | Yes               |                                                       |
| normalize             | No                |                                                       |
| octet_length          | Yes               |                                                       |
| overlay               | Yes               |                                                       |
| position              | Yes               |                                                       |
| rpad                  | Yes               |                                                       |
| rtrim                 | Yes               |                                                       |
| substring             | Yes               | Currently not supporting regular expression arguments |
| trim                  | Yes               |                                                       |
| upper                 | Yes               |                                                       |
| ^@                    | No                |                                                       |
| ascii                 | Yes               |                                                       |
| chr                   | Yes               |                                                       |
| concat                | Yes               |                                                       |
| concat_ws             | Yes               |                                                       |
| format                | Yes               |                                                       |
| initcap               | Yes               |                                                       |
| left                  | Yes               |                                                       |
| length                | Yes               |                                                       |
| md5                   | Yes               |                                                       |
| parse_ident           | Yes               |                                                       |
| quote_ident           | Yes               |                                                       |
| quote_literal         | Yes               |                                                       |
| quote_nullable        | Yes               |                                                       |
| regexp_count          | No                |                                                       |
| regexp_instr          | No                |                                                       |
| regexp_like           | No                |                                                       |
| regexp_match          | Yes               |                                                       |
| regexp_matches        | Yes               |                                                       |
| regexp_replace        | Yes               | Currently not supporting replacing N'th match         |
| regexp_split_to_array | Yes               |                                                       |
| regexp_split_to_table | Yes               |                                                       |
| regexp_substr         | Yes               |                                                       |
| repeat                | Yes               |                                                       |
| replace               | Yes               |                                                       |
| reverse               | Yes               |                                                       |
| right                 | Yes               |                                                       |
| split_part            | Yes               |                                                       |
| starts_with           | Yes               |                                                       |
| string_to_array       | Yes               |                                                       |
| string_to_table       | No                |                                                       |
| strpos                | Yes               |                                                       |
| substr                | Yes               |                                                       |
| to_ascii              | No                |                                                       |
| to_hex                | Yes               |                                                       |
| translate             | Yes               |                                                       |
| unistr                | No                |                                                       |

#### Bytea
| **Feature**  | **Support State** |             **Details** |
|--------------|-------------------|------------------------:|
| \|\|         | Yes               |                         |
| bit_length   | Yes               |                         |
| btrim        | Yes               |                         |
| ltrim        | No                |                         |
| octet_length | Yes               |                         |
| overlay      | Yes               |                         |
| position     | Yes               |                         |
| rtrim        | No                |                         |
| substring    | Yes               |                         |
| trim         | Yes               | Only for BOTH direction |
| bit_count    | No                |                         |
| get_bit      | No                |                         |
| get_byte     | Yes               |                         |
| length       | Yes               |                         |
| md5          | Yes               |                         |
| set_bit      | Yes               |                         |
| set_byte     | Yes               |                         |
| sha224       | No                |                         |
| sha384       | No                |                         |
| sha512       | No                |                         |
| substr       | Yes               |                         |
| convert      | Yes               | Only for UTF8           |
| convert_from | Yes               | Only for UTF8           |
| convert_to   | Yes               | Only for UTF8           |
| encode       | Yes               |                         |
| decode       | Yes               |                         |

#### Bit
| **Feature**  | **Support State** | **Details** |
|--------------|-------------------|------------:|
| \|\|         | No                |             |
| &            | No                |             |
| \|           | No                |             |
| #            | No                |             |
| ~            | No                |             |
| \<\<         | No                |             |
| \>\>         | No                |             |
| bit_count    | Yes               |             |
| bit_length   | Yes               |             |
| length       | No                |             |
| octet_length | Yes               |             |
| overlay      | Yes               |             |
| position     | Yes               |             |
| substring    | Yes               |             |
| get_bit      | Yes               |             |
| set_bit      | Yes               |             |

#### Pattern Matching
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| LIKE        | Yes               |             |
| SIMILAR TO  | Yes               |             |

#### Data Type Formatting
| **Feature**  | **Support State** | **Details** |
|--------------|-------------------|-------------|
| to_char      | No                |             |
| to_date      | No                |             |
| to_number    | No                |             |
| to_timestamp | No                |             |

#### Date/Time
| **Feature**           | **Support State** | **Details**      |
|-----------------------|-------------------|------------------|
| +                     | Yes               |                  |
| -                     | Yes               |                  |
| *                     | Yes               |                  |
| /                     | Yes               |                  |
| age                   | Yes               |                  |
| clock_timestamp       | Yes               |                  |
| current_date          | Yes               |                  |
| current_time          | Yes               |                  |
| current_timestamp     | Yes               |                  |
| date_add              | No                | possible with +  |
| date_bin              | No                |                  |
| date_part             | Yes               |                  |
| date_subtract         | No                | possible with -  |
| date_trunc            | Yes               | Without timezone |
| extract               | Yes               |                  |
| isfinite              | No                |                  |
| justify_days          | Yes               |                  |
| justify_hours         | Yes               |                  |
| justify_interval      | Yes               |                  |
| localtime             | Yes               |                  |
| localtimestamp        | Yes               |                  |
| make_date             | No                |                  |
| make_interval         | No                |                  |
| make_time             | No                |                  |
| make_timestamp        | No                |                  |
| make_timestamptz      | Yes               |                  |
| now                   | Yes               |                  |
| statement_timestamp   | No                |                  |
| timeofday             | No                |                  |
| transaction_timestamp | No                |                  |
| to_timestamp          | Yes               |                  |
| OVERLAPS              | Yes               |                  |
| EXTRACT               | Yes               | Without timezone |

#### Enum
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| enum_first  | No                |             |
| enum_last   | No                |             |
| enum_range  | No                |             |


#### Geometric
| **Feature**  | **Support State** | **Details** |
|--------------|-------------------|-------------|
| +            | No                |             |
| -            | No                |             |
| *            | No                |             |
| /            | No                |             |
| @-@          | No                |             |
| @@           | No                |             |
| #            | No                |             |
| ##           | No                |             |
| <->          | No                |             |
| @>           | No                |             |
| <@           | No                |             |
| &&           | No                |             |
| \<\<         | No                |             |
| \>\>         | No                |             |
| &<           | No                |             |
| &>           | No                |             |
| \<\<\|       | No                |             |
| \|\>\>       | No                |             |
| &<\|         | No                |             |
| \|&>         | No                |             |
| <^           | No                |             |
| >^           | No                |             |
| ?#           | No                |             |
| ?-           | No                |             |
| ?\|          | No                |             |
| ?-\|         | No                |             |
| ?\|\|        | No                |             |
| ~=           | No                |             |
| area         | No                |             |
| center       | No                |             |
| diagonal     | No                |             |
| diameter     | No                |             |
| height       | No                |             |
| isclosed     | No                |             |
| isopen       | No                |             |
| length       | No                |             |
| npoints      | No                |             |
| pclose       | No                |             |
| popen        | No                |             |
| radius       | No                |             |
| slope        | No                |             |
| width        | No                |             |
| box          | No                |             |
| bounding_box | No                |             |
| circle       | No                |             |
| line         | No                |             |
| lseg         | No                |             |
| path         | No                |             |
| point        | No                |             |
| polygon      | No                |             |

#### Network
| **Feature**      | **Support State** | **Details** |
|------------------|-------------------|-------------|
| \<\<             | No                |             |
| \<\<=            | No                |             |
| \>\>             | No                |             |
| \>\>=            | No                |             |
| &&               | No                |             |
| ~                | No                |             |
| &                | No                |             |
| \|               | No                |             |
| +                | No                |             |
| -                | No                |             |
| abbrev           | No                |             |
| broadcast        | No                |             |
| family           | No                |             |
| host             | No                |             |
| hostmask         | No                |             |
| inet_merge       | No                |             |
| inet_same_family | No                |             |
| masklen          | No                |             |
| netmask          | No                |             |
| network          | No                |             |
| set_masklen      | No                |             |
| text             | No                |             |

#### Text Search
| **Feature**           | **Support State** | **Details** |
|-----------------------|-------------------|-------------|
| @@                    | No                |             |
| \|\|                  | No                |             |
| &&                    | No                |             |
| !!                    | No                |             |
| <->                   | No                |             |
| @>                    | No                |             |
| <@                    | No                |             |
| array_to_tsvector     | No                |             |
| get_current_ts_config | No                |             |
| length                | No                |             |
| numnode               | No                |             |
| plainto_tsquery       | No                |             |
| phraseto_tsquery      | No                |             |
| websearch_to_tsquery  | No                |             |
| querytree             | No                |             |
| setweight             | No                |             |
| strip                 | No                |             |
| to_tsquery            | No                |             |
| to_tsvector           | No                |             |
| json(b)_to_tsvector   | No                |             |
| ts_delete             | No                |             |
| ts_filter             | No                |             |
| ts_headline           | No                |             |
| ts_rank               | No                |             |
| ts_rank_cd            | No                |             |
| ts_rewrite            | No                |             |
| tsquery_phrase        | No                |             |
| tsvector_to_array     | No                |             |
| unnest                | No                |             |
| ts_debug              | No                |             |
| ts_lexize             | No                |             |
| ts_parse              | No                |             |
| ts_token_type         | No                |             |
| ts_stat               | No                |             |

#### UUID
| **Feature**            | **Support State** | **Details** |
|------------------------|-------------------|-------------|
| get_random_uuid        | Yes               |             |
| uuid_extract_timestamp | No                |             |
| uuid_extract_version   | No                |             |

#### XML
| **Feature**        | **Support State** | **Details** |
|--------------------|-------------------|-------------|
| xmltext            | No                |             |
| xmlcomment         | No                |             |
| xmlconcat          | No                |             |
| xmlelement         | No                |             |
| xmlforest          | No                |             |
| xmlpi              | No                |             |
| xmlroot            | No                |             |
| xmlagg             | No                |             |
| IS DOCUMENT        | No                |             |
| IS NOT DOCUMENT    | No                |             |
| XMLEXISTS          | No                |             |
| xml_is_well_formed | No                |             |
| xpath              | No                |             |
| xpath_exists       | No                |             |
| XMLTABLE           | No                |             |

#### JSON
| **Feature**               | **Support State** | **Details** |
|---------------------------|-------------------|-------------|
| ->                        | Yes               |             |
| -\>\>                     | Yes               |             |
| #>                        | No                |             |
| #\>\>                     | No                |             |
| @>                        | No                |             |
| <@                        | No                |             |
| ?                         | No                |             |
| ?\|                       | No                |             |
| ?&                        | No                |             |
| \|\|                      | No                |             |
| -                         | No                |             |
| #-                        | No                |             |
| @?                        | No                |             |
| @@                        | No                |             |
| to_json                   | No                |             |
| to_jsonb                  | No                |             |
| array_to_json             | No                |             |
| json_array                | No                |             |
| row_to_json               | No                |             |
| json_build_array          | No                |             |
| jsonb_build_array         | No                |             |
| json_build_object         | No                |             |
| jsonb_build_object        | No                |             |
| json_object               | No                |             |
| jsonb_object              | No                |             |
| IS JSON                   | No                |             |
| json_array_elements       | Yes               |             |
| jsonb_array_elements      | Yes               |             |
| json_array_elements_text  | No                |             |
| jsonb_array_elements_text | No                |             |
| json_array_length         | Yes               |             |
| jsonb_array_length        | No                |             |
| json_each                 | No                |             |
| jsonb_each                | No                |             |
| json_each_text            | No                |             |
| jsonb_each_text           | No                |             |
| json_object_keys          | No                |             |
| jsonb_object_keys         | No                |             |
| json_populate_record      | No                |             |
| jsonb_populate_record     | No                |             |
| json_populate_recordset   | No                |             |
| jsonb_populate_recordset  | No                |             |
| json_to_record            | No                |             |
| jsonb_to_record           | No                |             |
| json_to_recordset         | No                |             |
| jsonb_to_recordset        | No                |             |
| jsonb_set                 | No                |             |
| jsonb_set_lax             | No                |             |
| jsonb_insert              | No                |             |
| json_strip_nulls          | No                |             |
| jsonb_strip_nulls         | No                |             |
| json_path                 | No                |             |

#### Sequence Manipulation
| **Feature** | **Support State** | **Details**           |
|-------------|-------------------|-----------------------|
| nextval     | Yes               | Only with sequence ID |
| setval      | No                |                       |
| currval     | No                |                       |
| lastval     | No                |                       |

#### Conditional
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| CASE        | Yes               |             |
| COALESCE    | Yes               |             |
| NULLIF      | Yes               |             |
| GREATEST    | Yes               |             |
| LEAST       | Yes               |             |

#### Array
| **Feature**       | **Support State** | **Details**              |
|-------------------|-------------------|--------------------------|
| @>                | Yes               |                          |
| <@                | Yes               |                          |
| &&                | No                |                          |
| \|\|              | Yes               | Not for multidimensional |
| array_append      | Yes               |                          |
| array_cat         | Yes               |                          |
| array_dims        | Yes               |                          |
| array_fill        | Yes               |                          |
| array_lower       | Yes               |                          |
| array_ndims       | Yes               |                          |
| array_position    | Yes               |                          |
| array_positions   | Yes               |                          |
| array_prepend     | Yes               |                          |
| array_remove      | Yes               |                          |
| array_replace     | Yes               |                          |
| array_sample      | No                |                          |
| array_shuffle     | No                |                          |
| array_to_string   | Yes               |                          |
| array_upper       | Yes               |                          |
| array_cardinality | Yes               |                          |
| trim_array        | Yes               |                          |
| unnest            | Yes               | No multi-array expansion |

#### Range
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| @>          | No                |             |
| <@          | No                |             |
| &&          | No                |             |
| \<\<        | No                |             |
| \>\>        | No                |             |
| &<          | No                |             |
| &>          | No                |             |
| -\|-        | No                |             |
| +           | No                |             |
| *           | No                |             |
| -           | No                |             |
| lower       | No                |             |
| upper       | No                |             |
| isempty     | No                |             |
| lower_inc   | No                |             |
| upper_inc   | No                |             |
| lower_inf   | No                |             |
| upper_inf   | No                |             |
| range_merge | No                |             |
| multirange  | No                |             |
| unnest      | No                |             |

#### Aggregate Functions

##### Generic
| **Feature**           | **Support State** |                                                                                                        **Details** |
|-----------------------|-------------------|-------------------------------------------------------------------------------------------------------------------:|
| any_value             | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| array_agg             | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| avg                   | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| bit_and               | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| bit_or                | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| bit_xor               | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| bool_and              | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| bool_or               | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| count(*)              | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| count("any")          | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| json(b)_agg           | No                |                                                                                                                    |
| json(b)_objectagg     | No                |                                                                                                                    |
| json(b)_object_agg    | No                |                                                                                                                    |
| json_arrayagg         | No                |                                                                                                                    |
| max                   | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| min                   | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| range(_intersect)_agg | No                |                                                                                                                    |
| string_agg            | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| sum                   | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#general-purpose-functions) |
| xmlagg                | No                |                                                                                                                    |

##### Statistical
| **Feature**    | **Support State** |                                                                                                     **Details** |
|----------------|-------------------|----------------------------------------------------------------------------------------------------------------:|
| corr           | No                |                                                                                                                 |
| covar_pop      | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| covar_samp     | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_avgx      | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_avgy      | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_count     | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_intercept | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_r2        | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_slope     | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_sxx       | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_sxy       | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| regr_syy       | No                |                                                                                                                 |
| stddev         | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| stddev_pop     | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| stddev_samp    | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| variance       | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| var_pop        | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |
| var_samp       | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation/#statistical-aggregates) |

##### Ordered-Set
| **Feature**     | **Support State** |                                                                                                               **Details** |
|-----------------|-------------------|--------------------------------------------------------------------------------------------------------------------------:|
| mode            | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation//#ordered-set-aggregate-functions) |
| percentile_cont | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation//#ordered-set-aggregate-functions) |
| percentile_disc | Yes               | [Aggregate Function Documentation](/docs/references/sqlreference/functions/aggregation//#ordered-set-aggregate-functions) |

#### Window
| **Feature**  | **Support State** | **Details** |
|--------------|-------------------|-------------|
| row_number   | Yes               |             |
| rank         | Yes               |             |
| dense_rank   | Yes               |             |
| percent_rank | Yes               |             |
| cume_dist    | Yes               |             |
| ntile        | Yes               |             |
| lag          | Yes               |             |
| lead         | Yes               |             |
| first_value  | Yes               |             |
| last_value   | Yes               |             |
| nth_value    | Yes               |             |

#### Subquery
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| EXISTS      | Yes               |             |
| IN          | Yes               |             |
| NOT IN      | Yes               |             |
| ANY/SOME    | Yes               |             |
| ALL         | Yes               |             |

#### Array Comparison
| **Feature** | **Support State** | **Details** |
|-------------|-------------------|-------------|
| EXISTS      | Yes               |             |
| IN          | Yes               |             |
| NOT IN      | Yes               |             |
| ANY/SOME    | Yes               |             |
| ALL         | Yes               |             |

#### Set Returning
| **Feature**        | **Support State** | **Details** |
|--------------------|-------------------|-------------|
| generate_series    | Yes               |             |
| generate_subscript | No                |             |


