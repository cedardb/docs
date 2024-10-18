---
title: Backend Compatibility
next: /roadmap
weight: 93
---
Besides compatibility with the PostgreSQL [SQL dialect and protocol](../sql_features), CedarDB also supports a large part of the PostgreSQL backend system catalog, which is often used by external tools and clients to interact with the database system.
This page provides an overview of the currently supported system tables and views.

Since CedarDB does not share the PostgreSQL codebase and internal structures, some tables and views cannot have meaningful content and exist only for compatibility reasons. Catalog entries without meaningful content are marked as such.


## System Tables
| **Feature**              | **Support State** | **Meaningful Entries** | **Details**     |
|--------------------------|-------------------|------------------------|-----------------|
| pg_aggregate             | Yes               | No                     |                 |
| pg_am                    | Yes               | Yes                    | amhandler unset |
| pg_amop                  | Yes               | No                     |                 |
| pg_amproc                | Yes               | No                     |                 |
| pg_attrdef               | Yes               | No                     |                 |
| pg_attribute             | Yes               | Yes                    |                 |
| pg_authid                | Yes               | Yes                    |                 |
| pg_auth_members          | Yes               | No                     |                 |
| pg_cast                  | Yes               | No                     |                 |
| pg_class                 | Yes               | Yes                    |                 |
| pg_collation             | Yes               | Yes                    |                 |
| pg_constraint            | Yes               | Yes                    |                 |
| pg_conversion            | Yes               | No                     |                 |
| pg_database              | Yes               | Yes                    |                 |
| pg_db_role_setting       | Yes               | No                     |                 |
| pg_default_acl           | Yes               | No                     |                 |
| pg_depend                | Yes               | No                     |                 |
| pg_description           | Yes               | Yes                    |                 |
| pg_enum                  | Yes               | No                     |                 |
| pg_event_trigger         | Yes               | No                     |                 |
| pg_extension             | Yes               | No                     |                 |
| pg_foreign_data_wrapper  | Yes               | No                     |                 |
| pg_foreign_server        | Yes               | No                     |                 |
| pg_foreign_table         | Yes               | No                     |                 |
| pg_index                 | Yes               | Yes                    |                 |
| pg_inherits              | Yes               | No                     |                 |
| pg_init_privs            | Yes               | No                     |                 |
| pg_language              | Yes               | No                     |                 |
| pg_largeobject           | Yes               | No                     |                 |
| pg_largeobject_metadata  | Yes               | No                     |                 |
| pg_namespace             | Yes               | Yes                    |                 |
| pg_opclass               | Yes               | No                     |                 |
| pg_operator              | Yes               | No                     |                 |
| pg_opfamily              | Yes               | No                     |                 |
| pg_parameter_acl         | Yes               | No                     |                 |
| pg_partitioned_table     | Yes               | No                     |                 |
| pg_policy                | Yes               | No                     |                 |
| pg_proc                  | Yes               | Yes                    |                 |
| pg_publication           | Yes               | No                     |                 |
| pg_publication_namespace | Yes               | No                     |                 |
| pg_publication_rel       | Yes               | No                     |                 |
| pg_range                 | Yes               | No                     |                 |
| pg_replication_origin    | Yes               | No                     |                 |
| pg_rewrite               | Yes               | No                     |                 |
| pg_seclabel              | Yes               | No                     |                 |
| pg_sequence              | Yes               | No                     |                 |
| pg_shdepend              | Yes               | No                     |                 |
| pg_shdescription         | Yes               | No                     |                 |
| pg_shseclabel            | Yes               | No                     |                 |
| pg_statistic             | Yes               | No                     |                 |
| pg_statistic_ext         | Yes               | No                     |                 |
| pg_statistic_ext_data    | Yes               | No                     |                 |
| pg_subscription          | Yes               | No                     |                 |
| pg_subscription_rel      | Yes               | No                     |                 |
| pg_tablespace            | Yes               | No                     |                 |
| pg_transform             | Yes               | No                     |                 |
| pg_trigger               | Yes               | No                     |                 |
| pg_ts_config             | Yes               | No                     |                 |
| pg_ts_config_map         | Yes               | No                     |                 |
| pg_ts_dict               | Yes               | No                     |                 |
| pg_ts_parser             | Yes               | No                     |                 |
| pg_ts_template           | Yes               | No                     |                 |
| pg_type                  | Yes               | Yes                    |                 |
| pg_user_mapping          | Yes               | No                     |                 |

## System Views
| **Feature**                     | **Support State** | **Meaningful Entries** | **Details** |
|---------------------------------|-------------------|------------------------|-------------|
| pg_available_extensions         | No                | No                     |             |
| pg_available_extension_versions | No                | No                     |             |
| pg_backend_memory_contexts      | No                | No                     |             |
| pg_config                       | No                | No                     |             |
| pg_cursors                      | No                | No                     |             |
| pg_file_settings                | No                | No                     |             |
| pg_group                        | Yes               | Yes                    |             |
| pg_hba_file_rules               | No                | No                     |             |
| pg_indexes                      | Yes               | Yes                    |             |
| pg_locks                        | Yes               | No                     |             |
| pg_matviews                     | Yes               | No                     |             |
| pg_policies                     | Yes               | No                     |             |
| pg_prepared_statements          | No                | No                     |             |
| pg_prepared_xacts               | No                | No                     |             |
| pg_publication_tables           | No                | No                     |             |
| pg_replication_origin_status    | No                | No                     |             |
| pg_replication_slots            | No                | No                     |             |
| pg_roles                        | Yes               | Yes                    |             |
| pg_rules                        | No                | No                     |             |
| pg_seclabels                    | No                | No                     |             |
| pg_sequences                    | No                | No                     |             |
| pg_settings                     | Yes               | Yes                    |             |
| pg_shadow                       | Yes               | Yes                    |             |
| pg_shmem_allocations            | No                | No                     |             |
| pg_stats                        | No                | No                     |             |
| pg_stats_ext                    | No                | No                     |             |
| pg_stats_ext_exprs              | No                | No                     |             |
| pg_tables                       | Yes               | Yes                    |             |
| pg_timezone_abbrevs             | Yes               | Yes                    |             |
| pg_timezone_names               | Yes               | Yes                    |             |
| pg_user                         | Yes               | Yes                    |             |
| pg_user_mappings                | No                | No                     |             |
| pg_views                        | Yes               | Yes                    |             |
| pg_wait_events                  | No                | No                     |             |
