---
title: "Reference: Inet Type"
linkTitle: "Inet"
weight: 24
---

The `inet` type stores an IPv4 or IPv6 host address, optionally together with its subnet as a netmask length.
For example, `192.168.1.5/24` describes the host `192.168.1.5` in the subnet `192.168.1.0/24`.

{{< callout type="info" >}}
CedarDB currently only supports basic `inet` functionality.
PostgreSQL's network operators, functions (for example, `<<`, `host()`, or `masklen()`), the `cidr` type, and
non-standard prefix-only IPs (`10/24`) are not yet supported.
{{< /callout >}}

## Usage Example

```sql
create table connections (
    client inet,
    ts timestamp
);
insert into connections values
    ('192.168.1.226/24', now()),
    ('10.1.2.3', now()),
    ('10:23::f1/64', now()),
    ('::1', now());
select client from connections order by client;
```

```text
      client
------------------
 10.1.2.3
 192.168.1.226/24
 ::1
 10:23::f1/64
(4 rows)
```

## Input

`inet` values are written as `address/bits`, where `address` is an IPv4 or IPv6 address and `bits` is the netmask.
Omitting the `/bits` specifies a single host with a full netmask.

```sql
-- IPv4
select inet '192.168.1.226/24';
select inet '192.168.1.226';
-- IPv6
select inet '10:23::f1/64';
select inet '0000:0000:0000:0000:0000:0000:0000:0001';
-- IPv6 with the last 32 bits in dotted IPv4 notation
select inet '::4.3.2.1/24';
```

## Output

CedarDB prints `inet` values in their normalized RFC 3493 form, and omits the netmask in the output for a single hosts.
IPv6 addresses are printed in their shortest form, without leading zeros and with the longest run of zero groups
replaced by `::`:

```sql
select inet '10.1.2.3/32', inet '0000:0000:0000:0000:0000:0000:0000:0001/128', inet '8000:0000:0000:0000:0000:0000:0000:0000/1';
```

```text
   inet   | inet |  inet
----------+------+---------
 10.1.2.3 | ::1  | 8000::/1
(1 row)
```

## Comparison and Sorting

`inet` values support the regular comparison operators:
IPv4 addresses sort before IPv6 addresses.
Within the same address family, values are first compared by their network part, then by their netmask length,
and then by the full address.

```sql
select a from (values
    ('192.168.1.0/24'::inet),
    ('192.168.1.0/25'::inet),
    ('192.168.1.1/23'::inet),
    ('10:23::ffff'::inet),
    ('10.1.2.3'::inet)
) as i(a) order by a;
```

```text
       a
----------------
 10.1.2.3
 192.168.1.1/23
 192.168.1.0/24
 192.168.1.0/25
 10:23::ffff
(5 rows)
```

## Constraints

You can declare `PRIMARY KEY` and `UNIQUE` constraints on `inet` columns.
Two values are equal if they have the same address and netmask length, so `10.0.0.1` and `10.0.0.1/32` are duplicates.

```sql
create table gateways (
    address inet primary key,
    site text
);
insert into gateways values ('10.0.0.1', 'greenhouse');
insert into gateways values ('10.0.0.1/32', 'nursery');
```

```text
ERROR:  duplicate key value violates unique constraint "gateways_pkey"
DETAIL:  Key (address)=(10.0.0.1) already exists.
```

## Functions

### inet_client_addr

`inet_client_addr()` returns the IP address of the client connected to the current session, `NULL` for connections via
Unix domain socket.

```sql
select inet_client_addr();
```

```text
 inet_client_addr
------------------
 192.168.1.42
(1 row)
```

## PostgreSQL Differences

- The `cidr`, `macaddr`, and `macaddr8` types are not supported.
- The network operators, such as `<<`, `>>`, `&&`, `~`, `&`, `|`, `+`, and `-`, are not supported.
- The network functions, such as `masklen`, `family`, and `abbrev`, are not supported.
- The aggregates `min` and `max`, and arrays of `inet` (`inet[]`), are not supported.
