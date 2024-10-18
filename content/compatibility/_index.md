---
title: PostgreSQL Compatibility
prev: /technology
next: /compatibility/sql_features
weight: 90
---

CedarDB is compatible with the PostgreSQL wire protocol version 3.0 and large parts of the PostgreSQL SQL dialect.
In addition, CedarDB strives for full PostgreSQL compatibility wherever possible and reasonable, which often allows you to switch your applications and tools from PostgreSQL to CedarDB without any changes to your code.
However, since CedarDB does not share a codebase with PostgreSQL, not all PostgreSQL features can be implemented in CedarDB in a meaningful way.

This section provides an overview of PostgreSQL features that are already supported and known differences between CedarDB and PostgreSQL.


## Core SQL
CedarDB already supports the vast majority of the PostgreSQL syntax, with more to come over time. You can find a list of supported statements, types and functions in our [Core SQL Compatibility](sql_features) documentation.

## Ecosystem and Clients

CedarDB is already fully wire protocol compatible with PostgreSQL. We are currently testing and adding support for all relevant programming language integrations and front-end applications.
For an overview of those we have already validated, see the [Ecosystem and Client Compatibility](ecosystem_and_clients) page.

If you think an important client you depend on is missing, do not hesitate to contact us!

## Backend

To ensure client compatibility, CedarDB is also compatible with a large number of PostgreSQL system tables, views and functions. While these are probably not relevant to most users of either CedarDB or PostgreSQL, tools and tool developers rely heavily on this functionality. For more details, see the [backend compatibility](backend) page.

## Unsupported features
PostgreSQL has accumulated a lot of features over its decades of development, and we do not consider all of them relevant to CedarDB.
Therefore, CedarDB will not be compatible with PostgreSQL in the following functionality.

### Unsupported types
PostgreSQL provides extensive functionality for XML data types that we do not plan to support in CedarDB.
While we plan to support geometric and geospatial types, as well as text search functionality, the implementation will likely differ from PostgreSQL's types and interfaces.

### PostgreSQL Extensions
CedarDB is built from the ground up independent of PostgreSQL.
Since extensions rely heavily on the internal structure of PostgreSQL, CedarDB is not compatible with them.
However, we are integrating functionality from the most popular extensions into CedarDB.
For more information, see our information on [extensions](ecosystem_and_clients#extensions).
