---
title: "CedarDB Installation"
linkTitle: "Installation"
weight: 110
sitemap_disable: true
sidebar:
    exclude: true
---
{{% callout type="info" %}}
Unless otherwise agreed, CedarDB is licensed under the [CedarDB Demo license](/legal/agreements/cedardb_demo_lizenz.pdf).<br>
A non-binding English translation of this license is available [here](https://cedardb.com/legal/agreements/cedardb_demo_license.pdf).
{{% /callout %}}

{{% callout type="warning" %}}
CedarDB now includes license checks. If you have access to CedarDB, but are not subscribed to our waitlist, please get in touch on our [community Slack](https://bonsai.cedardb.com/slack).
{{% /callout %}}

This page contains the installation instructions and release notes for CedarDB.
We recommend always upgrading to the latest version at release.

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
docker build --no-cache --tag cedardb .
```


### Get started with our _Getting Started_ guide

Follow our [Running in docker](/docs/getting_started/running_docker_image) guide to get CedarDB up and running.

### Activate your enterprise license

To activate your license within a Docker container, it’s recommended to pass the license key using an additional enviornment flag during the `docker run` command.
```Shell
-e LICENSE_KEY='<your_key>'
```

For example, you can start your container with an active license like this:
```Shell
docker run --rm -p 5432:5432 -e CEDAR_PASSWORD=test -e LICENSE_KEY='<your_key>' --name cedardb_test cedardb
```

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


### Activate your enterprise license

To activate your license, it's recommended to set the license key using the following environment variable at startup.
```
LICENSE_KEY='<your_key>'
```
Alternatively, you can use the [SQL set command](/docs/references/sqlreference/statements/settings) `set license.key='<your_key>'`.
Note: This SQL setting is not persisted across database restarts.

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
