---
title: CH-benCHmark
linkTitle: "CH-benCHmark"
weight: 20
---
The [CH-benCHmark](https://db.in.tum.de/research/projects/CHbenCHmark/?lang=en) bridges the gap between TPC-C, an OLTP (i.e., transactional) benchmark, and TPC-H, an OLAP (i.e., analytical) benchmark.

In contrast to many other benchmarks for hybrid workloads, CH-benCHmark runs its analytical queries on the same tables that are updated by the transactional queries.
This especially stresses the database's transaction subsystem as it has to ensure that all queries see a consistent state of the heavily write-contended tables.

## The Dataset

The data set consists of all nine [TPC-C](https://www.tpc.org/tpcc/) tables, and three additional [TPC-H](https://www.tpc.org/tpch/) tables.
It runs all 22 TPC-H queries in a slightly adapted form which uses the TPC-C base tables, ensuring analytical queries depend on the transactional updates of the TPC-C tables.

## Executing the benchmark

CMU's benchmarking tool [benchbase](https://github.com/cmu-db/benchbase/) comes with a CH-benCHmark configuration and is compatible with PostgreSQL.

{{% steps %}}

### Prepare a CedarDB instance

First install CedarDB [locally](../get_started/install_locally) or alternatively [via Docker](../get_started/install_with_docker).

```shell
curl https://get.cedardb.com | bash
./cedar/cedardb
```

### Set up benchbase

CedarDB requires a slight modification to the upstream benchbase project, which is maintained [in a fork](https://github.com/cedardb/benchbase/). 
Following the [quickstart instructions](https://github.com/cedardb/benchbase/#quickstart), set up benchbase:

```shell
git clone --depth 1 https://github.com/cedardb/benchbase.git
cd benchbase
./mvnw clean package -P postgres
cd target
tar xvzf benchbase-postgres.tgz
cd benchbase-postgres
```

The benchmark config file specifies the workload parameters.
The following file specifies the CH workload with scale factor 100, which is about 10&nbsp;GB data.

```xml {filename="config.xml"}
<parameters>
    <!-- Connection details,  -->
    <type>POSTGRES</type>
    <driver>org.postgresql.Driver</driver>
    <url>jdbc:postgresql://localhost:5432/postgres?sslmode=disable&amp;ApplicationName=chbenchmark&amp;reWriteBatchedInserts=true</url>
    <username>postgres</username>
    <password>postgres</password>
    <reconnectOnConnectionFailure>true</reconnectOnConnectionFailure>
    <batchsize>128</batchsize>
    <scalefactor>100</scalefactor>
    <terminals>101</terminals>
    <works>
        <work>
            <warmup>60</warmup>
            <time>120</time>
            <rate bench="tpcc">unlimited</rate>
            <rate bench="chbenchmark">unlimited</rate>
            <weights bench="tpcc">45,43,4,4,4</weights>
            <weights bench="chbenchmark">3, 2, 3, 2, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5</weights>
            <active_terminals bench="tpcc">100</active_terminals>
            <active_terminals bench="chbenchmark">1</active_terminals>
        </work>
    </works>
    <transactiontypes bench="chbenchmark">
        <transactiontype><name>Q1</name></transactiontype>
        <transactiontype><name>Q2</name></transactiontype>
        <transactiontype><name>Q3</name></transactiontype>
        <transactiontype><name>Q4</name></transactiontype>
        <transactiontype><name>Q5</name></transactiontype>
        <transactiontype><name>Q6</name></transactiontype>
        <transactiontype><name>Q7</name></transactiontype>
        <transactiontype><name>Q8</name></transactiontype>
        <transactiontype><name>Q9</name></transactiontype>
        <transactiontype><name>Q10</name></transactiontype>
        <transactiontype><name>Q11</name></transactiontype>
        <transactiontype><name>Q12</name></transactiontype>
        <transactiontype><name>Q13</name></transactiontype>
        <transactiontype><name>Q14</name></transactiontype>
        <transactiontype><name>Q15</name></transactiontype>
        <transactiontype><name>Q16</name></transactiontype>
        <transactiontype><name>Q17</name></transactiontype>
        <transactiontype><name>Q18</name></transactiontype>
        <transactiontype><name>Q19</name></transactiontype>
        <transactiontype><name>Q20</name></transactiontype>
        <transactiontype><name>Q21</name></transactiontype>
        <transactiontype><name>Q22</name></transactiontype>
    </transactiontypes>
    <transactiontypes bench="tpcc">
        <transactiontype><name>NewOrder</name></transactiontype>
        <transactiontype><name>Payment</name></transactiontype>
        <transactiontype><name>OrderStatus</name></transactiontype>
        <transactiontype><name>Delivery</name></transactiontype>
        <transactiontype><name>StockLevel</name></transactiontype>
    </transactiontypes>
</parameters>
```

### Run the benchmark

With CedarDB running and benchbase set up in the `benchbase-postgres` directory, the benchmark is ready to run.

```shell
# Set up the benchmark user for CedarDB using the same values as in config.xml
psql -h /tmp -U postgres -c "alter user postgres with password 'postgres';"

# Run the benchmark
java -jar benchbase.jar -b tpcc,chbenchmark -c config.xml --create=true --load=true --execute=true
```

Benchbase now generates and loads the initial dataset before running the workload query stream.
The initial data loading takes about 5&nbsp;minutes, which can be skipped with `--create=false --load=false` after the first run.

The config specifies a warm-up time of 60&nbsp;seconds to ensure data is cached, and afterward runs the benchmark for 120&nbsp;seconds.

### Results

After the benchmark run, benchbase prints a detailed report of the workload.
The following is an example run on AWS with EBS. TODO: @ChrisWint please add the specifics.

```text
Completed Transactions:
com.oltpbenchmark.benchmarks.tpcc.procedures.NewOrder/01                         [2257376] ********************************************************************************
com.oltpbenchmark.benchmarks.tpcc.procedures.Payment/02                          [2178734] *****************************************************************************
com.oltpbenchmark.benchmarks.tpcc.procedures.OrderStatus/03                      [ 202457] *******
com.oltpbenchmark.benchmarks.tpcc.procedures.Delivery/04                         [ 202717] *******
com.oltpbenchmark.benchmarks.tpcc.procedures.StockLevel/05                       [ 202556] *******
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q1/06                           [      1]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q2/07                           [      2]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q3/08                           [      2]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q4/09                           [      1]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q5/10                           [      0]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q6/11                           [      4]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q7/12                           [      0]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q8/13                           [      3]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q9/14                           [      6]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q10/15                          [      4]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q11/16                          [      1]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q12/17                          [      4]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q13/18                          [      5]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q14/19                          [      2]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q15/20                          [      4]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q16/21                          [      1]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q17/22                          [      3]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q18/23                          [      4]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q19/24                          [      7]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q20/25                          [      7]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q21/26                          [      2]
com.oltpbenchmark.benchmarks.chbenchmark.queries.Q22/27                          [      4]
```

The two key CH-benCHmark metrics can be derived from these numbers:

**tpmC** (new-order transactions per minute, the standard TPC-C throughput metric):

```text
2.257.376 NewOrder tx / 120s * 60 = 1.128.688 tpmC
```

**QphH** (analytical queries per hour, summing all 22 CH query completions):

```text
67 queries / 120s * 3600 = 2.010 QphH
```

{{% /steps %}}
