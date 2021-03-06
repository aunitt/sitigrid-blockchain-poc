# Part 4: RESTful API to expose the Chaincode

The RESTful API is a Node.js application that uses the Fabric SDK to interact with the Fabric chaincode
and exposes the chaincode functions as REST APIs. This allows loose coupling between the UI application
and the underlying Fabric network.

## Pre-requisites
For the Fabric workshop, the REST API server will run on the Fabric client node.

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the AWS CloudFormation stack you 
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
they are not, follow Step 4 in [Part 1](../sitigrid-fabric/README.md) to repopulate them:

```
cd ~/sitigrid-blockchain-poc/sitigrid-fabric
source fabric-exports.sh
```

## Step 1 - Install Node
On the Fabric client node.

Install Node.js. We will use v8.x.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

```
. ~/.nvm/nvm.sh
nvm install lts/carbon
nvm use lts/carbon
```

Amazon Linux seems to be missing g++, so:

```
sudo yum install gcc-c++ -y
```

## Step 2 - Install dependencies
On the Fabric client node.

```
cd ~/sitigrid-blockchain-poc/sitigrid-rest-api
npm install
```

## Step 3 - Generate a connection profile
On the Fabric client node.

The REST API needs a connection profile to connect to the Fabric network. Connection profiles describe
the Fabric network and provide information needed by the Node.js application in order to connect to the
Fabric network. The instructions below will auto-generate a connection profile. 

Generate the connection profile using the script below and check that the connection profile contains 
URL endpoints for the peer, ordering service and CA, an 'mspid', a 'caName', and that the admin username and password
match those you entered when creating the Fabric network. If they do not match, edit the connection profile
and update them. The connection profile can be found here: `~/sitigrid-blockchain-poc/tmp/connection-profile/sitigrid-connection-profile.yaml`

```
cd ~/sitigrid-blockchain-poc/sitigrid-rest-api/connection-profile
./gen-connection-profile.sh
cd ~/sitigrid-blockchain-poc/tmp/connection-profile/
cat sitigrid-connection-profile.yaml
```

## Step 4 - Run the REST API Node.js application
On the Fabric client node.

Run the app:

```
cd ~/sitigrid-blockchain-poc/sitigrid-rest-api
nvm use lts/carbon
node app.js 
```

## Step 5 - Test the REST API
Open a new terminal pane within Cloud 9.  Click on Window -> New Terminal.

From the new terminal, SSH into the Fabric cilent node.  

```
export REGION=us-east-1
export STACKNAME=$(aws cloudformation describe-stacks --region $REGION --query 'Stacks[?Description==`Amazon Managed Blockchain. Creates network with a single member and peer node`] | [0].StackName' --output text)
export NETWORKNAME=$(aws cloudformation describe-stacks --stack-name $STACKNAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`NetworkName`].OutputValue' --output text)
export EC2URL=$(aws cloudformation describe-stacks --stack-name sitigrid-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='EC2URL'].OutputValue" --output text --region $REGION)
ssh ec2-user@$EC2URL -i ~/$NETWORKNAME-keypair.pem
```

On the Fabric client node.

Once the app is running you can register an identity, and then start to execute chaincode. The command
below registers a user identity with the Fabric CA. This user identity is then used to run chaincode
queries and invoke transactions.

### Register/enroll a user:

request:
```
curl -s -X POST http://localhost:3000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=michael&orgName=Org1'
```

response:
```
{"success":true,"secret":"","message":"michael enrolled Successfully"}
```

**If you encounter an error such as `{"code":20,"message":"Authorization failure"}`, it is likely because the admin credentials in `config.json` above are incorrect.  Update those and restart the REST API server that is running in the other terminal.**

### POST a meterpoint

request:
```
curl -s -X POST "http://localhost:3000/meters" -H "content-type: application/json" -d '{ 
   "MPAN": "00-111-222-14-1234-5678-345", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}'
```

response:
A transaction ID, which can be ignored:

```
{"transactionId":"2f3f3a85340bde09b505b0d37235d1d32a674e43a66229f9a205e7d8d5328ed1"}
```

### Get all meters

request:
```
curl -s -X GET   "http://localhost:3000/meters" -H "content-type: application/json"
```

response:
```
[
    {"docType":"user","MPAN":"00-111-222-13-1234-5678-345","registeredDate":"2018-10-22T11:52:20.182Z"}
]
```
## Step 6 - Load the workshop test data
On the Fabric client node.

Loading the test data uses cURL commands similar to those you used above to test the API. 
This step outputs a lot of text as it is creating the test data, so if you prefer to run this from a new terminal, 
you can open a new Cloud 9 terminal and SSH into the Fabric client node to create a new terminal session. If you do
this, remember to rerun the statements under Pre-requisites above.

To run the script:

```
cd ~/sitigrid-blockchain-poc/sitigrid-rest-api
./sitigrid-load-workshop.sh
```

# Testing
The workshop runs the REST API server on the Fabric client node. If you exit the SSH session on the Fabric client node, 
the running REST API server will automatically exit. You would need to restart it after SSH'ing back into 
the Fabric client node.

For purposes of the workshop we can just leave the SSH session open. However, if we need to keep the REST 
API application running after we exit the SSH session, we can use various methods to do this. I use `PM2`,
using a command such as `pm2 start app.js`, which will keep the app running. The logs can be found in `~/.pm2/logs`.

## Optionally move on to Part 4
The workshop instructions can be found in the README files in parts 1-3:

* [Part 1:](../sitigrid-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../sitigrid-chaincode/README.md) Deploy the sitigrid chaincode. 
* [Part 3:](../sitigrid-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 4:](../sitigrid-rest-api/README.md) Run the RESTful API server.  
* [Part 5:](../new-member/README.md) Add a new member to the network.

