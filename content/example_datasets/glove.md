---
title: "GloVe: Global Vectors for Word Representation"
linkTitle: "GloVe: Global Vectors for Word Representation"
prev: /example_datasets
weight: 30
---
The GloVe dataset consists of a set of pre-trained word vectors using the famous [GloVe unsupervised learning algorithm](https://nlp.stanford.edu/projects/glove/).
You can use it to check out CedarDB's vector capabilities.

{{< callout type="info" >}}
This example uses the syntax of the `pgvector` PostgreSQL extension.
CedarDB implements compatible vector support, so this example can run in both CedarDB as well as PostgreSQL.
{{< /callout >}}



## The Dataset
The dataset comprises one table with two columns.
Each row specifies a word and a vector representing that word in a 300 dimensional vector space.
We can use this vector for word similarity search or finding interesting correlations.

```sql
CREATE TABLE words (
    word text,
    embedding vector(300)
);
```

Here is the row in the dataset for the word `cedar`:

```
cedar -0.035741 0.30627 -0.89386 -0.42192 0.4423 -0.0031244 0.1343 -0.1627 -0.56503 0.55582 0.04976 -0.38961 -0.70721 -0.22251 -0.63599 0.010212 0.44991 1.4495 0.14731 0.49291 -0.43543 0.43853 0.89911 0.7473 -0.32095 -0.37141 0.011313 0.40663 -0.054914 0.052961 -0.089976 0.61442 -0.098188 -0.55887 0.17341 0.2009 0.36195 -0.028696 -0.61912 0.25283 -0.43368 0.52983 0.29688 -0.45046 0.86235 -0.033074 -0.40946 -0.88257 0.5405 0.31433 -0.66538 -0.40765 0.59338 0.15275 -0.03373 -0.58895 0.082962 0.19579 -0.33768 0.17269 -0.1885 0.28613 -0.0763 0.47297 -0.25998 0.43033 0.2628 -0.41632 -0.44285 0.34218 -0.23407 0.32939 -0.18196 0.36787 0.50732 0.62926 0.35413 0.07248 -0.7088 -0.48028 0.069412 0.1061 0.4844 0.41549 0.075002 0.087866 1.093 1.4178 -0.18223 0.19481 0.3665 -0.38657 0.3705 -0.067371 -0.15721 0.67263 0.60278 0.18825 -0.47069 0.23095 0.53747 0.15372 0.28769 -0.23418 -0.065959 -1.3184 0.3386 0.49832 0.23596 -0.84735 0.034094 0.89097 -0.039864 -0.18604 -0.44887 0.65578 0.49864 0.056556 -0.14284 0.21705 -0.31605 -0.080527 -0.26386 0.068591 -0.24204 0.0085045 0.12535 0.25822 -0.45192 -0.19591 -0.28525 -0.21406 -0.23933 -0.079567 0.077772 -0.044807 0.13742 -0.38121 0.51215 -0.15845 -1.1855 0.48977 -0.11569 0.071149 -0.21234 0.63803 -0.074817 0.12214 0.22618 -0.30874 0.3661 -0.45319 -0.46136 0.25993 0.20315 -0.14687 0.30222 -0.10477 0.24161 0.7081 0.158 0.22283 -0.57998 0.51195 0.095581 0.37133 0.038913 -0.10041 0.18371 0.12732 -0.078713 0.015901 -0.27671 0.82712 -0.55948 0.65985 0.27161 -0.056506 0.81918 -0.176 -0.10151 0.3601 0.43843 -0.019308 0.09502 0.21175 -0.66881 -0.42617 -0.033088 0.13867 -0.29438 -0.17065 -0.050052 0.046184 -0.46501 -0.28081 -0.055363 0.12984 0.24892 0.15695 -0.051954 -0.067292 -0.15835 -0.023483 0.34172 0.53221 -0.26182 0.28651 0.40593 -0.029766 -0.19969 0.80703 0.37087 -0.14587 0.26325 0.23282 0.33873 0.10298 0.29892 -0.27437 -0.75017 0.51737 0.20513 0.52544 -0.13263 0.5456 -0.53637 0.68089 0.062844 0.63056 0.76018 -0.23215 -0.60312 0.045453 0.23291 -0.71336 0.31855 -0.98226 0.31373 0.49496 0.29236 -0.052623 -0.22314 -0.17556 -0.24841 -0.27599 0.28926 0.006082 0.47148 -0.55711 0.40644 -0.19782 0.10583 0.080815 0.074759 0.42763 0.66005 -0.5212 0.091959 0.090721 0.63784 -0.5445 0.3681 -0.18135 0.095805 -0.2006 -0.52705 -0.29647 -0.97121 0.57904 -0.26934 0.3796 0.22758 -0.32191 -0.43989 -0.6026 0.34945 0.42713 -0.15097 -0.020774 -0.43159 0.19217 -0.12373 -0.1276 0.086802 0.21242 0.54875 0.045418 0.016401 -0.17856 -0.098253 0.092168 -0.52934 -0.51203 -0.2586 -0.028755 0.40569 -0.54969 -0.20679 -0.28477
```

{{% steps %}}

### Obtain the data
You can download the dataset from the [GloVe project website](https://nlp.stanford.edu/projects/glove/).
There are multiple versions with differing training sets and vectors of different dimensionalities. 
Let's choose the biggest dataset "Common Crawl (840B tokens, 2.2M vocab, cased, 300d vectors".

To obtain the data simply run

```shell
wget https://nlp.stanford.edu/data/glove.840B.300d.zip
unzip glove.840B.300d.zip
```

{{< callout type="info" >}}
The zip archive is about 2&nbsp;GB to download, which decompresses to about 5.3&nbsp;GB.
{{< /callout >}}

### Import the data into CedarDB

To import the data, ensure that CedarDB is running and then run the following Python script.
It creates the `words` table, transforms the data into the right format, inserts it and creates an index on the words column.

```python
import numpy as np
import psycopg
import pgvector.psycopg

if __name__ == '__main__':
    # use your own credentials here
    connstr = "host=/tmp port=5432 dbname=postgres user=postgres"

    with psycopg.connect(connstr) as conn:
        pgvector.psycopg.register_vector(conn)
        with conn.cursor() as cur:
            cur.execute("""create table if not exists words(
                                word text,
                                embedding vector(300))""")
            conn.commit()

            with cur.copy("COPY words (word, embedding) FROM STDIN (FORMAT TEXT)") as copy:
                copy.set_types(["text", "vector"])
                with open("/path/to/glove.840B.300d.txt") as file:
                    for line in file:
                        # word and vector are separated by space
                        (word, vec) = line.split(' ', 1)
                        # dimensions of the vector are also separated by space
                        vec2 = np.array(vec.split(' '))
                        copy.write_row((word, vec2))
            conn.commit()

            cur.execute("commit; begin bulk write")
            cur.execute("create index on words(word)")
            conn.commit()
```

{{% /steps %}}

## Queries

### Nearest Neighbors

Let's first find the 10 nearest neighbors for a given word:
```sql
select b.word, 
       a.embedding <=> b.embedding as distance 
from words a cross join 
     words b 
where a.word = 'cedar' 
    and b.word != a.word 
order by distance asc 
limit 10;
```

This query calculates the distance of the vector of the word `cedar` with every other word's vector, sorts them by distance and then returns the 10 nearest words.
The result seems reasonable:

```
   word   |     distance      
----------+-------------------
 oak      | 0.230610596571098
 pine     | 0.235847765821746
 cypress  | 0.275875426234673
 redwood  | 0.295171770883236
 wood     |  0.30067442896967
 fir      | 0.316822897654372
 birch    | 0.319249692107759
 spruce   | 0.329496165973873
 hickory  | 0.338934022447928
 hardwood | 0.365919178569564
(10 rows)

```


{{< callout type="info" >}}
We're using the cosine distance (`<=>`) as metric. CedarDB also supports other distance metrics. For a full list, take a look at the [vector reference]().
{{< /callout >}}

{{< callout type="info" >}}
Interestingly, the word most dissimilar to `cedar` is `Counterinsurgency` which makes sense for a revolutionary database system like CedarDB, I guess ;).
{{< /callout >}}

### Linear Substructures
Since each word's vector representation has so many dimensions, we can look at similarities among multiple dimensions using vector arithmetic.

Take for example the words `cat`, `feline`, and `dog`. 
A cat is a feline, but what would be the corresponding word for a dog?
Let's ask CedarDB!

```sql
select target.word 
from
    words cat cross join
    words feline cross join
    words dog cross join
    words target
where cat.word = 'cat'
    and feline.word = 'feline'
    and dog.word = 'dog'
order by (feline.embedding - cat.embedding) + dog.embedding <=> target.embedding limit 1;
```
Take a look at the `order by` clause: It subtracts the "catness" from the word "feline", adds the "dogness" and finally searches for the word closest to the resulting vector.
Let's look at the result:

```
  word  
--------
 canine
(1 row)
```

Bingo!


You can try to find more such relations with the following prepared statement:

```sql
-- a is to b like c is to ...?
prepare deduce as 
    select d.word, 
        d.embedding <=> (b.embedding - a.embedding) + c.embedding as distance 
    from
        words a cross join
        words b cross join
        words c cross join
        words d
    where a.word = $1::text
        and b.word = $2::text
        and c.word = $3::text
    order by distance asc limit 1;
```

We recommend the following word triplets as a starting point:
```sql 
execute deduce('Germany', 'Berlin', 'France');
execute deduce('dark', 'darker', 'soft');
execute deduce('sister', 'brother', 'niece');
```