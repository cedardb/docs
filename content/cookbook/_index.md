---
title: Data Cookbook
weight: 20

---

The Data Cookbook contains a collection of recipes for common tasks typically asked of database systems, along with
step-by-step instructions on how to accomplish them using CedarDB.

* [Import data from JSON](importing_from_json)
* [Import data from PostgreSQL](importing_from_postgresql)
  * [Copy with pg_dump](importing_from_postgresql/pg_dump)
  * [Migrate with minimal downtime](importing_from_postgresql/minimal_downtime)
  * [Replicate with AWS DMS](importing_from_postgresql/aws_dms)
* [Importing and working with CSV data](working_with_csv)

To replicate data continuously with Debezium or load data with Airbyte, see [Data Import and CDC](/docs/clients/data_import/).

In addition, you can also find some recipes for performance evaluation:

* [Benchmarking with ClickBench](clickbench)
* [Benchmarking with pgbench](pgbench)
