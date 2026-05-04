---
title: NASDAQ Orders in Real-Time with Grafana
linkTitle: "NASDAQ Orders in Grafana"
---

In this chapter, we will build a real-time stock market monitoring solution for the whole NASDAQ stock exchange.

You will learn how you can use CedarDB as central engine to
 - process tens of thousands of events per second while handling a complex analytical workload,
 - gain real-time insights with an off-the-shelf [Grafana](https://grafana.com/) dashboard,
 - ingest data from any application with a Postgres-compatible connector,
 - do all of the above on inexpensive hardware.



Since a picture is worth more then a thousand words, here is what we are building:

![Architecture](/images/nasdaq/grafana.png)


## Just get me started ASAP

```shell
git clone git@github.com:cedardb/examples.git
cd examples/nasdaq 
./prepare.sh
docker compose build client
docker compose up
google-chrome localhost:3000
```




## Goals and Requirements

We have the following requirements for our NASDAQ real-time trading dashboard:
 - **We want to display the current market state as it happens.** Our dashboard therefore must be able to ingest and process all order book changes as they come in - up to a hundred thousand events per second.
 - **We want to extract all the information we can glean from the data.** To gain an advantage over our competition, we want our insights to be informed by the full data set. We expecially don't want to throw away or pre-aggregate data. We should at least be able to calculate the complete current order book for any instrument traded on NASDAQ in real-time.
 - **We want to focus on the business logic, not the software stack.** We want to use Grafana as an off-the-shelf dashboarding solution. We want to visualize the price history, order book depth, and other metrics without worrying about interfacing with the database.
 - **Cost and ease of use.** We want to do all of this on modest, cheap and easily available hardware, like a reasonably modern Laptop. We definitely don't want to depend on exotic hardware or having to rent expensive beefy cloud instances.

## Dataset

We will use NASDAQ's [dump of real-time orders](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/) as data source.
For an overview of the dataset and some queries to get you started, take a look at the [NASDAQ dataset page](/docs/example_datasets/nasdaq).


## Architecture

Let's sketch out the architecture of our stock market monitor.

![Architecture](/images/nasdaq/architecture.png)

* **A thin *Stock Client* accepts the external Data Stream from NASDAQ and transforms it into SQL statements for CedarDB.** 
In a real-world deployment this might be an adapter around the UDP connection to NASDAQ serving the stock exchange events or your existing monitoring solution.
Since we don't have access to the real-time data, we have to make do with the dump of one day's worth of events. We built a C++ client that does a live replay in real-time, mocking the NASDAQ exchange.
* **A Grafana dashboard serves as front end to the users.**
It will display the state of the stock exchange by issuing queries against CedarDB using Grafana's Postgres data source connector.
* **CedarDB does the heavy lifting.** It serves as persistent data store for the exchange data and query engine driving the Grafana visualization all by itself.

## Setting up CedarDB
Lets first focus on how we can set up CedarDB to store and process all our data.
Afterwards, we can think about how to best get data into and out of CedarDB.


### The Schema
We will use the following schema to store the state of the exchange:

```sql {filename="schema.sql"}
begin;
drop table if exists orderbook, executions, cancelations, orders, marketMakers, stocks;

create table stocks
(
    stockId                     int primary key,
    name                        text unique,
    marketCategory              text,
    financialStatusIndicator    text,
    roundLotSize                int,
    roundLotsOnly               bool,
    issueClassification         text,
    issueSubType                text,
    authenticity                text,
    shortSaleThresholdIndicator bool,
    IPOFlag                     bool,
    LULDReferencePriceTier      text,
    ETPFlag                     bool,
    ETPLeverageFactor           int,
    InverseIndicator            bool
);

create table marketmakers
(
    timestamp   bigint,
    stockId     int,
    name        text,
    isPrimary   bool,
    mode        text,
    state       text
);

create table orders
(
    stockId     int not null,
    timestamp   bigint not null,
    orderId     bigint primary key not null,
    side        text,
    quantity    int not null,
    price       numeric(10,4) not null,
    attribution text,
    prevOrder   bigint
);

create table executions
(
    timestamp   bigint not null,
    orderId     bigint,
    stockId     int not null,
    quantity    int not null,
    price       numeric(10,4),
);

create table cancelations
(
    timestamp   bigint not null,
    orderId     bigint not null,
    stockId     int not null,
    quantity    int
);

create table orderbook
(
    orderId     bigint,
    stockId     int,
    side        text,
    price       numeric(10,4),
    quantity    int,
    primary key(orderid, price)
);
commit;

begin bulk write;
create index on orderbook(orderId);
create index on cancelations(timestamp);
create index on executions(timestamp);
create index on orders(timestamp);
commit;
```

The tables `stocks` and `marketmakers` are static.
We will populate them once at startup and use them to show user readable info (i.e., displaying a stock's name, not just its id).


The tables `orders`, `executions`, and `cancelations` are append only and store a complete history of the exchange. 
They act as source of truth and also allow us to recompute the state of the exchange at any point in time.

{{< callout type="info" >}}
For a more in depth explanation of these tables, take a look at the [NASDAQ example dataset page](/docs/example_datasets/nasdaq).
{{< /callout >}}

Since we are usually interested in the *current* state of the exchange, it might be a good idea to optimize for that. 
To this end, we are adding another table called *orderbook* which keeps track of which orders are currently active.

With this setup, the following four sets of DDL statements are enough to keep track of the exchange state.

### Adding a new order

```sql
begin;
-- 'orderID' wants to BUY/SELL ('side') 'quantity' amount of 'stockId' at 'price'.
-- Attribution optionally refers to a marketmaker.
-- prevOrder is NULL as we insert a new order which doesn't replace a previous order.
insert into orders values(stockId, timestamp, orderId, side, quantity, price, attribution, null);
-- Add the new order to the order book as well.
insert into orderbook values(orderId, stockId, side, quantity, price);
commit;
```

### Updating an existing order

```sql
begin;
-- Append the new order and mark it as superseding the previous order
insert into orders values((...), prevOrder);
-- Remove the now obsolete old order from the order book
delete from orderbook where orderId = prevOrder;
-- Add the updated order to the orderbook
insert into orderbook values((...));
commit;
```

### Executing an order

```sql
begin;
-- 'executedQuantity' of 'stockId' from 'executedOrderId' have exchanged hands.
-- Almost all execution events don't have a price (last 'NULL') 
-- since the price is already specified in the executed order
insert into executions values(timestamp, executedOrderId, stockId, executedQuantity, null);
-- Reduce amount in order book accordingly. 
-- There still might be some shares left as orders can be fulfilled partially.
update orderbook set quantity = quantity - executedQuantity where orderId = executedOrderId;
commit;
```

### Canceling an order

```sql
begin;
insert into cancelations values(timestamp, canceledOrderId, stockId, canceledQuantity);
-- If canceledQuantity == 0, i.e. full cancelation, we can remove the order from the book:
delete from orderbook where orderid = canceledOrderId and canceledQuantity = 0;
-- Else it's a partial cancelation, update order book accordingly:
update orderbook set quantity = quantity - canceledQuantity 
  where orderId = canceledOrderId and canceledQuantity != 0;
commit;
```

## The Client

We have written a [simple C++ client](https://github.com/cedardb/examples/tree/main/nasdaq/client) to feed CedarDB with the parsed exchange events.
Its job is to parse incoming events and issue the corresponding SQL statements introduced above.

The client uses Postgres's `libpq` to talk to CedarDB. It leverages [pipeline mode](https://www.postgresql.org/docs/current/libpq-pipeline-mode.html) for better throughput, but is otherwise very straightforward.
The application logic fits into 100 lines of code, most of the other 350 lines are required for CSV parsing.

While the client is running, it replays the live exchange data in 100 millisecond batches, treating the point in time the program was started as 9:30 AM, i.e. the exact instance the market opens. 
So, if the client runs for 30 minutes, the database state will represent the state of the NASDAQ exchange 30 minutes after market open, i.e., 10:00 AM.


## Grafana

We use the default Grafana docker container and establish connection to CedarDB with a [Postgres data source](https://github.com/cedardb/examples/blob/main/nasdaq/grafana/datasources/automatic.yml).

The Grafana visualizations are driven by parametrized raw SQL queries containing the application logic.
They are directly executed against CedarDB with no caching layer in between.

Let's look at two exemplary queries!

### Order book depth

This visualization calculates the depth of the order book at all price points. 
![Orderbook](/images/nasdaq/orderbook.png)

It can be read as follows:
There are zero open orders at about $323.50.
Everything to the right of that are open sell orders. People would like to sell for more than the current price.
There are, for example, around 60,000 outstanding orders that would like to sell at $330.00.
Conversely, everything to the right are buy orders. About 30,000 orders would like to buy at $320.00. 
Seems like humans prefer nice round numbers!

The chart is generated by the following SQL query:
```sql
with orderdepth as ( 
    -- count the number of available stock at each price for the buy and for the sell side
    select price, side, sum(quantity) as quantity
    from orderbook o, stocks s
    where o.stockId = s.stockId
    and s.name = 'AAPL' -- stock ticker symbol we're interested in
    group by price, side
    having sum(quantity) > 0
),
cumulative_sell as (
    -- transform the sell side into a cumulative sum with a window query
    select price, side, sum(quantity) over (order by price asc) as sum
    from orderdepth
    where side = 'SELL'
),
cumulative_buy as (
    -- transform the buy side into a cumulative sum with a window query
    select price, side, sum(quantity) over (order by price desc) as sum
    from orderdepth
    where side = 'BUY'

)
-- stitch together buy and sell side
select * 
from (select * from cumulative_sell union all select * from cumulative_buy) 
order by price;
```

### Candlesticks

The probably most well-known chart type to show a stock's price history.
Wikipedia has a [nice introduction](https://en.wikipedia.org/wiki/Candlestick_chart).

![Candlesticks](/images/nasdaq/candlesticks.png)

The chart is generated by the following SQL query:
```sql
with limits as (
    select 34200000000000::bigint as start,
          -- from 9:30 AM (in nanoseconds since midnight), i.e. the start of trading day
           34200000000000 + (30*60)::bigint * 1000 * 1000 * 1000 as end, 
          -- to 30*60 seconds = 30 minutes after market start
           10::bigint * 1000 * 1000 * 1000 as step
           -- bin size of 10 seconds
), bins as (
    -- we always generate the bins from the start of the trading day so they are stable
    select generate_series(l.start ,l.end, l.step) as time
    from limits l 
),
prices as (
  -- For any order of a given stock executed within the relevant time span, find the price
  select 
    e.timestamp as time, s.name as metric, 
    -- if the execution itself has a price, it takes precedence
    max(coalesce(e.price, o.price)) as value,
    max(coalesce(e.price, o.price) * e.quantity) as volume
  from executions e, stocks s, orders o, limits l
  where e.orderid = o.orderid
    and o.stockid = s.stockid 
    and s.name = 'AAPL' -- the stock ticker symbol we're interested in
    and e.timestamp >= l.start
    and e.timestamp < l.end
  group by e.timestamp, s.name
),
binned as (
  select 
      extract(epoch from current_date + (b.time/(1000*1000) * interval '1 millisecond')) as time,
      p.metric, 
      first_value(p.value) over w as open,
      last_value(p.value) over w as close,
      max(p.value) over w as high,
      min(p.value) over w as low,
      sum(p.volume) over w as volume,
      row_number() over w as rn
  from prices p, bins b, limits l
  -- assign each event into its bin
  where p.time >= b.time and p.time < b.time + l.step
  -- for each bin, find the candle stick parameters with a window function
  window w as (
    partition by b.time, p.metric 
    order by p.time asc 
    rows between unbounded preceding and unbounded following)
)
select metric, time, open, close, high, low, volume 
from binned b 
where rn = 1;
```

## Putting it all together

We have built a Grafana dashboard with the above visualizations plus a few more.
The dashboard auto-refreshes multiple times per second to give an up-to-date view of the exchange state.

The following video shows a live demo:
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/szKVXWWXQJg?si=XbXN9RPJ1Lz47dZ-" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>



If you want to try it out yourself, just clone our [examples repository](https://github.com/cedardb/examples/) and follow the Readme in the `nasdaq` subdirectory.

