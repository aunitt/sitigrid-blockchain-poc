import { Chaincode } from '../sitigrid.js';
import { ChaincodeMockStub, Transform } from '@theledger/fabric-mock-stub';

import { expect, assert, use, should } from 'chai';
should()

import chaiLike from 'chai-like';
import chaiThings from 'chai-things';
use(chaiLike);
use(chaiThings);

const chaincode = new Chaincode();

describe('Test Sitigrid Chaincode', () => {
    it("Should init without issues", async () => {
        const mockStub = new ChaincodeMockStub("MyMockStub", chaincode);
        const response = await mockStub.mockInit("tx1", []);
        expect(response.status).to.eql(200)
    });

    it("Should be able to add a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = "2018-10-22T11:52:20.182Z"; 

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
        const registeredDate = "2018-10-22T11:52:20.182Z";  

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
        const registeredDate0 = "2018-10-22T11:52:20.182Z";  

        const MPAN1 = "00-111-222-13-1234-5678-001";
        const registeredDate1 = "2018-10-22T11:53:00.182Z";  

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

    it("Should be able to add a production record", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        // Create a meterpoint as we need one
        const MPAN0 = "00-111-222-13-1234-5678-345";
        const registeredDate = "2018-10-22T11:52:20.182Z"; 

        const responseMPAN = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate
            }
        )]);
        expect(responseMPAN.status).to.eql(200)

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
        expect(responseProduction.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx3", ['queryProduction', JSON.stringify(
            { "productionId": productionId })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "productionId": productionId,
            "productionAmount": productionAmount,
            "productionDate": productionDate,
            "MPAN": MPAN0
        })
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
        const registeredDate = "2018-10-22T11:52:20.182Z"; 

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
    });

    it("Should be able to read production records for a given meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-000";
        const registeredDate0 = "2018-10-22T11:52:20.182Z";  

        const MPAN1 = "00-111-222-13-1234-5678-001";
        const registeredDate1 = "2018-10-22T11:53:00.182Z";  

        const response0 = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate0
            }
        )]);
        expect(response0.status).to.eql(200)

        const response1 = await stub.mockInvoke("tx2", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN1,
                "registeredDate": registeredDate1
            }
        )]);
        expect(response1.status).to.eql(200)

        const productionId0 = "ID1";
        const productionAmount0 = 42;
        const productionDate0 = "2019-01-01T00:00:01.001Z";

        const responseProduction0 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId0,
                "productionAmount": productionAmount0,
                "productionDate": productionDate0,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction0.status).to.eql(200)

        const productionId1 = "ID2";
        const productionAmount1 = 10;
        const productionDate1 = "2019-01-02T00:00:01.001Z";

        const responseProduction1 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId1,
                "productionAmount": productionAmount1,
                "productionDate": productionDate1,
                "MPAN": MPAN1
            }
        )]);
        expect(responseProduction1.status).to.eql(200)

        const productionId2 = "ID3";
        const productionAmount2 = 5;
        const productionDate2 = "2019-01-01T01:00:01.123Z";

        const responseProduction2 = await stub.mockInvoke("tx4", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId2,
                "productionAmount": productionAmount2,
                "productionDate": productionDate2,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction2.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx5", ['queryProductionsForMeterpoint', JSON.stringify(
            { "MPAN": MPAN0 })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
    });

    it("I can get the total productions for a meterpoint", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-000";
        const registeredDate0 = "2018-10-22T11:52:20.182Z";  

        const MPAN1 = "00-111-222-13-1234-5678-001";
        const registeredDate1 = "2018-10-22T11:53:00.182Z";  

        const response0 = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate0
            }
        )]);
        expect(response0.status).to.eql(200)

        const response1 = await stub.mockInvoke("tx2", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN1,
                "registeredDate": registeredDate1
            }
        )]);
        expect(response1.status).to.eql(200)

        const productionId0 = "ID1";
        const productionAmount0 = 42;
        const productionDate0 = "2019-01-01T00:00:01.001Z";

        const responseProduction0 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId0,
                "productionAmount": productionAmount0,
                "productionDate": productionDate0,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction0.status).to.eql(200)

        const productionId1 = "ID2";
        const productionAmount1 = 10;
        const productionDate1 = "2019-01-02T00:00:01.001Z";

        const responseProduction1 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId1,
                "productionAmount": productionAmount1,
                "productionDate": productionDate1,
                "MPAN": MPAN1
            }
        )]);
        expect(responseProduction1.status).to.eql(200)

        const productionId2 = "ID3";
        const productionAmount2 = 5;
        const productionDate2 = "2019-01-01T01:00:01.123Z";

        const responseProduction2 = await stub.mockInvoke("tx4", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId2,
                "productionAmount": productionAmount2,
                "productionDate": productionDate2,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction2.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx5", ['queryTotalProductionsForMeterpoint', JSON.stringify(
            { "MPAN": MPAN0 })]);

        expect(Transform.bufferToObject(queryResponse.payload)).to.deep.include({
            "totalProductions": productionAmount0 + productionAmount2
        })
    });

    it("I can get productions by date", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode);

        const MPAN0 = "00-111-222-13-1234-5678-000";
        const registeredDate0 = "2018-10-22T11:52:20.182Z";  

        const MPAN1 = "00-111-222-13-1234-5678-001";
        const registeredDate1 = "2018-10-22T11:53:00.182Z";  

        const response0 = await stub.mockInvoke("tx1", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN0,
                "registeredDate": registeredDate0
            }
        )]);
        expect(response0.status).to.eql(200)

        const response1 = await stub.mockInvoke("tx2", ['createMeterpoint', JSON.stringify(
            {
                "MPAN": MPAN1,
                "registeredDate": registeredDate1
            }
        )]);
        expect(response1.status).to.eql(200)

        const productionId0 = "ID1";
        const productionAmount0 = 42;
        const productionDate0 = "2019-01-01T00:00:01.001Z";

        const responseProduction0 = await stub.mockInvoke("tx3", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId0,
                "productionAmount": productionAmount0,
                "productionDate": productionDate0,
                "MPAN": MPAN0
            }
        )]);
        expect(responseProduction0.status).to.eql(200)

        const productionId1 = "ID2";
        const productionAmount1 = 10;
        const productionDate1 = "2019-01-02T00:00:01.001Z";

        const responseProduction1 = await stub.mockInvoke("tx4", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId1,
                "productionAmount": productionAmount1,
                "productionDate": productionDate1,
                "MPAN": MPAN1
            }
        )]);
        expect(responseProduction1.status).to.eql(200)

        const productionId2 = "ID3";
        const productionAmount2 = 5;
        const productionDate2 = "2019-01-01T01:00:01.123Z";

        const responseProduction2 = await stub.mockInvoke("tx5", ['createProductionRecord', JSON.stringify(
            {
                "productionId": productionId2,
                "productionAmount": productionAmount2,
                "productionDate": productionDate2,
                "MPAN": MPAN1
            }
        )]);
        expect(responseProduction2.status).to.eql(200)

        const queryResponse = await stub.mockInvoke("tx6", ['queryAllProductionsInDateRange', JSON.stringify(
            {
                "startDate": "2019-01-01T00:00:00.000Z",
                "endDate": "2019-01-01T23:59:59.999Z"
            })]);

        expect(queryResponse.status).to.eql(200)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.length(2)
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"productionId": productionId0})
        expect(Transform.bufferToObject(queryResponse.payload)).to.be.an('array').that.contains.something.like({"productionId": productionId2})
    });
});