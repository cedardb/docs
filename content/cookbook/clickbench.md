---
title: "Tutorial: Benchmarking with ClickBench"
linkTitle: "ClickBench"
weight: 101
---

`ClickBench` is a popular benchmark for analytical database systems
[maintained by ClickHouse](https://github.com/ClickHouse/ClickBench/).
ClickBench compares about 50 different database systems with a workload of relatively simple analytical queries.
There is a ranking dashboard with results hosted at [benchmark.clickhouse.com](https://benchmark.clickhouse.com/).

## Loading the Dataset

The ClickBench dataset consists of a single wide table of real-world web traffic analysis data, including several
string columns with Unicode strings.
ClickHouse hosts the official dataset in several formats.
In the following, we will use the TSV data, which follows the default PostgreSQL conventions.
You can download the dataset like so:

```shell
curl -O https://datasets.clickhouse.com/hits_compatible/hits.tsv.gz
gzip -d hits.tsv.gz
```

{{< callout type="info" >}}
The compressed tarball is about 16&nbsp;GB to download, which decompresses to about 70&nbsp;GB of plain text.
After importing into CedarDB, the database will be about 33&nbsp;GB.
{{< /callout >}}

After downloading, you can create the schema with its 104 columns and load the TSV data into a database:

{{% details title="Open to show the SQL schema" closed="true" %}}

```sql
create table hits (
    watchid               bigint       not null,
    javaenable            smallint     not null,
    title                 text         not null,
    goodevent             smallint     not null,
    eventtime             timestamp    not null,
    eventdate             date         not null,
    counterid             integer      not null,
    clientip              integer      not null,
    regionid              integer      not null,
    userid                bigint       not null,
    counterclass          smallint     not null,
    os                    smallint     not null,
    useragent             smallint     not null,
    url                   text         not null,
    referer               text         not null,
    isrefresh             smallint     not null,
    referercategoryid     smallint     not null,
    refererregionid       integer      not null,
    urlcategoryid         smallint     not null,
    urlregionid           integer      not null,
    resolutionwidth       smallint     not null,
    resolutionheight      smallint     not null,
    resolutiondepth       smallint     not null,
    flashmajor            smallint     not null,
    flashminor            smallint     not null,
    flashminor2           text         not null,
    netmajor              smallint     not null,
    netminor              smallint     not null,
    useragentmajor        smallint     not null,
    useragentminor        varchar(255) not null,
    cookieenable          smallint     not null,
    javascriptenable      smallint     not null,
    ismobile              smallint     not null,
    mobilephone           smallint     not null,
    mobilephonemodel      text         not null,
    params                text         not null,
    ipnetworkid           integer      not null,
    traficsourceid        smallint     not null,
    searchengineid        smallint     not null,
    searchphrase          text         not null,
    advengineid           smallint     not null,
    isartifical           smallint     not null,
    windowclientwidth     smallint     not null,
    windowclientheight    smallint     not null,
    clienttimezone        smallint     not null,
    clienteventtime       timestamp    not null,
    silverlightversion1   smallint     not null,
    silverlightversion2   smallint     not null,
    silverlightversion3   integer      not null,
    silverlightversion4   smallint     not null,
    pagecharset           text         not null,
    codeversion           integer      not null,
    islink                smallint     not null,
    isdownload            smallint     not null,
    isnotbounce           smallint     not null,
    funiqid               bigint       not null,
    originalurl           text         not null,
    hid                   integer      not null,
    isoldcounter          smallint     not null,
    isevent               smallint     not null,
    isparameter           smallint     not null,
    dontcounthits         smallint     not null,
    withhash              smallint     not null,
    hitcolor              char         not null,
    localeventtime        timestamp    not null,
    age                   smallint     not null,
    sex                   smallint     not null,
    income                smallint     not null,
    interests             smallint     not null,
    robotness             smallint     not null,
    remoteip              integer      not null,
    windowname            integer      not null,
    openername            integer      not null,
    historylength         smallint     not null,
    browserlanguage       text         not null,
    browsercountry        text         not null,
    socialnetwork         text         not null,
    socialaction          text         not null,
    httperror             smallint     not null,
    sendtiming            integer      not null,
    dnstiming             integer      not null,
    connecttiming         integer      not null,
    responsestarttiming   integer      not null,
    responseendtiming     integer      not null,
    fetchtiming           integer      not null,
    socialsourcenetworkid smallint     not null,
    socialsourcepage      text         not null,
    paramprice            bigint       not null,
    paramorderid          text         not null,
    paramcurrency         text         not null,
    paramcurrencyid       smallint     not null,
    openstatservicename   text         not null,
    openstatcampaignid    text         not null,
    openstatadid          text         not null,
    openstatsourceid      text         not null,
    utmsource             text         not null,
    utmmedium             text         not null,
    utmcampaign           text         not null,
    utmcontent            text         not null,
    utmterm               text         not null,
    fromtag               text         not null,
    hasgclid              smallint     not null,
    refererhash           bigint       not null,
    urlhash               bigint       not null,
    clid                  integer      not null,
    primary key (counterid, eventdate, userid, eventtime, watchid)
);
copy hits from 'hits.tsv';
```

{{% /details %}}

## Running the Queries

While the ClickBench dataset is realistic, the queries that run on it are less so.
Most of the queries are simplistic, and only perform a full table scan on 27 of the >100 total columns.
Because of the simple nature of these queries, they are often limited by I/O and memory bandwidth, rather than by the
processing power of your system.

A good example of a realistic query is Q7, which ranks traffic by `advengineid`, presumably to determine which
ad engine works best:

```sql
select advengineid, count(*)
from hits
where advengineid <> 0
group by advengineid
order by count(*) desc;
```

However, some other queries return nonsensical results like `avg(userid)`, `sum(advengineid)`, or meaningless
redundant expressions like: `sum(resolutionwidth + 1), sum(resolutionwidth + 2), sum(resolutionwidth + 3), ...`.

{{% details title="Open to show all ClickBench queries" closed="true" %}}

```sql {linenos=table,linenostart=0}
SELECT COUNT(*) FROM hits;
SELECT COUNT(*) FROM hits WHERE AdvEngineID <> 0;
SELECT SUM(AdvEngineID), COUNT(*), AVG(ResolutionWidth) FROM hits;
SELECT AVG(UserID) FROM hits;
SELECT COUNT(DISTINCT UserID) FROM hits;
SELECT COUNT(DISTINCT SearchPhrase) FROM hits;
SELECT MIN(EventDate), MAX(EventDate) FROM hits;
SELECT AdvEngineID, COUNT(*) FROM hits WHERE AdvEngineID <> 0 GROUP BY AdvEngineID ORDER BY COUNT(*) DESC;
SELECT RegionID, COUNT(DISTINCT UserID) AS u FROM hits GROUP BY RegionID ORDER BY u DESC LIMIT 10;
SELECT RegionID, SUM(AdvEngineID), COUNT(*) AS c, AVG(ResolutionWidth), COUNT(DISTINCT UserID) FROM hits GROUP BY RegionID ORDER BY c DESC LIMIT 10;
SELECT MobilePhoneModel, COUNT(DISTINCT UserID) AS u FROM hits WHERE MobilePhoneModel <> '' GROUP BY MobilePhoneModel ORDER BY u DESC LIMIT 10;
SELECT MobilePhone, MobilePhoneModel, COUNT(DISTINCT UserID) AS u FROM hits WHERE MobilePhoneModel <> '' GROUP BY MobilePhone, MobilePhoneModel ORDER BY u DESC LIMIT 10;
SELECT SearchPhrase, COUNT(*) AS c FROM hits WHERE SearchPhrase <> '' GROUP BY SearchPhrase ORDER BY c DESC LIMIT 10;
SELECT SearchPhrase, COUNT(DISTINCT UserID) AS u FROM hits WHERE SearchPhrase <> '' GROUP BY SearchPhrase ORDER BY u DESC LIMIT 10;
SELECT SearchEngineID, SearchPhrase, COUNT(*) AS c FROM hits WHERE SearchPhrase <> '' GROUP BY SearchEngineID, SearchPhrase ORDER BY c DESC LIMIT 10;
SELECT UserID, COUNT(*) FROM hits GROUP BY UserID ORDER BY COUNT(*) DESC LIMIT 10;
SELECT UserID, SearchPhrase, COUNT(*) FROM hits GROUP BY UserID, SearchPhrase ORDER BY COUNT(*) DESC LIMIT 10;
SELECT UserID, SearchPhrase, COUNT(*) FROM hits GROUP BY UserID, SearchPhrase LIMIT 10;
SELECT UserID, extract(minute FROM EventTime) AS m, SearchPhrase, COUNT(*) FROM hits GROUP BY UserID, m, SearchPhrase ORDER BY COUNT(*) DESC LIMIT 10;
SELECT UserID FROM hits WHERE UserID = 435090932899640449;
SELECT COUNT(*) FROM hits WHERE URL LIKE '%google%';
SELECT SearchPhrase, MIN(URL), COUNT(*) AS c FROM hits WHERE URL LIKE '%google%' AND SearchPhrase <> '' GROUP BY SearchPhrase ORDER BY c DESC LIMIT 10;
SELECT SearchPhrase, MIN(URL), MIN(Title), COUNT(*) AS c, COUNT(DISTINCT UserID) FROM hits WHERE Title LIKE '%Google%' AND URL NOT LIKE '%.google.%' AND SearchPhrase <> '' GROUP BY SearchPhrase ORDER BY c DESC LIMIT 10;
SELECT * FROM hits WHERE URL LIKE '%google%' ORDER BY EventTime LIMIT 10;
SELECT SearchPhrase FROM hits WHERE SearchPhrase <> '' ORDER BY EventTime LIMIT 10;
SELECT SearchPhrase FROM hits WHERE SearchPhrase <> '' ORDER BY SearchPhrase LIMIT 10;
SELECT SearchPhrase FROM hits WHERE SearchPhrase <> '' ORDER BY EventTime, SearchPhrase LIMIT 10;
SELECT CounterID, AVG(length(URL)) AS l, COUNT(*) AS c FROM hits WHERE URL <> '' GROUP BY CounterID HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
SELECT SUM(ResolutionWidth::bigint), SUM(ResolutionWidth::bigint + 1), SUM(ResolutionWidth::bigint + 2), SUM(ResolutionWidth::bigint + 3), SUM(ResolutionWidth::bigint + 4), SUM(ResolutionWidth::bigint + 5), SUM(ResolutionWidth::bigint + 6), SUM(ResolutionWidth::bigint + 7), SUM(ResolutionWidth::bigint + 8), SUM(ResolutionWidth::bigint + 9), SUM(ResolutionWidth::bigint + 10), SUM(ResolutionWidth::bigint + 11), SUM(ResolutionWidth::bigint + 12), SUM(ResolutionWidth::bigint + 13), SUM(ResolutionWidth::bigint + 14), SUM(ResolutionWidth::bigint + 15), SUM(ResolutionWidth::bigint + 16), SUM(ResolutionWidth::bigint + 17), SUM(ResolutionWidth::bigint + 18), SUM(ResolutionWidth::bigint + 19), SUM(ResolutionWidth::bigint + 20), SUM(ResolutionWidth::bigint + 21), SUM(ResolutionWidth::bigint + 22), SUM(ResolutionWidth::bigint + 23), SUM(ResolutionWidth::bigint + 24), SUM(ResolutionWidth::bigint + 25), SUM(ResolutionWidth::bigint + 26), SUM(ResolutionWidth::bigint + 27), SUM(ResolutionWidth::bigint + 28), SUM(ResolutionWidth::bigint + 29), SUM(ResolutionWidth::bigint + 30), SUM(ResolutionWidth::bigint + 31), SUM(ResolutionWidth::bigint + 32), SUM(ResolutionWidth::bigint + 33), SUM(ResolutionWidth::bigint + 34), SUM(ResolutionWidth::bigint + 35), SUM(ResolutionWidth::bigint + 36), SUM(ResolutionWidth::bigint + 37), SUM(ResolutionWidth::bigint + 38), SUM(ResolutionWidth::bigint + 39), SUM(ResolutionWidth::bigint + 40), SUM(ResolutionWidth::bigint + 41), SUM(ResolutionWidth::bigint + 42), SUM(ResolutionWidth::bigint + 43), SUM(ResolutionWidth::bigint + 44), SUM(ResolutionWidth::bigint + 45), SUM(ResolutionWidth::bigint + 46), SUM(ResolutionWidth::bigint + 47), SUM(ResolutionWidth::bigint + 48), SUM(ResolutionWidth::bigint + 49), SUM(ResolutionWidth::bigint + 50), SUM(ResolutionWidth::bigint + 51), SUM(ResolutionWidth::bigint + 52), SUM(ResolutionWidth::bigint + 53), SUM(ResolutionWidth::bigint + 54), SUM(ResolutionWidth::bigint + 55), SUM(ResolutionWidth::bigint + 56), SUM(ResolutionWidth::bigint + 57), SUM(ResolutionWidth::bigint + 58), SUM(ResolutionWidth::bigint + 59), SUM(ResolutionWidth::bigint + 60), SUM(ResolutionWidth::bigint + 61), SUM(ResolutionWidth::bigint + 62), SUM(ResolutionWidth::bigint + 63), SUM(ResolutionWidth::bigint + 64), SUM(ResolutionWidth::bigint + 65), SUM(ResolutionWidth::bigint + 66), SUM(ResolutionWidth::bigint + 67), SUM(ResolutionWidth::bigint + 68), SUM(ResolutionWidth::bigint + 69), SUM(ResolutionWidth::bigint + 70), SUM(ResolutionWidth::bigint + 71), SUM(ResolutionWidth::bigint + 72), SUM(ResolutionWidth::bigint + 73), SUM(ResolutionWidth::bigint + 74), SUM(ResolutionWidth::bigint + 75), SUM(ResolutionWidth::bigint + 76), SUM(ResolutionWidth::bigint + 77), SUM(ResolutionWidth::bigint + 78), SUM(ResolutionWidth::bigint + 79), SUM(ResolutionWidth::bigint + 80), SUM(ResolutionWidth::bigint + 81), SUM(ResolutionWidth::bigint + 82), SUM(ResolutionWidth::bigint + 83), SUM(ResolutionWidth::bigint + 84), SUM(ResolutionWidth::bigint + 85), SUM(ResolutionWidth::bigint + 86), SUM(ResolutionWidth::bigint + 87), SUM(ResolutionWidth::bigint + 88), SUM(ResolutionWidth::bigint + 89) FROM hits;
SELECT SearchEngineID, ClientIP, COUNT(*) AS c, SUM(IsRefresh), AVG(ResolutionWidth) FROM hits WHERE SearchPhrase <> '' GROUP BY SearchEngineID, ClientIP ORDER BY c DESC LIMIT 10;
SELECT WatchID, ClientIP, COUNT(*) AS c, SUM(IsRefresh), AVG(ResolutionWidth) FROM hits WHERE SearchPhrase <> '' GROUP BY WatchID, ClientIP ORDER BY c DESC LIMIT 10;
SELECT WatchID, ClientIP, COUNT(*) AS c, SUM(IsRefresh), AVG(ResolutionWidth) FROM hits GROUP BY WatchID, ClientIP ORDER BY c DESC LIMIT 10;
SELECT URL, COUNT(*) AS c FROM hits GROUP BY URL ORDER BY c DESC LIMIT 10;
SELECT 1, URL, COUNT(*) AS c FROM hits GROUP BY 1, URL ORDER BY c DESC LIMIT 10;
SELECT ClientIP, ClientIP - 1, ClientIP - 2, ClientIP - 3, COUNT(*) AS c FROM hits GROUP BY ClientIP, ClientIP - 1, ClientIP - 2, ClientIP - 3 ORDER BY c DESC LIMIT 10;
SELECT URL, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-01' AND EventDate <= '2013-07-31' AND DontCountHits = 0 AND IsRefresh = 0 AND URL <> '' GROUP BY URL ORDER BY PageViews DESC LIMIT 10;
SELECT Title, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-01' AND EventDate <= '2013-07-31' AND DontCountHits = 0 AND IsRefresh = 0 AND Title <> '' GROUP BY Title ORDER BY PageViews DESC LIMIT 10;
SELECT URL, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-01' AND EventDate <= '2013-07-31' AND IsRefresh = 0 AND IsLink <> 0 AND IsDownload = 0 GROUP BY URL ORDER BY PageViews DESC LIMIT 10 OFFSET 1000;
SELECT TraficSourceID, SearchEngineID, AdvEngineID, CASE WHEN (SearchEngineID = 0 AND AdvEngineID = 0) THEN Referer ELSE '' END AS Src, URL AS Dst, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-01' AND EventDate <= '2013-07-31' AND IsRefresh = 0 GROUP BY TraficSourceID, SearchEngineID, AdvEngineID, Src, Dst ORDER BY PageViews DESC LIMIT 10 OFFSET 1000;
SELECT URLHash, EventDate, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-01' AND EventDate <= '2013-07-31' AND IsRefresh = 0 AND TraficSourceID IN (-1, 6) AND RefererHash = 3594120000172545465 GROUP BY URLHash, EventDate ORDER BY PageViews DESC LIMIT 10 OFFSET 100;
SELECT WindowClientWidth, WindowClientHeight, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-01' AND EventDate <= '2013-07-31' AND IsRefresh = 0 AND DontCountHits = 0 AND URLHash = 2868770270353813622 GROUP BY WindowClientWidth, WindowClientHeight ORDER BY PageViews DESC LIMIT 10 OFFSET 10000;
SELECT DATE_TRUNC('minute', EventTime) AS M, COUNT(*) AS PageViews FROM hits WHERE CounterID = 62 AND EventDate >= '2013-07-14' AND EventDate <= '2013-07-15' AND IsRefresh = 0 AND DontCountHits = 0 GROUP BY DATE_TRUNC('minute', EventTime) ORDER BY DATE_TRUNC('minute', EventTime) LIMIT 10 OFFSET 1000;
```

{{% /details %}}

You can run the queries on your own setup with [`psql`](/docs/clients/psql), which supports tracking the time it takes
to execute a query using the built-in `\timing` command.
The ClickBench website shows the results as a minimum of three runs, which you can measure with the following bash script:

```shell
for i in {1..3}; do
   psql -h localhost -U postgres -c '\timing' -c "SELECT COUNT(DISTINCT UserID) FROM hits;" | grep 'Time';
done
```

### Results

Now let's also do a full run with all queries and report the total time:

```shell
cat <(echo '\\timing') queries.sql | psql -h localhost -U postgres | grep 'Time' | awk '{print "Q" NR-1 " " $0; sum += $2;} END {print "Total: " sum " ms = " NR*60000/sum " qpm";}'
```

```
Q0 Time: 11.032 ms
Q1 Time: 13.756 ms
Q2 Time: 65.314 ms
Q3 Time: 112.579 ms
Q4 Time: 168.332 ms
Q5 Time: 307.368 ms
Q6 Time: 36.960 ms
Q7 Time: 5.009 ms
Q8 Time: 278.937 ms
Q9 Time: 1221.559 ms (00:01.222)
Q10 Time: 93.650 ms
Q11 Time: 114.402 ms
Q12 Time: 285.417 ms
Q13 Time: 372.584 ms
Q14 Time: 242.044 ms
Q15 Time: 188.241 ms
Q16 Time: 536.300 ms
Q17 Time: 464.359 ms
Q18 Time: 829.231 ms
Q19 Time: 19.840 ms
Q20 Time: 400.901 ms
Q21 Time: 96.579 ms
Q22 Time: 235.864 ms
Q23 Time: 4069.513 ms (00:04.070)
Q24 Time: 109.139 ms
Q25 Time: 25.094 ms
Q26 Time: 60.293 ms
Q27 Time: 493.523 ms
Q28 Time: 9695.677 ms (00:09.696)
Q29 Time: 85.802 ms
Q30 Time: 244.296 ms
Q31 Time: 284.507 ms
Q32 Time: 1940.981 ms (00:01.941)
Q33 Time: 1674.242 ms (00:01.674)
Q34 Time: 1549.061 ms (00:01.549)
Q35 Time: 205.294 ms
Q36 Time: 84.640 ms
Q37 Time: 332.153 ms
Q38 Time: 92.401 ms
Q39 Time: 282.580 ms
Q40 Time: 58.157 ms
Q41 Time: 208.479 ms
Q42 Time: 70.673 ms
Total: 27666.8 ms = 93.2527 qpm
```

The results shown here were measured on a laptop with an Intel i7-13700H CPU, which is roughly comparable to
the `c6a.4xlarge` results from the dashboard.

If you want to compare performance to a wider variety of hardware, Phoronix has a number of results for ClickHouse on
OpenBenchmarking.org:
https://openbenchmarking.org/test/pts/clickhouse  
Their results use the [geometric mean](https://en.wikipedia.org/wiki/Geometric_mean) for queries per minute (qpm).
You can use the following command to get comparable qpm numbers.

```shell
cat <(echo '\\timing') queries.sql | psql -h localhost -U postgres | grep 'Time' | awk '{sum += log($2);} END {print "Geometric mean: " exp(1)^(sum/NR) " ms = " 60000/exp(1)^(sum/NR) " qpm ";}'
```

```
Geometric mean: 197.884 ms = 303.208 qpm
```

## Closing Thoughts

Unfortunately, ClickBench does not verify the results for correctness.
For CedarDB, we have validated the all results against PostgreSQL and DuckDB.
For other systems, the comparison is unfortunately not *apples to apples*, as the systems sometimes calculate
subtly different results.

For example, ClickHouse defaults to less expensive narrow data types, which
can [overflow](https://github.com/ClickHouse/ClickBench/issues/49) in some queries.
Similarly, for the `length(string)` function, ClickHouse uses the cheaper but inaccurate
[byte length](https://clickhouse.com/docs/en/sql-reference/functions/string-functions#length) instead of the
Unicode character length.
