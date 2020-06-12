# nano-api-test

This project pretends help you to install Kong, configure as api-gateway and set a basic security for the api-call. This was prepared as part of the API Training 2o2o - API management track.

## Create a docker network

This network will be use for kong and our API server:

`docker network create kong-net`

## Start database for Kong
There is two option database : Postgres or Cassandra. For this sample we use postgres.

```
docker run -d --name kong-database \
--network=kong-net \
-p 5432:5432 \
-e "POSTGRES_USER=kong" \
-e "POSTGRES_DB=kong" \
-e "POSTGRES_PASSWORD=kong" \
postgres:9.6
```

## Prepare database
run migration with Kong container:
```
docker run --rm \
--network=kong-net \
-e "KONG_DATABASE=postgres" \
-e "KONG_PG_HOST=kong-database" \
-e "KONG_PG_PASSWORD=kong" \
-e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
kong:latest kong migrations bootstrap
```

reponse like:
```
...
migrating session on database 'kong'...
session migrated up to: 000_base_session (executed)
24 migrations processed
24 executed
Database is up-to-date
```

## Start a kong container
Once the migrations have run and your database is ready, .
in this case, we are using the

- port 8000/8443 to get access to KONG
- port 8001/8444 to get access to Admin KONG

```
docker run -d --name kong \
--network=kong-net \
-e "KONG_DATABASE=postgres" \
-e "KONG_PG_HOST=kong-database" \
-e "KONG_PG_PASSWORD=kong" \
-e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
-e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
-e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
-e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
-e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
-e "KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl" \
-p 8000:8000 \
-p 8443:8443 \
-p 8001:8001 \
-p 8444:8444 \
kong:latest
```

## Check Kong Instance

Be sure the kong admin is running, for this invoke

`curl -i http://localhost:8001`

the expected response is something like this:

```
HTTP/1.1 200 OK
Server: openresty/1.13.6.2
Date: Wed, 18 Jul 2018 03:58:57 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Allow-Origin: *
```

*(here a shellscript to autovalidate, could be useful)*

```
RESPONSE=$(curl -i "http://localhost:8001" | grep '200 OK')
EXPECTED_RESPONSE="HTTP/1.1 200 OK"
echo "response: $RESPONSE"
if [ "$RESPONSE" == "$EXPECTED_RESPONSE" ]; then
echo "Now Kong is up and ready to be used"
fi
```

**Now Kong is up and ready to be used.**

## Test Kong API Gateway

### Set a (nano) API Rest for test Kong

The next thing is prepare an API server that contain service routes and can be accessed as REST API use to be.

```
APP_WORKSPACE=$HOME/workspace
APP_NAME=nano-api-test
```

Prepare the API server, for this tutorial we are going to use node.js and docker
```
cd $APP_WORKSPACE
git clone https://github.com/cafaray/nano-api-test.git
cd "$APP_NAME"
```
build the docker in your local to start up the API Server

`docker build -t node_kong .`

*may you see this warnings, for this sample don't worry about it*
```
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN docker_node_for_kong@1.0.0 No repository field.
npm WARN docker_node_for_kong@1.0.0 No license field.
```

run the docker container

`docker run -d --name=node_kong --network=kong-net node_kong`

**verify you have the three components needed**

`docker ps -a`

The result is something like this:
|CONTAINER ID|IMAGE|COMMAND|CREATED|STATUS|PORTS|NAMES|
|------------|-----|-------|-------|------|-----|-----|
|d13586f83e52|node_kong|“npm start”|2 minutes ago|Up 2 minutes|10000/tcp|node_kong |
|41156cad5c86|kong:latest|“/docker-entrypoint.…”|6 days ago|Up 6 days|0.0.0.0:9000->8000/tcp,0.0.0.0:9001->8001/tcp,0.0.0.0:9443->8443/tcp,0.0.0.0:9444->8444/tcp|kong|
|f794a0e9506c|postgres:9.6|“docker-entrypoint.s…"|6 days ago|Up 6 days|0.0.0.0:5555->5432/tcp|kong-database|

**Check API server by access its API.**

We need to get IP container on docker network kong-net. After that get into container kong shell and check the API from it.

`docker network inspect kong-net`

Expected response:

```
…
…
“Containers”: {
    “41156cad5c864af4ad8615c051fac8da7f683238a6c8cc42267f02813f14810f”: {
        “Name”: “kong”,
        “EndpointID”: “fe1cec9f6f31a015ab29a100fdd54b609abea11bbfa00f5e9ca67cc6175d7b2f”,
        “MacAddress”: “02:42:ac:13:00:03”,
        “IPv4Address”: “172.19.0.3/16”,
        “IPv6Address”: “”
    },
    “d13586f83e52df8866b9879ba0537d58c21fc1b95978dde0580b017ce1a7b418”: {
        “Name”: “node_kong”,
        “EndpointID”: “5677f7588b7daef391cf8cecec6a3ede0155f99f7d86e0e14dd5970ff0570924”,
        “MacAddress”: “02:42:ac:13:00:04”,
        “IPv4Address”: “172.19.0.4/16”,
        “IPv6Address”: “”
    },
    “f794a0e9506c7330f1cc19c5c390f745823c29dd4603e0d727dae4e8a68caa8d”: {
        “Name”: “kong-database”,
        “EndpointID”: “51737ca4e2a4b0e30d25db86e197e653a81e6206893588f4dae7b4a0a50e2799”,
        “MacAddress”: “02:42:ac:13:00:02”,
        “IPv4Address”: “172.19.0.2/16”,
        “IPv6Address”: “”
    }
},
...
```

Take care in the **IP of node_kong container**, it will be used in follow steps

Execute from kong container the curl to the IP of node_kong container

In our case, the **ip_node:kong** is *172.19.0.4*

`docker exec -ti kong sh / # curl -i {{ip_node_kong}}:10000/customers`

*If any trouble, try this, it's possible the docker image can't execute a curl command*

*`curl -I {{ip_node_kong}}:10000/customers`*


The response must be very likely:
```
HTTP/1.1 200 
OKX-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-Tf3vAGLC3XH0dFR2pCIzWdG8/5c”
Date: Wed, 10 Jun 2020 12:22:16 GMT
Connection: keep-alive

[
    {
        "id”:1,
        "first_name”:"Barley”,
        "last_name”:”Inspector"
    },{
        "id”:2,
        "first_name”:"Ian”,
        "last_name”:”Ligthfoot"
    }
]
```

## Setup KONG as API-gateway 
Configure the API gateway to the API server routing. Routes are entry-points in Kong and define rules to match client requests.
Once a Route is matched, Kong proxies the request to its associated Service.
The service that has been defined will be direct to API server that is ready to serve.
API server that is live on server http://{{ip_node_kong}}:10000/api/v1/customers
We set the next route path

*/api/v1/customers*

And set the service host to 

`http://{{ip_node_kong}}:10000/api/v1/customers`

So, when client request to kong (in this case kong is live at localhost:8000) with path route /api/v1/customer : in complete client request:

`http://localhost:8000/customers`

Kong will proxy it to: `*{{ip_node_kong}}:10000/api/v1/customers*`

To setup your services, go to source documentation for get a guide fot it [here](https://docs.konghq.com/2.0.x/getting-started/configuring-a-service/)

**Create a service in Kong**

```curl --location --request POST 'localhost:8001/services/' \
--header 'Content-Type: application/json' \
--data-raw '{ "name": "api-v1", "url": "http://172.23.0.4:10000/api/v1" }'
```

**Get services from Kong**

`curl --location --request GET 'localhost:8001/services'`

**Remove service by id**
*$KONG_SERVICE_ID=93f1bb40-2f87-428c-8df6-8e35446abffb*
`curl --location --request DELETE 'localhost:8001/services/$KONG_SERVICE_ID'`

**Create a route for the service.**

the path "/" should allow to invoke the path defined in the app, in our case we have:

- /customers
- /clients

```
curl --location --request POST 'localhost:8001/services/api-v1/routes/' \
--header 'Content-Type: application/json' \
--data-raw '{ "hosts": [“apitrain2o2o"], "paths": ["/"] }'
```

**Get the routes from Kong**

`curl --location --request GET 'localhost:8001/routes'`

**Test the service -> route -> backend**

`curl --location --request GET 'localhost:8000/customers' --header 'Host: apitrain2o2o'`

> At this moment, Kong is working as a proxy, routing requests from localhost:8000 -> {{ip_node_kong}}:10000/api/v1

**Secure the endpoints**

First start with simple basic authentication through API-KEY token plugin, more details in plugins [here](https://docs.konghq.com/hub/)

`curl -i -X POST --url http://localhost:8001/services/api-v1/plugins/ --data 'name=key-auth'`

>Invoke to customers o clients application endpoint and verify that the plugin is properly configured
>
>```
>{
>    "message": "No API key found in request”
>}
>```

**Set the consumer**

Create a consumer for the customer and clients app endpoints, in this way the consumer will be identified

`curl -i -X POST --url http://localhost:8001/consumers/ --data "username=dash@i.db.com"`

Response like this:

```
HTTP/1.1 201 
CreatedDate: Thu, 11 Jun 2020 08:46:07 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Access-Control-Allow-Origin: *Server: kong/2.0.4
Content-Length: 130
X-Kong-Admin-Latency: 5

{
    "custom_id":null,
    "created_at":1591865167,
    "id":"8df0ede6-1116-41b5-a632-125401c2aadd”,
    "tags":null,
    "username":"nofolk@someone.com”
}
```

**Provision key credentials**

Grant the recent consumer with an apikey for consume app’s endpoints

`curl -i -X POST --url http://localhost:8001/consumers/8df0ede6-1116-41b5-a632-125401c2aadd/key-auth/ --data 'key=MTU4NDgyNzc3MmRhc2hAaS5kYi5jb20K'`

The response:

```
HTTP/1.1 201 
CreatedDate: Thu, 11 Jun 2020 08:49:27 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Access-Control-Allow-Origin: *Server: kong/2.0.4
Content-Length: 190
X-Kong-Admin-Latency: 7

{
    "created_at":1591865367,
    "consumer”:{
        "id":"8df0ede6-1116-41b5-a632-125401c2aadd”
    },
    "id":"ac361bdb-e742-4d1f-9af9-26e9850ff2b4”,
    "tags":null,
    "ttl":null,
    "key":”MTU4NDgyNzc3MmRhc2hAaS5kYi5jb20K"
}
```

**Test the apikey token**

Set the api key in the param section to test apikey token is working properly:

`curl --location --request GET 'localhost:8000/customers' --header 'Host: apitrain2o2o' --header 'apikey: MTU4NDgyNzc3MmRhc2hAaS5kYi5jb20K'`

Response expected:

```
[
    {
        "id": 1,
        "first_name": "Manticore",
        "last_name": "Spencer"
    },
    {
        "id": 2,
        "first_name": "Laurel",
        "last_name": "Dreyfus"
    }
]
```

Find more info about this plugin [here](https://docs.konghq.com/hub/kong-inc/key-auth/)

## Use an UI for kong

An alternative for use Kong is to use an interface like [Konga](https://pantsel.github.io/konga/)

**Installing konga**

You can install Konga as a nodejs application or as a docker container. In our case we rather docker, as Kong also is running under docker and a docker network.

`docker run -d -p 1337:1337 --network kong-net --name konga -e "NODE_ENV=development" -e "TOKEN_SECRET=mysecret" pantsel/konga`

Take a look to the docker running table and verify Konga is up

`docker ps -a`

|CONTAINER ID|IMAGE|COMMAND|CREATED|STATUS|PORTS|NAMES|
|------------|-----|-------|-------|------|-----|-----|
|df3f55406f57|pantsel/konga|"/app/start.sh"|37 minutes ago|Up 37 minutes|0.0.0.0:1337->1337/tcp|konga|
|8fe52fb74241|node_kong|"docker-entrypoint.s…"|39 hours ago|Up 39 hours|8080/tcp|node_konge|
|6c47895a0bb|kong:latest|"/docker-entrypoint.…"|2 days ago|Up 2 days|0.0.0.0:8000->8000/tcp, 127.0.0.1:8001->8001/tcp, 0.0.0.0:8443->8443/tcp, 127.0.0.1:8444->8444/tcp|kong|
|3d610b03bdcd|postgres:9.6|"docker-entrypoint.s…"|2 days ago|Up 2 days|0.0.0.0:5432->5432/tcp|kong-database|

As you can see, it’s running on port 1337, so let’s gonna try 

`curl -I localhost:1337`

```
Response
HTTP/1.1 302 Found
X-Powered-By: Sails <sailsjs.org>
Location: /register
Vary: Accept
Content-Type: text/plain; charset=UTF-8
Content-Length: 31
Date: Fri, 12 Jun 2020 06:56:08 GMT
Connection: keep-alive
```

**Configure Konga to use Kong**

The Konga wellcome page invites you to create the admin user at first time, so provide the required info to logon

Once did it, go below in the next page and set the next values to the connection fields:

**Name**: *kong-net*
**Kong Admin URL**: *http://172.19.0.3*

> *Note. Remember that Kong is running in a docker container, so you must provide the IP of the container.*

Click on the “**Create connection**” button and you will see the Dashboard. 

More info about konga [here](https://hub.docker.com/r/pantsel/konga/)

Here an interesting video about API Management [API Management](https://www.youtube.com/watch?v=U2GUzfrkRiA)