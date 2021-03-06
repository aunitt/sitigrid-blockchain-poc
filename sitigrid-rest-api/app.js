/*
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
*/

'use strict';
var log4js = require('log4js');
log4js.configure({
	appenders: {
	  out: { type: 'stdout' },
	},
	categories: {
	  default: { appenders: ['out'], level: 'info' },
	}
});
var logger = log4js.getLogger('SitigridAPI');
const WebSocketServer = require('ws');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var cors = require('cors');
var hfc = require('fabric-client');
const uuidv4 = require('uuid/v4');

var connection = require('./connection.js');
var query = require('./query.js');
var invoke = require('./invoke.js');
var blockListener = require('./blocklistener.js');

hfc.addConfigFile('config.json');
var host = 'localhost';
var port = 3000;
var username = "";
var orgName = "";
var channelName = hfc.getConfigSetting('channelName');
var chaincodeName = hfc.getConfigSetting('chaincodeName');
var peers = hfc.getConfigSetting('peers');
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATIONS ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(function(req, res, next) {
	logger.info(' ##### New request for URL %s',req.originalUrl);
	return next();
});

//wrapper to handle errors thrown by async functions. We can catch all
//errors thrown by async functions in a single place, here in this function,
//rather than having a try-catch in every function below. The 'next' statement
//used here will invoke the error handler function - see the end of this script
const awaitHandler = (fn) => {
	return async (req, res, next) => {
		try {
			await fn(req, res, next)
		} 
		catch (err) {
			next(err)
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  Listening on: http://%s:%s  ******************',host,port);
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START WEBSOCKET SERVER ///////////////////////
///////////////////////////////////////////////////////////////////////////////
const wss = new WebSocketServer.Server({ server });
wss.on('connection', function connection(ws) {
	logger.info('****************** WEBSOCKET SERVER - received connection ************************');
	ws.on('message', function incoming(message) {
		console.log('##### Websocket Server received message: %s', message);
	});

	ws.send('something');
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Health check - can be called by load balancer to check health of REST API
app.get('/health', awaitHandler(async (req, res) => {
	res.sendStatus(200);
}));

// Register and enroll user. A user must be registered and enrolled before any queries 
// or transactions can be invoked
app.post('/users', awaitHandler(async (req, res) => {
	logger.info('================ POST on Users');
	username = req.body.username;
	orgName = req.body.orgName;
	logger.info('##### End point : /users');
	logger.info('##### POST on Users- username : ' + username);
	logger.info('##### POST on Users - userorg  : ' + orgName);
	let response = await connection.getRegisteredUser(username, orgName, true);
	logger.info('##### POST on Users - returned from registering the username %s for organization %s', username, orgName);
    logger.info('##### POST on Users - getRegisteredUser response secret %s', response.secret);
    logger.info('##### POST on Users - getRegisteredUser response secret %s', response.message);
    if (response && typeof response !== 'string') {
        logger.info('##### POST on Users - Successfully registered the username %s for organization %s', username, orgName);
		logger.info('##### POST on Users - getRegisteredUser response %s', response);
		// Now that we have a username & org, we can start the block listener
		await blockListener.startBlockListener(channelName, username, orgName, wss);
		res.json(response);
	} else {
		logger.error('##### POST on Users - Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({success: false, message: response});
	}
}));

/************************************************************************************
 * Meterpoint methods
 ************************************************************************************/

// GET Meterpoint
app.get('/meters', awaitHandler(async (req, res) => {
	logger.info('================ GET on meters');
	let args = {};
	let fcn = "queryAllMeterpoints";

    logger.info('##### GET on meterpoint - username : ' + username);
	logger.info('##### GET on meterpoint - userOrg : ' + orgName);
	logger.info('##### GET on meterpoint - channelName : ' + channelName);
	logger.info('##### GET on meterpoint - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on meterpoint - fcn : ' + fcn);
	logger.info('##### GET on meterpoint - args : ' + JSON.stringify(args));
	logger.info('##### GET on meterpoint - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific meterpoint
app.get('/meters/:MPAN', awaitHandler(async (req, res) => {
	logger.info('================ GET on meterpoint by ID');
	logger.info('meterpoint username : ' + req.params);
	let args = req.params;
	let fcn = "queryMeterpoint";

    logger.info('##### GET on meterpoint by username - username : ' + username);
	logger.info('##### GET on meterpoint by username - userOrg : ' + orgName);
	logger.info('##### GET on meterpoint by username - channelName : ' + channelName);
	logger.info('##### GET on meterpoint by username - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on meterpoint by username - fcn : ' + fcn);
	logger.info('##### GET on meterpoint by username - args : ' + JSON.stringify(args));
	logger.info('##### GET on meterpoint by username - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the productions for a specific meterpoint
app.get('/meters/:MPAN/productions', awaitHandler(async (req, res) => {
	logger.info('================ GET on productions for meterpoint');
	logger.info('meterpoint username : ' + req.params);
	let args = req.params;
	let fcn = "queryProductionsForMeterpoint";

    logger.info('##### GET on productions for meterpoint - username : ' + username);
	logger.info('##### GET on productions for meterpoint - userOrg : ' + orgName);
	logger.info('##### GET on productions for meterpoint - channelName : ' + channelName);
	logger.info('##### GET on productions for meterpoint - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on productions for meterpoint - fcn : ' + fcn);
	logger.info('##### GET on productions for meterpoint - args : ' + JSON.stringify(args));
	logger.info('##### GET on productions for meterpoint - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET total productions for a specific meterpoint
app.get('/meters/:MPAN/totalproductions', awaitHandler(async (req, res) => {
	logger.info('================ GET on totalproductions for meterpoint');
	logger.info('meterpoint username : ' + req.params);
	let args = req.params;
	let fcn = "queryTotalProductionsForMeterpoint";

    logger.info('##### GET on productions for meterpoint - username : ' + username);
	logger.info('##### GET on productions for meterpoint - userOrg : ' + orgName);
	logger.info('##### GET on productions for meterpoint - channelName : ' + channelName);
	logger.info('##### GET on productions for meterpoint - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on productions for meterpoint - fcn : ' + fcn);
	logger.info('##### GET on productions for meterpoint - args : ' + JSON.stringify(args));
	logger.info('##### GET on productions for meterpoint - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the consumptions for a specific meterpoint
app.get('/meters/:MPAN/consumptions', awaitHandler(async (req, res) => {
	logger.info('================ GET on consumptions for meterpoint');
	logger.info('meterpoint username : ' + req.params);
	let args = req.params;
	let fcn = "queryConsumptionsForMeterpoint";

    logger.info('##### GET on consumptions for meterpoint - username : ' + username);
	logger.info('##### GET on consumptions for meterpoint - userOrg : ' + orgName);
	logger.info('##### GET on consumptions for meterpoint - channelName : ' + channelName);
	logger.info('##### GET on consumptions for meterpoint - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on consumptions for meterpoint - fcn : ' + fcn);
	logger.info('##### GET on consumptions for meterpoint - args : ' + JSON.stringify(args));
	logger.info('##### GET on consumptions for meterpoint - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET total consumptions for a specific meterpoint
app.get('/meters/:MPAN/totalconsumptions', awaitHandler(async (req, res) => {
	logger.info('================ GET on totalconsumptions for meterpoint');
	logger.info('meterpoint username : ' + req.params);
	let args = req.params;
	let fcn = "queryTotalConsumptionsForMeterpoint";

    logger.info('##### GET on consumptions for meterpoint - username : ' + username);
	logger.info('##### GET on consumptions for meterpoint - userOrg : ' + orgName);
	logger.info('##### GET on consumptions for meterpoint - channelName : ' + channelName);
	logger.info('##### GET on consumptions for meterpoint - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on consumptions for meterpoint - fcn : ' + fcn);
	logger.info('##### GET on consumptions for meterpoint - args : ' + JSON.stringify(args));
	logger.info('##### GET on consumptions for meterpoint - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));
// POST meterpoint
app.post('/meters', awaitHandler(async (req, res) => {
	logger.info('================ POST on meterpoint');
	var args = req.body;
	var fcn = "createMeterpoint";

    logger.info('##### POST on meterpoint - username : ' + username);
	logger.info('##### POST on meterpoint - userOrg : ' + orgName);
	logger.info('##### POST on meterpoint - channelName : ' + channelName);
	logger.info('##### POST on meterpoint - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on meterpoint - fcn : ' + fcn);
	logger.info('##### POST on meterpoint - args : ' + JSON.stringify(args));
	logger.info('##### POST on meterpoint - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * Production methods
 ************************************************************************************/

// GET production
app.get('/productions', awaitHandler(async (req, res) => {
	logger.info('================ GET on production');
	let args = {};
	let fcn = "queryAllProductions";

    logger.info('##### GET on production - username : ' + username);
	logger.info('##### GET on production - userOrg : ' + orgName);
	logger.info('##### GET on production - channelName : ' + channelName);
	logger.info('##### GET on production - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on production - fcn : ' + fcn);
	logger.info('##### GET on production - args : ' + JSON.stringify(args));
	logger.info('##### GET on production - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific production
app.get('/productions/:productionId', awaitHandler(async (req, res) => {
	logger.info('================ GET on production by ID');
	logger.info('production ID : ' + req.params);
	let args = req.params;
	let fcn = "queryProduction";

    logger.info('##### GET on production - username : ' + username);
	logger.info('##### GET on production - userOrg : ' + orgName);
	logger.info('##### GET on production - channelName : ' + channelName);
	logger.info('##### GET on production - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on production - fcn : ' + fcn);
	logger.info('##### GET on production - args : ' + JSON.stringify(args));
	logger.info('##### GET on production - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET productions in a date range
app.get('/productionsbydate', awaitHandler(async (req, res) => {
	logger.info('================ GET on productions by date range');
	let start = req.query.start;
	let end = req.query.end;
	let args = { startDate: start, endDate: end };

	let fcn = "queryAllProductionsInDateRange";

    logger.info('##### GET on production in date range - username : ' + username);
	logger.info('##### GET on production in date range- userOrg : ' + orgName);
	logger.info('##### GET on production in date range- channelName : ' + channelName);
	logger.info('##### GET on production in date range- chaincodeName : ' + chaincodeName);
	logger.info('##### GET on production in date range- fcn : ' + fcn);
	logger.info('##### GET on production in date range- args : ' + JSON.stringify(args));
	logger.info('##### GET on production in date range- peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST production
app.post('/productions', awaitHandler(async (req, res) => {
	logger.info('================ POST on production');
	var args = req.body;
	var fcn = "createProductionRecord";

    logger.info('##### POST on production - username : ' + username);
	logger.info('##### POST on production - userOrg : ' + orgName);
	logger.info('##### POST on production - channelName : ' + channelName);
	logger.info('##### POST on production - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on production - fcn : ' + fcn);
	logger.info('##### POST on production - args : ' + JSON.stringify(args));
	logger.info('##### POST on production - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * Consumption methods
 ************************************************************************************/

// GET consumption
app.get('/consumptions', awaitHandler(async (req, res) => {
	logger.info('================ GET on consumption');
	let args = {};
	let fcn = "queryAllConsumptions";

    logger.info('##### GET on consumption - username : ' + username);
	logger.info('##### GET on consumption - userOrg : ' + orgName);
	logger.info('##### GET on consumption - channelName : ' + channelName);
	logger.info('##### GET on consumption - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on consumption - fcn : ' + fcn);
	logger.info('##### GET on consumption - args : ' + JSON.stringify(args));
	logger.info('##### GET on consumption - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific consumption
app.get('/consumptions/:consumptionId', awaitHandler(async (req, res) => {
	logger.info('================ GET on consumption by ID');
	logger.info('consumption ID : ' + req.params);
	let args = req.params;
	let fcn = "queryConsumption";

    logger.info('##### GET on consumption - username : ' + username);
	logger.info('##### GET on consumption - userOrg : ' + orgName);
	logger.info('##### GET on consumption - channelName : ' + channelName);
	logger.info('##### GET on consumption - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on consumption - fcn : ' + fcn);
	logger.info('##### GET on consumption - args : ' + JSON.stringify(args));
	logger.info('##### GET on consumption - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST consumption
app.post('/consumptions', awaitHandler(async (req, res) => {
	logger.info('================ POST on consumption');
	var args = req.body;
	var fcn = "createConsumptionRecord";

    logger.info('##### POST on consumption - username : ' + username);
	logger.info('##### POST on consumption - userOrg : ' + orgName);
	logger.info('##### POST on consumption - channelName : ' + channelName);
	logger.info('##### POST on consumption - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on consumption - fcn : ' + fcn);
	logger.info('##### POST on consumption - args : ' + JSON.stringify(args));
	logger.info('##### POST on consumption - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));



/************************************************************************************
 * Blockchain metadata methods
 ************************************************************************************/

// GET details of a blockchain transaction using the record key (i.e. the key used to store the transaction
// in the world state)
app.get('/blockinfos/:docType/keys/:key', awaitHandler(async (req, res) => {
	logger.info('================ GET on blockinfo');
	logger.info('Key is : ' + req.params);
	let args = req.params;
	let fcn = "queryHistoryForKey";
	
	logger.info('##### GET on blockinfo - username : ' + username);
	logger.info('##### GET on blockinfo - userOrg : ' + orgName);
	logger.info('##### GET on blockinfo - channelName : ' + channelName);
	logger.info('##### GET on blockinfo - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on blockinfo - fcn : ' + fcn);
	logger.info('##### GET on blockinfo - args : ' + JSON.stringify(args));
	logger.info('##### GET on blockinfo - peers : ' + peers);

	let history = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	logger.info('##### GET on blockinfo - queryHistoryForKey : ' + util.inspect(history));
	res.send(history);
}));


/************************************************************************************
 * Utility function for creating dummy spend records. Mimics the behaviour of an NGO
 * spending funds, which are allocated against donations
 ************************************************************************************/

async function dummySpend() {
	if (!username) {
		return;
	}
	// first, we get a list of donations and randomly choose one
	let args = {};
	let fcn = "queryAllProductions";

    logger.info('##### dummySpend GET on production - username : ' + username);
	logger.info('##### dummySpend GET on production - userOrg : ' + orgName);
	logger.info('##### dummySpend GET on production - channelName : ' + channelName);
	logger.info('##### dummySpend GET on production - chaincodeName : ' + chaincodeName);
	logger.info('##### dummySpend GET on production - fcn : ' + fcn);
	logger.info('##### dummySpend GET on production - args : ' + JSON.stringify(args));
	logger.info('##### dummySpend GET on production - peers : ' + peers);

	let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	let len = message.length;
	if (len < 1) {
		logger.info('##### dummySpend - no donations available');
	}
	logger.info('##### dummySpend - number of donation record: ' + len);
	if (len < 1) {
		return;
	}
	let ran = Math.floor(Math.random() * len);
	logger.info('##### dummySpend - randomly selected donation record number: ' + ran);
	logger.info('##### dummySpend - randomly selected donation record: ' + JSON.stringify(message[ran]));

	// then we create a spend record for the NGO that received the donation
	fcn = "createSpend";
	let spendId = uuidv4();
	let spendAmt = Math.floor(Math.random() * 100) + 1;

	args = {};
	args["spendId"] = spendId;
	args["spendDescription"] = "Peter Pipers Poulty Portions for Pets";
	args["spendDate"] = "2018-09-20T12:41:59.582Z";
	args["spendAmount"] = spendAmt;

	logger.info('##### dummySpend - username : ' + username);
	logger.info('##### dummySpend - userOrg : ' + orgName);
	logger.info('##### dummySpend - channelName : ' + channelName);
	logger.info('##### dummySpend - chaincodeName : ' + chaincodeName);
	logger.info('##### dummySpend - fcn : ' + fcn);
	logger.info('##### dummySpend - args : ' + JSON.stringify(args));
	logger.info('##### dummySpend - peers : ' + peers);

	message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
}

(function loop() {
    var rand = Math.round(Math.random() * (20000 - 5000)) + 5000;
    setTimeout(function() {
		//dummySpend();
        loop();  
    }, rand);
}());

/************************************************************************************
 * Error handler
 ************************************************************************************/

app.use(function(error, req, res, next) {
	res.status(500).json({ error: error.toString() });
});

