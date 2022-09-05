const util = require('./../../util.js');
const constants = require('./../../constants.js');
const filres = require('./../../libraries/filterResult');
const sel = require('./../../libraries/selectResponse');

exports.run = function(actionmap, input, response, context, cb) {
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	console.log("Inside main query--"+actionmap.nodeName);
	context[constants.STEP_COUNTER] = 0;
	let promises = [];

	if(!response.configs[constants.EBDSURL]) {
		let err = {};
		err[constants.StatusCode] = constants.ERROR_STATUS_INVALID_DB_URL;
		err[constants.ErrorDescription] = "Database URL missing..";
		return cb(err);
	}
	
	promises = [...promises, stepfn(actionmap, constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT, input, response, context)];
	promises = [...promises, stepfn(actionmap, constants.HANDLER_UNSTRUCTURED_DEFAULT, input, response, context)];
	//promises = [...promises, stepfn(actionmap, constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT, input, response, context)];
	//promises = [...promises, stepfn(actionmap, constants.HANDLER_STRUCTURED_ACROSS_INTENT, input, response, context)];
	
	Promise.all(promises)
	.then((json) => {
		let result = filres.filterResults(json, actionmap, response);
		sel.selectNoIntentResponse(result, actionmap, context, response, input);
		if(context.results && context.results.objects && context.results.objects.length > 0)
		{
			util.IncreaseRevalanceForTriggeredIntentObject(context, response);
			cb();
		}
		else
		{
			console.log("there are no records with in intent for the specified entity. There is no default too. Checking across unstructured");
			Promise.all([
				stepfn(actionmap, constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT, input, response, context)
			]).then((json) => {
				let result = filres.filterResults(json, actionmap, response);
				sel.selectNoIntentResponse(result, actionmap, context, response, input);
				util.IncreaseRevalanceForTriggeredIntentObject(context, response);
				cb();
				
			});
		}
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
	});;
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
			
			let intent = "";
			if(input)
				intent = util.getIntent(input);

			if(intent && (handler == constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT) &&
				(intent == constants.INTENT_LOCATION || intent == constants.INTENT_CONTACT ||
					intent == constants.INTENT_FIRSTDAY || intent == constants.INTENT_TIMING ||
					intent == constants.INTENT_LASTDAY || intent == constants.INTENT_CAMPUS_EVENT))
			{
				handler = constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT;
			}
			
			let query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ');
				
			if(handler == constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT) {
				
				query = util.updateElasticQueryForUnstructured(query, response, input, context);
				query = util.addUnstructuredIntentInWhereQuery(query, input);
				query = util.removeUnstructuredCopiedFromWhereQuery(query);
				query = util.addCopiedFromStrFilterCondition(query, input);
				//Below 2 lines of code required now as we are specifying intent direclty in query
				//query = util.addIntentFilterCondition(query, true, input);			
				//query = util.boostQueryForRightIntent(query, input);

			} else if(handler == constants.HANDLER_UNSTRUCTURED_DEFAULT) {
				
				query = util.addUnstructuredIntentInWhereQuery(query, input);
				query = util.addUnstructuredCopiedFromWhereQuery(query);
			
			} else if(handler == constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT) {
				
				query = util.updateElasticQueryForUnstructured(query, response, input, context);
				query = util.addCopiedFromStrFilterCondition(query, input);

			} else {

				query = util.updateLatLonInQuery(query, input);
				query = util.updateElasticQuery(query, response, input, context);
			}
			
			
			options.body = query;
			console.log("****************"+handler+'-'+context[constants.STEP_COUNTER]+"**************");
			console.log("\n\n URL:"+options.url);
			console.log("\n\n Query:"+query);
			console.log("**************************************");
			if(query)
			promises.push(util.execute(url, query, options, context[constants.STEP_COUNTER], handler));
		}
		Promise.all(promises).then((results) => {
			console.log("All done", results);
			success(results);
		})
		.catch((e) => {
			// Handle errors here
			console.log(e);
			fails(e);
		});
	});
}
