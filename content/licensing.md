---
title: "Licensing"
weight: 1000
---

CedarDB is available in three editions to suit different needs, from free usage to full enterprise:

| Type              | Description                                                                                                                                 |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| Community Edition | Free version of CedarDB with a 64 GiB database size limit and no enterprise features. Includes access to documentation and Slack for support. Find the license terms [here](https://cedardb.com/legal/agreements/community_tcs.pdf).   |
| Enterprise        | Full-featured CedarDB with all enterprise capabilities. License must be renewed as negotiated. Includes dedicated Enterprise support.                    |
| Enterprise Trial  | Time-limited trial of CedarDB Enterprise with all features. Includes Community Edition support (documentation and Slack).                                    |


## Obtain a license

- **Community Edition** is available free of charge under the [Community Edition license](https://cedardb.com/legal/agreements/community_tcs.pdf).
- To obtain an **Enterprise** license, [contact sales](mailto:sales@cedardb.com).
- To start an **Enterprise Trial**, visit the [self-service console](https://console.cedardb.com) for a 90-day trial license.

## Activate your license

### Via environment variable

Once you have your license key, you can activate it using an environment variable.
The method depends on how you're running CedarDB:

{{< tabs items="Native,Docker" >}}
  {{< tab >}} 

    Export your license key before starting CedarDB like this:
    ```shell
    export LICENSE_KEY='<your_key>'
    ./cedardb <your args>
    ```
  {{< /tab >}}
  {{< tab >}}

Pass the license key as environment variable when starting CedarDB (e.g., via `docker run`):
```Shell
docker run --rm -p 5432:5432 -e CEDAR_PASSWORD=test -e LICENSE_KEY='<your_key>' cedardb/cedardb
```
  {{< /tab >}}
{{< /tabs >}}

---

At startup, CedarDB logs the license activation:

```
LOG:     initializing license.key=<your_key> from environment variable
INFO:    License registered to Customer Name, valid until 2025-08-20.
INFO:    You're running CEDARDB ENTERPRISE EDITION.
```

### Via SQL
You can also activate a license while CedarDB is already running (e.g., without restarting) using SQL as a superuser:

```sql
set license.key='<your_key>'
```

{{% callout type="warning" %}}
This method does **not** persist across restarts.
Be sure to also set the environment variable to ensure your license is re-applied when CedarDB restarts.
{{% /callout %}}


## Monitor your license

You can see your license expiration date at the [CedarDB console](https://console.cedardb.com):

![console license page](/images/license.png)


## Renew your expired license

- To renew your **Enterprise** license, [contact sales](mailto:sales@cedardb.com).

- **Enterprise Trial** licenses cannot be renewed. To upgrade to an Enterprise license, [contact sales](mailto:sales@cedardb.com).

## FAQs

### What happens if I exceed the Community Edition data size limits?
Your database will enter *read-only* mode. You won’t be able to insert, update, or delete data, but:

- You can still query your data.
- You can export it using SQL statements like `COPY OUT` (to CSV) or tools like `pg_dump` (to SQL). 


### What happens when my Enterprise trial license expires?
Your database automatically reverts to the **Community Edition**:

- Enterprise features are disabled.
- If your database exceeds the 64 GiB limit, it will become read-only.
- You retain all your data, even if it exceeds the Community Edition limit.


### Can I chain multiple trials?

No, you can only obtain and activate a single trial license per database.

### Can I use CedarDB for academic research?

Yes. CedarDB has strong academic roots, and we’re happy to support research use cases.
If you would like to use CedarDB in your own research, [contact us](mailto:contact@cedardb.com).
