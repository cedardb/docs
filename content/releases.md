---
title: "CedarDB Releases"
linkTitle: "Releases"
---

### Current Release

You can automatically [install the latest release](/docs/get_started/install_locally) using our helper script:

```shell
curl https://get.cedardb.com | bash
```

Or use the [CedarDB Docker container](/docs/get_started/install_with_docker):

```shell
docker pull cedardb/cedardb
```

{{% callout type="info" %}}
Try our [Quick Start](/docs/get_started/quickstart/). Fast to deploy. Faster to query.
{{% /callout %}}

For manual download, please choose the correct version for your system:

| System             |                                                  AMD64                                                  |                                                  ARM64                                                  |
|:-------------------|:-------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------:|
| current            | <a href="https://download.cedardb.com/latest/cedar-current-amd64.tar.xz">cedar-current-amd64.tar.xz</a> | <a href="https://download.cedardb.com/latest/cedar-current-arm64.tar.xz">cedar-current-arm64.tar.xz</a> |
| legacy<br>(<22.04) |  <a href="https://download.cedardb.com/latest/cedar-legacy-amd64.tar.xz">cedar-legacy-amd64.tar.xz</a>  |  <a href="https://download.cedardb.com/latest/cedar-legacy-arm64.tar.xz">cedar-legacy-arm64.tar.xz</a>  |

{{< releasenotes current="true" >}}

### Older Versions

{{< releasenotes current="false" >}}
