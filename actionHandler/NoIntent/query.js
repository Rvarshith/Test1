const util = require('./../../util.js');
const constants = require('./../../constants.js');
const sel = require('./../../libraries/selectResponse');
const filres = require('./../../libraries/filterResult');

exports.run = function(actionmap, input, response, context, cb) {
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	//console.log("Inside main query--"+actionmap.nodeName);
	context[constants.STEP_COUNTER] = 0;

	if(!response.configs[constants.EBDSURL]) {
		let err = {};
		err[constants.StatusCode] = constants.ERROR_STATUS_INVALID_DB_URL;
		err[constants.ErrorDescription] = "Database URL missing..";
		return cb(err);
	}
	var ustPromise = stepfn(actionmap, 'unstructured', input, response, context);
	var stPromise = stepfn(actionmap, 'structured', input, response, context);

	Promise.all([stPromise, ustPromise])
	.then((json) => {
		//var noIntentResult = sel.selectNoIntentResponse(json);
		sel.selectNoIntentResponse(json, actionmap, context, response, input);
		util.IncreaseRevalanceForTriggeredIntentObject(context, response);
		cb();
	}).catch((err) => {
		let err2 = {};
		if(err && err.StatusCode) {
			err2[constants.StatusCode] = err.StatusCode;
			err2[constants.ErrorDescription] = (err.body) ? err.body : 'Failed due to error code:'+err.StatusCode;
		} else {
			err2[constants.StatusCode] = constants.ERROR_STATUS_TECH_FAILED;
			err2[constants.ErrorDescription] = 'No Intent promise failed.';
		}
		return cb(err2);
	});
}

function stepfn(actionmap, handler, input, response, context) {
	return new Promise((success, fails) => {
		var promises = [];
		var options = {
			method: 'POST',
			encoding: null, 
			rejectUnauthorized: false,
			timeout: response.configs[constants.Timeout] || process.env.YANA_DEFAULT_TIMEOUT,
			headers: {
				'User-Agent': 'node.js',
				"Content-Type": "application/json"
			}
		};
		if(response.configs[constants.ProxyURL]) {
			options.proxy = response.configs[constants.ProxyURL];
		}
		
		context[constants.STEP_COUNTER] = -1;
		var url = false;
		for(step = util.at_xpath(actionmap, handler+'/steps/*'); (step && step.nodeName == 'step'); step = step.nextSibling) {
			
			context[constants.STEP_COUNTER]++;
			
			if(!url) {
				url = util.getActionHandlerUrl(input, response.configs, step); 
				//url = "https://admin:BBZNUTRCVPVMJRNM@portal-ssl1582-45.bmix-dal-yp-90732137-47ff-4697-aaeb-126a6af78aa2.585614919.composedb.com:22678/unstructured/_search";
				options.url = url;
			}
			
			
			let query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ');
			if(handler == constants.UNSTRUCTURED_INTENT) {
				query = util.updateElasticQueryForUnstructured(query, response, input, context);
				query = util.excludeAlternatesTimeNLCUnstrForNoIntent(query, input);
			}
			else
				query = updateQuery(query, response, input, context);

			//query = util.addIntentFilterCondition(query, false, input);
			options.body = query;
			console.log("\n\n URL:"+options.url);
			console.log("No Intent Query "+query);
			if(query)
			promises.push(util.execute(url, query, options, context[constants.STEP_COUNTER], handler));
		}
		Promise.all(promises).then((results) => {
			console.log("All done", results);
			success(results);
		})
		.catch((e) => {
			fails(e);
		});
	});
}

function updateQuery(query, response, input, context) {
	var a, len;
	
	if((a = input.addtnlInputParams) && (lat = a.latitude) && (lon = a.longitude)) {
		console.log("\n\n\n lat & lon ", lat, lon);
		query = query.replace(/(\?INTPUT_latitude)/g, function() { return lat})
			.replace(/(\?INTPUT_longitude)/g, function() { return lon});
	} else {
		query = query.replace(/(\?INTPUT_latitude)/g, function() { return null})
			.replace(/(\?INTPUT_longitude)/g, function() { return null});
		query = JSON.parse(query);
		delete query.sort;
		query = JSON.stringify(query);
	}
	return util.updateElasticQuery(query, response, input, context);
	
}