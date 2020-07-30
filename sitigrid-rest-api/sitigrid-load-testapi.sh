#!/bin/bash

#
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
#

# Test script for testing the REST API
# Set the exports below to point to the REST API hostname/port and run the script

# The export statements below can be used to point to either localhost or to an ELB endpoint, 
# depending on where the REST API server is running 
#export ENDPOINT=Fabric-ELB-205962472.us-west-2.elb.amazonaws.com
#export PORT=80
export ENDPOINT=localhost
export PORT=3000
set +e
echo installing jq
sudo yum install jq
echo To test, run the API server as per the instructions in the README, then execute this script on the command line
echo 'NOTE: the logger for the REST API server (in app.js) should be running at INFO level, not DEBUG'
echo
RED='\033[0;31m'
RESTORE='\033[0m'
echo connecting to server: $ENDPOINT:$PORT
echo
echo '---------------------------------------'
echo Registering a user
echo '---------------------------------------'
echo 'Register User'
USERID=$(uuidgen)
echo
response=$(curl -s -X POST http://${ENDPOINT}:${PORT}/users -H 'content-type: application/x-www-form-urlencoded' -d "username=${USERID}&orgName=Org1")
echo $response
echo Response should be: {"success":true,"secret":"","message":"$USERID enrolled Successfully"}
echo
echo Checking response:
echo
ret=$(echo $response | jq '.message | contains("enrolled Successfully")')
if [ $ret ]; then
        echo test case passed
else
        echo -e ${RED} ERROR - test case failed - user was not enrolled ${RESTORE}
fi
echo $response | jq ".message" | grep "$USERID enrolled Successfully"
echo
echo '---------------------------------------'
echo Donors
echo '---------------------------------------'
echo 'Create Donor'
echo
DONOR1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/meters -H 'content-type: application/json' -d '{ 
   "MPAN": "'"${DONOR1}"'", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
DONOR2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/meters -H 'content-type: application/json' -d '{ 
   "MPAN": "'"${DONOR2}"'", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query all donors'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters -H 'content-type: application/json'
echo
echo 'Query specific donors'
echo
response=$(curl -s -X GET http://${ENDPOINT}:${PORT}/meters/${DONOR1} -H 'content-type: application/json')
echo $response
echo
ret=$(echo $response | jq '.[].docType' | jq 'contains("donor")')
echo $ret
if $ret ; then
        echo test case passed
else
        echo -e ${RED} ERROR - test case failed - query specific donors does not match expected result. Result is: $ret ${RESTORE}
fi

echo
echo '---------------------------------------'
echo Production
echo '---------------------------------------'
echo
echo 'Create Production'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 100,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION2}"'",
        "productionAmount": 999,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION3}"'",
        "productionAmount": 75,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query all Productions'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json'
echo
echo 'Query specific Production'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/productions/${DONATION2} -H 'content-type: application/json'
echo
echo 'Query Productions for a meterpoint'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters/${DONOR1}/productions/ -H 'content-type: application/json'
echo
echo 'Query Productions for an Sitigrid'
ret=$(echo $response | jq '.[].docType' | jq 'contains("production")')
echo $ret
if $ret ; then
        echo test case passed
else
        echo -e ${RED} ERROR - test case failed - query specific production does not match expected result. Result is: $response ${RESTORE}
fi
echo
echo 'Create Productions'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 111,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 222,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 222,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo

DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 875,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 1,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION1}"'",
        "productionAmount": 0,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "'"${DONOR1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query Blockinfo for a record key'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/blockinfos/spendAllocation/keys/12345 -H 'content-type: application/json'
