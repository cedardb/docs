---
title: "VisuaLeaf"
linkTitle: "VisuaLeaf"
weight: 100
---

You can connect to CedarDB using [VisuaLeaf](https://visualeaf.com/), a cross-platform desktop database client for
Windows, macOS, and Linux. VisuaLeaf connects to CedarDB through its PostgreSQL connection type, so you can browse your
schema, run SQL queries, and view the results in a grid. It offers a free Community Edition as well as paid editions.

## Set up VisuaLeaf

{{% steps %}}

### Install VisuaLeaf

Install VisuaLeaf from its [download page](https://visualeaf.com/download).

### Add a CedarDB connection

After starting VisuaLeaf, click **New Connection** on the welcome screen to open the database picker.

<img src="/docs/images/visualeaf/1_new_connection.png" alt="VisuaLeaf database picker" style="max-width: 66%" loading="lazy" />

CedarDB speaks the PostgreSQL wire protocol, so search for `PostgreSQL` and select the **PostgreSQL** card.

<img src="/docs/images/visualeaf/2_select_postgresql.png" alt="selecting the PostgreSQL connection type" style="max-width: 66%" loading="lazy" />

In the next screen, enter your CedarDB connection settings: host, port (`5432` by default), database, user, and
password.

<img src="/docs/images/visualeaf/3_connection_form.png" alt="CedarDB connection settings" style="max-width: 66%" loading="lazy" />

### Test the connection

You can test the connection with the **Test Connection** button, which verifies your connection credentials.
When everything is correct, the test completes successfully. Then click **Save & Connect**.

<img src="/docs/images/visualeaf/4_test_connection.png" alt="successful connection test" style="max-width: 66%" loading="lazy" />

{{% /steps %}}

## Features

This is a brief overview of the features you can use with VisuaLeaf.

### Schema

The new connection appears in the **Connections** sidebar. Expand it to see the schemas of your database with their
tables, views, sequences, and procedures.

![schema overview](/images/visualeaf/5_object_tree.png)

### Queries

To write SQL queries, right-click the database and choose **New SQL Editor**.
In this editor, you can enter SQL scripts and run them against CedarDB with **Run All** (<kbd>F5</kbd>) or run the
current statement with **Run** (<kbd>F9</kbd>). Results are shown in a grid below the editor.

![query results](/images/visualeaf/6_query_results.png)
