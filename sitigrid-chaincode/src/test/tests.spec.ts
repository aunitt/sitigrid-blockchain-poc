import { Chaincode } from '../sitigrid.js';
import { ChaincodeMockStub, Transform } from '@theledger/fabric-mock-stub';

import { expect } from "chai";

const chaincode = new Chaincode();

describe('Test MyChaincode', () => {
    it("Should init without issues", async () => {
        const mockStub = new ChaincodeMockStub("MyMockStub", chaincode);
        const response = await mockStub.mockInit("tx1", []);
        expect(response.status).to.eql(200)
    });
});