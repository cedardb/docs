---
title: Ecosystem and Client Compatibility
weight: 92
---

CedarDB is compatible with the PostgreSQL protocol version 3 and aims to support many PostgreSQL-compatible tools and connectors out of the box.
Since CedarDB does not share a codebase with PostgreSQL and we are still in the process of achieving full [backend compatibility](../backend), not all functionality will work out of the box.
This page contains a list of clients, libraries, and other ecosystem components that we have verified to work with CedarDB. This list is by no means exhaustive, and many other tools should work as well.

{{< callout type="info" >}}
If you come across something you feel is missing from the list, feel free to drop us a line on [Slack](https://bonsai.cedardb.com/slack) or [add it to the docs](https://github.com/cedardb/docs) directly.
{{< /callout >}}


## Supported Clients and Libraries
Through both [SQL dialect](../sql_features) and [backend](../backend) compatibility, CedarDB works with a wide range of PostgreSQL connectors for end-user tools like Graphana and programming language drivers like JDBC.


### Applications
| **Application** | **Version** | **Support State** | **Details**                              |
|-----------------|-------------|-------------------|------------------------------------------|
| DataGrip        | 2024.2.2    | Partial           | [Documentation](/docs/clients/dbeaver/)  |
| DBeaver         | 24.2.2      | Partial           | [Documentation](/docs/clients/datagrip/) |
| Grafana         | 10.4.2      | Partial           | [Documentation](/docs/clients/grafana/)  |

### Programming Language Libraries
| **Language** | **Framework**  | **Version** | **Support State** | **Details**                            |
|--------------|----------------|-------------|-------------------|----------------------------------------|
| C#           | Npgsql         | 8.0.4       | Full              | [Documentation](/docs/clients/csharp/) |
| C++          | libpqxx        | 7.9.1       | Full              | [Documentation](/docs/clients/cpp/)    |
| Java         | JDBC           | 42.7.4      | Full              | [Documentation](/docs/clients/java/)   |
| JavaScript   | node-postgres  | 8.13.0      | Full              | [Documentation](/docs/clients/js/)     |
| Python       | psycopg2       | 2.9.10      | Full              |                                        |
|              | psycopg        | 3.2.3       | Full              | [Documentation](/docs/clients/python/) |
| R            | RPostgres      | 1.4.7       | Full              | [Documentation](/docs/clients/r/)      |
| Rust         | tokio-postgres | 0.7.12      | Full              | [Documentation](/docs/clients/rust/)   |

## Extensions
Because extensions rely heavily on the internal structure of PostgreSQL, and because CedarDB does not share a codebase with PostgreSQL, CedarDB is generally not compatible with PostgreSQL extensions.
However, since the functionality provided by extensions complements use cases not covered by raw SQL, we plan to integrate the functionality of the most popular extensions into CedarDB with language and interface compatibility.

### pgvector
CedarDB supports vector similarity search with the same interface and behavior as the PosgreSQL extension [pgvector](https://github.com/pgvector/pgvector).
A more detailed description can be found in our [vector functionality documentation](/docs/references/advanced/pgvector/).
