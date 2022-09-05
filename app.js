const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const fs = require('fs'),
util = require('./util'),
constants = require('./constants'),
query = require('./query'), 
manager = require('./ebspManager'),
erresp = require('./errorHandler/errorHandler'),
watson = require('./yana-wcs/watson'), 
auditlog = require('./auditlogHandler'),
conftpl = require('./load-conf-tpl');
var ApiResponse = require('./apiResponse');
var map = null;
const httpheaders = {"Content-Type": "application/json; charset=UTF-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers":"X-Requested-With"};

/*process.env.AWS_URL="http://yana-auditlog.us-east-2.elasticbeanstalk.com/saveAuditData";
process.env.EBSP_ENVIRONMENT="MAIN-BOT-LAMBDA";
process.env.EBSP_VERSION="5.7.0.1";
process.env.BASE_AWS_URL="http://yana-auditlog.us-east-2.elasticbeanstalk.com/";
process.env.YANA_DEFAULT_TIMEOUT = "5000";
process.env.INPUT_APP_ID = true;
process.env.KM_API_URL = "https://knowledgemodel.yanaimpl.com/v1/";
process.env.KM_API_AUTH = "YXBpdXNlcjpUaG91Z2h0Rm9jdXNAMTIz";
process.env.ENABLE_LOG = true;
*/

app.post('/', async (req, res) => {
  let configuration = {}, input = {}, log = {};
  try {
	input = req.body;
	util.printlog("1. Inside API - Input Object", input);
	auditlog.initializeLog(input, log);
	let configOutput = await GetConfigurations(input);
	configuration = configOutput.conf;
	//await WcsCall(input, configuration, log);
	if(!map) {
	  map = util.parse(fs.readFileSync(__dirname + '/map.xml', { encoding:'utf8' }));
	  //query.walk_actions(map);
	}
	let resp = await EBSPCall(map, input, log, configuration);
	let apiResponse = new ApiResponse(null, resp, log, input, configuration);
	let response = apiResponse.constructResponse();
	res.status(200).send(response);
	apiResponse.savelogs();
  } catch(err) {
	let apiResponse = new ApiResponse(err, {}, log, input, configuration);
	let response = apiResponse.constructResponse();
	res.status(200).send(response);
	apiResponse.savelogs();
  }
});

function GetConfigurations(input) {
			
  return new Promise((resolve, reject) => {
	let env ;
	if(process.env.INPUT_APP_ID  &&  input[constants.applicationId]) {
		env = input.applicationId;
	} else {
		env = process.env.EBSP_ENVIRONMENT;
	}
    conftpl.loadTemplateConfiguration(env, function(err, st, conf) {
	  if(err) {
		util.printlog("2. Get Configurations error..", conf);
		reject({success: false, code: st, error: err});
	  } else {
		util.printlog("2. Get Configurations success..", conf);
		resolve({success: true, code: st, conf: conf});
	  }
	});
  });
};

function EBSPCall(map, input, log, configuration) {
  return new Promise((reslove, reject) => {
	manager.run(map, input, log, configuration, (err, resp) => {
		if(!err) {
		util.printlog("4. EBSP Call success", resp);
		reslove(resp);
		} else {
		util.printlog("4. EBSP Call failed", err);
		reject({success: true, code: (log[constants.StatusCode]) ? log[constants.StatusCode] : constants.STATUS_WATSON_FAILED, error: err});
		}
	});
  });
}
function WcsCall(input, configuration, log) {
  return new Promise((resolve, reject) => {
	watson.run(input, configuration, log, (err, {}, log) => {
	  if(!err) {
		util.printlog("3. WCS Call success", input);
		resolve({success: true});
	  } else {
		util.printlog("3. WCS Call error", err);
		reject({success: false, 
			code: (log[constants.StatusCode]) ? log[constants.StatusCode] : constants.STATUS_WATSON_FAILED, 
			error: err});
	  }
	})
  });
}

function constructErrorResponse(err, resp, log) {
  console.log("constructErrorResponse starts");
  if(err && err != null) {
	console.log("error has occured and it is::" + err);
	if(typeof err == 'object') {
	  log[constants.ErrorDescription] = err.toString();
	} else {
	  log[constants.ErrorDescription] = err;
	}
	util.print("Server.js Error: ", err);
	let st = log[constants.StatusCode] || '';
	//resp = erresp.getErrorResponse(st, map, input, resp);
	erresp.getErrorResponse(st, map, input, resp, function(err, response) {
	  return constructResponse(res, err, response, log);
	});
  }
}
function SendResponse(err, resp, log) {
  if(err && err != null) {
	constructErrorResponse(res, err, resp, log);
  } else {
	constructResponse(res, err, resp, log);
  }
  //console.log("end of SendResponse");
}
module.exports = app;

