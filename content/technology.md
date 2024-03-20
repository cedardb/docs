---
title: "The Technology behind CedarDB"
linkTitle: "CedarDB's Technology"
prev: /
next: getting_started
weight: 2
---

There is no single technical innovation responsible for CedarDB's speed.
Instead, CedarDB pushes the state of the art in many small, but meaningful ways, allowing it to optimally use all available system resources.

In the following, we will present a few highlights:

## Many-core execution
Modern servers usually come with a few dozen to a hundred CPU cores.
To make us of all cores, database systems have traditionally used inter-query-parallelism (i.e., each query is executed by its own core).
All modern database systems also use intra-query-parallelism (i.e., each query is processed by multiple cores in parallel), which is specifically important when issuing few, but very compute intensive analytical queries.
However, even this approach quickly runs into [Amdahl's Law](https://en.wikipedia.org/wiki/Amdahl%27s_law):
The more cores one has available, the harder it becomes to keep all of them busy all the time.

CedarDB innovates by implementing morsel-based parallelism. Each query is divided into many morsels of a few thousand tuples each. Whenever a CPU core is done with its current job, it grabs a new morsel, i.e., a small chunk of data waiting to be processed.
Since there are a lot more morsels waiting to be processed than CPU cores, CedarDB can ensure that all cores stay busy until the end.



## Making use of all available RAM
Modern systems come equipped with large amounts of RAM.
In contrast to most database systems, which assume that most data has to be loaded from disk (PostgreSQL, for example, defaults to 4 Megabytes of working memory per query!), CedarDB fully utilizes all system resources.
Working sets smaller than RAM capacity thus run with in-memory speed. 
In such cases, CedarDB's query performance is primarily constrained by RAM bandwidth, which typically operates at speeds of around 100 Gigabytes per second.

Should the working set of a query be larger than RAM, CedarDB's sophisticated buffer manager ensures that data is read from and written to background storage, making full use of all storage device's bandwidth.  


## Fast SSD-centric I/O
Most database systems currently available purchase originate from a time where it was reasonable to assume that storage is slow: A state-of-the-art Hard Disk (HDD) was able to read/write about 100 Megabyes per second with a spin up time of 10 milliseconds.
However, the landscape has since evolved dramatically: Modern Solid State Drives (SSDs) can deliver multiple gigabytes of data per second, boasting latency measured in just microseconds.

Legacy database systems often struggle to fully exploit the throughput potential of modern SSDs due to hidden bottlenecks. For instance, to capitalize on the performance of modern SSDs, a database system needs to access them with multiple threads concurrently, leading to contention for the global lock of the buffer manager.
CedarDB addresses this challenge using [Pointer Swizzling](https://en.wikipedia.org/wiki/Pointer_swizzling), a technique that makes such a global lock obslete, ensuring that CedarDB fully capitalizes on the speed and efficiency of modern SSD-based I/O.

## State of the art query optimizer
CedarDB implements a full-fledged cost-based query optimizer that is extensively tested for extremely large queries (> 10'000 joins).
The best query optimizer is worthless if it has no insights about the underlying data. Therefore, CedarDB employs a sophisticated statistics subsystem, providing many estimates to the optimizer that other database systems do not have. For example, CedarDB can estimate relation size after group by operations, or cardinalities after filtering for distinct values. 


The optimizer can additionally fully decorrelate all dependent subqueries, reducing them from quadratic runtime to linear runtime.
This enables you to express complex queries crunching terabytes of data intuitively without worrying about the performance impact.


## Code generation
Most database system available today execute queries by interpreting them: Each query is translated into an operator tree. All operators are then instantiated and data is passed through this tree via function calls.
This interpretation approach introduces overhead and requires data to be passed around between different operators.
CedarDB, on the other hand, employs data centric code generation.
For each query, it generates custom machine code which it then executes. Each query is thus compiled into its own program exactly doing what the query requires (and nothing more).
This code generation approach completely sidesteps the interpretation overhead of database systems using the more traditional execution models.

 ![Codegen in CedarDB](/images/tightloops.svg)


The code generation approach, however, introduces latency, as the code has to be generated, optimized and compiled to machine instructions. CedarDB sidesteps this issue by implementing a custom low level language optimized for database workloads and designed for fast compilation to CPU instructions.
Furthermore, CedarDB implements adaptive query execution. Each query is started before compilation is finished and then recompiled multiple times with increasing optimization levels during runtime.
This approach ensures that short running queries are finished quickly without huge compilation overhead while more complex long running queries benefit from increased optimization.


