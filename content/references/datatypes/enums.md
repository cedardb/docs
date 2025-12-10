# Enum Types

Just like in many programming languages, an enum types consist of a static, ordered set of labels defined by the user. 
They combine the clarity of text with the compactness of numerics, when the inherent meaning of a value is more than should be encoded by a single number, but the number of possible values is relatively small. 

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

Enums can be used just like any other type inside of tables, views, queries, etc. .

```sql
create table tasks (id int, priority importance);
insert into tasks values (1, 'major'), (2, 'minor'), (3, 'critical'), (4, 'major');
```

The enum labels are case sensitive, whereas the enum names are not.

This does not work:
```sql
select 'mInOr'::importance;
```
```
ERROR: invalid input value for enum importance: "mInOr"
```

This works:
```sql     
select 'minor'::iMpOrTaNcE;
```
```
enum importance
---------------
minor
```

## Comparison of Enum types

Values of the same enum type are comparable. Their ordering corresponds the order in which they were listed at creation time. Values of different enum types are incomparable. Similarly, an enum cannot be compared with a builtin type.


In this example ID2 gets filtered out as its corresponding priority is too low in the enum ordering.
```sql
select id, priority from tasks where priority >= 'major';
```

```
id | priority
-------------
 1 | major
 3 | critical
 4 | major
```

```sql
select id from tasks where priority > 1;
```
```
ERROR: cannot compare enum importance and integer
```
## Deletion of Enum types

Enum types can be removed via the Drop Type command.

```sql
drop type [if exists] name;
```
The deletion of an enum type is not possible, when any other object still depends on it. Trying to do so regardless results in an error.

## Alter Enum types

### Add new label
A new label can be added to an existing enum via
```sql
alter type enum_name add value [if not exists] added_enum_label;
```
The newly inserted label is the new maximum in this enum type. Inserting a new label at another location is currently not supported.
If the label is already present, the insertion fails with an error. Specifying "if not exists" suppresses this error.

### Change ownership
The owner of an enum can be changed via
```sql
alter type enum_name owner to new_owner;
```
