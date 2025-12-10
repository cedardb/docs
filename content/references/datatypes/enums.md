# Enum types

Just like in many programming languages, an enum type consist of a static, ordered set of labels defined by the user. 
Just like in many programming languages, enum types consist of a static, ordered set of labels defined by the user. 
They can be utilized to 

## Creation of Enum types

Enum types can be created via the Create Type command. 

```sql
create type enum_name as enum (['label' [,...]]);
```

An example usage could look like this:

```sql
create type importance as enum ('minor', 'major', 'critical');
```

## Usage of Enum types

```sql
create table tasks (id int, priority importance);
insert into tasks values (1, 'major'), (2, 'minor'), (3, 'critical'), (4, 'major');
```

The enum labels are case sensitive, whereas the enum names are not.

```sql
select 'mInOr'::importance;
```
```
ERROR: invalid input value for enum importance: "mInOr"
```
```sql     
select 'minor'::iMpOrTaNcE;
```
```
enum importance
---------------
minor
```

## Comparison of Enum types

Values of the same enum type are comparable. Their ordering corresponds the order in which they were listed at creation time. Values of different enum types are incomparable. Similarly, an enum cannot be compared with a builin type.

```sql
select 'critical'::importance > 'major'::importance;
```
```
?column?
-------
t
```

```sql
select id from tasks where priority >= 'major';
```

```
id
----
1
3
4
```

## Deletion of Enum types

Enum types can be removed via the Drop Type command.

```sql
drop type [ if exists ] name;
```
The deletion of an enum type is not possible, when any other object still depends on it.

```sql
drop type importance;
```

```
ERROR: cannot drop enum importance because other objects depend on it
```

