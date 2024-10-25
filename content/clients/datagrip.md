---
title: "DataGrip"
linkTitle: "DataGrip"
weight: 100
---

You can connect to CedarDB using [DataGrip](https://www.jetbrains.com/datagrip/), the powerful cross-platform JetBrains
IDE for databases.
You can use DataGrip to connect to CedarDB and view your database, manage your schema, and insert or update values in
tables.

## Set up DataGrip

{{% steps %}}

### Install DataGrip

Install DataGrip according to the instructions on the [download page](https://www.jetbrains.com/datagrip/download/).

### Start DataGrip

After starting DataGrip, and before you connect to CedarDB, the initial interface will be empty.

![DataGrip interface](/images/datagrip/1_start.png)

### Add a CedarDB connection

To connect to CedarDB, create a new data source connection with the shown keyboard shortcut or by clicking the
"+" icon.
In the now open menu, select PostgreSQL

![data source menu](/images/datagrip/2_connect.png)

In the following wizard, enter your CedarDB connection settings like so:

<img src="/docs/images/datagrip/3_connect_details.png" alt="CedarDB connection settings" style="max-width: 66%" loading="lazy" />

After DataGrip has downloaded the driver, check your connection by clicking on the "Test Connection" button.
In case your system needs advanced configuration, please refer to the
[official documentation](https://www.jetbrains.com/help/datagrip/postgresql.html).

### Select schemas

After setting up the date source, you need to configure which schemas DataGrip should introspect and show.
To use all visible schemas of the database, select the corresponding checkbox and apply your changes.

![select all schemas](/images/datagrip/4_schemas.png)

{{% /steps %}}

## Features

This is a brief overview of the features you can use with DataGrip.
For more in-depth information, use
[DataGrips's getting started guide](https://www.jetbrains.com/help/datagrip/quick-start-with-datagrip.html).

### Tables

When you select a table in the Database Explorer, you can view and edit the data contained in the table.

![table view](/images/datagrip/5_table.png)

### Queries

To write SQL queries, you can open the Database console and enter arbitrary SQL to execute them in the current database.

![SQL console](/images/datagrip/6_query.png)
