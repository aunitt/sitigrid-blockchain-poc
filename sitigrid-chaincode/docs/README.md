# Chaincode documentation

The sitigrid chaincode uses several different documents to store the state of the energy network. This includes some document records that exist purely to speed up the reading and processing of other core documents.

## Date & time representation

All documents represent dates and times in Epoch format (normally using millisecond precision). This is done for ease of processing the documents.

## Core documents

The following documents represent the core entities in the blockchain.

### Meterpoint

This document represents an energy meter in the network. MPANs are used as the unique identifier for a meter, see https://en.wikipedia.org/wiki/Meter_Point_Administration_Number

Example:
```yaml
{
   "doctype":"meterpoint",
   "key":"meterpoint00-111-222-13-1234-5678-345",
   "MPAN":"00-111-222-13-1234-5678-345",
   "registeredDate":"1537447319000"
}
```

### Energy Production Record

This document is a record of energy produced by a producer.

Example:
```yaml
{    
    "doctype":"production",
    "key":"production2211",
    "productionId":"2211",  
    "productionAmount":1.3,
    "unreconciledAmount": 1.3,  
    "productionDate":1537447319000,
    "MPAN":"00-111-222-13-1234-5678-345",
    "owner":"sitigrid-id"     
}
```

Notes:
* productionId - Unique id of the record, typically a UUID
* productionAmount - How much energy has been produced in kilowatts
* unreconciledAmount - How much energy has yet to be reconciled into a 1 gigawatt "chunk" for the regulator / sale. Will get updated by the reconciliation process
* MPAN - The meterpoint that has created the production
* owner - The org that created the record, used to support multiple orgs on the same blockchain for future cross company trading

### Energy Consumption Record

This document is a record of energy consumed by a consumer.

Example:
```yaml
{   
    "doctype":"consumption",
    "key":"consumption433da889-777d-4f11-b9eb-a6610d8ba555", 
    "consumptionId":"433da889-777d-4f11-b9eb-a6610d8ba555",  
    "consumptionAmount":0.74, 
    "consumptionDate":1537447319000,
    "MPAN":"00-111-222-13-1234-5678-345",
    "owner":"sitigrid-id"     
}
```

Notes:
* consumptionId - Unique id of the record, typically a UUID
* consumptionAmount - How much energy has been consumed in kilowatts
* MPAN - The meterpoint that has created the consumption
* owner - The org that created the record, used to support multiple orgs on the same blockchain for future cross company trading

### Reconciliation Record

Each org in the system has a reconcilation record which keeps track as to which records we have reconciled up to.

Example:
```yaml
{   
    "doctype":"reconciliation",
    "key":"reconiliationsitigrid-id", 
    "reconciledUpTo":1537447319000,
    "owner":"sitigrid-id"     
}
```

Notes:
* reconciledUpTo - The time at which we have reconciled all production records up to.

## Index documents

The following documents are created to enable fast reads of the core documents. This was done as the default Amazon Managed blockchain only supports LevelDB for a state store, if CouchDB is used then these documents are probably not necessary.

### Production date record

Example:
```yaml
{    
    "doctype":"prodDate",
    "key":"prodDate1537447319000",
    "productionId":"2211"
    "MPAN":"00-111-222-13-1234-5678-345",
    "owner":"sitigrid-id"     
}
```

Notes:
* The key field includes the datetime of the production to allow us to do datetime range queries
* productionId - foreign key for the production record

### Consumption date record

Example:
```yaml
{    
    "doctype":"consDate",
    "key":"consDate1537447319000",
    "consumptionId":"433da889-777d-4f11-b9eb-a6610d8ba555"
    "MPAN":"00-111-222-13-1234-5678-345",
    "owner":"sitigrid-id"     
}
```

Notes:
* The key field includes the datetime of the consumption to allow us to do datetime range queries
* consumptionId - foreign key for the consumption record