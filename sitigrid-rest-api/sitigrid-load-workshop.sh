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

echo 'Query all donors'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/customers -H 'content-type: application/json'

echo '---------------------------------------'
echo Donation
echo '---------------------------------------'
echo
echo 'Create Donation'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 100,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "customerName": "edge",
        "ngoRegistrationNumber": "1102"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION2}"'",
        "donationAmount": 255,
        "donationDate": "2018-09-18T07:41:59.582Z",
        "customerName": "jane",
        "ngoRegistrationNumber": "1105"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION3}"'",
        "donationAmount": 900,
        "donationDate": "2018-09-09T06:32:59.582Z",
        "customerName": "louisa",
        "ngoRegistrationNumber": "1103"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION4=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION4}"'",
        "donationAmount": 430,
        "donationDate": "2018-08-09T09:32:59.582Z",
        "customerName": "braendle",
        "ngoRegistrationNumber": "1103"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION5=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION5}"'",
        "donationAmount": 200,
        "donationDate": "2018-09-18T07:41:59.582Z",
        "customerName": "edge",
        "ngoRegistrationNumber": "1103"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION6=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION6}"'",
        "donationAmount": 520,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "customerName": "edge",
        "ngoRegistrationNumber": "1101"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION7=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION7}"'",
        "donationAmount": 760,
        "donationDate": "2018-09-18T07:41:59.582Z",
        "customerName": "jane",
        "ngoRegistrationNumber": "1105"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION8=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION8}"'",
        "donationAmount": 25,
        "donationDate": "2018-09-09T06:32:59.582Z",
        "customerName": "louisa",
        "ngoRegistrationNumber": "1101"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION9=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION9}"'",
        "donationAmount": 44,
        "donationDate": "2018-08-09T09:32:59.582Z",
        "customerName": "braendle",
        "ngoRegistrationNumber": "1103"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION10=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION10}"'",
        "donationAmount": 120,
        "donationDate": "2018-09-18T07:41:59.582Z",
        "customerName": "edge",
        "ngoRegistrationNumber": "1104"
}')
echo "Transaction ID is $TRX_ID"

echo 'Query all Donations'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json'


