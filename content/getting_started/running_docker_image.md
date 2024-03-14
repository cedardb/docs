---
title: "Tutorial: CedarDB Docker Image"
linkTitle: "Running inside Docker"
weight: 30
---
This tutorial explains how to build, configure and run the default CedarDB docker image.

# Download and build the docker image

```shell
mkdir cedardb && cd cedardb
wget https://db.in.tum.de/\~fent/Dockerfile
docker build -t cedardb .
```


## Run the docker container

Run the container like so:
```shell
docker run -p 5432:5432 --name=cedardb_test cedardb
```


## Configure the volumes correctly

You have to ensure that CedarDB stores its database on a performant SSD.
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

## Create a database user

The docker image does not define a default and password for security reasons.
You thus have to connect via domain socket from inside the docker container and create your own:

```shell
docker exec -it cedardb_test psql -h /tmp -U postgres

```
This will launch the psql shell. From within, you can then create a new user:

```sql
create user {{username}} superuser;
\password {{username}}
```
Enter your password twice, then exit shell and docker container via CTRL-D.

## Connect to CedarDB from outside the container

From now on, you can connect from outside to the running CedarDB instance:
```shell
psql -h localhost -U {{username}} -d postgres
```
The `-d postgres` argument is required, because CedarDB uses the database with the selected {{username}} by default, which does not yet exist at this time.

You can, however, create a new database from within the psql shell:
```sql
create database {{dbname}};
```
and then connect like this:
```shell
psql -h localhost -U {{username}} -d {{dbname}}
```

If you omit the `-d` argument, you automatically connect to the {{username}} database, if it exists.

## Run your queries! 
Done :) 