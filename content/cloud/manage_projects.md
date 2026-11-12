---
title: "Manage Projects"
linkTitle: "Manage Projects"
weight: 10
---

You manage a project from its tabs in CedarDB Cloud.
The **Overview** tab starts and stops the instance and shows how to connect.
The **Settings** tab deletes the project.

## Start, stop, and restart

The status banner on the project's **Overview** tab shows whether the instance runs.

- **Stop** shuts the instance down. Your data stays in the project's storage.
- **Start** starts a stopped instance again.
- **Restart** stops and starts the instance. Open connections drop.

A stopped project is billed like a running one.

## Reset the password

On the **Connection** card of the **Overview** tab, select **Reset password**, then **Reset password** again to confirm.
CedarDB Cloud generates a new password for `cedar`.

{{< callout type="warning" >}}
Applications and saved connection strings that use the old password stop connecting.
Update them with the new connection string.
{{< /callout >}}

## Delete a project

{{% steps %}}

### Open the project's settings

Open the project and go to its **Settings** tab.

### Schedule the deletion

Under **Danger zone**, select **Delete project**.
Type the project's name to confirm, then select **Schedule deletion**.

{{% /steps %}}

The project stays available until the end of the month.
The **Settings** tab shows the date.
Until then, select **Keep project** to stop the deletion.
A trial project stays available until the end of the day.

Deleting a project also deletes its backups.
