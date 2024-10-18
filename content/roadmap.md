---
title: "Feature Roadmap for CedarDB"
linkTitle: "Roadmap"
prev: /compatibility
weight: 100
---

This page provides a brief overview of the most important CedarDB [database](#database-features) and [enterprise](#enterprise-features) features that are next on our roadmap. Information about intermediate status of features and minor features will be available in our release notes.

We categorise the status of the features on this page as planned, in progress, and fully available:

| **State**          |               **Icon** |
|--------------------|-----------------------:|
| Planned            |   {{< iconplanned >}}  |
| Under Construction | {{< iconinprogress >}} |
| Available          |    {{< icondone >}}    |


A more detailed overview of our PostgreSQL compatibility level can be found on the separate [Compatibility](../compatibility/) page.
Features in progress are often already partially available in CedarDB.

We plan to update this page regularly to accurately reflect our progress and changes in feature prioritisation.

{{< callout type="info" >}}
If you feel that features that are important to you are missing from the list, feel free to drop us a line on [Slack](https://bonsai.cedardb.com/slack). We'd love to hear from you!
{{< /callout >}}

## Database Features
{{< callout type="info" >}}
This section contains information about planned core database features that we plan to make available to all users of CedarDB.
{{< /callout >}}


### Data Model & Domain-Specific Features
| **Feature**                  |              **State** | **Details**                                                |
|------------------------------|-----------------------:|------------------------------------------------------------|
| AsOf joins                   |    {{< icondone >}}    | [Documentation](/docs/references/advanced/asof_join/)      |
| Fulltext search              |   {{< iconplanned >}}  |                                                            |
| Enhanced graph query support |   {{< iconplanned >}}  |                                                            |
| Range types                  | {{< iconinprogress >}} |                                                            |
| Schema evolution             | {{< iconinprogress >}} | [Documentation](/docs/references/sqlreference/statements/) |
| Vector support               | {{< iconinprogress >}} | [Documentation](/docs/references/advanced/pgvector/)       |

### Data Formats
| **Feature**           |              **State** | **Details**                                                |
|-----------------------|-----------------------:|------------------------------------------------------------|
| Parquet reader        |   {{< iconplanned >}}  |                                                            |
| Parquet writer        |   {{< iconplanned >}}  |                                                            |
| Iceberg support       |   {{< iconplanned >}}  |                                                            |
| pg_dump compatibility | {{< iconinprogress >}} | [Documentation](/docs/cookbook/importing_from_postgresql/) |

### Connectivity
| **Feature**                    |              **State** | **Details**                                      |
|--------------------------------|-----------------------:|--------------------------------------------------|
| PostgreSQL system tables       |    {{< icondone >}}    | [Documentation](/docs/compatibility/backend/)    |
| information_schema support     | {{< iconinprogress >}} | [Documentation](/docs/compatibility/backend/)    |
| PostgreSQL Logical replication | {{< iconinprogress >}} |                                                  |
| Support for more CDC tools     | {{< iconinprogress >}} | [Documentation](/docs/cookbook/aurora_debezium/) |

## Enterprise Features
{{< callout type="info" >}}
This section contains features that are primarily intended for enterprise customers and are most relevant to large-scale production use of CedarDB. These features may not be available to all CedarDB users.
{{< /callout >}}

### Operations
| **Feature**                 |           **State** | **Details** |
|-----------------------------|--------------------:|-------------|
| Read replication to CedarDB | {{< iconplanned >}} |             |
| Automatic failover          | {{< iconplanned >}} |             |
| Automatic backups           | {{< iconplanned >}} |             |
| Point-in-time recovery      | {{< iconplanned >}} |             |
| Encryption at rest          | {{< iconplanned >}} |             |
| Query progress tracking     | {{< iconplanned >}} |             |

### Multi Tenancy
| **Feature**                            |              **State** | **Details** |
|----------------------------------------|-----------------------:|-------------|
| Resource limits for individual tenants |   {{< iconplanned >}}  |             |
| Extended role & grant management       | {{< iconinprogress >}} |             |
| Fair scheduling over multiple tenants  |   {{< iconplanned >}}  |             |
