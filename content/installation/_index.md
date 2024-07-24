---
title: "CedarDB Installation"
linkTitle: "Installation"
weight: 110
sitemap_disable: true
sidebar:
    exclude: true
---
This page contains the installation instructions and release notes for CedarDB.
We recommend always upgrading to the latest version at release.

## Download
{{% steps %}}

### Get the current Dockerfile
Download the CedarDB Dockerfile below
{{< downloadbutton filename="Dockerfile" href="https://cedardb.com/download/Dockerfile" >}}
Download
{{< /downloadbutton >}}

{{% callout type="info" %}}
Unless otherwise agreed, CedarDB is licensed under the [CedarDB Demo license](/legal/agreements/cedardb_demo_lizenz.pdf).<br>
A non-binding English translation of this license is available [here](https://cedardb.com/legal/agreements/cedardb_demo_license.pdf).
{{% /callout %}}

### Build the CedarDB docker image
Build the docker image using the Dockerfile downloaded from the link above.

```shell
docker build --tag cedar /path/to/Dockerfile
```


### Get started with our _Getting Started_ guide

Follow our [Running in docker](/docs/getting_started/running_docker_image) guide to get CedarDB up and running.

From there, either dig in with your own datasets, e.g., [imported from PostgreSQL](/docs/cookbook/importing_from_postgresql), or start with one of our [example datasets](/docs/example_datasets).

{{% /steps %}}

{{% callout type="warning" %}}
CedarDB releases are still in alpha, and some releases will break with the old database file format. To ensure a smooth upgrade process, please keep track of your DDL statements to re-create your schema if necessary.
{{% /callout %}}

## Release Notes

### Current Release

{{< releasenotes current="true" >}}

### Older Versions

{{< releasenotes current="false" >}}
