---
title: "Backups"
linkTitle: "Backups"
weight: 20
---

A backup holds everything in a project: all databases, tables, roles, and settings.
You can restore a backup into its project at any time, as often as you like.

You manage a project's backups on its **Backup & Restore** tab in CedarDB Cloud.

## Create a backup

<video controls muted loop playsinline preload="metadata" poster="backup.jpg" style="display:block; width:100%; margin:1.5rem 0">
  <source src="backup.mp4" type="video/mp4">
</video>

{{% steps %}}

### Open the Backup & Restore tab

Open the project in CedarDB Cloud and go to its **Backup & Restore** tab.

### Create the backup

Select **Create backup**.
Give the backup a name that helps you identify it later, for example before a risky migration.
Then select **Create backup** again to start it.

### Wait until it is available

The backup shows as **Creating** at first.
Once it shows as **Available**, you can restore it.

{{% /steps %}}

You can back up a project while it runs or while it is stopped.
A running database keeps serving queries during a backup.

The **Overview** shows when the project's last backup was taken and how much storage its backups use.
If the newest backup failed, the tab says so above the backup history.
Select **Show error** next to the failed backup to see why.

## Restore a backup

A restore replaces the project's data with the data from the backup.
Data written after the backup was taken is lost.

{{< callout type="warning" >}}
A restore can't be undone.
To keep the project's current data, create a backup of it first.
{{< /callout >}}

{{% steps %}}

### Choose the backup

On the project's **Backup & Restore** tab, select **Restore** next to the backup.

### Confirm the restore

Type the project's name to confirm, then select **Restore backup**.

### Follow the restore

The **Backup & Restore** tab shows how far the restore is:

1. **Preparing:** The database keeps running, but changes you make now are lost.
2. **Applying:** The database is unavailable.
3. **Restarting:** The database starts with the restored data.

{{% /steps %}}

Once the restore finishes, the backup it came from shows as **Restored** in the backup history.
If the project was stopped, it stays stopped, and starts with the restored data next time.

The backup stays available after the restore, so you can restore it again later.

## Delete a backup

On the project's **Backup & Restore** tab, select **Delete** next to the backup.
Type the backup's name to confirm, then select **Delete backup**.
A deleted backup can't be restored.
Backups stay until you delete them.

When you delete a project, CedarDB Cloud deletes its backups with it.

## Pricing

Each project includes three backups.
Each backup beyond these is billed by the hour for the project's full provisioned storage.
Delete backups you no longer need to keep costs down. They stop counting right away.

During the free trial, a project can have up to three backups.
To create another one, delete an existing backup first.
