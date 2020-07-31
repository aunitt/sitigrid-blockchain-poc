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

# Script for loading the Sitigrids and other data used in the workshop, via the REST API
# Set the exports below to point to the REST API hostname/port and run the script

# The export statements below can be used to point to either localhost or to an ELB endpoint, 
# depending on where the REST API server is running 
set +e
#export ENDPOINT=ngo10-elb-2090058053.us-east-1.elb.amazonaws.com
#export PORT=80
export ENDPOINT=localhost
export PORT=3000

echo '---------------------------------------'
echo connecting to server: $ENDPOINT:$PORT
echo '---------------------------------------'

echo '---------------------------------------'
echo Registering a user
echo '---------------------------------------'
echo 'Register User'
USERID=$(uuidgen)
echo
response=$(curl -s -X POST http://${ENDPOINT}:${PORT}/users -H 'content-type: application/x-www-form-urlencoded' -d "username=${USERID}&orgName=Org1")
echo $response
echo Response should be: {"success":true,"secret":"","message":"$USERID enrolled Successfully"}

echo '---------------------------------------'
echo Meterpoints
echo '---------------------------------------'
echo 'Create Meterpoint'
echo
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/meters -H 'content-type: application/json' -d '{ 
   "MPAN": "jane", 
   "registeredDate": "2018-10-21T09:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/meters -H 'content-type: application/json' -d '{ 
   "MPAN": "louisa", 
   "registeredDate": "2018-11-18T05:32:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"

echo 'Query all meters'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters -H 'content-type: application/json'

echo '---------------------------------------'
echo Production
echo '---------------------------------------'
echo
echo 'Create Production'
echo
PRODUCTION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION1}"'",
        "productionAmount": 100,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION2}"'",
        "productionAmount": 255,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION3}"'",
        "productionAmount": 900,
        "productionDate": "2018-09-09T06:32:59.582Z",
        "MPAN": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION4=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION4}"'",
        "productionAmount": 430,
        "productionDate": "2018-08-09T09:32:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-678"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION5=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION5}"'",
        "productionAmount": 200,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION6=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION6}"'",
        "productionAmount": 520,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION7=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION7}"'",
        "productionAmount": 760,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION8=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION8}"'",
        "productionAmount": 25,
        "productionDate": "2018-09-09T06:32:59.582Z",
        "MPAN": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION9=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION9}"'",
        "productionAmount": 44,
        "productionDate": "2018-08-09T09:32:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-678"
}')
echo "Transaction ID is $TRX_ID"
echo
PRODUCTION10=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${PRODUCTION10}"'",
        "productionAmount": 120,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"

echo '---------------------------------------'
echo Consumptions
echo '---------------------------------------'
echo
echo 'Create Consumption'
echo
CONSUMPTION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION1}"'",
        "consumptionAmount": 100,
        "consumptionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION2}"'",
        "consumptionAmount": 144,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION3}"'",
        "consumptionAmount": 800,
        "consumptionDate": "2018-09-09T06:32:59.582Z",
        "MPAN": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION4=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION4}"'",
        "consumptionAmount": 420,
        "consumptionDate": "2018-08-09T09:32:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-678"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION5=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION5}"'",
        "consumptionAmount": 201,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION6=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION6}"'",
        "consumptionAmount": 520,
        "consumptionDate": "2018-09-20T12:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION7=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION7}"'",
        "consumptionAmount": 760,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION8=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION8}"'",
        "consumptionAmount": 255,
        "consumptionDate": "2018-09-09T06:32:59.582Z",
        "MPAN": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION9=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION9}"'",
        "consumptionAmount": 36,
        "consumptionDate": "2018-08-09T09:32:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-678"
}')
echo "Transaction ID is $TRX_ID"
echo
CONSUMPTION10=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${CONSUMPTION10}"'",
        "consumptionAmount": 120,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "MPAN": "00-111-222-13-1234-5678-345"
}')
echo "Transaction ID is $TRX_ID"



echo
echo 'Query all Productions'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json'
echo

echo
echo 'Query all Productions for a date range'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/productions/daterange?start=2018-09-18&end=2018-09-19 -H 'content-type: application/json'
echo

echo 
echo 'Query production for one meterpoint'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters/00-111-222-13-1234-5678-345/productions -H 'content-type: application/json'
echo

echo
echo 'Total production for one meterpoint'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters/00-111-222-13-1234-5678-345/totalproductions -H 'content-type: application/json'
echo

echo 
echo 'Query consumption for one meterpoint'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters/00-111-222-13-1234-5678-345/consumptions -H 'content-type: application/json'
echo

echo
echo 'Total consumption for one meterpoint'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/meters/00-111-222-13-1234-5678-345/totalconsumptions -H 'content-type: application/json'
echo

