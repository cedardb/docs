---
title: "Replicating from Aurora for PostgreSQL via Debezium"
linkTitle: "Replicating via Debezium"
weight: 102
---

[Debezium](https://debezium.io/) is a popular platform for [Change Data Capture (CDC)](https://en.wikipedia.org/wiki/Change_data_capture).

This guide shows you how you can replicate tables from your transactional Amazon Aurora PostgreSQL to CedarDB, allowing you to do fast analytics on data is it comes in without impacting your existing data infrastructure. 


## Setting up Replication

{{% steps %}}


### Starting an EC2 Instance

CedarDB and Debezium will live inside this instance.

{{< callout type="info" >}}
If you do not already know your requirements, we recommend using the `m6id.2xlarge` instance type which comes with 32 GiB of Memory, 8 vCPUs and 500 GiB of fast ephemeral SSD. If you want to spend less, going for something with 4 vCPUs is also fine.
{{< /callout >}}

The rest of this instruction manual assumes you use Ubuntu 24.04 as your operating system. Since CedarDB runs inside its own docker image, you can choose any other OS as well but you might have to adapt the installation instructions accordingly.


{{< callout type="info" >}}
Configure the EBS volume where your root partition is mounted to be large enough to hold all of the data Debezium needs to store its CDC events.
By default, it retains all events for one week and there will be one message per insert/update/delete of all replicated tables.
For playing around, the default of 8 GiB is fine.
{{< /callout >}}

### Setting up your EC2 Instance

CedarDB loves fast SSDs. If your instance comes with an ephemeral SSD, mount it like this:
```shell
sudo mkfs.ext4 -E nodiscard /dev/nvme1n1
mkdir /home/ubuntu/db
sudo mount -o discard /dev/nvme1n1 /home/ubuntu/db
sudo chown ubuntu:ubuntu db
```

Next, we install docker:
```shell
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update

sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Before you can docker commands, you need to add your user to the docker group and re-login:
```shell
sudo adduser ubuntu docker
```

Finally, build the docker image using the CedarDB Dockerfile.

```shell
docker build --tag cedardb .
```


### Starting an Amazon Aurora PostgreSQL Cluster

If you already have a cluster, you can skip this step.

{{< callout type="info" >}}
If you do not already know your requirements, we recommend using the `db.r6gd.xlarge` instance type which comes with 32 GiB of memory and 4 vCPUs. You can definitely go cheaper here, if you just want to play around a little bit.
{{< /callout >}}


Make sure to connect it to your EC2 instance.
In this example, we will assume you have created an admin user `postgresuser` with password `postgrespw`.

{{< callout type="warning" >}}
If you use such easily guessable credentials, make sure this cluster is only reachable from inside your VPC!
{{< /callout >}}

{{< callout type="warning" >}}
If you intend to do more than just play around, you should not give the Postgres user used for replication root access! Instead, it's best practice to [create a separate user with replication privileges](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-permissions).
{{< /callout >}}



### Configuring your Amazon Aurora PostgreSQL Cluster
Amazon Aurora PostgreSQL needs to be configured for logical replication to Debezium. You can take a look at the [Debezium documentation](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-in-the-cloud) for details and instructions to check if your cluster is already set up correctly.

If not, here are the steps to enable it:

1. Create a new parameter group for your cluster
   
    Call it, e.g., `logicalreplication`, set the engine type to `Aurora PostgreSQL`, the family to your PostgreSQL version, e.g. `aurora-postgresql15` and the type to `DB Cluster Parameter Group`.

    Then, within that parameter group, change the parameter `ds.logical_replication` to `1`.

2. Apply this group to your cluster
3. Restart your cluster (or wait for the next maintenance window)


### Starting CedarDB and Debezium

Create a file `docker-compose.yml` with the following content:
```yml
services:
  zookeeper:
    image: quay.io/debezium/zookeeper:2.7
    ports:
     - 2181:2181
     - 2888:2888
     - 3888:3888
  kafka:
    image: quay.io/debezium/kafka:2.7
    ports:
     - 9092:9092
    links:
     - zookeeper
    environment:
     - ZOOKEEPER_CONNECT=zookeeper:2181
     - KAFKA_AUTO_CREATE_TOPICS_ENABLE=true
  cedardb:
    image: cedardb:latest
    ports:
     - 5433:5432
    volumes:
     - type: bind
       source: /home/ubuntu/db
       target: /var/lib/cedardb/data
  connect:
    image: quay.io/debezium/connect:2.7
    ports:
     - 8083:8083
     - 1976:1976
    links:
     - kafka
     - cedardb
    environment:
     - BOOTSTRAP_SERVERS=kafka:9092
     - GROUP_ID=1
     - CONFIG_STORAGE_TOPIC=my_connect_configs
     - OFFSET_STORAGE_TOPIC=my_connect_offsets
     - STATUS_STORAGE_TOPIC=my_connect_statuses
```

Make sure that your docker container database is created somewhere on a fast SSD, i.e. modify the docker volumes of CedarDB in the docker-compose configuration accordingly.
If you followed this guide, `/home/ubuntu/db` should point to your fast ephemeral ssd (if your instance has one).

Then, start all services with the following command:
```shell
docker compose up
```

### Connecting to and setting up CedarDB:

We now need to create a user in CedarDB Debezium can use for replication.

1. Install psql: `sudo apt install posgresql-common postgresql-client-16`
   
2. Find the container id of the cedar image via `docker ps`: In my case it's `90ae1249bddb`.
   
3. Create the correct user in the docker image: `sudo docker exec -it 90ae psql -h /tmp -U postgres`
   
4. Set a password: `alter user postgres with password 'postgres';`


### Creating a Source and Sink Configuration for Debezium

We now need to connect Debezium to Amazon Aurora PostgreSQL via a `source` connector and to CedarDB via a `sink` connector.

Create a file `source.json` with the following contents:

```json
{
    "name": "postgres-source",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
        "database.hostname": "[Your Amazon Aurora PostgreSQL hostname]",
        "plugin.name": "pgoutput",
        "database.port": "5432",
        "database.user": "postgresuser",
        "database.password": "postgrespw",
        "database.dbname" : "postgres", 
        "topic.prefix": "postgres",
        "heartbeat.inverval.ms" : "20",
        "table.include.list": "public.lineitem",
        "topic.creation.enable": "true",
        "topic.creation.default.replication.factor": "-1",
        "topic.creation.default.partitions": "-1",
        "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
        "transforms.unwrap.drop.tombstones": "false",
        "delete.handling.mode": "none"
    }
}
```

Create a file `sink.json` with the following contents:

```json
{
    "name": "cedar-sink",
    "config": {
        "connector.class": "io.debezium.connector.jdbc.JdbcSinkConnector",
        "topics.regex": "postgres.public.lineitem",
        "connection.url": "jdbc:postgresql://cedardb:5432/postgres?stringtype=unspecified",
        "connection.username": "postgres",
        "connection.password": "postgres",
        "delete.handling.mode": "none",
        "insert.mode": "upsert",
        "schema.evolution": "basic",
        "delete.enabled": "true",
        "primary.key.mode": "record_key",
	    "primary.key.fields": "lineitem_id",
        "table.name.format": "${source.table}"
    }
}
```

This configuration assumes we want to replicate a table called `lineitem` with a primary key called `lineitem_id`. Modify both files to work with your Amazon Aurora PostgreSQL and CedarDB credentials.


### Starting Source and Sink

Execute the following commands to register the source and sink with Debezium and start them:

```shell
curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/ -d @sink.json

curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/ -d @source.json
```

It's possible that you need to restart all containers (`docker compose down` then `docker compose up`) for the replication to start after creating the connectors.

{{< callout type="info" >}}
If you want to delete source and sink, you can use the following commands:
```shell
curl -i -X DELETE -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/postgres-source

curl -i -X DELETE -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/cedar-sink
```
{{< /callout >}}


{{% /steps %}}

## Testing the Replication

Congratulations, you're now ready to go!
Let's test if everything is working correctly.

### Creating a Table in Amazon Aurora for PostgreSQL

Connect to your cluster (e.g., via `psql -h [...].rds.amazonaws.com -U postgresuser -p 5432 -d postgres` ) and paste the following:

```sql
CREATE TABLE lineitem (
    lineitem_id BIGINT PRIMARY KEY, -- Unique identifier for each line item
    transaction_id BIGINT NOT NULL, -- Links the line item to a specific transaction (e.g., order_id or invoice_id)
    product_id BIGINT NOT NULL, -- ID of the product or service being transacted
    quantity NUMERIC(10, 2) NOT NULL, -- Quantity of the product being ordered
    unit_price NUMERIC(15, 4) NOT NULL, -- Price per unit of the product
    discount NUMERIC(5, 2) DEFAULT 0.00, -- Discount applied to the line item, if any
    tax_rate NUMERIC(5, 2) DEFAULT 0.00, -- Applicable tax rate
    total_amount NUMERIC(20, 4) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount / 100) * (1 + tax_rate / 100)) STORED, -- Calculated total amount for the line item
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the line item was created
    transaction_date DATE NOT NULL, -- Date of the transaction
    status VARCHAR(50) DEFAULT 'active', -- Status of the line item (e.g., 'active', 'void', 'pending')
    notes TEXT -- Optional notes or comments about the line item
);


INSERT INTO lineitem (lineitem_id,  transaction_id, product_id, quantity, unit_price, discount, tax_rate, transaction_date, status, notes
) VALUES
    (1, 1001, 2001, 10.00, 50.00, 5.00, 10.00, '2024-10-15', 'active', 'First line item for this transaction'),
    (2, 1001, 2002, 5.00, 100.00, 0.00, 15.00, '2024-10-15', 'active', 'Second line item with no discount'),
    (3, 1002, 2003, 2.00, 250.00, 10.00, 12.00, '2024-10-16', 'pending', 'Third line item in a different transaction'),
    (4, 1003, 2004, 7.00, 75.00, 3.00, 8.00, '2024-10-16', 'void', 'Voided line item for test purposes');
```


### Checking Replication in CedarDB

Now connect to CedarDB (e.g., via `docker exec -it 90ae psql -h /tmp -U postgres`) and check the replicated table:

```sql
select * from lineitem;
```

## Automate
Let's create some more rows! Create a file `inserter.py` with the following content:

```python
import psycopg2
from psycopg2 import sql
import random
import time

# PostgreSQL connection parameters
conn = psycopg2.connect(
    dbname="postgres",
    user="postgresuser",
    password="postgrespw",
    host="[Your Amazon Aurora PostgreSQL hostname]",
    port="5432"
)

# Create a cursor object
cur = conn.cursor()


# Function to insert dummy lineitem records
def insert_dummy_lineitem(lineitem_id):
    transaction_id = random.randint(1000, 1100)  # Random transaction_id between 1000 and 1100
    product_id = random.randint(2000, 2100)      # Random product_id between 2000 and 2100
    quantity = round(random.uniform(1, 20), 2)   # Random quantity between 1 and 20
    unit_price = round(random.uniform(10, 200), 2)  # Random unit price between 10 and 200
    discount = round(random.uniform(0, 10), 2)   # Random discount between 0% and 10%
    tax_rate = round(random.uniform(5, 15), 2)   # Random tax rate between 5% and 15%
    transaction_date = time.strftime('%Y-%m-%d')  # Current date
    status = random.choice(['active', 'pending', 'void'])  # Random status
    notes = f"Random note {random.randint(1, 100)}"  # Random notes

    # Insert statement
    insert_query = sql.SQL("""
        INSERT INTO lineitem (
            lineitem_id, transaction_id, product_id, quantity, unit_price, discount, tax_rate, transaction_date, status, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """)

    # Execute insert statement
    cur.execute(insert_query, (
        lineitem_id, transaction_id, product_id, quantity, unit_price, discount, tax_rate, transaction_date, status, notes
    ))

    # Commit transaction
    conn.commit()

# Insert dummy data every few milliseconds
try:
    lineitem_id = 5
    while True:
        insert_dummy_lineitem(lineitem_id)
        print("Inserted a new lineitem.")
        lineitem_id = lineitem_id + 1
except KeyboardInterrupt:
    print("Insertion process stopped.")
finally:
    # Close the cursor and connection
    cur.close()
    conn.close()
```
It requires psycopg2 which you can install via `sudo apt install python3-psycopg2`. 

Then run `python3 inserter.py`. 


## Running Analytical Queries

Connect to CedarDB again and run your analytical queries.
Let's find the average tax rate for each product:

```sql
SELECT 
    product_id, 
    AVG(tax_rate) AS avg_tax_rate
FROM 
    lineitem
GROUP BY 
    product_id
ORDER BY 
    avg_tax_rate DESC;
```

You can now run all your expensive analytical queries against CedarDB while keeping your PostgreSQL database system as system of record.