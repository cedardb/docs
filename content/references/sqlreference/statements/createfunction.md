---
title: "Reference: Create Function Statement"
linkTitle: "Create Function"
---

Create function allows creating user-defined functions.
Functions can help you to encapsulate common logic that can be reused.

```sql
create function times_two(x int) returns int language sql as
    'x * 2';
    
create function cowsay(t text) returns text language sql as $$
  ' ' || repeat('_', length(t) + 2) || E'\n' ||
  '< ' || t || E' >\n' ||
  ' ' || repeat('-', length(t) + 2) || E'\n' ||
 E'        \\   ^__^\n' ||
 E'         \\  (oo)\\_______\n' ||
 E'            (__)\\       )\\/\\\n' ||
 E'                ||----w |\n' ||
 E'                ||     ||\n'
$$;
```

Now you can use these functions in regular SQL queries:

```sql
select times_two(x::int) from generate_series(1, 3) s(x);
```

```
 times_two 
-----------
         2
         4
         6
(3 rows)
```

```sql
select cowsay('Hello CedarDB!');
```

```
            cowsay            
------------------------------
  ________________           +
 < Hello CedarDB! >          +
  ----------------           +
         \   ^__^            +
          \  (oo)\_______    +
             (__)\       )\/\+
                 ||----w |   +
                 ||     ||   +
 
(1 row)
```

