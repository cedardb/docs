---
title: "Tutorial: CedarDB Docker Image"
linkTitle: "Running inside Docker"
next: /guides
weight: 30
---
This tutorial explains how to build, configure and run the default CedarDB docker image.


{{% steps %}}

### Download and build the docker image

```shell
mkdir cedardb && cd cedardb
wget https://db.in.tum.de/\~fent/Dockerfile
docker build -t cedardb .
```


### Run the docker container

Run the container like so:
```shell
docker run -p 5432:5432 --name=cedardb_test cedardb
```


### Configure the volumes correctly

You have to ensure that CedarDB stores its database on a reasonably fast SSD.
To this end, the docker container defines a volume for persistency.
This is mounted to a directory globally defined by docker by default.
You can print this directory like so:

```shell
docker inspect cedardb_test | grep -A10 Mounts

```

Example result:

```shell
"/mnt/ssd/docker-images/volumes/708c56339290a98cbcf45b337b565f53689ba02e96729380478731705225f3d8/_data"
```
If this directory is on a fast SSD, you can skip this step.
Otherwise, mount the volume at a better place, e.g.:
```shell
    docker run -p 5432:5432 -v /mnt/fastssd:/var/lib/umbra/data --name=cedardb_test cedardb
```

Ensure that the docker user has write access for the directory you have chosen.

### Create a database user

The docker image does not define a default and password for security reasons.
You thus have to connect via domain socket from inside the docker container and create your own:

```shell
docker exec -it cedardb_test psql -h /tmp -U postgres

```
This will launch the psql shell. From within, you can then create a new user:

```sql
create user {{username}} superuser;
create database {{username}};
alter user {{username}} with password '1234';
```
Enter your password twice, then exit shell and docker container via `CTRL-D`.

### Connect to CedarDB from outside the container

From now on, you can connect from outside to the running CedarDB instance:
```shell
psql -h localhost -U {{username}}
```

### Copy data into the container

In the following tutorials, we will often use the `copy` operator to load data into CedarDB, which requires the server to have access to the files.
This way, the server can directly access the data without network overhead for more performant operations.
Although `\copy` can be used to copy data relative to the `psql` client, we focus on `copy` (without `\`) in this tutorial for its higher performance.
To access the data from the server, we first need to copy the downloaded data inside the docker container.

```shell
docker cp /your/path/download_folder cedardb_test:/var/lib/umbra/data/
```

This command copies the folder `download_folder` to the CedarDB server, making it accessible without a path prefix.

{{% /steps %}}

Congratulations, you now have CedarDB running inside Docker and connect to it from the outside.
