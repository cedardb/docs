---
title: Row Level Security
weight: 94
---

CedarDB implements row level security (RLS) like it is defined by PostgreSQL.

In RLS, policies can be defined on tables that restrict the rows a user can see or modify.
RLS needs to be enabled per table and is not applied to the table owner per default.

Example:
```sql
create table secrets (
   secret text,
   security_level int
);

insert into secrets values
   ('not so secret', 1),
   ('more secret', 2),
   ('super secret', 3);

create role normal_user;
grant select on secrets to normal_user;

-- normal_user may only see secrets with security_level 1
create policy secrets_normal_user on secrets for select on normal_user using (security_level = 1);

-- RLS needs to be enabled on the table to be applied
alter table secrets enable row level security;

-- RLS is not applied to the table owner but to the normal_user
set role normal_user;

select * from secrets;
----
'not so secret' 1

-- The default for policies is default-deny and no insert policy has been defined
insert into secrets values ('another secret', 1);
----
new row violates row-level security policy for table "secrets"

```

## Create Policy

```sql
CREATE POLICY name ON table_name
   [ AS { PERMISSIVE | RESTRICTIVE } ]
   [ FOR { ALL | SELECT | INSERT | UPDATE | DELETE } ]
   [ TO { role_name | PUBLIC | CURRENT_ROLE | CURRENT_USER | SESSION_USER } [, ...] ]
   [ USING ( using_expression ) ]
   [ WITH CHECK ( check_expression ) ]
```

The policy is defined on the table `table_name` and the `name` needs to be unique for that table but can be used on other tables.

`PERMISSIVE` and `RESTRICTIVE` specify how different policies on the same table are combined. See [Evaluation of Policies](/docs/compatibility/row_level_security/#evaluation-of-policies) for details.

`ALL, SELECT, INSERT, UPDATE` and `DELETE` specify for which statements the policies are applied. See [Evaluation of Policies](/docs/compatibility/row_level_security/#evaluation-of-policies) for details.

Policies can be defined for roles. If no roles are specified, the `PUBLIC` role is used.
By default, the policies are not applied to the table owner of the table the policy is defined on but this can be enforced with `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.

`USING` and `WITH CHECK` define the expressions to check. `USING` expressions check rows when scanning (i.e., only in `ALL, SELECT, UPDATE` and `DELETE` policies) while `WITH CHECK` expressions
check rows before writing them (i.e., only in `ALL, INSERT` and `UPDATE` policies).

## Alter Policy

```sql
ALTER POLICY name ON table_name
   [ TO { role_name | PUBLIC | CURRENT_ROLE | CURRENT_USER | SESSION_USER } [, ...] ]
   [ USING ( using_expression ) ]
   [ WITH CHECK ( check_expression ) ]
```

Only the role, the `USING` and the `WITH CHECK` expression of a policy can be modified using the `alter` command.

If the rest of a policy needs to be changed, it can be dropped and recreated.

## Delete Policy

```sql
DROP POLICY [ IF EXISTS ] name ON table_name
```

`DROP POLICY` deletes the policy. If the last policy of a table is deleted and row level security is enabled, it stays enabled and the default-deny policy will be used.

## row_security_active

The system information function `row_security_active` returns whether RLS policies will be applied for the table and the current user.
This is the case if
- row level security was enabled with `alter table ... enable row level security` and
- All of the following are true
  - the current user is not a superuser
  - the current user has not `bypassrls` set
  - the current user is not the table owner or the current user is the table owner and RLS is enforced with `alter table ... force row level security`.

With the tables and policies of the example, we have
```sql
-- postgres is a superuser
set role postgres;
select row_security_active(secrets);
----
false

-- normal_user is no superuser, not the table owner and has no bypassrls
set role normal_user;
select row_security_active(secrets);
----
true
```  

## row_security Session Setting

If the session setting `row_security` is set to `on`, RLS is applied normally.
If it is set to `off`, an error is thrown if policies are applied to at least one table in the query, i.e., if `row_security_active` is true for at least one table in the query.

This is useful, e.g., if the whole database is being dumped for a backup and you need to be sure that no data is filtered.

## Evaluation of Policies

For each query, policies are applied to tables where `row_security_active`is true.

If there is more than one policy for a policy command and table, they are combined as followed. <br>
All `PERMISSIVE` policies are combined with a boolean 'OR'. If there is no permissive policy, the default is 'false'. <br>
All `RESTRICTIVE` policies are combined with a boolean 'AND'. If there is no restrictive policy, the default is 'true'. <br>
The disjunction of the permissive policies and the conjunction of the restrictive policies is combined with a boolean 'AND'. <br>
Consequently, if there is no policy, the default is 'false' and there needs always to be at least one permissive policy.
`All` policies are used for every policy command type.

The `using` expressions of policies (in most cases) silently filter the values that are accessed in a query while a violation of a `with check` expression leads to an error and the query is aborted.

#### Select Policies

Select policies are applied every time a table is scanned, also when evaluation the expressions of policies.
In update and delete statements, the table is only scanned if there is a returning clause, a where condition, or if the previous value for an update is referenced in the new value (e.g., attr1 = attr1 + 1).

For upserts, the table needs to be scanned to find the values to update but the policies are applied after finding those values (else, it would be possible to insert values that might have to be updated).

Select policies are also applied on the values of returning clauses of insert, update and delete statements and always on the output of upserts, even if there is no returning clause.

Usually, select policies silently filter the values. This is not the case on the output values of insert, update and upsert statements.


#### Insert Policies

Insert policies are checked before inserting any value into the table. If the policy references the table it is defined on, it is possible to add values to the table that violate the policy, e.g.

```sql
create table books (
    id integer,
    author text,
    title text
);

alter table books enable row level security;

create policy books_select on books for select using (true);

create policy books_insert on books for insert with check (id not in (select id from books));

set role normal_user;

-- It is possible to add two books with the same id even though the books_insert policy does not allow this.
insert into books values (1, 'Antoine de Saint-Exupéry', 'The Little Prince'), (1, 'Hedwig Munck', 'The Little King');

select * from books;
----
1  Antoine de Saint-Exupéry   The Little Prince
1  Hedwig Munck               The Little King
```

Insert policies are also checked in upserts for all values (also the new value if the update path is taken).

#### Update Policies

Update policies can have both an `using` and a `with check` expression.
The `using` expression silently filters the rows that may be updated for update statements, for upserts, an error might be thrown.
The `with check` expression checks the new values and might throw an error.

All `using` expressions are applied before the `with check` expressions.
They are also applied in the update path of upsert statements.

#### Delete Policies

Delete policies filter the values that may be deleted.

## Notes

Referencing views in policies is not supported yet.