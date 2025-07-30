---
title: "Operate in the Cloud"
linkTitle: "Operate in the Cloud"
weight: 40
---

You can easily deploy CedarDB on your own AWS EC2 instances.

## Installation


Here's a quick setup example for running CedarDB in the cloud.

We recommend using the latest **Ubuntu LTS** release (i.e., Ubuntu 24.04 as of writing).


{{< tabs items="Native,Docker" >}}
  {{< tab >}}

    Install the psql shell:

    ```shell
    apt update
    apt install -y postgresql-client
    ```

    Download and launch CedarDB:
    ```shell
    curl https://get.cedardb.com | bash
    ./cedar/cedardb mydb --address=::
    ```

    For more details, see the [local installation guide](../install_locally).


  {{< /tab >}}
  {{< tab >}}

    Install docker and the psql shell:
    ```shell
    apt update
    apt install -y docker.io postgresql-client
    ```
    Start a CedarDB container:

    ```shell
    docker run -p 5432:5432 -e CEDAR_PASSWORD=test cedardb/cedardb
    ```
    For advanced usage and customization, refer to the [Docker setup guide](../install_with_docker).

  {{< /tab >}}
{{< /tabs >}}

{{< callout type="info" >}}
By using CedarDB, you agree to our [Terms and Conditions]({{< relref "/licensing.md" >}}).
{{< /callout >}}

---

## Instance sizing guidelines

When deploying CedarDB in the cloud, performance depends on three key resource dimensions:

- **Main Memory:** CedarDB caches hot data and intermediate query results in RAM. For best performance, choose an instance with enough memory to fit your working set.
- **CPU:** CedarDB scales seamlessly from a single core to hundreds. Analytical workloads benefit significantly from more CPU cores.
- **Storage:**
  * For **analytical workloads**, throughput is critical, especially for cold data not yet in memory.
  * For **transactional workloads**, durability and write latency are key.

### Recommended EC2 instance types

As a starting point:
* Use the [`m7a`](https://instances.vantage.sh/aws/ec2/m7a.4xlarge) range of instances with the `m7a.4xlarge` as a good baseline for bigger workloads.
* Choose the compute-optimized [`c7a`](https://instances.vantage.sh/aws/ec2/c7a.4xlarge) family for compute-heavy workloads where RAM demand is lower.
* Use the memory-optimized [`r7a`](https://instances.vantage.sh/aws/ec2/r7a.4xlarge) family if you have a large working set but latency is not as big of a concern.
* Use a network-optimized [`c6in`](https://instances.vantage.sh/aws/ec2/c6in.8xlarge) or [`m6in`](https://instances.vantage.sh/aws/ec2/m6in.8xlarge) family if you store your data on S3 and process large amounts of data.

## Storage guidelines

For an overview of AWS storage types, see: [EBS volume types](https://aws.amazon.com/ebs/volume-types/).

Recommendations by use case:

- **Analytical, read-heavy workloads:** Use `gp3` volumes. They are cost-efficient and sufficient when the working set fits into memory.
- **High durability and transactional throughput:** Use `io2` volumes with enough provisioned IOPS to ensure consistent latency and reliability.
- **Ephemeral storage for temporary workloads:** If you don't need persistence across instance shutdowns, instances with attached ephemeral NVMe SSDs offer fast, low-latency storage at a lower price. This is a good fit for: Batch workloads, temporary database instances, or situations where data is already backed up elsewhere.


{{% callout type="info" %}}
Want to store your data on S3 instead for increased performance and much lower cost?
[Contact us](mailto:sales@cedardb.com) for a preview of CedarDB's S3-backed relations!
{{% /callout %}}
