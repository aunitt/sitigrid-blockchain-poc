import { Chaincode } from '../sitigrid-core.js';
import { ChaincodeMockStub, Transform } from '@theledger/fabric-mock-stub';

import { expect, assert, use, should } from 'chai';
should()

import chaiLike from 'chai-like';
import chaiThings from 'chai-things';
use(chaiLike);
use(chaiThings);

const chaincode = new Chaincode();

function jsDateToEpochMS(d){
    // d = javascript date time string
    // returns epoch timestamp including milliseconds
    var date = new Date(d);
    return date.getTime();
}

describe('Test Sitigrid Chaincode', () => {
    it("Should init without issues", async () => {
        const mockStub = new ChaincodeMockStub("MyMockStub", chaincode);
        const response = await mockStub.mockInit("tx1", []);
        expect(response.status).to.eql(200)
    });

    it("Should be able to add a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z"); 

        const response = await stub.mockInvoke("mptx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);

        expect(response.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("mptx2", ['queryMeterpoint', JSON.stringify({ "MPAN":MPAN0 })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "MPAN": MPAN0,
            "registeredDate": registeredDate
        })
    });

    it("Shouldn't be able to add a meterpoint twice", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-000";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z");  

        const response = await stub.mockInvoke("mptx3", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);

        expect(response.status).to.eql(200)

        const response2 = await stub.mockInvoke("mptx4", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);

        expect(response2.status).to.eql(500)
    });

    it("I can query all meterpoints", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-000";
        const registeredDate0 = jsDateToEpochMS("2018-10-22T11:52:20.182Z");  

        const MPAN1 = "00-111-222-13-1234-5678-001";
        const registeredDate1 = jsDateToEpochMS("2018-10-22T11:53:00.182Z");  

        const response0 = await stub.mockInvoke("mptx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate0
            }
        )]);
        expect(response0.status).to.eql(200)

        const response1 = await stub.mockInvoke("mptx2", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN1,
                "registeredDate": registeredDate1
            }
        )]);
        expect(response1.status).to.eql(200)

        const response = await stub.mockInvoke("mptx3", ['queryAllMeterpoints'] );

        expect(response.status).to.eql(200)
        expect(Transform.bufferToObject(response.payload)).to.be.length(2)
    });


    /************************************************************** 
     *
     * Productions
     *
     **************************************************************/

    it("Should be able to add a production record", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Create a meterpoint as we need one
        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z"); 

        const responseMPAN = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);
        expect(responseMPAN.status).to.eql(200)

        const productionId = "ID1";
        const productionAmount = 42;
        const productionDate = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

        const responseProduction = await stub.mockInvoke("tx2", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId,
                "productionAmount": productionAmount,
                "productionDate": productionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx3", ['queryProduction', JSON.stringify(
            { "productionId": productionId })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "productionId": productionId,
            "productionAmount": productionAmount,
            "productionDate": productionDate,
            "MPAN": MPAN0,
            "unreconciledAmount": productionAmount
        })
        expect(Transform.bufferToObject(queryResponse.payload)).to.have.property('owner');
    });

    it("Shouldn't be able to add a production record with an invalid meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Note we are not creating a meterpoint
        const MPAN0 = "00-111-222-13-1234-5678-345";

        const productionId = "ID1";
        const productionAmount = 42;
        const productionDate = "2019-01-01T00:00:01.001Z";

        const responseProduction = await stub.mockInvoke("tx2", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId,
                "productionAmount": productionAmount,
                "productionDate": productionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction.status).to.eql(500)
    });

    it("Shouldn't be able to add a production record with an invalid date", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Create a meterpoint as we need one
        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z"); 

        const responseMPAN = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);
        expect(responseMPAN.status).to.eql(200)

        const productionId = "ID1";
        const productionAmount = 42;
        const badProductionDate = "Mickey Mouse";

        const responseProduction = await stub.mockInvoke("tx2", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId,
                "productionAmount": productionAmount,
                "productionDate": badProductionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction.status).to.eql(500)

        const productionId1 = "ID2";
        const productionAmount1 = 42;
        const badProductionDate1 = 100000;

        const responseProduction1 = await stub.mockInvoke("tx2", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId1,
                "productionAmount": productionAmount1,
                "productionDate": badProductionDate1,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction1.status).to.eql(500)
    });

    it("Should be able to add a production record with an textual date", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Create a meterpoint as we need one
        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z"); 

        const responseMPAN = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);
        expect(responseMPAN.status).to.eql(200)

        const productionId = "ID3";
        const productionAmount = 42;
        const ProductionDate = "2020-03-22T11:52:20.182Z";  /* We also support valid text dates */

        const responseProduction = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId,
                "productionAmount": productionAmount,
                "productionDate": ProductionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction.status).to.eql(200)
    });

    it("Should be able to read production records for a given meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        await CreateProductions(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx5", ['queryProductionsForMeterpoint', JSON.stringify(
            { "MPAN": MPAN0 })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
    });

    it("I can get the total productions for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionAmount0, productionAmount2 } = await CreateProductions(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx5", ['queryTotalProductionsForMeterpoint', JSON.stringify(
            { "MPAN": MPAN0 })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "totalProductions": productionAmount0 + productionAmount2
        })
    });

    it("I can get productions by date", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);
        
        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId2 } = await CreateProductions(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx6", ['queryAllProductionsInDateRange', JSON.stringify(
            {
                "startDate": jsDateToEpochMS("2019-01-01T00:00:00.000Z"),
                "endDate": jsDateToEpochMS("2019-01-01T23:59:59.999Z")
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"productionId": productionId0})
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"productionId": productionId2})
    });

    it("I can get productions by date for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId3 } = await CreateProductionsAlt(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx6", ['queryAllProductionsForMeterpointInRange', JSON.stringify(
            {
                "MPAN":MPAN0,
                "startDate": jsDateToEpochMS("2019-01-01T00:00:00.000Z"),
                "endDate": jsDateToEpochMS("2019-01-01T23:59:59.999Z")
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"productionId": productionId0})
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"productionId": productionId3})
    });

    it("I can get total productions by date for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionAmount0, productionAmount3 } = await CreateProductionsAlt(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx6", ['queryTotalProductionsForMeterpointInRange', JSON.stringify(
            {
                "MPAN":MPAN0,
                "startDate": jsDateToEpochMS("2019-01-01T00:00:00.000Z"),
                "endDate": jsDateToEpochMS("2019-01-01T23:59:59.999Z")
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "totalProductions": productionAmount0 + productionAmount3
        })   
    });

    /************************************************************** 
     *
     * Consumptions
     *
     **************************************************************/

    it("Should be able to add a consumption record", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Create a meterpoint as we need one
        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z"); 

        const responseMPAN = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);
        expect(responseMPAN.status).to.eql(200)

        const consumptionId = "ID1";
        const consumptionAmount = 42;
        const consumptionDate = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

        const responseConsumption = await stub.mockInvoke("tx2", ['createConsumptionRecord', JSON.stringify(
            {
                "consumptionId": consumptionId,
                "consumptionAmount": consumptionAmount,
                "consumptionDate": consumptionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseConsumption.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx3", ['queryConsumption', JSON.stringify(
            { "consumptionId": consumptionId })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "consumptionId": consumptionId,
            "consumptionAmount": consumptionAmount,
            "consumptionDate": consumptionDate,
            "MPAN": MPAN0
        })
        expect(Transform.bufferToObject(queryResponse.payload)).to.have.property('owner');
    });

    it("Shouldn't be able to add a consumption record with an invalid meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Note we are not creating a meterpoint
        const MPAN0 = "00-111-222-13-1234-5678-345";

        const consumptionId = "ID1";
        const consumptionAmount = 42;
        const consumptionDate = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

        const responseConsumption = await stub.mockInvoke("tx2", ['createConsumptionRecord', JSON.stringify(
            {
                "consumptionId": consumptionId,
                "consumptionAmount": consumptionAmount,
                "consumptionDate": consumptionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseConsumption.status).to.eql(500)
    });

    it("Shouldn't be able to add a consumption record with an invalid date", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Create a meterpoint as we need one
        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = jsDateToEpochMS("2018-10-22T11:52:20.182Z"); 

        const responseMPAN = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);
        expect(responseMPAN.status).to.eql(200)

        const consumptionId = "ID1";
        const consumptionAmount = 42;
        const badConsumptionDate = "Mickey Mouse";

        const responseConsumption = await stub.mockInvoke("tx2", ['createConsumptionRecord', JSON.stringify(
            {
                "consumptionId": consumptionId,
                "consumptionAmount": consumptionAmount,
                "consumptionDate": badConsumptionDate,
                "MPAN": MPAN0
            }
        )]);
        expect(responseConsumption.status).to.eql(500)
    });

    it("Should be able to read consumption records for a given meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const consumptionId0 = "ID1";
        const consumptionAmount0 = 42;
        const consumptionDate0 = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

        const responseConsumption0 = await stub.mockInvoke("tx3", ['createConsumptionRecord', JSON.stringify(
            {
                "consumptionId": consumptionId0,
                "consumptionAmount": consumptionAmount0,
                "consumptionDate": consumptionDate0,
                "MPAN": MPAN0
            }
        )]);
        expect(responseConsumption0.status).to.eql(200)

        const consumptionId1 = "ID2";
        const consumptionAmount1 = 10;
        const consumptionDate1 = jsDateToEpochMS("2019-01-02T00:00:01.001Z");

        const responseConsumption1 = await stub.mockInvoke("tx3", ['createConsumptionRecord', JSON.stringify(
            {
                "consumptionId": consumptionId1,
                "consumptionAmount": consumptionAmount1,
                "consumptionDate": consumptionDate1,
                "MPAN": MPAN1
            }
        )]);
        expect(responseConsumption1.status).to.eql(200)

        const consumptionId2 = "ID3";
        const consumptionAmount2 = 5;
        const consumptionDate2 = jsDateToEpochMS("2019-01-01T01:00:01.123Z");

        const responseConsumption2 = await stub.mockInvoke("tx4", ['createConsumptionRecord', JSON.stringify(
            {
                "consumptionId": consumptionId2,
                "consumptionAmount": consumptionAmount2,
                "consumptionDate": consumptionDate2,
                "MPAN": MPAN0
            }
        )]);
        expect(responseConsumption2.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx5", ['queryConsumptionsForMeterpoint', JSON.stringify(
            { "MPAN": MPAN0 })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
    });

    it("I can get the total consumptions for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { consumptionAmount0, consumptionAmount2 } = await CreateConsumptions(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx5", ['queryTotalConsumptionsForMeterpoint', JSON.stringify(
            { "MPAN": MPAN0 })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "totalConsumptions": consumptionAmount0 + consumptionAmount2
        })
    });

    it("I can get consumptions by date", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { consumptionId0, consumptionId2 } = await CreateConsumptions(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx6", ['queryAllConsumptionsInDateRange', JSON.stringify(
            {
                "startDate": jsDateToEpochMS("2019-01-01T00:00:00.000Z"),
                "endDate": jsDateToEpochMS("2019-01-01T23:59:59.999Z")
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"consumptionId": consumptionId0})
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"consumptionId": consumptionId2})
    });

    it("I can get consumptions by date for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { consumptionId0, consumptionId3 } = await CreateConsumptionsAlt(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx6", ['queryAllConsumptionsForMeterpointInRange', JSON.stringify(
            {
                "MPAN":MPAN0,
                "startDate": jsDateToEpochMS("2019-01-01T00:00:00.000Z"),
                "endDate": jsDateToEpochMS("2019-01-01T23:59:59.999Z")
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"consumptionId": consumptionId0})
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"consumptionId": consumptionId3})
    });

    it("I can get total consumptions by date for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { consumptionAmount0, consumptionAmount3 } = await CreateConsumptionsAlt(stub, MPAN0, MPAN1);

        const queryResponse = await stub.mockInvoke("tx6", ['queryTotalConsumptionsForMeterpointInRange', JSON.stringify(
            {
                "MPAN":MPAN0,
                "startDate": jsDateToEpochMS("2019-01-01T00:00:00.000Z"),
                "endDate": jsDateToEpochMS("2019-01-01T23:59:59.999Z")
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "totalConsumptions": consumptionAmount0 + consumptionAmount3
        })  
    });

    it("I can reconcile production records into a chunk", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId1, productionId2 } = await CreateProductions(stub, MPAN0, MPAN1);

        const unimportantBlockSize = 10;
        const queryResponse = await stub.mockInvoke("tx6", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": unimportantBlockSize
            })]);
        expect(queryResponse.status).to.eql(200)
    });

    it("I can reconcile production records that fit exactly into a chunk", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId1, productionId2, productionAmount0, productionAmount1, productionAmount2 } 
            = await CreateProductions(stub, MPAN0, MPAN1);

        const blockSize = productionAmount0 + productionAmount1 + productionAmount2;
        const queryResponse = await stub.mockInvoke("tx6", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": blockSize
            })]);
        expect(queryResponse.status).to.eql(200)
        let obj = Transform.bufferToObject(queryResponse.payload);
        expect(obj).to.deep.include({
            "successful": true
        })    
        expect(obj).to.have.property('reconciled')
            .that.is.an('array')
            .that.has.lengthOf(3)
            .that.contains.something.like({"productionId": productionId0, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId1, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId2, "unreconciledAmount":0})
    });

    it("I can reconcile production records that overflow a chunk", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId1, productionId2, productionAmount0, productionAmount1, productionAmount2 } 
            = await CreateProductions(stub, MPAN0, MPAN1);

        const overflowAmount = 1.5;
        let blockSize = productionAmount0 + productionAmount1 + productionAmount2 - overflowAmount;
        let queryResponse = await stub.mockInvoke("tx6", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": blockSize
            })]);
        expect(queryResponse.status).to.eql(200)
        let obj = Transform.bufferToObject(queryResponse.payload);

        expect(obj).to.deep.include({
            "successful": true
        })    
        expect(obj).to.have.property('reconciled')
            .that.is.an('array')
            .that.has.lengthOf(3)
            .that.contains.something.like({"productionId": productionId0, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId2, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId1, "unreconciledAmount":overflowAmount})
    });

    it("I can reconcile production records into multiple chunks", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId1, productionId2, productionAmount0, productionAmount1, productionAmount2 } 
            = await CreateProductions(stub, MPAN0, MPAN1);

        const overflowAmount = 1.5;
        let blockSize = productionAmount0 + productionAmount1 + productionAmount2 - overflowAmount;
        let queryResponse = await stub.mockInvoke("tx6", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": blockSize
            })]);
        expect(queryResponse.status).to.eql(200)
        let obj = Transform.bufferToObject(queryResponse.payload);

        expect(obj).to.deep.include({
            "successful": true
        })    
        expect(obj).to.have.property('reconciled')
            .that.is.an('array')
            .that.has.lengthOf(3)
            .that.contains.something.like({"productionId": productionId0, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId2, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId1, "unreconciledAmount":overflowAmount})

        // Now try and consume the overflow amount
        blockSize = overflowAmount;
        queryResponse = await stub.mockInvoke("tx7", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": blockSize
            })]);
        expect(queryResponse.status).to.eql(200)
        obj = Transform.bufferToObject(queryResponse.payload);
        expect(obj).to.have.property('successful').that.equals(true)
        expect(obj).to.have.property('reconciled')
        .that.is.an('array')
        .that.has.lengthOf(1)
        .that.contains.something.like({"productionId": productionId1, "unreconciledAmount":0})
    });

    it("I can reconcile production records into multiple chunks that fit exactly", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const { MPAN0, MPAN1 } = await SetupMeterpoints(stub);

        const { productionId0, productionId1, productionId2, productionAmount0, productionAmount1, productionAmount2 } 
            = await CreateProductions(stub, MPAN0, MPAN1);

        let blockSize = productionAmount0 + productionAmount2;
        let queryResponse = await stub.mockInvoke("tx6", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": blockSize
            })]);
        expect(queryResponse.status).to.eql(200)
        let obj = Transform.bufferToObject(queryResponse.payload);

        expect(obj).to.deep.include({
            "successful": true
        })    
        expect(obj).to.have.property('reconciled')
            .that.is.an('array')
            .that.has.lengthOf(2)
            .that.contains.something.like({"productionId": productionId0, "unreconciledAmount":0})
        expect(obj).to.have.property('reconciled')
            .that.contains.something.like({"productionId": productionId2, "unreconciledAmount":0})

        // Now try and consume the overflow amount
        blockSize = productionAmount1;
        queryResponse = await stub.mockInvoke("tx7", ['reconcileProductionRecords', JSON.stringify(
            {
                "requestedBlockSize": blockSize
            })]);
        expect(queryResponse.status).to.eql(200)
        obj = Transform.bufferToObject(queryResponse.payload);
        expect(obj).to.have.property('successful').that.equals(true)
        expect(obj).to.have.property('reconciled')
        .that.is.an('array')
        .that.has.lengthOf(1)
        .that.contains.something.like({"productionId": productionId1, "unreconciledAmount":0})
    });

    //TODO: Add more reconciliation tests
    // Do check reconciled up to time properly
});

async function CreateConsumptionsAlt(stub: ChaincodeMockStub, MPAN0: string, MPAN1: string) {
    const consumptionId0 = "ID1";
    const consumptionAmount0 = 42;
    const consumptionDate0 = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

    const responseConsumption0 = await stub.mockInvoke("tx3", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId0,
            "consumptionAmount": consumptionAmount0,
            "consumptionDate": consumptionDate0,
            "MPAN": MPAN0
        }
    )]);
    expect(responseConsumption0.status).to.eql(200);

    const consumptionId1 = "ID2";
    const consumptionAmount1 = 10;
    const consumptionDate1 = jsDateToEpochMS("2019-01-02T00:00:01.001Z");

    const responseConsumption1 = await stub.mockInvoke("tx4", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId1,
            "consumptionAmount": consumptionAmount1,
            "consumptionDate": consumptionDate1,
            "MPAN": MPAN0
        }
    )]);
    expect(responseConsumption1.status).to.eql(200);

    const consumptionId2 = "ID3";
    const consumptionAmount2 = 5;
    const consumptionDate2 = jsDateToEpochMS("2019-01-01T01:00:01.123Z");

    const responseConsumption2 = await stub.mockInvoke("tx5", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId2,
            "consumptionAmount": consumptionAmount2,
            "consumptionDate": consumptionDate2,
            "MPAN": MPAN1
        }
    )]);
    expect(responseConsumption2.status).to.eql(200);

    const consumptionId3 = "ID4";
    const consumptionAmount3 = 15;
    const consumptionDate3 = jsDateToEpochMS("2019-01-01T01:30:01.555Z");

    const responseConsumption3 = await stub.mockInvoke("tx5", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId3,
            "consumptionAmount": consumptionAmount3,
            "consumptionDate": consumptionDate3,
            "MPAN": MPAN0
        }
    )]);
    expect(responseConsumption3.status).to.eql(200);

    return { consumptionId0, consumptionId1, consumptionId2, consumptionId3,
             consumptionAmount0, consumptionAmount1, consumptionAmount2, consumptionAmount3
           };
}

async function CreateConsumptions(stub: ChaincodeMockStub, MPAN0: string, MPAN1: string) {
    const consumptionId0 = "ID1";
    const consumptionAmount0 = 42;
    const consumptionDate0 = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

    const responseConsumption0 = await stub.mockInvoke("tx3", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId0,
            "consumptionAmount": consumptionAmount0,
            "consumptionDate": consumptionDate0,
            "MPAN": MPAN0
        }
    )]);
    expect(responseConsumption0.status).to.eql(200);

    const consumptionId1 = "ID2";
    const consumptionAmount1 = 10;
    const consumptionDate1 = jsDateToEpochMS("2019-01-02T00:00:01.001Z");

    const responseConsumption1 = await stub.mockInvoke("tx3", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId1,
            "consumptionAmount": consumptionAmount1,
            "consumptionDate": consumptionDate1,
            "MPAN": MPAN1
        }
    )]);
    expect(responseConsumption1.status).to.eql(200);

    const consumptionId2 = "ID3";
    const consumptionAmount2 = 5;
    const consumptionDate2 = jsDateToEpochMS("2019-01-01T01:00:01.123Z");

    const responseConsumption2 = await stub.mockInvoke("tx4", ['createConsumptionRecord', JSON.stringify(
        {
            "consumptionId": consumptionId2,
            "consumptionAmount": consumptionAmount2,
            "consumptionDate": consumptionDate2,
            "MPAN": MPAN0
        }
    )]);
    expect(responseConsumption2.status).to.eql(200);
    return { consumptionAmount0, consumptionAmount1, consumptionAmount2, consumptionId0, consumptionId1, consumptionId2 };
}

async function CreateProductionsAlt(stub: ChaincodeMockStub, MPAN0: string, MPAN1: string) {
    const productionId0 = "ID1";
    const productionAmount0 = 42;
    const productionDate0 = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

    const responseProduction0 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId0,
            "productionAmount": productionAmount0,
            "productionDate": productionDate0,
            "MPAN": MPAN0
        }
    )]);
    expect(responseProduction0.status).to.eql(200);

    const productionId1 = "ID2";
    const productionAmount1 = 10;
    const productionDate1 = jsDateToEpochMS("2019-01-02T00:00:01.001Z");

    const responseProduction1 = await stub.mockInvoke("tx4", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId1,
            "productionAmount": productionAmount1,
            "productionDate": productionDate1,
            "MPAN": MPAN0
        }
    )]);
    expect(responseProduction1.status).to.eql(200);

    const productionId2 = "ID3";
    const productionAmount2 = 5;
    const productionDate2 = jsDateToEpochMS("2019-01-01T01:00:01.123Z");

    const responseProduction2 = await stub.mockInvoke("tx5", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId2,
            "productionAmount": productionAmount2,
            "productionDate": productionDate2,
            "MPAN": MPAN1
        }
    )]);
    expect(responseProduction2.status).to.eql(200);

    const productionId3 = "ID4";
    const productionAmount3 = 15;
    const productionDate3 = jsDateToEpochMS("2019-01-01T01:30:01.555Z");

    const responseProduction3 = await stub.mockInvoke("tx5", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId3,
            "productionAmount": productionAmount3,
            "productionDate": productionDate3,
            "MPAN": MPAN0
        }
    )]);
    expect(responseProduction3.status).to.eql(200);
    return { productionId0, productionId1, productionId2, productionId3,
             productionAmount0, productionAmount1, productionAmount2, productionAmount3
        };
}

async function CreateProductions(stub: ChaincodeMockStub, MPAN0: string, MPAN1: string) {
    const productionId0 = "ID1";
    const productionAmount0 = 42;
    const productionDate0 = jsDateToEpochMS("2019-01-01T00:00:01.001Z");

    const responseProduction0 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId0,
            "productionAmount": productionAmount0,
            "productionDate": productionDate0,
            "MPAN": MPAN0
        }
    )]);
    expect(responseProduction0.status).to.eql(200);

    const productionId1 = "ID2";
    const productionAmount1 = 10;
    const productionDate1 = jsDateToEpochMS("2019-01-02T00:00:01.001Z");

    const responseProduction1 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId1,
            "productionAmount": productionAmount1,
            "productionDate": productionDate1,
            "MPAN": MPAN1
        }
    )]);
    expect(responseProduction1.status).to.eql(200);

    const productionId2 = "ID3";
    const productionAmount2 = 5;
    const productionDate2 = jsDateToEpochMS("2019-01-01T01:00:01.123Z");

    const responseProduction2 = await stub.mockInvoke("tx4", ['createProductionRecord', JSON.stringify(
        {
            "productionId": productionId2,
            "productionAmount": productionAmount2,
            "productionDate": productionDate2,
            "MPAN": MPAN0
        }
    )]);
    expect(responseProduction2.status).to.eql(200);

    return { productionAmount0, productionAmount1, productionAmount2, productionId0, productionId1, productionId2 };
}

async function SetupMeterpoints(stub: ChaincodeMockStub) {
    const MPAN0 = "00-111-222-13-1234-5678-000";
    const registeredDate0 = jsDateToEpochMS("2018-10-22T11:52:20.182Z");

    const MPAN1 = "00-111-222-13-1234-5678-001";
    const registeredDate1 = jsDateToEpochMS("2018-10-22T11:53:00.182Z");

    const response0 = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
        {
            "MPAN": MPAN0,
            "registeredDate": registeredDate0
        }
    )]);
    expect(response0.status).to.eql(200);

    const response1 = await stub.mockInvoke("tx2", ['createMeterpoint', JSON.stringify(
        {
            "MPAN": MPAN1,
            "registeredDate": registeredDate1
        }
    )]);
    expect(response1.status).to.eql(200);
    return { MPAN0, MPAN1 };
}
