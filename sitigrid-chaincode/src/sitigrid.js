/*
# Copyright 2020 Sitigrid. All Rights Reserved.
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
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

/************************************************************************************************
 * 
 * GENERAL FUNCTIONS 
 * 
 ************************************************************************************************/

/**
 * Executes a query using a specific key
 * 
 * @param {*} key - the key to use in the query
 */
async function queryByKey(stub, key) {
  console.log('============= START : queryByKey ===========');
  console.log('##### queryByKey key: ' + key);

  let resultAsBytes = await stub.getState(key); 
  if (!resultAsBytes || resultAsBytes.toString().length <= 0) {
    throw new Error('##### queryByKey key: ' + key + ' does not exist');
  }
  console.log('##### queryByKey response: ' + resultAsBytes);
  console.log('============= END : queryByKey ===========');
  return resultAsBytes;
}

/**
 * Executes a query based on a provided queryString
 * 
 * I originally wrote this function to handle rich queries via CouchDB, but subsequently needed
 * to support LevelDB range queries where CouchDB was not available.
 * 
 * @param {*} queryString - the query string to execute
 */
async function queryByString(stub, queryString) {
  console.log('============= START : queryByString ===========');
  console.log("##### queryByString queryString: " + queryString);

  // CouchDB Query
  // let iterator = await stub.getQueryResult(queryString);

  // Equivalent LevelDB Query. We need to parse queryString to determine what is being queried
  // In this chaincode, all queries will either query ALL records for a specific docType, or
  // they will filter ALL the records looking for a specific NGO, Donor, Donation, etc. So far, 
  // in this chaincode there is a maximum of one filter parameter in addition to the docType.
  let docType = "";
  let startKey = "";
  let endKey = "";
  let jsonQueryString = JSON.parse(queryString);
  if (jsonQueryString['selector'] && jsonQueryString['selector']['docType']) {
    docType = jsonQueryString['selector']['docType'];
    startKey = docType + "0";
    endKey = docType + "z";
  }
  else {
    throw new Error('##### queryByString - Cannot call queryByString without a docType element: ' + queryString);   
  }

  let iterator = await stub.getStateByRange(startKey, endKey);

  // Iterator handling is identical for both CouchDB and LevelDB result sets, with the 
  // exception of the filter handling in the commented section below
  let allResults = [];
  while (true) {
    let res = await iterator.next();

    if (res.value && res.value.value.toString()) {
      let jsonRes = {};
      console.log('##### queryByString iterator: ' + res.value.value.toString('utf8'));

      jsonRes.Key = res.value.key;
      try {
        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
      } 
      catch (err) {
        console.log('##### queryByString error: ' + err);
        jsonRes.Record = res.value.value.toString('utf8');
      }
      // ******************* LevelDB filter handling ******************************************
      // LevelDB: additional code required to filter out records we don't need
      // Check that each filter condition in jsonQueryString can be found in the iterator json
      // If we are using CouchDB, this isn't required as rich query supports selectors
      let jsonRecord = jsonQueryString['selector'];
      // If there is only a docType, no need to filter, just return all
      console.log('##### queryByString jsonRecord - number of JSON keys: ' + Object.keys(jsonRecord).length);
      if (Object.keys(jsonRecord).length == 1) {
        allResults.push(jsonRes);
        continue;
      }
      for (var key in jsonRecord) {
        if (jsonRecord.hasOwnProperty(key)) {
          console.log('##### queryByString jsonRecord key: ' + key + " value: " + jsonRecord[key]);
          if (key == "docType") {
            continue;
          }
          console.log('##### queryByString json iterator has key: ' + jsonRes.Record[key]);
          if (!(jsonRes.Record[key] && jsonRes.Record[key] == jsonRecord[key])) {
            // we do not want this record as it does not match the filter criteria
            continue;
          }
          allResults.push(jsonRes);
        }
      }
      // ******************* End LevelDB filter handling ******************************************
      // For CouchDB, push all results
      // allResults.push(jsonRes);
    }
    if (res.done) {
      await iterator.close();
      console.log('##### queryByString all results: ' + JSON.stringify(allResults));
      console.log('============= END : queryByString ===========');
      return Buffer.from(JSON.stringify(allResults));
    }
  }
}

/************************************************************************************************
 * 
 * CHAINCODE
 * 
 ************************************************************************************************/

let Chaincode = class {

  /**
   * Initialize the state when the chaincode is either instantiated or upgraded
   * 
   * @param {*} stub 
   */
  async Init(stub) {
    console.log('=========== Init: Instantiated / Upgraded Sitigrid chaincode ===========');
    return shim.success();
  }

  /**
   * The Invoke method will call the methods below based on the method name passed by the calling
   * program.
   * 
   * @param {*} stub 
   */
  async Invoke(stub) {
    console.log('============= START : Invoke ===========');
    let ret = stub.getFunctionAndParameters();
    console.log('##### Invoke args: ' + JSON.stringify(ret));

    let method = this[ret.fcn];
    if (!method) {
      console.error('##### Invoke - error: no chaincode function with name: ' + ret.fcn + ' found');
      throw new Error('No chaincode function with name: ' + ret.fcn + ' found');
    }
    try {
      let response = await method(stub, ret.params);
      console.log('##### Invoke response payload: ' + response);
      return shim.success(response);
    } catch (err) {
      console.log('##### Invoke - error: ' + err);
      return shim.error(err);
    }
  }

  /**
   * Initialize the state. This should be explicitly called if required.
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async initLedger(stub, args) {
    console.log('============= START : Initialize Ledger ===========');
    console.log('============= END : Initialize Ledger ===========');
  }

  /************************************************************************************************
   * 
   * Customer functions 
   * 
   ************************************************************************************************/

   /**
   * Creates a new customer
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "customerName":"edge",
   *    "email":"edge@abc.com",
   *    "registeredDate":"2018-10-22T11:52:20.182Z"
   * }
   */
  async createCustomer(stub, args) {
    console.log('============= START : createCustomer ===========');
    console.log('##### createCustomer arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'customer' + json['customerName'];
    json['docType'] = 'customer';

    console.log('##### createCustomer payload: ' + JSON.stringify(json));

    // Check if the donor already exists
    let donorQuery = await stub.getState(key);
    if (donorQuery.toString()) {
      throw new Error('##### createCustomer - This customer already exists: ' + json['customerName']);
    }

    await stub.putState(key, Buffer.from(JSON.stringify(json)));
    console.log('============= END : createCustomer ===========');
  }

  /**
   * Retrieves a specfic customer
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryCustomer(stub, args) {
    console.log('============= START : queryCustomer ===========');
    console.log('##### queryCustomer arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'customer' + json['customerName'];
    console.log('##### queryCustomer key: ' + key);

    return queryByKey(stub, key);
  }

  /**
   * Retrieves all customers
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryAllCustomers(stub, args) {
    console.log('============= START : queryAllCustomers ===========');
    console.log('##### queryAllCustomers arguments: ' + JSON.stringify(args));
 
    let queryString = '{"selector": {"docType": "customer"}}';
    return queryByString(stub, queryString);
  }

  /************************************************************************************************
   * 
   * Energy production functions 
   * 
   ************************************************************************************************/

  /**
   * Creates a new energy production record
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "productionId":"2211",
   *    "productionAmount":100,
   *    "productionDate":"2018-09-20T12:41:59.582Z",
   *    "customerName":"edge"
   * }
   */
  async createProductionRecord(stub, args) {
    console.log('============= START : createProductionRecord ===========');
    console.log('##### createProductionRecord arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'production' + json['productionId'];
    json['docType'] = 'production';

    console.log('##### createProductionRecord production: ' + JSON.stringify(json));

    // Confirm the customer exists
    let customerKey = 'customer' + json['customerName'];
    let customerQuery = await stub.getState(customerKey);
    if (!customerQuery.toString()) {
      throw new Error('##### createProductionRecord - Cannot create production as the Customer does not exist: ' + json['customerName']);
    }

    // Check if the Production already exists
    let productionQuery = await stub.getState(key);
    if (productionQuery.toString()) {
      throw new Error('##### createProductionRecord - This production already exists: ' + json['productionId']);
    }

    await stub.putState(key, Buffer.from(JSON.stringify(json)));
    console.log('============= END : createProductionRecord ===========');
  }

  /**
   * Retrieves a specfic production
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryProduction(stub, args) {
    console.log('============= START : queryProduction ===========');
    console.log('##### queryProduction arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'production' + json['productionId'];
    console.log('##### queryProduction key: ' + key);
    return queryByKey(stub, key);
  }

  /**
   * Retrieves productions for a specfic customer
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryProductionsForCustomer(stub, args) {
    console.log('============= START : queryProductionsForCustomer ===========');
    console.log('##### queryProductionsForCustomer arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let queryString = '{"selector": {"docType": "production", "customerName": "' + json['customerName'] + '"}}';
    return queryByString(stub, queryString);
  }

  /**
   * Retrieves the sum of productions for a specfic customer
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryTotalProductionsForCustomer(stub, args) {
    console.log('============= START : queryTotalProductionsForCustomer ===========');
    console.log('##### queryTotalProductionsForCustomer arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let queryString = '{"selector": {"docType": "production", "customerName": "' + json['customerName'] + '"}}';
    let productions = await queryByString(stub, queryString);
    productions = JSON.parse(productions.toString());
    console.log('#####  -queryTotalProductionsForCustomer productions as JSON: ' + productions);

    let totalProductions = 0;
    for (let n = 0; n < productions.length; n++) {
      let production = productions[n];
      console.log('##### queryTotalProductionsForCustomer - production: ' + JSON.stringify(donation));
      totalProductions += production['Record']['productionAmount'];
    }
    console.log('##### allocateSpend - Total productions for this customer are: ' + totalProductions.toString());
    
    return totalProductions.toString();
  }

  /**
   * Retrieves all productions
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryAllProductions(stub, args) {
    console.log('============= START : queryAllProductions ===========');
    console.log('##### queryAllProductions arguments: ' + JSON.stringify(args)); 
    let queryString = '{"selector": {"docType": "production"}}';
    return queryByString(stub, queryString);
  }

  /************************************************************************************************
   * 
   * Blockchain related functions 
   * 
   ************************************************************************************************/

  /**
   * Retrieves the Fabric block and transaction details for a key or an array of keys
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * [
   *    {"key": "a207aa1e124cc7cb350e9261018a9bd05fb4e0f7dcac5839bdcd0266af7e531d-1"}
   * ]
   * 
   */
  async queryHistoryForKey(stub, args) {
    console.log('============= START : queryHistoryForKey ===========');
    console.log('##### queryHistoryForKey arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = json['key'];
    let docType = json['docType']
    console.log('##### queryHistoryForKey key: ' + key);
    let historyIterator = await stub.getHistoryForKey(docType + key);
    console.log('##### queryHistoryForKey historyIterator: ' + util.inspect(historyIterator));
    let history = [];
    while (true) {
      let historyRecord = await historyIterator.next();
      console.log('##### queryHistoryForKey historyRecord: ' + util.inspect(historyRecord));
      if (historyRecord.value && historyRecord.value.value.toString()) {
        let jsonRes = {};
        console.log('##### queryHistoryForKey historyRecord.value.value: ' + historyRecord.value.value.toString('utf8'));
        jsonRes.TxId = historyRecord.value.tx_id;
        jsonRes.Timestamp = historyRecord.value.timestamp;
        jsonRes.IsDelete = historyRecord.value.is_delete.toString();
      try {
          jsonRes.Record = JSON.parse(historyRecord.value.value.toString('utf8'));
        } catch (err) {
          console.log('##### queryHistoryForKey error: ' + err);
          jsonRes.Record = historyRecord.value.value.toString('utf8');
        }
        console.log('##### queryHistoryForKey json: ' + util.inspect(jsonRes));
        history.push(jsonRes);
      }
      if (historyRecord.done) {
        await historyIterator.close();
        console.log('##### queryHistoryForKey all results: ' + JSON.stringify(history));
        console.log('============= END : queryHistoryForKey ===========');
        return Buffer.from(JSON.stringify(history));
      }
    }
  }
}
shim.start(new Chaincode());
