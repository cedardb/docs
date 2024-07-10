---
title: "DBeaver"
linkTitle: "DBeaver"
weight: 100
---

You can connect to CedarDB using [DBeaver Community](https://dbeaver.io/), the free universal database tool.
You can use DBeaver to connect to CedarDB and view your database, manage your schema, and insert or update values in
tables.

## Set up DBeaver

{{% steps %}}

### Install DBeaver

Install DBeaver Community from its [download page](https://dbeaver.io/download/).

### Start DBeaver

After starting DBeaver, and before you connect to CedarDB, the initial interface will be empty.

![DBeaver interface](/images/dbeaver/1_start.png)

### Add a CedarDB connection

To connect to CedarDB, create a new database connection with the shown keyboard shortcut or by clicking the
corresponding <img src="/docs/images/dbeaver/2_connect_icon.png" alt="new database connection icon" style="display: initial; margin: 0;" loading="lazy" />
icon.
In the following wizard, you can use the PostgreSQL driver to connect to CedarDB.

<img src="/docs/images/dbeaver/3_connect.png" alt="connect to a database wizard" style="max-width: 66%" loading="lazy" />

In the next screen, enter your CedarDB connection settings like so:

<img src="/docs/images/dbeaver/4_connect_details.png" alt="CedarDB connection settings" style="max-width: 66%" loading="lazy" />

### Test the connection

You can test the connection with the "Test Connection ..." button, which verifies your connection credentials.
When everything is correct, the test completes successfully.

<img src="/docs/images/dbeaver/5_connect_test.png" alt="successful connection test" style="max-width: 33%" loading="lazy" />

In case your system needs advanced configuration, please refer to
the [official docs](https://dbeaver.com/docs/dbeaver/Create-Connection/).

{{% /steps %}}

## Features

This is a brief overview of the features you can use with DBeaver.
For more in-depth information, use
[DBeaver's getting started guide](https://dbeaver.com/docs/dbeaver/Basic-operations-with-DBeaver/).

### Schema

For an overview of your database, you can open its schemas in the database navigator view on the left.
This shows the current schema with all visible tables and their used storage space.
When you select a schema, you can also display an entity diagram showing all tables with their relations as connections
by foreign keys.

![schema overview](/images/dbeaver/6_schema.png)

### Tables

When selecting a table, you can see all its columns in the Properties tab shown below.
In the second tab, "Data", you can view and edit the data contained in the table.

![table details](/images/dbeaver/7_table.png)

### Queries

To write SQL queries, you can open the SQL Editor via the menu bar, or with the SQL toolbar entry.
In this editor, you can enter arbitrary SQL scripts and execute them in the current database.
This DBeaver SQL editor has convenient [auto-complete](https://dbeaver.com/docs/dbeaver/SQL-Assist-and-Auto-Complete/)
functionality to help you write SQL queries quickly.

![table details](/images/dbeaver/8_query.png)






