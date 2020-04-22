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
echo Customers
echo '---------------------------------------'
echo 'Create Customer'
echo
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/customers -H 'content-type: application/json' -d '{ 
   "customerName": "jane", 
   "email": "jane@abc.com", 
   "registeredDate": "2018-10-21T09:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/customers -H 'content-type: application/json' -d '{ 
   "customerName": "louisa", 
   "email": "louisa@hij.com", 
   "registeredDate": "2018-11-18T05:32:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"

echo 'Query all customers'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/customers -H 'content-type: application/json'

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
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION2}"'",
        "productionAmount": 255,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION3}"'",
        "productionAmount": 900,
        "productionDate": "2018-09-09T06:32:59.582Z",
        "customerName": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION4=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION4}"'",
        "productionAmount": 430,
        "productionDate": "2018-08-09T09:32:59.582Z",
        "customerName": "braendle"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION5=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION5}"'",
        "productionAmount": 200,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION6=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION6}"'",
        "productionAmount": 520,
        "productionDate": "2018-09-20T12:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION7=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION7}"'",
        "productionAmount": 760,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION8=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION8}"'",
        "productionAmount": 25,
        "productionDate": "2018-09-09T06:32:59.582Z",
        "customerName": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION9=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION9}"'",
        "productionAmount": 44,
        "productionDate": "2018-08-09T09:32:59.582Z",
        "customerName": "braendle"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION10=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json' -d '{ 
        "productionId": "'"${DONATION10}"'",
        "productionAmount": 120,
        "productionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"

echo '---------------------------------------'
echo Consumptions
echo '---------------------------------------'
echo
echo 'Create Consumption'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION1}"'",
        "consumptionAmount": 100,
        "consumptionDate": "2018-09-20T12:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION2}"'",
        "consumptionAmount": 144,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION3}"'",
        "consumptionAmount": 800,
        "consumptionDate": "2018-09-09T06:32:59.582Z",
        "customerName": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION4=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION4}"'",
        "consumptionAmount": 420,
        "consumptionDate": "2018-08-09T09:32:59.582Z",
        "customerName": "braendle"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION5=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION5}"'",
        "consumptionAmount": 201,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION6=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION6}"'",
        "consumptionAmount": 520,
        "consumptionDate": "2018-09-20T12:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION7=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION7}"'",
        "consumptionAmount": 760,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "jane"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION8=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION8}"'",
        "consumptionAmount": 255,
        "consumptionDate": "2018-09-09T06:32:59.582Z",
        "customerName": "louisa"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION9=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION9}"'",
        "consumptionAmount": 36,
        "consumptionDate": "2018-08-09T09:32:59.582Z",
        "customerName": "braendle"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION10=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/consumptions -H 'content-type: application/json' -d '{ 
        "consumptionId": "'"${DONATION10}"'",
        "consumptionAmount": 120,
        "consumptionDate": "2018-09-18T07:41:59.582Z",
        "customerName": "edge"
}')
echo "Transaction ID is $TRX_ID"



echo
echo 'Query all Productions'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/productions -H 'content-type: application/json'
echo

echo 
echo 'Query production for one customer'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/customers/edge/productions -H 'content-type: application/json'
echo

echo
echo 'Total production for one customer'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/customers/edge/totalproductions -H 'content-type: application/json'
echo

echo 
echo 'Query consumption for one customer'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/customers/edge/consumptions -H 'content-type: application/json'
echo

echo
echo 'Total consumption for one customer'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/customers/edge/totalconsumptions -H 'content-type: application/json'
echo

