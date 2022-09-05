const util = require('../util.js');
const constants = require('../constants.js');
const ranking = require('../libraries/ranking');
const nudge_util = require('./nudge_util.js');
const intentIdentifier = require('../decisionMaker/Intent-identifier.js');
exports.run = function (actionmap, decision, response, context, appendIntentToQuery, cb) {
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	console.log("Inside main query--" + actionmap.nodeName);
	context[constants.STEP_COUNTER] = 0;
	let promises = [];

	if (!response.configs[constants.EBDSURL]) {
		let err = {};
		err[constants.StatusCode] = constants.ERROR_STATUS_INVALID_DB_URL;
		err[constants.ErrorDescription] = "Database URL missing..";
		return cb(err);
	}

	//call get academic event handler, location handler and timing handler store it in variables
	// Now check data record handler. if both are same don't add that to promise

	var academicEventHandler = intentIdentifier.getAcademicEventHandler();
    var timingHandler = intentIdentifier.getTimingHandler();
	var locationHandler = intentIdentifier.getLocationHandler();

	console.log("val :" + academicEventHandler.indexOf(decision[constants.dataRecord][constants.HANDLER]));
	console.log("val :" + timingHandler.indexOf(decision[constants.dataRecord][constants.HANDLER]));
	console.log("val :" + locationHandler.indexOf(decision[constants.dataRecord][constants.HANDLER]));

	if (academicEventHandler.indexOf(decision[constants.dataRecord][constants.HANDLER]) == -1)
		promises = [stepfn(actionmap, academicEventHandler, decision, response, context, appendIntentToQuery)];
	if (timingHandler.indexOf(decision[constants.dataRecord][constants.HANDLER]) == -1)
		promises = [stepfn(actionmap, timingHandler, decision, response, context, appendIntentToQuery)];
	if (locationHandler.indexOf(decision[constants.dataRecord][constants.HANDLER]) == -1)
		promises = [stepfn(actionmap, locationHandler, decision, response, context, appendIntentToQuery)];

	Promise.all(promises)
		.then(json => {

			let recordData = [];
			if (Array.isArray(json)) {
				for (var i = 0; i < json.length; i++) {
					let res = json[i];
					let hits, leni;
					for (var j = 0; j < res.length; j++) {
						let body = res[j];
						let structuredIntent = body[constants.TYPE];
						let hits, a;
						leni = (body && (body = body.body) && (hits = body.hits) && (hits.total.value || hits.total)) ? (hits.total.value || hits.total) : 0;

						if (leni > 0) {
							hits = hits.hits;
							for (k = 0; k < hits.length; k++) {
								//a = hits[i]._source;
								hits[k]._source[constants.INTENT] = structuredIntent;
								recordData.push(hits[k]._source);
							}

						}
					}
				}
			}

			ranking.RankingAndSort(recordData, response.decision, decision, true);
			decision[constants.NUDGE_OPTIONS] = recordData;
			cb();
		}).catch(err => {
			let err2 = {};
			if (err && err.StatusCode) {
				err2[constants.StatusCode] = err.StatusCode;
				err2[constants.ErrorDescription] = (err.body) ? err.body : 'Failed due to error code:' + err.StatusCode;
			} else {
				err2[constants.StatusCode] = constants.ERROR_STATUS_TECH_FAILED;
				err2[constants.ErrorDescription] = 'No Intent promise failed at unstructured query of nudge.';
			}
			return cb(err2);
		});
}

function stepfn(actionmap, handler, decision, response, context, appendIntentToQuery) {
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
		if (response.configs[constants.ProxyURL]) {
			options.proxy = response.configs[constants.ProxyURL];
		}

		context[constants.STEP_COUNTER] = -1;
		var url = false;
		for (step = util.at_xpath(actionmap, handler + '/steps/*');
			(step && step.nodeName == 'step'); step = step.nextSibling) {

			context[constants.STEP_COUNTER]++;

			if (!url) {
				url = util.getActionHandlerUrl(decision, response.configs, step);
				options.url = url;
			}


			let query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ');
			query = nudge_util.getReplaceableQuery(query, step, decision, handler)

			//adding intent filter query only if this flag is true.
			if (appendIntentToQuery)
				query = util.addUnstructuredIntentInWhereQuery(query, decision);

			options.body = query;
			console.log("****************" + handler + '-' + context[constants.STEP_COUNTER] + "**************");
			console.log("\n\n URL:" + options.url);
			console.log("\n\n Query:" + query);
			console.log("**************************************");
			if (query)
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
