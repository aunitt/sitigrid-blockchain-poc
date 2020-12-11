# How to update chaincode in a live environment

The following code snippets are useful if you need to update chaincode in a live environment. You need to increment the version number in the environment variable for each deploy.

```
cd ~
cp ./sitigrid-blockchain-poc/sitigrid-chaincode/src/* ./fabric-samples/chaincode/sitigrid
```

```
export VERSION='v3'
```

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  \
    cli peer chaincode install -n sitigrid -l node -v $VERSION -p /opt/gopath/src/github.com/sitigrid
```


```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  \
    cli peer chaincode upgrade -o $ORDERER -C mychannel -n sitigrid -v $VERSION -c '{"Args":["init"]}' --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```