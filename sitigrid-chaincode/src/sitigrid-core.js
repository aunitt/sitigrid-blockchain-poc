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

function normaliseToMSEpoch(ts) {
  if ( typeof ts === 'string')
    ts = new Date(ts).getTime();

  if ( ts < 9999999999 )
    // Assume we are passed an epoch time in seconds without millisecond component
    return ts * 1000;
    
  else
    return ts;
}

function isSaneDate(ts){
  // ts = epoch timestamp
  let date = new Date(ts);
  let year = date.getFullYear();

  return ( year >= 2000 && year < 2100 );
}

function getSenderOrg(sender){
  if ( "mspid" in sender )
    return sender.mspid;

  if ( "mspId" in sender)
    return sender.mspId;

  throw new Error("Owner not found in sender object");
}

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

async function getAllResults(iterator) {
  let allResults = [];
  while (true) {
    let res = await iterator.next();

    if (res.value && res.value.value.toString()) {
      let jsonRes = {};
      jsonRes.Key = res.value.key;
      try {
        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
      } catch (err) {
        console.log(err);
        jsonRes.Record = res.value.value.toString('utf8');
      }

      allResults.push(jsonRes);
    }
    if (res.done) {
      console.log('end of data');
      await iterator.close();
      console.info(allResults);
      return allResults;
    }
  }
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
  // they will filter ALL the records looking for a specific Meterpoint, Production, etc. So far, 
  // in this chaincode there is a maximum of one filter parameter in addition to the docType.
  let docType = "";
  let startKey = "";
  let endKey = "";
  let jsonQueryString = JSON.parse(queryString);
  if (jsonQueryString.selector && jsonQueryString.selector.docType) {
    docType = jsonQueryString.selector.docType;
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
      let jsonRecord = jsonQueryString.selector;
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
   * Meter point functions 
   * 
   ************************************************************************************************/

   /**
   * Creates a new meter point
   * 
   * See https://en.wikipedia.org/wiki/Meter_Point_Administration_Number
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "MPAN":"00-111-222-13-1234-5678-345",
   *    "registeredDate":"1537447319000"
   * }
   */
  async createMeterpoint(stub, args) {
    console.log('============= START : createMeterpoint ===========');
    console.log('##### createMeterpoint arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'meterpoint' + json.MPAN;
    json.docType = 'meterpoint';

    console.log('##### createMeterpoint payload: ' + JSON.stringify(json));

    // Check if the meterpoint already exists
    let meterpointQuery = await stub.getState(key);
    if ( meterpointQuery && meterpointQuery.toString() ) {
      throw new Error('##### createMeterpoint - This meterpoint already exists: ' + json.MPAN);
    }

    // Check validity of registration date
    json.registeredDate = normaliseToMSEpoch(json.registeredDate);
    if ( !isSaneDate(json.registeredDate) ) {
      throw new Error('##### createMeterpoint - This date is not valid: ' + json.registeredDate);
    }

    await stub.putState(key, Buffer.from(JSON.stringify(json)));
    console.log('============= END : createMeterpoint ===========');
  }

  /**
   * Retrieves a specfic meterpoint
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryMeterpoint(stub, args) {
    console.log('============= START : queryMeterpoint ===========');
    console.log('##### queryMeterpoint arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'meterpoint' + json.MPAN;
    console.log('##### queryMeterpoint key: ' + key);

    return queryByKey(stub, key);
  }

  /**
   * Retrieves all meters
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryAllMeterpoints(stub, args) {
    console.log('============= START : queryAllMeterpoints ===========');
    console.log('##### queryAllMeterpoints arguments: ' + JSON.stringify(args));
 
    let queryString = '{"selector": {"docType": "meterpoint"}}';
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
   *    "productionDate":1537447319000,
   *    "MPAN":"00-111-222-13-1234-5678-345"
   * }
   * 
   * productionDate must be in Epoch format
   * 
   * NOTE: Also creates an index record with to allow us to index by date 
   * 
   */
  async createProductionRecord(stub, args) {
    console.log('============= START : createProductionRecord ===========');
    console.log('##### createProductionRecord arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    await akaCreateProductionRecord(json, stub, false);

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
    let key = 'production' + json.productionId;
    console.log('##### queryProduction key: ' + key);
    return queryByKey(stub, key);
  }

  /**
   * Retrieves productions for a specfic meterpoint
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryProductionsForMeterpoint(stub, args) {
    console.log('============= START : queryProductionsForMeterpoint ===========');
    console.log('##### queryProductionsForMeterpoint arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let queryString = '{"selector": {"docType": "production", "MPAN": "' + json.MPAN + '"}}';
    return queryByString(stub, queryString);
  }

  /**
   * Retrieves the sum of productions for a specfic meterpoint
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryTotalProductionsForMeterpoint(stub, args) {
    console.log('============= START : queryTotalProductionsForMeterpoint ===========');
    console.log('##### queryTotalProductionsForMeterpoint arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let queryString = '{"selector": {"docType": "production", "MPAN": "' + json.MPAN + '"}}';
    let productions = await queryByString(stub, queryString);
    productions = JSON.parse(productions.toString());
    console.log('#####  -queryTotalProductionsForMeterpoint productions as JSON: ' + JSON.stringify(productions));

    let totalProductions = 0;
    console.log('#####  -queryTotalProductionsForMeterpoint number of productions: ' + productions.length);
    for(const production of productions) { 
      console.log('##### queryTotalProductionsForMeterpoint - production: ' + JSON.stringify(production));
      totalProductions += production.Record.productionAmount;
    }
    console.log('##### queryTotalProductionsForMeterpoint - Total productions for this meterpoint are: ' + totalProductions.toString());
    
    let result = { 'totalProductions' : totalProductions };
    console.log('##### queryTotalProductionsForMeterpoint - Total result: ' + JSON.stringify(result));
    
    return Buffer.from(JSON.stringify(result));
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

  /**
   * Retrieves all productions in a given date range
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "startDate":"2018-09-20T12:41:59.582Z",
   *    "endDate":"2018-09-21T00:00:00.000Z"
   * }
   */
  async queryAllProductionsInDateRange(stub, args) {
    console.log('============= START : queryAllProductionsInDateRange ===========');
    console.log('##### queryAllProductionsInDateRange arguments: ' + JSON.stringify(args)); 

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let startIndex = 'prodDate' + json.startDate;
    let endIndex = 'prodDate' + json.endDate;

    // execute a range query on the given dates
    let resultsIterator = await stub.getStateByRange(startIndex,endIndex);
    let productions  = await getAllResults(resultsIterator);

    let result=[];

    for (let n = 0; n < productions.length; n++) {
      let key = 'production' + productions[n].Record.productionId;
      let production = await queryByKey(stub, key);
      //console.log(JSON.parse(production.toString()));
      result.push(JSON.parse(production.toString()));
    }

    return Buffer.from(JSON.stringify(result));
  }
  
  /**
   * Retrieves all productions for a given meterpoint in a given date range
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "MPAN":"00-111-222-13-1234-5678-345",
   *    "startDate":"2018-09-20T12:41:59.582Z",
   *    "endDate":"2018-09-21T00:00:00.000Z"
   * }
   */
  async queryAllProductionsForMeterpointInRange(stub, args) {
    console.log('============= START : queryAllProductionsForMeterpointInRange ===========');
    console.log('##### queryAllProductionsForMeterpointInRange arguments: ' + JSON.stringify(args)); 

    // args is passed as a JSON string
    let result = await getAllProductionsForMPInRange(args, stub);

    return Buffer.from(JSON.stringify(result));
  }
  
  /**
   * Retrieves total productions for a given meterpoint in a given date range
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "MPAN":"00-111-222-13-1234-5678-345",
   *    "startDate":"2018-09-20T12:41:59.582Z",
   *    "endDate":"2018-09-21T00:00:00.000Z"
   * }
   */
  async queryTotalProductionsForMeterpointInRange(stub, args) {
    console.log('============= START : queryTotalProductionsForMeterpointInRange ===========');
    console.log('##### queryTotalProductionsForMeterpointInRange arguments: ' + JSON.stringify(args)); 

    // args is passed as a JSON string
    let productions = await getAllProductionsForMPInRange(args, stub);

    // Sum the productions
    let totalProductions = 0;
    for (const production of productions) {
      totalProductions += production.productionAmount;
    }

    let result = { 'totalProductions' : totalProductions };
    console.log('##### queryTotalProductionsForMeterpointInRange - Total result: ' + JSON.stringify(result));

    return Buffer.from(JSON.stringify(result));
  }

  /************************************************************************************************
   * 
   * Energy reconciliation functions 
   * 
   ************************************************************************************************/
  
   /**
   * Reconciles production records into a given chunk size, if it can't find enough production amounts
   * to reconcile will not update production records
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "requestedBlockSize": 1000
   * }
   */
  async reconcileProductionRecords(stub, args) {
    console.log('============= START : reconcileProductionRecords  ===========');
    console.log('##### reconcileProductionRecords arguments: ' + JSON.stringify(args)); 

    let json = JSON.parse(args);

    // Find where we have already reconciled up to for our Org
    let senderOrg = getSenderOrg( await stub.getCreator() );

    let reconciliationKey = 'reconcilation' + senderOrg;
    let reconciliationQuery = await stub.getState(reconciliationKey);
    if (!reconciliationQuery || !reconciliationQuery.toString()) {
      throw new Error('##### reconcileProductionRecords - No reconciliation record exists for ' + senderOrg);
    }

    let alreadyReconciledUpTo = JSON.parse(reconciliationQuery).reconciledUpTo;

    // Find productions after this date for our org
    let productions = await getAllProductionsForOrgInRange(senderOrg,alreadyReconciledUpTo,Date.now(),stub);
    let successfullyReconciled = false;
    let reconciled = [];
    let amountToReconcile = json.requestedBlockSize;
    let reconciledUpTo = alreadyReconciledUpTo;

    // Sort the productions by date
    productions.sort((a,b) => (a.productionDate > b.productionDate) ? 1 : ((b.productionDate > a.productionDate) ? -1 : 0)); 

    for(const production of productions){
      let updatedProduction = Object.assign({}, production);

      if (production.unreconciledAmount < amountToReconcile) {
        if (production.unreconciledAmount > Number.EPSILON) {
          updatedProduction.unreconciledAmount = 0.0;
          reconciled.push( updatedProduction );
          amountToReconcile -= production.unreconciledAmount;
          //console.log("Reconciled production " + production.productionId + " in full");
        }
      }
      else 
      {
        updatedProduction.unreconciledAmount = production.unreconciledAmount - amountToReconcile;
        reconciled.push( updatedProduction );
        amountToReconcile = 0.0;
        //console.log("Partially reconciled " + production.productionId);
      }

      //console.log("Amount to still reconcile is " + amountToReconcile);

      if (amountToReconcile < Number.EPSILON)
      {
        //console.log("Successfully reconciled full amount");
        reconciledUpTo = production.productionDate;
        successfullyReconciled = true;
        break;
      }
    }

    if ( successfullyReconciled ) {
      // Write production records
      await writeProductionRecords( stub, reconciled );

      // Write the reconciled up to time
      let reconciliationJson = JSON.parse(reconciliationQuery);
      reconciliationJson.reconciledUpTo = reconciledUpTo;

      //console.log("Writing reconciled up to record " + JSON.stringify(reconciliationJson));
    
      await stub.putState(reconciliationKey, Buffer.from(JSON.stringify(reconciliationJson)));
    }
    else {
      reconciled = [];
    }

    let result = {
      successful: successfullyReconciled,
      reconciled: reconciled
    };

    return Buffer.from(JSON.stringify(result));
  }

  /************************************************************************************************
   * 
   * Energy consumption functions 
   * 
   ************************************************************************************************/

  /**
   * Creates a new energy consumption record
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "consumptionId":"433da889-777d-4f11-b9eb-a6610d8ba555",
   *    "consumptionAmount":100,
   *    "consumptionDate":1537447319582,
   *    "MPAN":"00-111-222-13-1234-5678-345"
   * }
   */
  async createConsumptionRecord(stub, args) {
    console.log('============= START : createConsumptionRecord ===========');
    console.log('##### createConsumptionRecord arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'consumption' + json.consumptionId;
    json.docType = 'consumption';

    console.log('##### createConsumptionRecord consumption: ' + JSON.stringify(json));

    // Confirm the meterpoint exists
    let meterKey = 'meterpoint' + json.MPAN;
    let meterQuery = await stub.getState(meterKey);
    if (!meterQuery || !meterQuery.toString()) {
      throw new Error('##### createConsumptionRecord - Cannot create consumption as the Meterpoint does not exist: ' + json.MPAN);
    }

    // Check if the Consumption already exists
    let consumptionQuery = await stub.getState(key);
    if (consumptionQuery && consumptionQuery.toString()) {
      throw new Error('##### createConsumptionRecord - This consumption already exists: ' + json.consumptionId);
    }

    json.consumptionDate = normaliseToMSEpoch(json.consumptionDate);
    if ( !isSaneDate(json.consumptionDate) ) {
      throw new Error('##### createConsumptionRecord - This date is notvalid: ' + json.productionDate);
    }

    // Add the owner details to the record
    json.owner = getSenderOrg( await stub.getCreator());

    await stub.putState(key, Buffer.from(JSON.stringify(json)));

    // Create the index record
    let indexJson = {};
    indexJson.docType = 'consDate';
    indexJson.consumptionId = json.consumptionId;
    indexJson.MPAN = json.MPAN;

    let indexKey  = 'consDate' + json.consumptionDate;

    // Write the consumption index record
    await stub.putState(indexKey, Buffer.from(JSON.stringify(indexJson)));

    console.log('============= END : createConsumptionRecord ===========');
  }

  /**
   * Retrieves a specfic consumption
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryConsumption(stub, args) {
    console.log('============= START : queryConsumption ===========');
    console.log('##### queryConsumption arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = 'consumption' + json.consumptionId;
    console.log('##### queryConsumption key: ' + key);
    return queryByKey(stub, key);
  }

  /**
   * Retrieves consumptions for a specfic meterpoint
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryConsumptionsForMeterpoint(stub, args) {
    console.log('============= START : queryConsumptionsForMeterpoint ===========');
    console.log('##### queryConsumptionsForMeterpoint arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let queryString = '{"selector": {"docType": "consumption", "MPAN": "' + json.MPAN + '"}}';
    return queryByString(stub, queryString);
  }

  /**
   * Retrieves the sum of consumptions for a specfic meterpoint
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryTotalConsumptionsForMeterpoint(stub, args) {
    console.log('============= START : queryTotalConsumptionsForMeterpoint ===========');
    console.log('##### queryTotalConsumptionsForMeterpoint arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let queryString = '{"selector": {"docType": "consumption", "MPAN": "' + json.MPAN + '"}}';
    let consumptions = await queryByString(stub, queryString);
    consumptions = JSON.parse(consumptions.toString());
    console.log('#####  -queryTotalConsumptionsForMeterpoint consumptions as JSON: ' + JSON.stringify(consumptions));

    let totalConsumptions = 0;
    console.log('#####  -queryTotalConsumptionsForMeterpoint number of consumptions: ' + consumptions.length);
    for (const consumption of consumptions) {
      console.log('##### queryTotalConsumptionsForMeterpoint - consumption: ' + JSON.stringify(consumption));
      totalConsumptions += consumption.Record.consumptionAmount;
    }
    console.log('##### queryTotalConsumptionsForMeterpoint - Total consumptions for this meterpoint are: ' + totalConsumptions.toString());
    
    let result = { 'totalConsumptions' : totalConsumptions };
    console.log('##### queryTotalConsumptionsForMeterpoint - Total result: ' + JSON.stringify(result));
    
    return Buffer.from(JSON.stringify(result));
  }

  /**
   * Retrieves all consumptions
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryAllConsumptions(stub, args) {
    console.log('============= START : queryAllConsumptions ===========');
    console.log('##### queryAllConsumptions arguments: ' + JSON.stringify(args)); 
    let queryString = '{"selector": {"docType": "consumption"}}';
    return queryByString(stub, queryString);
  }

  /**
   * Retrieves all consumptions in a given date range
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "startDate":"2018-09-20T12:41:59.582Z",
   *    "endDate":"2018-09-21T00:00:00.000Z"
   * }
   */
  async queryAllConsumptionsInDateRange(stub, args) {
    console.log('============= START : queryAllConsumptionsInDateRange ===========');
    console.log('##### queryAllConsumptionsInDateRange arguments: ' + JSON.stringify(args)); 

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let startIndex = 'consDate' + json.startDate;
    let endIndex = 'consDate' + json.endDate;

    // execute a range query on the given dates
    let resultsIterator = await stub.getStateByRange(startIndex,endIndex);
    let consumptions  = await getAllResults(resultsIterator);

    let result=[];

    for (let n = 0; n < consumptions.length; n++) {
      let key = 'consumption' + consumptions[n].Record.consumptionId;
      let consumption = await queryByKey(stub, key);
      //console.log(JSON.parse(consumption.toString()));
      result.push(JSON.parse(consumption.toString()));
    }

    return Buffer.from(JSON.stringify(result));
  }

  /**
   * Retrieves all consumptions for a given meterpoint in a given date range
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "MPAN":"00-111-222-13-1234-5678-345",
   *    "startDate":"2018-09-20T12:41:59.582Z",
   *    "endDate":"2018-09-21T00:00:00.000Z"
   * }
   */
  async queryAllConsumptionsForMeterpointInRange(stub, args) {
    console.log('============= START : queryAllConsumptionsForMeterpointInRange ===========');
    console.log('##### queryAllConsumptionsForMeterpointInRange arguments: ' + JSON.stringify(args)); 

    // args is passed as a JSON string
    let result = await getAllConsumptionsForMPInRange(args, stub);

    return Buffer.from(JSON.stringify(result));
  }

    /**
   * Retrieves total consumptions for a given meterpoint in a given date range
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "MPAN":"00-111-222-13-1234-5678-345",
   *    "startDate":"2018-09-20T12:41:59.582Z",
   *    "endDate":"2018-09-21T00:00:00.000Z"
   * }
   */
  async queryTotalConsumptionsForMeterpointInRange(stub, args) {
    console.log('============= START : queryTotalConsumptionsForMeterpointInRange ===========');
    console.log('##### queryTotalConsumptionsForMeterpointInRange arguments: ' + JSON.stringify(args)); 

    // args is passed as a JSON string
    let consumptions = await getAllConsumptionsForMPInRange(args, stub);

    // Sum the consumption
    let totalConsumptions = 0;
    for (const consumption of consumptions) {

      totalConsumptions += consumption.consumptionAmount;
    }

    let result = { 'totalConsumptions' : totalConsumptions };
    console.log('##### queryTotalConsumptionsForMeterpointInRange - Total result: ' + JSON.stringify(result));
    return Buffer.from(JSON.stringify(result));
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
    let key = json.key;
    let docType = json.docType.
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
};

 /************************************************************************************************
   * 
   * Common functions 
   * 
   ************************************************************************************************/

async function akaCreateProductionRecord(args, stub, updateExisting) {
  let key = 'production' + args.productionId;
  args.docType = 'production';

  console.log('##### createProductionRecord production: ' + JSON.stringify(args));

  // Confirm the meterpoint exists
  let meterKey = 'meterpoint' + args.MPAN;
  let meterQuery = await stub.getState(meterKey);
  if (!meterQuery || !meterQuery.toString()) {
    throw new Error('##### createProductionRecord - Cannot create production as the Meterpoint does not exist: ' + args.MPAN);
  }

  // Check the productionAmount is a number
  if (typeof args.productionAmount != 'number') {
    throw new Error('##### createProductionRecord - productionAmount is not a number: ' + args.productionAmount + ' (' + typeof args.productionAmount + ')');
  }

  // Check the date is in the right format
  args.productionDate = normaliseToMSEpoch(args.productionDate);
  if (!isSaneDate(args.productionDate)) {
    throw new Error('##### createProductionRecord - This date is not valid: ' + args.productionDate);
  }

  if ( !updateExisting) {
    // Add unallocated production amount - to be used later for reconciliation
    args.unreconciledAmount = args.productionAmount;
  }

  // Add the owner details to the record
  let sender = await stub.getCreator();
  let senderOrg = getSenderOrg(sender);
  args.owner = senderOrg;

  //console.log('Sender = ' + Object.keys(sender));
  //console.log('Sender org = ' + senderOrg);

  // Check if reconciliation record exists for this org and if not create it
  let reconciliationKey = 'reconcilation' + senderOrg;
  let reconciliationQuery = await stub.getState(reconciliationKey);
  if (!reconciliationQuery || !reconciliationQuery.toString()) {
    let reconciliationJson = {};
    reconciliationJson.organisation = senderOrg;
    reconciliationJson.reconciledUpTo = 0; // Epoch date of where we have reconciled up to 

    await stub.putState(reconciliationKey, Buffer.from(JSON.stringify(reconciliationJson)));
  }

  // Write the production
  await stub.putState(key, Buffer.from(JSON.stringify(args)));

  // Create the index record
  let indexJson = {};
  indexJson.docType = 'prodDate';
  indexJson.productionId = args.productionId;
  indexJson.MPAN = args.MPAN;
  indexJson.owner = args.owner;

  let indexKey = 'prodDate' + args.productionDate;
  //console.log('prodDate ' + indexKey);

  // Write the production index record
  await stub.putState(indexKey, Buffer.from(JSON.stringify(indexJson)));
}

async function getAllConsumptionsForMPInRange(args, stub) {
  let json = JSON.parse(args);
  let MPAN = json.MPAN;
  let startIndex = 'consDate' + json.startDate;
  let endIndex = 'consDate' + json.endDate;

  // execute a range query on the given dates
  let resultsIterator = await stub.getStateByRange(startIndex, endIndex);
  let consumptions = await getAllResults(resultsIterator);

  let result = [];

  for (let n = 0; n < consumptions.length; n++) {
    let key = 'consumption' + consumptions[n].Record.consumptionId;
    if (consumptions[n].Record.MPAN === MPAN) {
      let consumptionBytes = await queryByKey(stub, key);
      let consumption = JSON.parse(consumptionBytes.toString());
      result.push(consumption);
    }
  }
  return result;
}

async function getAllProductionsForMPInRange(args, stub) {
  let json = JSON.parse(args);
  let MPAN = json.MPAN;
  let startIndex = 'prodDate' + json.startDate;
  let endIndex = 'prodDate' + json.endDate;

  // execute a range query on the given dates
  let resultsIterator = await stub.getStateByRange(startIndex, endIndex);
  let productions = await getAllResults(resultsIterator);

  let result = [];

  for (let n = 0; n < productions.length; n++) {
    let key = 'production' + productions[n].Record.productionId;
    if (productions[n].Record.MPAN === MPAN) {
      let productionBytes = await queryByKey(stub, key);
      let production = JSON.parse(productionBytes.toString());
      result.push(production);
    }
  }
  return result;
}

async function getAllProductionsForOrgInRange(org, startDate, endDate, stub) {
  // execute a range query on the given dates
  //console.log("Get all prods for org in range, start = " + startDate + " end = " + endDate);
  let startIndex = 'prodDate' + startDate;
  let endIndex = 'prodDate' + endDate;

  let resultsIterator = await stub.getStateByRange(startIndex, endIndex);
  let productions = await getAllResults(resultsIterator);

  let result = [];

  for (let n = 0; n < productions.length; n++) {
    let key = 'production' + productions[n].Record.productionId;
    if (productions[n].Record.owner === org) {
      let productionBytes = await queryByKey(stub, key);
      let production = JSON.parse(productionBytes.toString());
      result.push(production);
    }
  }
  return result;
}

async function writeProductionRecords( stub, reconciled ) {
  for (const production of reconciled) {
    await akaCreateProductionRecord(production, stub, true);
  }
}


module.exports.Chaincode = Chaincode;
