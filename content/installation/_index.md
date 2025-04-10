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

{{% callout type="info" %}}
Unless otherwise agreed, CedarDB is licensed under the [CedarDB Demo license](/legal/agreements/cedardb_demo_lizenz.pdf).<br>
A non-binding English translation of this license is available [here](https://cedardb.com/legal/agreements/cedardb_demo_license.pdf).
{{% /callout %}}


You have two options for running CedarDB: as a standalone binary or in Docker.
- [**Docker (recommended):**](#docker) This method offers several convenience features, including automated database upgrades and parameterized user initialization. If you're using macOS, Docker is required.
- [**Standalone binary:**](#standalone) Use this if you're in an environment without Docker or just want to experiment with the interactive SQL shell.

## Docker
{{% steps %}}

### Get the current Dockerfile
Download the CedarDB Dockerfile below
{{< downloadbutton filename="Dockerfile" href="https://cedardb.com/download/Dockerfile" >}}
Download
{{< /downloadbutton >}}


### Build the CedarDB docker image
Build the docker image using the Dockerfile downloaded from the link above.

```shell
docker build --tag cedardb /path/to/Dockerfile/directory
```


### Get started with our _Getting Started_ guide

Follow our [Running in docker](/docs/getting_started/running_docker_image) guide to get CedarDB up and running.

{{% /steps %}}


## Standalone
You can run CedarDB as a standalone binary. It works out of the box on any Linux distribution with glibc >= 2.27 (released in 2018).

{{% steps %}}

### Get the binary
Automatically download and decompress the correct CedarDB version with:
```sh
curl https://get.cedardb.com | bash
```

### Get started with our _Getting Started_ guide

Follow our [Running CedarDB natively](/docs/getting_started/running_natively) guide to get CedarDB up and running.

{{% /steps %}}

Congratulations, you are now running CedarDB! 
From here, either dig in with your own datasets, e.g., [imported from PostgreSQL](/docs/cookbook/importing_from_postgresql), or start with one of our [example datasets](/docs/example_datasets).


{{% callout type="warning" %}}
CedarDB releases are still in alpha, and some releases will break with the old database file format. To ensure a smooth upgrade process, please keep track of your DDL statements to re-create your schema if necessary.
{{% /callout %}}

## Release Notes

### Current Release

{{< releasenotes current="true" >}}

### Older Versions

{{< releasenotes current="false" >}}
