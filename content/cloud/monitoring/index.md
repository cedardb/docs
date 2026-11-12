---
title: "Monitoring"
linkTitle: "Monitoring"
weight: 15
---

The **Monitoring** tab gives you a live view of how your instance is doing.

<video controls muted loop playsinline preload="metadata" poster="monitoring.jpg" style="display:block; width:100%; margin:1.5rem 0">
  <source src="monitoring.mp4" type="video/mp4">
</video>

Use the **Range** selector to look at the last 1 hour, 6 hours, or 24 hours, and refresh the page to pull in the latest data.

## Summary

The summary at the top shows the current values for:

- CPU utilization
- Storage used, out of the provisioned storage
- Open connections
- Uptime
- Transactions per second and the share of rolled back transactions
- Rows read and written per second

## Charts

Below the summary, charts show how these metrics develop over time, including CPU, memory pressure, connections (active, idle in transaction, idle), disk usage compared to the volume size, disk I/O, and network traffic.

Keep an eye on disk usage in particular.
Since storage is provisioned up front, contact support early if you expect to outgrow it.

## Sessions

The **Connections** chart links to the **Sessions** tab, where you can see what each connection is currently doing.
From there you can also cancel long-running or slow sessions.
