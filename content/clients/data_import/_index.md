---
title: "Data Import and CDC"
linkTitle: "Data Import and CDC"
---

Data integration and change data capture (CDC) tools that load data into CedarDB or keep it in sync with another
database.
CedarDB works with these tools through their PostgreSQL connectors, without a CedarDB-specific plugin.
For a step-by-step migration from PostgreSQL, including methods that need no extra tools,
see [Migrating from PostgreSQL](/docs/cookbook/importing_from_postgresql/).

* [Airbyte](./airbyte) — copy tables once
* [Debezium](./debezium) — replicate PostgreSQL changes continuously through Kafka, or copy a snapshot once
