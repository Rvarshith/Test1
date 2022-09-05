const util = require('./util'),
constants = require('./constants'),
ResponseHandler = require('./responseHandler/responseHandler'),
conftpl = require('./load-conf-tpl'),
decisionMaker = require('./decisionMaker/decisionMaker'),
contextHandler = require('./contextHandler/contextHandler');


const GetDataRecord = require('./handlers/getDataRecords');

exports.run = function(map, input, log, configuration, callback) {
	
	var decision = {};
	
	/* This function gets configuration from wcs response(which input to the ebsp) or mysql/elastic table */
	
	var GetDecision = async function(input) {
		
		if(configuration)
			util.updateUTCTime(input, configuration[constants.Timezone]);
		
		contextHandler.updateContext(input, decision, configuration, async function(e) {
			if(e) {
				setAPIError(e, constants.ERROR_STATUS_CONTEXT_FAILED);
			}
			try {
				await decisionMaker.makeDecision(input, decision, configuration);
				GetAction(input, decision, configuration);
			} catch(e) {
				setAPIError(e, constants.ERROR_STATUS_TECH_FAILED);
			}
		});
	}
	var GetAction = async function(input, decision, configuration) {

		try {
			
			let data = {};

			if(!decision[constants.IS_EXCEPTION_CASE]) {
				let ah = new GetDataRecord(input, decision, configuration, map);
			
				data = await ah.execute();
			} 
			BuildResponse(data, decision, configuration);
			
			util.printlog("Response after action handler execution.", data);
		} catch(e) {
			let error = (e && e.desc) ? e.desc : {};
			let code = (e && e.code) ? e.code : constants.ERROR_STATUS_TECH_FAILED;
			setAPIError(error, code);
		}
	}
	var setAPIError = function(err, stCode) {
		util.debug("\n Error :", stCode, err);
		log[constants.StatusCode] = stCode;
		if(err) util.addErrorDescription(log, err);
		let data = {code: stCode, desc:err};
		BuildResponse(data, decision, configuration);
	}
	/* This function build response- error response or success response */
	var BuildResponse = async function(data, decision, configuration) {
		
		let rh = new ResponseHandler.ResponseHandler(data, decision, configuration, input);
		let responseObj = await rh.buildResponse()
		return callback(null, responseObj, log);	
	}	
	GetDecision(input);

}