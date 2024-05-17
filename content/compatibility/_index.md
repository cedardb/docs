---
title: PostgreSQL compatibility
prev: /technology
next: /roadmap
weight: 90
---

CedarDB strives for full PostgreSQL compatibility wherever possible and sensible.
Within due time, this section will give an overview over which features are already supported and which will be available soon.


## Supported Features

### Clients

CedarDB is already fully wire protocol compatible with PostgreSQL. We are currently testing and adding support for all relevant clients.
For an overview of those we have already validated, see the [Clients page](../clients).

If you think an important client you depend on is missing, do not hesitate to get in touch!

### Query Language

CedarDB is built to be compatible with PostgreSQL's query language. For a first overview, take a look at the [Language Reference](../references).

## Planned Features

* Range types
* Enum types
* Accelerated full text search
* `pg_vector`

## Unsupported Features

### PostgreSQL extensions
CedarDB is built from the ground up independently from PostgreSQL.
As extensions heavily depend on the internal structure of PostgreSQL, CedarDB is not compatible with them.
However, we are integrating functionality of the most popular extensions into CedarDB.
For more information, see our [Roadmap](../roadmap).