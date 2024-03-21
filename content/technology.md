---
title: "The Technology behind CedarDB"
linkTitle: "CedarDB's Technology"
prev: /
weight: 50
---

There is no single technical innovation responsible for CedarDB's speed.
Instead, CedarDB pushes the state of the art in many small, but meaningful ways, allowing it to optimally use all available system resources.

Here are a few highlights:

## Many-core execution
Modern servers usually come with a few dozen to a hundred CPU cores. Database systems have traditionally used inter-query-parallelism to make us of all cores (i.e., each query is executed by its own core). All modern database systems also use intra-query-parallelism (i.e., each query is processed by multiple cores in parallel), which is especially important when issuing few but very compute-intensive analytical queries. However, even this approach quickly runs into [Amdahl's Law](https://en.wikipedia.org/wiki/Amdahl%27s_law): The more cores one has available, the harder it becomes to keep all of them busy.

 ![Morsels in CedarDB](/images/morsels.svg)


CedarDB innovates by implementing morsel-driven parallelism. It divides each query into many morsels of a few thousand tuples each. Whenever a CPU core is done with its current job, it grabs a new morsel, i.e., a small chunk of data waiting to be processed. Since many more morsels are waiting to be processed than CPU cores, CedarDB can ensure that all cores stay busy until the end, as shown in the above picture. 


## Making use of all available RAM
Modern systems come equipped with large amounts of RAM. In contrast to most database systems, which assume that most data has to be loaded from disk (PostgreSQL, for example, defaults to 4 Megabytes of working memory per query!), CedarDB fully utilizes all system resources. Working sets that are smaller than RAM capacity thus run with in-memory speed. In such cases, CedarDB's query performance is primarily constrained by RAM bandwidth, which typically operates at speeds of around 100 Gigabytes per second.

Should the working set of a query be larger than RAM, CedarDB's sophisticated buffer manager ensures that data is read from and written to background storage, making full use of all storage device's bandwidth.  


## Fast SSD-centric I/O
Most database systems currently available for purchase originate from a time when it was reasonable to assume that storage is slow: A state-of-the-art Hard Disk (HDD) can read/write about 100 Megabytes per second with a spin-up time of 10 milliseconds. However, the landscape has since evolved dramatically: Modern Solid State Drives (SSDs) can deliver multiple gigabytes of data per second, boasting latency measured in microseconds.

Legacy database systems often struggle to fully exploit the throughput potential of modern SSDs due to hidden bottlenecks. For instance, to capitalize on the performance of modern SSDs, a database system needs to access them with multiple threads concurrently, leading to contention for the global lock of the buffer manager.

 ![Pointer Swizzling in CedarDB](/images/pointer_swizzling.svg)
CedarDB addresses this challenge using [Pointer Swizzling](https://en.wikipedia.org/wiki/Pointer_swizzling), a technique that decentralizes buffer management, making such a global lock obsolete, as seen in the above picture. Each pointer stores information whether the data it points to is currently in memory or swapped out to disk.
This is one of many innovations ensuring that CedarDB fully capitalizes on the speed and efficiency of modern SSD-based I/O.


## State-of-the-art query optimizer
CedarDB implements a full-fledged cost-based query optimizer extensively tested for extremely large queries (> 10'000 joins). The best query optimizer is worthless if it lacks insights about the underlying data. Therefore, CedarDB employs a sophisticated statistics subsystem, providing many estimates to the optimizer that other database systems do not have. For example, CedarDB can estimate relation size after group by operations or cardinalities after filtering for distinct values.

 ![Pointer Swizzling in CedarDB](/images/unnesting.svg)

As shown in the above picture, CedarDB's optimizer can also fully decorrelate very complex dependent subqueries, reducing them from quadratic runtime to linear runtime. This lets you express complex queries crunching terabytes of data intuitively without worrying about the impact on performance.

## Code generation
Most database systems today execute queries by interpreting them: 
They translate every query into an operator tree. They then instantiate all operators and pass data through this tree via function calls. 
This interpretation approach introduces overhead and requires data to be passed around between different operators. 
CedarDB, on the other hand, employs data-centric code generation. It generates custom machine code for each query it executes. 
Each query is thus compiled into a program that exactly does what the query requires (and nothing more).
This code generation approach completely sidesteps the interpretation overhead of database systems using the more traditional execution models.

 ![Codegen in CedarDB](/images/tightloops.svg)


However, the code generation approach introduces latency, as the code must be generated, optimized, and compiled to machine instructions. CedarDB sidesteps this issue by implementing a custom low-level language optimized for database workloads and designed for fast compilation to CPU instructions.
Furthermore, CedarDB implements adaptive query execution. Each query is started before compilation is finished and then recompiled multiple times with increasing optimization levels during runtime. 
This approach ensures that short-running queries are completed quickly without huge compilation overhead, while more complex long-running queries benefit from increased optimization.

 ![Codegen in CedarDB](/images/tpchprofiles.svg)
You can see effect of adaptive query execution in above picture. It compares the same query executed in three different modes. While compiling and optimizing a query has a significant overhead (the bar labeled 'C' in the middle), adaptively compiling the query while it is already running can significantly improve performance even for queries taking only 20 milliseconds!