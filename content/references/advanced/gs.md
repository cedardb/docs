---
title: Tables on Google Cloud Storage
---


CedarDB supports processing data from disaggregated storage.
With disaggregated storage, CedarDB can process data that's larger than your local SSD.
CedarDB automatically compresses data to columnar format on the fly when appending or updating rows, uploads compressed chunks to GCS, and downloads them on demand during querying.
Behind the scenes, our unified storage system [Colibri](https://cedardb.com/blog/colibri/) differentiates between hot and cold data.
For more technical details, you can also read up on our [blog](https://cedardb.com/blog/colibri/).


{{<callout type="info">}}
CedarDB still uses a regular (local) storage device for metadata and recently updated (hot) data.
{{</callout>}}

## Creating a Table on Google Cloud Storage

Before creating tables that work on remote data, you need to use the [CREATE SERVER](../../sqlreference/statements/createserver/) statement to first define the location of the data (e.g., the bucket) and the credentials.
After defining the remote server, the [CREATE TABLE](../../sqlreference/statements/createtable/) statement uses the information of the remote server to store the data on disaggregated storage.
Multiple tables can share the same remote server (e.g., the same bucket).

```sql
-- 1) Point CedarDB at your GCS bucket + region and supply a service account
-- You can also create this statement with the python script in the appendix of this page.
CREATE SERVER gcp FOREIGN DATA WRAPPER gs
OPTIONS (
  location 'gcp://bucket-name:europe_west1',
  id       'iamid@project.iam.gserviceaccount.com',  -- service account email
  secret  '-----BEGIN PRIVATE KEY-----
  ...your service account private key PEM...
  -----END PRIVATE KEY-----');

-- 2) Create a regular CedarDB table that stores data on GCS
CREATE TABLE salary (salary integer, tax numeric) WITH (SERVER = gcp);
```

After setting up a table that uses Google Cloud Storage as backend storage, you can use it the same as a regular table stored on the local filesystem.

## GCP performance considerations

To get the most out of tables using Google Cloud Storage, it is crucial to choose an instance with enough network bandwidth.
For remote data processing, we recommend using [general-purpose instances](../../../get_started/operate_in_cloud/#recommended-gcp-instance-types) (such as the c4 family) with `50 Gbit/s` or more.
Please also provision a fast local disk (Persistent Disk SSD or Hyperdisk) with sufficient IOPS/throughput.
CedarDB's hot set and metadata live there; size PD to hit the IOPS/MB/s you need, or consider Hyperdisk for higher ceilings.

To create such an instance, you can use the following gcloud cli command as a starting point.
```
gcloud compute instances create cedardb_cloud_storage \
    --project=project \
    --zone=europe-west1-b \
    --machine-type=c4-standard-48 \
    --network-interface=network-tier=PREMIUM,nic-type=GVNIC,stack-type=IPV4_ONLY,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=iamid@project.iam.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/trace.append \
    --create-disk=auto-delete=yes,boot=yes,device-name=cedardb_cloud_storage,image=projects/ubuntu-os-cloud/global/images/ubuntu-minimal-2504-plucky-amd64-v20250911,mode=rw,provisioned-iops=16000,provisioned-throughput=1000,size=128,type=hyperdisk-balanced \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=goog-ec-src=vm_add-gcloud \
    --reservation-affinity=any \
    --network-performance-configs=total-egress-bandwidth-tier=TIER_1
```

## Cost considerations

Google cloud object storage is typically cheaper per GiB than local SSD, but requests and network egress are billed separately.
CedarDB writes large objects to keep per-request overhead low; still, budget for PUT, GET, and listing operations as your workload scales.
See GCS pricing for storage classes, operations, and network egress.
Note that it is important to co-locate the storage bucket and the instance (same region) to avoid any network cost.
Otherwise, expensive egress cost will be charged which may dominate the overall cost.


## CREATE SERVER Script

You can create the create server statement with the help of the following python script.
Just download the JSON key of your service account and specify the bucket and region when running the script.

```shell
python3 gs.py --key cedardb-5465632a3de0.json --bucket 'cedardb_test' --region 'europe_west1'
```

```py
#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def singleQuote(text: str) -> str:
    """SQL single-quoted literal; doubles single quotes inside."""
    return "'" + text.replace("'", "''") + "'"


def buildCreateServer(client_email: str, private_key_pem: str, bucket: str, region: str, server_name: str = "gcp", fdw_name: str = "s3") -> str:
    """Build the create server sql statement."""
    id = singleQuote(client_email)
    secret = singleQuote(private_key_pem)
    location = singleQuote(f"gs://{bucket}:{region}")
    if len(region) == 0:
        location = singleQuote(f"gs://{bucket}")

    return (f"CREATE SERVER {server_name} FOREIGN DATA WRAPPER {fdw_name}\n"
            f"OPTIONS (\n"
            f"    location {location},\n"
            f"    id {id},\n"
            f"    secret {secret});")

def main():
        p = argparse.ArgumentParser(description="Generate CREATE SERVER for GS FDW from a service account key.")
        p.add_argument("--key", required=True, help="Path to the service account JSON key file")
        p.add_argument("--bucket", required=True, help="GCS bucket name, e.g. cedardb")
        p.add_argument("--region", default="" , help="GCS bucket region, e.g. europe_west1")
        p.add_argument("--name", default="gs", help="Server name in CREATE SERVER (default: gs)")
        p.add_argument("--fdw", default="gs", help="FDW name (default: gs)")
        args = p.parse_args()

        key_path = Path(args.key)
        with key_path.open("r", encoding="utf-8") as fh:
                data = json.load(fh)

        client_email = data["client_email"]
        private_key = data["private_key"]

        sql = buildCreateServer(client_email=client_email,
                    private_key_pem=private_key,
                    bucket=args.bucket,
                    region=args.region,
                    server_name=args.name,
                    fdw_name=args.fdw)
        print(sql)

if __name__ == "__main__":
        main()
```
