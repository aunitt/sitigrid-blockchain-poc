#!/bin/bash

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# or in the "license" file accompanying this file. This file is distributed 
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
# express or implied. See the License for the specific language governing 
# permissions and limitations under the License.

echo Run this script on the Fabric client node, OUTSIDE of the CLI container
echo
echo Add User

# Note the Args below - we are passing in a JSON payload, rather than the usual array of strings that Fabric requires. 
# IMO this is much better as we can clearly see what each argument means, rather than just passing an array of strings

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createCustomer","{\"customerName\": \"edge\", \"email\": \"edge@def.com\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createCustomer","{\"customerName\": \"braendle\", \"email\": \"braendle@def.com\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}'
echo Add Donation

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" 
\ -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" 
\ cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME 
\ -c '{"Args":["createDonation","{\"donationId\": \"2211\", \"donationAmount\": 100, \"donationDate\": \"2018-09-20T12:41:59.582Z\", \"customerName\": \"edge\", \"ngoRegistrationNumber\": \"6322\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createDonation","{\"donationId\": \"2212\", \"donationAmount\": 733, \"donationDate\": \"2018-09-20T12:41:59.582Z\", \"customerName\": \"braendle\", \"ngoRegistrationNumber\": \"6322\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createDonation","{\"donationId\": \"2230\", \"donationAmount\": 450, \"donationDate\": \"2018-09-20T12:41:59.582Z\", \"customerName\": \"edge\", \"ngoRegistrationNumber\": \"6323\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createDonation","{\"donationId\": \"2231\", \"donationAmount\": 29, \"donationDate\": \"2018-09-20T12:41:59.582Z\", \"customerName\": \"braendle\", \"ngoRegistrationNumber\": \"6323\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createDonation","{\"donationId\": \"2232\", \"donationAmount\": 98, \"donationDate\": \"2018-09-20T12:41:59.582Z\", \"customerName\": \"braendle\", \"ngoRegistrationNumber\": \"6323\"}"]}'

echo Query all donors

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllCustomers"]}'

echo Query specific donor

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryUser","{\"customerName\": \"edge\"}"]}'

echo Query all Sitigrids

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllSitigrids"]}'

echo Query specific Sitigrid

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["querySitigrid","{\"ngoRegistrationNumber\": \"6322\"}"]}'

echo Query all Donations

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllDonations"]}'

echo Query all Donations for NGO

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryDonationsForNGO","{\"ngoRegistrationNumber\": \"6322\"}"]}'

echo Query all Spend

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllSpends"]}'

echo Query history for a specific key

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryHistoryForKey","{\"key\": \"136772b8c4bc84c09f86d8f936ae107a5fcbfbaa25b15d4a9ee7059dac1b312a-0\"}"]}'
