---
title: "CedarDB Cloud"
linkTitle: "CedarDB Cloud"
weight: 3
---

[CedarDB Cloud](https://cedardb.cloud) is the fully managed version of CedarDB.
You don't have to install, patch, or size anything yourself: create a project, connect with any PostgreSQL-compatible client, and start querying.

## Sign Up

1. Open the [CedarDB Cloud sign-up page](https://app.cedardb.cloud/signup/).
2. Enter your details and confirm your email address.
3. Sign in to the console at [app.cedardb.cloud](https://app.cedardb.cloud).

Your account belongs to an **organization**, which groups all of your projects.
Each database instance you run lives in its own **project**.

Payment details are bound to the organization.
When you launch your first project, you need to add a payment card.
It is verified before the project is created.

### Free Trial

You can try CedarDB Cloud with a free trial.
The free trial is available with a CedarDB I2 instance with up to 64 GiB of storage.

## Create an Instance

Every database instance is created as a project.

<video controls muted loop playsinline preload="metadata" poster="deploy.jpg" style="display:block; width:100%; margin:1.5rem 0">
  <source src="deploy.mp4" type="video/mp4">
</video>

1. In the console, open **Projects** and click **Create project**.
2. Fill out the form:
   - **Project Name:** A name that is unique across all projects.
   - **Region:** The region that hosts the project's storage and compute. Choose the one closest to your applications.
   - **Storage:** The provisioned storage for the project, in GiB.
   - **Instance Type:** The compute size of the instance, for example `Cloud I16`.
3. Check the **Price** box, which shows the monthly cost with a breakdown by instance, storage, and backups, as well as estimated invoices.
4. Click **Create project**.

Once the project status changes to **Running**, the instance is ready.
Use the **Query** page in the console to run SQL directly in your browser, or connect with any PostgreSQL-compatible client such as `psql`.
See the [client documentation](../clients) for connection examples.

## Monitor Your Instance

The **Monitoring** page gives you a live view of how your instance is doing.

<video controls muted loop playsinline preload="metadata" poster="monitoring.jpg" style="display:block; width:100%; margin:1.5rem 0">
  <source src="monitoring.mp4" type="video/mp4">
</video>

Use the **Range** selector to look at the last 1 hour, 6 hours, or 24 hours, and refresh the page to pull in the latest data.

The summary at the top shows the current values for:

- CPU utilization
- Storage used, out of the provisioned storage
- Open connections
- Uptime
- Transactions per second and the share of rolled back transactions
- Rows read and written per second

Below the summary, charts show how these metrics develop over time, including CPU, memory pressure, connections (active, idle in transaction, idle), disk usage compared to the volume size, disk I/O, and network traffic.
The **Connections** chart links to the **Sessions** page, where you can see what each connection is currently doing.
From this page you can also cancel long-running or slow sessions.

Keep an eye on disk usage in particular.
Since storage is provisioned up front, contact support early if you expect to outgrow it.

## Backups

The **Backup & Restore** page lists all backups of your project and shows when the last one was taken.

<video controls muted loop playsinline preload="metadata" poster="backup.jpg" style="display:block; width:100%; margin:1.5rem 0">
  <source src="backup.mp4" type="video/mp4">
</video>

To take a backup at any time:

1. Open **Backup & Restore** and click **Create backup**.
2. Enter a name that helps you identify the backup later, for example before a risky migration.
3. Click **Create backup**.

The backup appears in the **Backup history** with its name, type, status, size, and creation time.
Its status changes from *Creating* to ready once the snapshot is complete, and you can then manage it using the actions in the last column.

Three backups are included with every project.
Additional backups are billed at the full disk size, as shown in the price breakdown when you create a project.
Delete backups you no longer need to keep costs down.

## Delete a Project

To delete a project, open the project's **Settings** page in the console and delete it from there.

{{< callout type="warning" >}}
Deleting a project doesn't remove it immediately. The project is marked for deletion until the end of the month, and you can restore it until then. After that, the project and its data are permanently removed.
{{< /callout >}}

{{< callout type="warning" >}}
Trial projects marked for deletion are deleted at the end of the current day instead of at the end of the month.
{{< /callout >}}
