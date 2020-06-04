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
-c '{"Args":["createMeterpoint","{\"meterpoint\": \"00-111-222-13-1234-5678-345\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createMeterpoint","{\"meterpoint\": \"00-111-222-13-1234-5678-678\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}'
echo Add Donation

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" 
\ -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" 
\ cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME 
\ -c '{"Args":["createProductionRecord","{\"productionId\": \"2211\", \"productionAmount\": 100, \"productionDate\": \"2018-09-20T12:41:59.582Z\", \"meterpoint\": \"00-111-222-13-1234-5678-345\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createProductionRecord","{\"productionId\": \"2212\", \"productionAmount\": 733, \"productionDate\": \"2018-09-20T12:41:59.582Z\", \"meterpoint\": \"00-111-222-13-1234-5678-678\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createProductionRecord","{\"productionId\": \"2230\", \"productionAmount\": 450, \"productionDate\": \"2018-09-20T12:41:59.582Z\", \"meterpoint\": \"00-111-222-13-1234-5678-345\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createProductionRecord","{\"productionId\": \"2231\", \"productionAmount\": 29, \"productionDate\": \"2018-09-20T12:41:59.582Z\", \"meterpoint\": \"00-111-222-13-1234-5678-678\"}"]}'

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \ 
-c '{"Args":["createProductionRecord","{\"productionId\": \"2232\", \"productionAmount\": 98, \"productionDate\": \"2018-09-20T12:41:59.582Z\", \"meterpoint\": \"00-111-222-13-1234-5678-678\"}"]}'

echo Query all meters

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllMeterpoints"]}'

echo Query specific meterpoint

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryMeterpoint","{\"meterpoint\": \"00-111-222-13-1234-5678-345\"}"]}'

echo Query all Productions

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllProductions"]}'

echo Query all Spend

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryAllSpends"]}'

echo Query history for a specific key

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \ 
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \ 
cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["queryHistoryForKey","{\"key\": \"136772b8c4bc84c09f86d8f936ae107a5fcbfbaa25b15d4a9ee7059dac1b312a-0\"}"]}'
