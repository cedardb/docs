---
title: Configuration
linkTitle: "Configuration"
weight: 30
---

In this part of the documentation, we will show you settings to control CedarDB's resource usage, set your enterprise license, and highlight some of our expert configuration options.
Usually, configuring these options is unnecessary, as CedarDB uses strategies to automatically choose the best settings
for you.

## How to Set Configuration Options in CedarDB

All setting names are _case-insensitive_ and we support the following two ways to pass the values to CedarDB at startup time:

### Configuration File

The recommended way to set option values is via a config file. By default, CedarDB looks for it at `~/.cedardb/config`.

Each line in the file can either be a comment (starting with `#`) or a key-value pair of the form:
```text
"settingName" = "value" # optional inline comment
```
Example:
```shell
cat ~/.cedardb/config
# Comment only line
"verbosity" = "debug5" # Inline comment
"buffersize" = "1G" # Buffer pool size (cf. Memory Usage section)
"database.workmemsize" = "3G"
"license.key" = "<your_key>"
```

You can pass a custom path to the configuration file as a CLI option to `cedardb`, as shown in the following example:
```shell
cedardb --configFile=/your/path/cedardb_config <remaining arguments>
```

{{% callout type="info" %}}
Note that both the setting name and value must be *double-quoted*, even if the value is an integer.
{{% /callout %}}

### Environment Variable

You can also use environment variables for settings. Because dot (.) is not allowed in a variable name, you have to replace it with an underscore (_).
The following example has the same effect as the previous one with the config file.
```
export VERBOSITY=debug5
export BUFFERSIZE=1G
export DATABASE_WORKMEMSIZE=3G
export LICENSE_KEY=<your_key>
```

{{% callout type="info" %}}
A value set via an environment variable takes precedence over the value defined in the configuration file.
{{% /callout %}}

## Logging

CedarDB prints log messages to the standard error output stream (stderr, fd 2).
Depending on how you run CedarDB, the log messages will be printed to the terminal or your service manager.

When running CedarDB directly in Bash, you can redirect all log messages to a log file:

```bash
./cedardb mydb 2>> cedardb.log
```

When running CedarDB in Docker, you can access the log of the container:

```sh
docker logs cedardb_test
```

When running CedarDB with systemd, you can access the logs using from the journal:

```sh
journalctl -u cedardb
```

### Log Verbosity

By default, CedarDB logs only a few messages -- primarily errors. You can adjust the verbosity using the setting:

| **Setting Name** | **Description**                        | **Possible Values**                                                           | **Default** |
|------------------|----------------------------------------|-------------------------------------------------------------------------------|-------------|
| `verbosity`      | Sets the minimum level of log messages | debug5,...,debug1,info,notice,warning,error,log,fatal,panic | log         |

For troubleshooting, it can be helpful to increase the verbosity to a higher level.
This can have a noticeable impact on performance, and can generate lots of log messages.
Especially in high-traffic instances, verbosity should be kept low.
You can also change the verbosity at runtime through SQL:
```SQL
SET verbosity = 'debug1';
```

## Memory Usage

By default, CedarDB uses 45% of available system memory for its buffer manager and 45% as working memory during query processing.
If you are running applications beside CedarDB on your machine (e.g., your IDE or your browser)
while doing heavy query processing on big datasets, you may want to reduce this amount.

These settings must be set before starting CedarDB.

| **Setting Name**    | **Description**                                  | **Unit**                                | **Default**             |
|---------------------|--------------------------------------------------|-----------------------------------------|-------------------------|
| `buffersize`      | Buffer manager pool size                         | Size with unit suffix (5G, 256M, 1024K) | 45% of available memory |
| `database.workmemsize` | Amount of memory to be used before spooling disk | Same as above                           | 45% of available memory |


## Degree of parallelism

CedarDB also uses *all* threads of the system for best performance.
This is intended behaviour, but might generate high load on your machine.
If you want to keep other applications responsive, consider starting CedarDB with `nice`.
Alternatively, you can limit the number of threads CedarDB uses.
Note, however, that this will limit the performance of CedarDB, since all queries will take advantage of the full
parallelism of the system.
This stems from our superior [morsel-driven](https://db.in.tum.de/~leis/papers/morsels.pdf) parallelization strategy.
To change the parallelism, you can change the following setting:

| **Setting Name**    | **Description**                | **Unit** | **Default**                             |
|---------------------|--------------------------------|----------|-----------------------------------------|
| `parallel`      | Number of threads CedarDB uses | Integer  | #hardware threads (logical cores/vCPUs) |

## License
Enterprise license are passed as a setting named `license.key` to CedarDB.
We have detailed how to obtain one in the dedicated [licensing page](/docs/licensing).

## Advanced configuration

Although these settings are usually determined automatically, we will briefly discuss some of our advanced settings.

### Compilation strategy

CedarDB is a compiling database, so each query is compiled into machine executable code.
To do this, we first create our own intermediate representation (think LLVM-IR), which is then compiled into machine
code.
We provide several compilation backends:

- Adaptive `a`: Adaptively chooses the best backend according to the current execution of the query and changes the
  execution over the duration of the query. It starts with the fastest latency backend and gradually transitions to
  faster but higher latency backends (default).
- Interpreted `i`: Interprets the generated code with very low latency but achieves only low performance.
- DirectEmit `d`: Directly generates executable machine code from our intermediate representation with low latency and
  good query execution performance.
- Cheap `c`: Medium latency backend that compiles the intermediate representation with LLVM and few optimizations and
  good query execution performance.
- Optimized `o`: High latency backend that compiles the intermediate representation with LLVM and many optimizations for
  superior execution performance.

```sql
set compilationmode='a';
```
