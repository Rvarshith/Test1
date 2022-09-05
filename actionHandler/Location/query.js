var util = require('./../../util.js');
var rc = require('./../../resultContainer/resultContainer.js');
var constants = require('./../../constants.js');
var contextManager = require('./../../contextManager.js');
var fs = require('fs');
var action_overrides = {};

exports.run = function(actionmap, input, response, context, cb) {

	console.log("\n Inside RUN :"+actionmap.nodeName);
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	console.log("\n\n Context value");
	console.log(context);
	console.log("\n\n Context value");
	var step = util.at_xpath(actionmap, "steps/*");

	if(step) {
		/* First step */
		stepfn('', step, input, response, context, cb);
	}
}
function stepfn(e, step, input, response, context, cb) {
	if(!step || e) {
		return cb(e);
		
	}
	if(!util.executeNextQuery(context, response[constants.decision], input)) {
		return cb('');
	}
	context[constants.STEP_COUNTER] ++;
	/* Step query replace ?now, ?today, ?userId, ?variable */

	var url, a, actionmap = step.parentNode.parentNode, elastic = actionmap.parentNode,
	
	query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ')
		.replace(/(\?userId)/g, function() { return input.userId })
		.replace(/(\?today)/g, function() { return util.format_date(new Date()).replace(/\//g, '-') })
		.replace(/(\?nowhyphen)/g, function() { return util.format_date(new Date(), 1).replace(/\//g, '-') })
		.replace(/(\?now)/g, function() { return util.format_date(new Date(), 1).replace(/\//g, '-') })
		.replace(/(\?Input_Text)/g, function() { return input.text})
		.replace(/(\?entity)/g, function() { return ((a=response.decision) && (a=a.ENTITY_VALUE)) ? a : ''; });
		
	
	query = updateQuery(query, response, input, context);

	//query = await contextManager.updateQueryWithContextDetails(query, input, response.configs);
	//query = util.addIntentInWhereQuery(query, actionmap, context[constants.STEP_COUNTER]);
	url = util.getActionHandlerUrl(input, response.configs, step);
	util.debug("\n Query URL: ", url);
	util.debug("\n Query : ", query);
	if(!url) {
		let err = {};
		err[constants.StatusCode] = constants.ERROR_STATUS_INVALID_DB_URL;
		err[constants.ErrorDescription] = "Database URL missing..";
		return cb(err);
	
	}

	/* Call the service with a timout */
	var options = {
		method: 'POST',
		uri: url, 
		encoding: null, 
		rejectUnauthorized: false,
		timeout: response.configs[constants.Timeout] || util.at_xpath(util.root(step), './@timeout', 1),
		headers: {
			'User-Agent': 'node.js',
			"Content-Type": "application/json"
		},
		body: query
	};
	if(response.configs[constants.ProxyURL]) {
		options.proxy = response.configs[constants.ProxyURL];
	}

	console.log("Value of query---------------------------------->" + JSON.stringify(query));
	require('request')(options, function(e, res, body) {
		/* Respond with hits when available */
		if(body) {
			try {
				body = JSON.parse(body);
			} catch(e) {
				util.debug("\n Query Execution Error : ", e);
				cb(e);
				return; 
			}
		}
		if(!e && body && (a = body['error'])) {
			if((a = a['root_cause'][0]) && (a = a['reason'])) e = a;
			else if((a = body['error']['reason'])) e = a;
			else  e = 'Failed';
			e += ' ' + url + ' ' + query;
		}

		/* Ignore error Simulate response on demand */
		if(util.at_xpath(actionmap, "./@CTX_RES_STATUS", 1) != '0') e = '';
		
		/* Format json response using output attributes to a matching query  */
		if(!e) rc.ElasticResponse(actionmap, body, input, context);
		
		/* Next step */
		var p; for(p = step.nextSibling; p && p.nodeName != 'step'; p = p.nextSibling);
		stepfn(e, p, input, response, context, cb);
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