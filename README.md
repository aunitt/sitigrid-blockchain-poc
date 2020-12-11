# Sitigrid Blockchain Proof of Concept

Based on Amazon Managed Blockchain Workshop example code - https://github.com/aws-samples/non-profit-blockchain

## Building and deploying Sitigrid Blockchain for Hyperledger Fabric on Amazon Managed Blockchain

This proof of concept builds a Hyperledger Fabric blockchain network using Amazon Managed Blockchain. Once the Fabric network has been created, you will deploy a 3-tier application that uses the Fabric network to track transactions on a peer to peer energy grid. The application consists of the following components:

* Fabric Chaincode, written in Node.js, deployed to a Hyperledger Fabric network
* An API written using Node.js Lambda functions and using the Amazon API Gateway
* A sample REACT application available at https://github.com/aunitt/sitigrid-app
* There is also RESTful API, running as a Node.js Express application, using the Hyperledger Fabric Client SDK to query 
and invoke chaincode - this is currently only used for testing

This example will build a Hyperledger Fabric blockchain network using Amazon Managed Blockchain, deploy the chaincode
and finally build and deploy a RESTful API using Lambda functions and the API gateway. The example is divided into four parts:

1. Building a Hyperledger Fabric blockchain network using Amazon Managed Blockchain. Instructions can be found in the folder: [sitigrid-fabric](sitigrid-fabric)
2. Deploying the chaincode, or smart contract, that provides the donation and spend tracking functionality. Instructions can be found in the folder: [sitigrid-chaincode](sitigrid-chaincode)
3. Deploying the lambda API being an API gateway. Instructions can be found in the folder: [sitigrid-lambda](sitigrid-lambda) 
4. Optionally starting the Node.js RESTful API server that exposes the chaincode functions to client applications. Instructions can be found in the folder: [sitigrid-rest-api](sitigrid-rest-api)

## Getting started

To build the network, deploy the chaincode and start the API, follow the 
README instructions in parts 1-3, in this order (parts 4 & 5 are optional):

* [Part 1:](sitigrid-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](sitigrid-chaincode/README.md) Deploy the sitigrid chaincode.
* [Part 3:](sitigrid-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda. 
* [Part 4:](sitigrid-rest-api/README.md) Run the RESTful API server. 
* [Part 5:](new-member/README.md) Add a new member to the network. 


## Cleanup

To clean up your resources delete the Hyperledger Fabric network managed by Amazon Managed Blockchain and the AWS CloudFormation template as follows:

* In the AWS CloudFormation console delete the stack with the stack name `<your network>-fabric-client-node`
* In the Amazon Managed Blockchain console delete the member for your network. This will delete the peer node, the member, and finally, the Fabric network (assuming you created only one member)
* In the AWS Cloud9 console delete your AWS Cloud9 instance

## License

This example is licensed under the Apache 2.0 License. 
