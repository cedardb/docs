---
title: System Table Compatibility
next: /roadmap
weight: 93
---

Besides compatibility with the PostgreSQL [SQL dialect and protocol](../sql_features), CedarDB also supports a large
part of the PostgreSQL system table catalog in the `pg_catalog` schema.
These system tables contain information about the *system* state in the form of metadata.
This metadata is often used by external tools and clients to interact with the database system for introspection and
reflection, e.g., to show which tables exist.

This page provides an overview of the currently supported system tables and views.

- 🟢 **Fully supported features.**
- 🟡 **Since CedarDB does not share the PostgreSQL codebase and internal structures, some tables and views cannot have
  meaningful content and exist only for compatibility reasons.**
- 🔴 **Catalog entries without meaningful content.**

## System Tables

System tables provide a raw view into the state of the database system.
In contrast to PostgreSQL, system tables in CedarDB are *read-only*, and can only be indirectly influenced through
[DDL statements](/docs/references/sqlreference/statements/).

System tables often contain many low-level details.
For more accessible and friendly access to the same information, consider using the
built-in [system views](#system-views), or the SQL-standard [information schema](#information-schema).

| Feature                                                                                                   | Support State | Details                                                                                   |
|-----------------------------------------------------------------------------------------------------------|---------------|-------------------------------------------------------------------------------------------|
| [pg_aggregate](https://www.postgresql.org/docs/current/catalog-pg-aggregate.html)                         | 🟡            | Stores information about aggregate functions.                                             |
| [pg_am](https://www.postgresql.org/docs/current/catalog-pg-am.html)                                       | 🟢            | Contains information about access methods; amhandler is unset.                            |
| [pg_amop](https://www.postgresql.org/docs/current/catalog-pg-amop.html)                                   | 🟡            | Stores information about operators associated with access methods.                        |
| [pg_amproc](https://www.postgresql.org/docs/current/catalog-pg-amproc.html)                               | 🟡            | Contains information about support procedures associated with access methods.             |
| [pg_attrdef](https://www.postgresql.org/docs/current/catalog-pg-attrdef.html)                             | 🟢            | Stores column default values.                                                             |
| [pg_attribute](https://www.postgresql.org/docs/current/catalog-pg-attribute.html)                         | 🟢            | Contains information about table columns.                                                 |
| [pg_authid](https://www.postgresql.org/docs/current/catalog-pg-authid.html)                               | 🟢            | Stores information about database roles.                                                  |
| [pg_auth_members](https://www.postgresql.org/docs/current/catalog-pg-auth-members.html)                   | 🟡            | Tracks role memberships.                                                                  |
| [pg_cast](https://www.postgresql.org/docs/current/catalog-pg-cast.html)                                   | 🟡            | Contains information about type casts.                                                    |
| [pg_class](https://www.postgresql.org/docs/current/catalog-pg-class.html)                                 | 🟢            | Stores information about tables, indexes, sequences, and other relations.                 |
| [pg_collation](https://www.postgresql.org/docs/current/catalog-pg-collation.html)                         | 🟢            | Contains information about collations.                                                    |
| [pg_constraint](https://www.postgresql.org/docs/current/catalog-pg-constraint.html)                       | 🟢            | Stores information about table constraints.                                               |
| [pg_conversion](https://www.postgresql.org/docs/current/catalog-pg-conversion.html)                       | 🟡            | Contains information about encoding conversions.                                          |
| [pg_database](https://www.postgresql.org/docs/current/catalog-pg-database.html)                           | 🟢            | Stores information about databases.                                                       |
| [pg_db_role_setting](https://www.postgresql.org/docs/current/catalog-pg-db-role-setting.html)             | 🟡            | Contains per-role and per-database configuration settings.                                |
| [pg_default_acl](https://www.postgresql.org/docs/current/catalog-pg-default-acl.html)                     | 🟡            | Stores default access privileges.                                                         |
| [pg_depend](https://www.postgresql.org/docs/current/catalog-pg-depend.html)                               | 🟡            | Tracks dependencies between database objects.                                             |
| [pg_description](https://www.postgresql.org/docs/current/catalog-pg-description.html)                     | 🟢            | Stores optional descriptions (comments) for database objects.                             |
| [pg_enum](https://www.postgresql.org/docs/current/catalog-pg-enum.html)                                   | 🟡            | Contains information about enum types.                                                    |
| [pg_event_trigger](https://www.postgresql.org/docs/current/catalog-pg-event-trigger.html)                 | 🟡            | Stores information about event triggers.                                                  |
| [pg_extension](https://www.postgresql.org/docs/current/catalog-pg-extension.html)                         | 🟡            | Contains information about installed extensions.                                          |
| [pg_foreign_data_wrapper](https://www.postgresql.org/docs/current/catalog-pg-foreign-data-wrapper.html)   | 🟡            | Stores information about foreign-data wrappers.                                           |
| [pg_foreign_server](https://www.postgresql.org/docs/current/catalog-pg-foreign-server.html)               | 🟡            | Contains information about foreign servers.                                               |
| [pg_foreign_table](https://www.postgresql.org/docs/current/catalog-pg-foreign-table.html)                 | 🟡            | Stores information about foreign tables.                                                  |
| [pg_index](https://www.postgresql.org/docs/current/catalog-pg-index.html)                                 | 🟢            | Contains information about indexes.                                                       |
| [pg_inherits](https://www.postgresql.org/docs/current/catalog-pg-inherits.html)                           | 🟡            | Tracks table inheritance hierarchies.                                                     |
| [pg_init_privs](https://www.postgresql.org/docs/current/catalog-pg-init-privs.html)                       | 🟡            | Stores initial privileges of database objects.                                            |
| [pg_language](https://www.postgresql.org/docs/current/catalog-pg-language.html)                           | 🟡            | Contains information about procedural languages.                                          |
| [pg_largeobject](https://www.postgresql.org/docs/current/catalog-pg-largeobject.html)                     | 🟡            | Stores large object data.                                                                 |
| [pg_largeobject_metadata](https://www.postgresql.org/docs/current/catalog-pg-largeobject-metadata.html)   | 🟡            | Contains metadata for large objects.                                                      |
| [pg_namespace](https://www.postgresql.org/docs/current/catalog-pg-namespace.html)                         | 🟢            | Stores information about schemas.                                                         |
| [pg_opclass](https://www.postgresql.org/docs/current/catalog-pg-opclass.html)                             | 🟢            | Contains information about operator classes.                                              |
| [pg_operator](https://www.postgresql.org/docs/current/catalog-pg-operator.html)                           | 🟡            | Stores information about operators.                                                       |
| [pg_opfamily](https://www.postgresql.org/docs/current/catalog-pg-opfamily.html)                           | 🟡            | Contains information about operator families.                                             |
| [pg_parameter_acl](https://www.postgresql.org/docs/current/catalog-pg-parameter-acl.html)                 | 🟡            | Stores access privileges for server parameters.                                           |
| [pg_partitioned_table](https://www.postgresql.org/docs/current/catalog-pg-partitioned-table.html)         | 🟡            | Contains information about partitioned tables.                                            |
| [pg_policy](https://www.postgresql.org/docs/current/catalog-pg-policy.html)                               | 🟡            | Stores information about row-level security policies.                                     |
| [pg_proc](https://www.postgresql.org/docs/current/catalog-pg-proc.html)                                   | 🟢            | Contains information about functions and procedures.                                      |
| [pg_publication](https://www.postgresql.org/docs/current/catalog-pg-publication.html)                     | 🟡            | Contains all publications created in the database.                                        |
| [pg_publication_namespace](https://www.postgresql.org/docs/current/catalog-pg-publication-namespace.html) | 🟡            | Maps schemas to publications, supporting a many-to-many relationship.                     |
| [pg_publication_rel](https://www.postgresql.org/docs/current/catalog-pg-publication-rel.html)             | 🟡            | Maps relations (tables) to publications, supporting a many-to-many relationship.          |
| [pg_range](https://www.postgresql.org/docs/current/catalog-pg-range.html)                                 | 🟡            | Stores information about range types, supplementing entries in pg_type.                   |
| [pg_replication_origin](https://www.postgresql.org/docs/current/catalog-pg-replication-origin.html)       | 🟡            | Contains all replication origins created, shared across all databases in a cluster.       |
| [pg_rewrite](https://www.postgresql.org/docs/current/catalog-pg-rewrite.html)                             | 🟡            | Stores rewrite rules for tables and views.                                                |
| [pg_seclabel](https://www.postgresql.org/docs/current/catalog-pg-seclabel.html)                           | 🟡            | Stores security labels on database objects, manipulable with the SECURITY LABEL command.  |
| [pg_sequence](https://www.postgresql.org/docs/current/catalog-pg-sequence.html)                           | 🟢            | Contains information about sequences, with additional details in pg_class.                |
| [pg_shdepend](https://www.postgresql.org/docs/current/catalog-pg-shdepend.html)                           | 🟡            | Records dependency relationships between database objects and shared objects, like roles. |
| [pg_shdescription](https://www.postgresql.org/docs/current/catalog-pg-shdescription.html)                 | 🟡            | Stores optional descriptions (comments) for shared database objects.                      |
| [pg_shseclabel](https://www.postgresql.org/docs/current/catalog-pg-shseclabel.html)                       | 🟡            | Stores security labels for shared database objects.                                       |
| [pg_statistic](https://www.postgresql.org/docs/current/catalog-pg-statistic.html)                         | 🟡            | Stores statistical data about the contents of the database, used by the query planner.    |
| [pg_statistic_ext](https://www.postgresql.org/docs/current/catalog-pg-statistic-ext.html)                 | 🟡            | Stores extended statistics for columns, aiding in more accurate query planning.           |
| [pg_statistic_ext_data](https://www.postgresql.org/docs/current/catalog-pg-statistic-ext-data.html)       | 🟡            | Contains data for extended statistics objects.                                            |
| [pg_subscription](https://www.postgresql.org/docs/current/catalog-pg-subscription.html)                   | 🟡            | Stores information about logical replication subscriptions.                               |
| [pg_subscription_rel](https://www.postgresql.org/docs/current/catalog-pg-subscription-rel.html)           | 🟡            | Tracks the state of individual relations in a subscription.                               |
| [pg_tablespace](https://www.postgresql.org/docs/current/catalog-pg-tablespace.html)                       | 🟡            | Stores information about the available tablespaces.                                       |
| [pg_transform](https://www.postgresql.org/docs/current/catalog-pg-transform.html)                         | 🟡            | Stores information about transforms between data types and procedural languages.          |
| [pg_trigger](https://www.postgresql.org/docs/current/catalog-pg-trigger.html)                             | 🟡            | Contains information about triggers on tables.                                            |
| [pg_ts_config](https://www.postgresql.org/docs/current/catalog-pg-ts-config.html)                         | 🟡            | Stores text search configurations.                                                        |
| [pg_ts_config_map](https://www.postgresql.org/docs/current/catalog-pg-ts-config-map.html)                 | 🟡            | Maps text search configurations to dictionaries.                                          |
| [pg_ts_dict](https://www.postgresql.org/docs/current/catalog-pg-ts-dict.html)                             | 🟡            | Stores text search dictionaries.                                                          |
| [pg_ts_parser](https://www.postgresql.org/docs/current/catalog-pg-ts-parser.html)                         | 🟡            | Contains text search parsers.                                                             |
| [pg_ts_template](https://www.postgresql.org/docs/current/catalog-pg-ts-template.html)                     | 🟡            | Stores text search templates.                                                             |
| [pg_type](https://www.postgresql.org/docs/current/catalog-pg-type.html)                                   | 🟢            | Stores information about data types.                                                      |
| [pg_user_mapping](https://www.postgresql.org/docs/current/catalog-pg-user-mapping.html)                   | 🟡            | Contains information about user mappings for foreign data access.                         |

## System Views

System views provide convenient access to system information.
System tables often contain numeric identifiers, e.g., for the owner of tables.
The views instead use more human-readable symbolic names.

| Feature                                                                                                              | Support State | Details                                                                                                                 |
|----------------------------------------------------------------------------------------------------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------|
| [pg_available_extensions](https://www.postgresql.org/docs/current/view-pg-available-extensions.html)                 | 🟡            | Lists available extensions.                                                                                             |
| [pg_available_extension_versions](https://www.postgresql.org/docs/current/view-pg-available-extension-versions.html) | 🟡            | Shows available versions of extensions.                                                                                 |
| [pg_backend_memory_contexts](https://www.postgresql.org/docs/current/view-pg-backend-memory-contexts.html)           | 🟡            | Displays memory contexts of the backend.                                                                                |
| [pg_config](https://www.postgresql.org/docs/current/view-pg-config.html)                                             | 🔴            | Provides access to compile-time configuration parameters.                                                               |
| [pg_cursors](https://www.postgresql.org/docs/current/view-pg-cursors.html)                                           | 🔴            | Lists open cursors.                                                                                                     |
| [pg_file_settings](https://www.postgresql.org/docs/current/view-pg-file-settings.html)                               | 🔴            | Summarizes contents of configuration files.                                                                             |
| [pg_group](https://www.postgresql.org/docs/current/view-pg-group.html)                                               | 🟢            | Displays groups of database users.                                                                                      |
| [pg_hba_file_rules](https://www.postgresql.org/docs/current/view-pg-hba-file-rules.html)                             | 🔴            | Summarizes client authentication configuration file contents.                                                           |
| [pg_indexes](https://www.postgresql.org/docs/current/view-pg-indexes.html)                                           | 🟢            | Shows information about indexes.                                                                                        |
| [pg_locks](https://www.postgresql.org/docs/current/view-pg-locks.html)                                               | 🟡            | Displays locks currently held or awaited.                                                                               |
| [pg_matviews](https://www.postgresql.org/docs/current/view-pg-matviews.html)                                         | 🟡            | Lists materialized views.                                                                                               |
| [pg_policies](https://www.postgresql.org/docs/current/view-pg-policies.html)                                         | 🟡            | Displays information about policies.                                                                                    |
| [pg_prepared_statements](https://www.postgresql.org/docs/current/view-pg-prepared-statements.html)                   | 🟡            | Lists prepared statements.                                                                                              |
| [pg_prepared_xacts](https://www.postgresql.org/docs/current/view-pg-prepared-xacts.html)                             | 🔴            | Shows prepared transactions.                                                                                            |
| [pg_publication_tables](https://www.postgresql.org/docs/current/view-pg-publication-tables.html)                     | 🔴            | Displays publications and their associated tables.                                                                      |
| [pg_replication_origin_status](https://www.postgresql.org/docs/current/view-pg-replication-origin-status.html)       | 🔴            | Provides information about replication origins, including replication progress.                                         |
| [pg_replication_slots](https://www.postgresql.org/docs/current/view-pg-replication-slots.html)                       | 🔴            | Displays replication slot information.                                                                                  |
| [pg_roles](https://www.postgresql.org/docs/current/view-pg-roles.html)                                               | 🟢            | Lists database roles.                                                                                                   |
| [pg_rules](https://www.postgresql.org/docs/current/view-pg-rules.html)                                               | 🟡            | Shows information about rules.                                                                                          |
| [pg_seclabels](https://www.postgresql.org/docs/current/view-pg-seclabels.html)                                       | 🔴            | Displays security labels. Internal error: unknown function pg_type_is_visible                                           |
| [pg_sequences](https://www.postgresql.org/docs/current/view-pg-sequences.html)                                       | 🟡            | Lists sequences.                                                                                                        |
| [pg_settings](https://www.postgresql.org/docs/current/view-pg-settings.html)                                         | 🟢            | Provides access to parameter settings.                                                                                  |
| [pg_shadow](https://www.postgresql.org/docs/current/view-pg-shadow.html)                                             | 🟢            | Displays database users.                                                                                                |
| [pg_shmem_allocations](https://www.postgresql.org/docs/current/view-pg-shmem-allocations.html)                       | 🟡            | Shows shared memory allocations.                                                                                        |
| [pg_stats](https://www.postgresql.org/docs/current/view-pg-stats.html)                                               | 🔴            | Provides planner statistics. Internal error: unknown function row_security_active                                       |
| [pg_stats_ext](https://www.postgresql.org/docs/current/view-pg-stats-ext.html)                                       | 🔴            | Displays extended planner statistics. Internal error: unknown function pg_mcv_list_items                                |
| [pg_stats_ext_exprs](https://www.postgresql.org/docs/current/view-pg-stats-ext-exprs.html)                           | 🔴            | Shows extended planner statistics for expressions. Internal error: unknown function pg_get_statisticsobjdef_expressions |
| [pg_tables](https://www.postgresql.org/docs/current/view-pg-tables.html)                                             | 🟢            | Lists tables.                                                                                                           |
| [pg_timezone_abbrevs](https://www.postgresql.org/docs/current/view-pg-timezone-abbrevs.html)                         | 🟢            | Displays time zone abbreviations.                                                                                       |
| [pg_timezone_names](https://www.postgresql.org/docs/current/view-pg-timezone-names.html)                             | 🟢            | Lists time zone names.                                                                                                  |
| [pg_user](https://www.postgresql.org/docs/current/view-pg-user.html)                                                 | 🟢            | Shows database users.                                                                                                   |
| [pg_user_mappings](https://www.postgresql.org/docs/current/view-pg-user-mappings.html)                               | 🟡            | Displays user mappings.                                                                                                 |
| [pg_views](https://www.postgresql.org/docs/current/view-pg-views.html)                                               | 🟢            | Lists views.                                                                                                            |

## Information Schema

The `information_schema` is a standardized, cross-database schema that allows portable system introspection.
For compatibility, CedarDB follows
the [PostgreSQL Information Schema](https://www.postgresql.org/docs/current/information-schema.html),
which matches the [ISO/IEC 9075-11](https://www.iso.org/standard/76586.html) standard.

{{< callout type="info" >}}
The information schema views are *not* included in the default search path, so queries on it need to use the
fully qualified name:

```sql
select * from information_schema.tables;
```

{{< /callout >}}

| Table name                            | Support State | Details                                                                            |
|---------------------------------------|---------------|------------------------------------------------------------------------------------|
| information_schema_catalog_name       | 🟢            |                                                                                    |
| administrable_role_authorizations     | 🟢            |                                                                                    |
| applicable_roles                      | 🟢            |                                                                                    |
| attributes                            | 🟡            |                                                                                    |
| character_sets                        | 🟢            |                                                                                    |
| check_constraint_routine_usage        | 🟡            |                                                                                    |
| check_constraints                     | 🟢            |                                                                                    |
| collations                            | 🟢            |                                                                                    |
| collation_character_set_applicability | 🟢            |                                                                                    |
| column_column_usage                   | 🟡            |                                                                                    |
| column_domain_usage                   | 🟡            |                                                                                    |
| column_options                        | 🟡            |                                                                                    |
| column_privileges                     | 🟡            |                                                                                    |
| column_udt_usage                      | 🟢            |                                                                                    |
| columns                               | 🟢            |                                                                                    |
| constraint_column_usage               | 🟢            |                                                                                    |
| constraint_table_usage                | 🟢            |                                                                                    |
| data_type_privileges                  | 🟢            |                                                                                    |
| domain_constraints                    | 🟡            |                                                                                    |
| domain_udt_usage                      | 🟡            |                                                                                    |
| domains                               | 🟡            |                                                                                    |
| element_types                         | 🟢            |                                                                                    |
| enabled_roles                         | 🟢            |                                                                                    |
| foreign_data_wrapper_options          | 🔴            | Internal error: unknown function has_foreign_data_wrapper_privilege(integer, text) |
| foreign_data_wrappers                 | 🔴            | Internal error: unknown function has_foreign_data_wrapper_privilege(integer, text) |
| foreign_server_options                | 🟡            |                                                                                    |
| foreign_servers                       | 🟡            |                                                                                    |
| foreign_table_options                 | 🟡            |                                                                                    |
| foreign_tables                        | 🟡            |                                                                                    |
| key_column_usage                      | 🟢            |                                                                                    |
| parameters                            | 🟢            |                                                                                    |
| referential_constraints               | 🟢            |                                                                                    |
| role_column_grants                    | 🟡            |                                                                                    |
| role_routine_grants                   | 🟡            |                                                                                    |
| role_table_grants                     | 🟡            |                                                                                    |
| role_udt_grants                       | 🟡            |                                                                                    |
| role_usage_grants                     | 🟢            |                                                                                    |
| routine_column_usage                  | 🟡            |                                                                                    |
| routine_privileges                    | 🟡            |                                                                                    |
| routine_routine_usage                 | 🟡            |                                                                                    |
| routine_sequence_usage                | 🟡            |                                                                                    |
| routine_table_usage                   | 🟡            |                                                                                    |
| routines                              | 🟢            |                                                                                    |
| schemata                              | 🟢            |                                                                                    |
| sequences                             | 🟢            |                                                                                    |
| sql_features                          | 🟡            |                                                                                    |
| sql_implementation_info               | 🟡            |                                                                                    |
| sql_parts                             | 🟡            |                                                                                    |
| sql_sizing                            | 🟡            |                                                                                    |
| table_constraints                     | 🟢            |                                                                                    |
| table_privileges                      | 🟡            |                                                                                    |
| tables                                | 🟢            |                                                                                    |
| transforms                            | 🟡            |                                                                                    |
| triggered_update_columns              | 🟡            |                                                                                    |
| triggers                              | 🟡            |                                                                                    |
| udt_privileges                        | 🟡            |                                                                                    |
| usage_privileges                      | 🟡            |                                                                                    |
| user_defined_types                    | 🟡            |                                                                                    |
| user_mapping_options                  | 🟡            |                                                                                    |
| user_mappings                         | 🟡            |                                                                                    |
| view_column_usage                     | 🟡            |                                                                                    |
| view_routine_usage                    | 🟡            |                                                                                    |
| view_table_usage                      | 🟡            |                                                                                    |
| views                                 | 🟢            |                                                                                    |

