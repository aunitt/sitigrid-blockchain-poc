# Part 2: Sitigrid Chaincode

The instructions in this README will help you to install the Sitigrid chaincode on the
Fabric network you created in [Part 1](../sitigrid-fabric/README.md)

All steps are carried out on the Fabric client node you created in [Part 1](../sitigrid-fabric/README.md)

## Pre-requisites

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you 
created in [Part 1](../sitigrid-fabric/README.md)

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

You should have already cloned this repo in [Part 1](../sitigrid-fabric/README.md)

```
cd ~
git clone https://github.com/aunitt/sitigrid-blockchain.git
```

You will need to set the context before carrying out any Fabric CLI commands. We do this 
using the export files that were generated for us in [Part 1](../sitigrid-fabric/README.md)

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again. The `source` command below
will print out the values of the key ENV variables. Make sure they are all populated. If
they are not, follow Step 4 in [Part 1](../sitigrid-fabric/README.md) to repopulate them.

```
cd ~/sitigrid-blockchain-poc/sitigrid-fabric
source fabric-exports.sh
source ~/peer-exports.sh 
```

## Step 1 - Copy the chaincode into the CLI container

The Fabric CLI container that is running on your Fabric client node (do `docker ps` to see it)
mounts a folder from the Fabric client node EC2 instance: /home/ec2-user/fabric-samples/chaincode.
You can see this by looking at the docker config. Look at the `Mounts` section in the output where
you'll see `/home/ec2-user/fabric-samples/chaincode` mounted into the Docker container:

```
docker inspect cli
```

You should already have this folder on your Fabric client node as it was created earlier. Copying the 
chaincode into this folder will make it accessible inside the Fabric CLI container.

```
cd ~
mkdir -p ./fabric-samples/chaincode/sitigrid
cp ./sitigrid-blockchain-poc/sitigrid-chaincode/src/* ./fabric-samples/chaincode/sitigrid
```

## Step 2 - Install the chaincode on your peer

Before executing any chaincode functions, the chaincode must be installed on the peer node. Chaincode
must be installed on every peer that wants to invoke transactions or run the query functions in the
chaincode.

Notice we are using the `-l node` flag, as our chaincode is written in Node.js.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  \
    cli peer chaincode install -n sitigrid -l node -v v0 -p /opt/gopath/src/github.com/sitigrid
```

Expected response:

```
2018-11-15 06:39:47.625 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-15 06:39:47.625 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2018-11-15 06:39:47.625 UTC [container] WriteFolderToTarPackage -> INFO 003 rootDirectory = /opt/gopath/src/github.com/sitigrid
2018-11-15 06:39:47.636 UTC [chaincodeCmd] install -> INFO 004 Installed remotely response:<status:200 payload:"OK" >
```

## Step 3 - Instantiate the chaincode on the channel

Instantiation initializes the chaincode on the channel, i.e. it binds the chaincode to a specific channel.
Instantiation is treated as a Fabric transaction. In fact, when chaincode is instantiated, the Init function
on the chaincode is called. Instantiation also sets the endorsement policy for this version of the chaincode
on this channel. In the example below we are not explictly passing an endorsement policy, so the default
policy of 'any member of the organizations in the channel' is applied.

It can take up to 30 seconds to instantiate chaincode on the channel.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  \
    cli peer chaincode instantiate -o $ORDERER -C mychannel -n sitigrid -v v0 -c '{"Args":["init"]}' --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

Expected response:
(Note this might fail if the chaincode has been previously instantiated. Chaincode only needs to be
instantiated once on a channel)

```
2018-11-15 06:41:02.847 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-15 06:41:02.847 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
```

## Step 4 - Query the chaincode

Query all meters
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode query -C mychannel -n sitigrid -c '{"Args":["queryAllMeterpoints"]}'
```

Expected response:
This is correct as we do not have any meters in our network yet. We'll add one in the next step.

```
[]
```

## Step 5 - Invoke a transaction

Let's add a couple of meters to Fabric. Execute both of these transactions below:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode invoke -C mychannel -n sitigrid \
    -c  '{"Args":["createMeterpoint","{\"MPAN\": \"00-111-222-13-1234-5678-345\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}' -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode invoke -C mychannel -n sitigrid \
    -c  '{"Args":["createMeterpoint","{\"MPAN\": \"00-111-222-13-1234-5678-678\", \"registeredDate\": \"2018-11-05T14:31:20.182Z\"}"]}' -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

## Step 6 - Query the chaincode

Query all meters
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode query -C mychannel -n sitigrid -c '{"Args":["queryAllMeterpoints"]}'
```

Query a specific meters
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode query -C mychannel -n sitigrid -c '{"Args":["queryMeterpoint","{\"MPAN\": \"00-111-222-13-1234-5678-345\"}"]}'
```

## Move on to Part 3
The workshop instructions can be found in the README files in parts 1-3:

* [Part 1:](../sitigrid-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../sitigrid-chaincode/README.md) Deploy the sitigrid chaincode. 
* [Part 3:](../sitigrid-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 4:](../sitigrid-rest-api/README.md) Run the RESTful API server. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 

## Chaincode development

There are unit tests written for the chaincode. These can run using npm:
```
cd sitigrid-chaincode/src
npm test
```

If you want to update versions of chaincode in the live environment see - [updating-chaincode.md](updating-chaincode.md)

For details on the documents created in the blockchain by the chaincode see [docs/README.md](docs/README.md)