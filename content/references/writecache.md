---
title: Write Caching
linkTitle: "Write Caching"
weight: 70
---

Modern storage devices often have high speed caches that hide latency when reading or writing data.
However, to guarantee *durability*, CedarDB wants to write data to storage such that the data survives a sudden
power-loss event.
On most consumer hardware, forcing durability for each write is not efficient, and CedarDB employs optimizations like
group commit and write batching to ensure high throughput for your queries.

## Background

Write caching as implemented in most SSDs can be problematic for durability of written data.
For example, it might happen that you insert some new data and commit, but before your SSD has finished writing
everything to disk, the system looses power.
When data is cached in volatile memory, this can result in data loss.
However, this dangerous time span relatively short, usually in the range of a few milliseconds, depending on your
hardware.

One solution for this durability problem is to simply wait until storage has actually written the data with `fsync`,
before acknowledging the commit.
However, this leads to high idle and wait times for small writes.
CedarDB processes a transaction that writes a couple of KB in a couple of microseconds, but NAND flash in SSDs needs
about a millisecond (about 100x as long) to durably write the data.
This leads to long wait times for disk syncs and low utilization of the database.

For high-load scenarios, where dozens of clients write data, CedarDB batches all data into a single write, which
amortizes the durability overhead.
Nevertheless, the latency for these operations is still relatively high, but this increases the throughput with many
independent insert streams.

An alternative are enterprise SSDs, which feature *durable* write caches, often marketed as *"power-loss-protection"*.
These SSDs usually feature a small battery or capacitor which flushes the storage's write cache in the event of a
power-loss.
These devices are best suited for low write latency, but are only found on server hardware.
When possible, we recommend such devices for optimal performance and durability.

You can check if your storage uses write back caching via
the [Linux block sysfs](https://www.kernel.org/doc/Documentation/ABI/stable/sysfs-block):

```shell
cat /sys/block/nvme0n1/queue/write_cache
```

```
write through
```

Here, `nvme0n1` is the NVMe SSD used for the database.
If your device writes are directly durable, the output will be *"write through"*.
Otherwise, the output will be *"write back"*, indicating that data might not directly be durable after writing.

You can also verify if your NVMe SSD uses a volatile cache using the `nvme-cli` tool:

```shell
sudo nvme id-ctrl /dev/nvme0n1 -H | grep 'Write Cache'
```

```
  [0:0] : 0	Volatile Write Cache Not Present
```

## CedarDB Durability Guarantees

By default, CedarDB detects if your storage has a volatile write buffer, or if it runs on hardware where writes are
directly durable.
On enterprise hardware, where we have hardware support, we guarantee strong durability after each commit.
On commodity hardware, we default to asynchronous commits, which only guarantees delayed durability.
Written data on consumer hardware is still durable after a few milliseconds, however, we do not wait for the hardware
acknowledge the durability to avoid the high query latency.

{{< callout type="warning" >}}
If your application can not tolerate any data loss in case of a power failure, we recommend using enterprise SSDs.
{{< /callout >}}

To get durable writes on commodity hardware, you can force synchronous commits in your current connection with:

```sql
set async_commit = off;
```
