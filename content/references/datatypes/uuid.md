---
title: "Reference: UUID Type"
linkTitle: "UUID"
weight: 24
---

UUIDs are universally unique identifiers that can be used as synthetic keys in tables.
Each UUID is a 128&nbsp;bit value, that can be generated via the commands ```gen_random_uuid``` or ```uuidv7```. The former will utilize a generation algorithm as specified in [RFC&nbsp;4122](https://datatracker.ietf.org/doc/html/rfc4122), 
whereas the latter also utilizes timestamps in the generation process (see [RFC&nbsp;9562](https://datatracker.ietf.org/doc/html/rfc9562#name-example-of-a-uuidv7-value) for more details).
Both generation algorithms aim at having a high probability of generating no collisions.

{{< callout type="info" >}}
As an alternative to UUIDs, consider using auto-incrementing integer IDs smaller than 16&nbsp;Bytes. E.g.:
```sql
create table foo(id integer generated always as identity)
```
{{< /callout >}}

## Usage Example
### UUIDv4:
```sql
create table example (
    id uuid default gen_random_uuid()
);
insert into example select from generate_series(1, 3);
select id from example;
```

```
                  id                  
--------------------------------------
 32cee028-940a-42d8-a2ed-1a6ab8d7b5cc
 20157067-99ab-4a02-9816-877f8bdb57ee
 a3108569-3ce7-4f7c-b650-1f7b2b5012b3
(3 rows)
```


### UUIDv7:

```sql
create table example2 (
    id uuid default uuidv7()
);

insert into example2 select ;
insert into example2 select uuidv7();
-- To shift the current timestamp
insert into example2 select uuidv7('-1 hour');
select id from example2;
```

```
                  id                  
--------------------------------------
bcd9f4e7-efab-753a-af7c-f7e0c1efb458
bcd9f4e7-efae-75c4-beae-68b9afbbaff7
bcd9f4b2-4ac9-71bf-b20a-0f438c5702eb
(3 rows)
```

UUIDs are stored as 16&nbsp;Bytes, but always displayed as 32 standard hexadecimal characters.

## Input
UUIDs are case and hyphen insensitive and can be surrounded by braces:

```sql
-- All of the following literals are equivalent
select uuid 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11';
select uuid '{a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11}';
select uuid 'a0eebc999c0b4ef8bb6d6bb9bd380a11';
select uuid 'a0ee-bc99-9c0b-4ef8-bb6d-6bb9-bd38-0a11';
select uuid '{a0eebc99-9c0b4ef8-bb6d6bb9-bd380a11}';
```

## UUID Extraction Functions

### uuid_extract_version
Provided with a valid UUID, `uuid_extract_version` extracts the version in a `smallint`. Otherwise the function returns `NULL`.

```sql
select uuid_extract_version(gen_random_uuid());
----
4

select uuid_extract_version(uuidv7());
----
7

select uuid_extract_version('11111111-1111-1111-1111-111111111111'::uuid); --invalid uuid
----
NULL
```

### uuid_extract_timestamp
`uuid_extract_timestamp` extracts the timestamp with time zone of a uuid of version 1 or 7. Otherwise, the function returns `NULL`.

```sql
SET timezone = 'Europe/Berlin'; --The timestamp displayed depends on the timezone

SELECT uuid_extract_timestamp('C232AB00-9414-11EC-B3C8-9F6BDECED846'::uuid); --version 1
----    
2022-02-22 20:22:22+01

SELECT uuid_extract_timestamp('017F22E2-79B0-7CC3-98C4-DC0C0C07398F'::uuid); --version 7
----
2022-02-22 20:22:22+01
```


