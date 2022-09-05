var util = require('./../../util.js');
var constants = require('./../../constants.js');
var rc = require('./../../resultContainer/resultContainer.js');

var fs = require('fs');


exports.run = function(actionmap, input, response, context, cb) {
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	console.log("Inside main query--"+actionmap.nodeName);
	
	var step = util.at_xpath(actionmap, "steps/*");
	
	if(!step) {
		//util.ElasticResponse(actionmap, '', input, context);
	}
	/* First step */
	stepfn('', step, input, response, context, cb);

	
}
function stepfn(e, step, input, response, context, cb) {
	if(!step || e) {
		return cb(e);
		
	}
	
	/* Step query replace ?now, ?today, ?userId, ?variable */

	var url, a, actionmap = step.parentNode.parentNode, elastic = actionmap.parentNode, temp1, temp2;
	
	var entitys = {}, types = [];
	
	
	try {
		context[constants.STEP_COUNTER] = constants.STEP_P_PLUS_K;
		context[constants.WCS_ENTITY_TYPE_LIST] = types;
		query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ');	
		
		query = util.updateElasticQuery(query, response, input, context);

		url = util.getActionHandlerUrl(input, response.configs, step);
		util.debug("\n Main URL : ", url);
		util.debug("\n Main Query: "+query);
		
		if(!url) {
			let err = {};
			err[constants.StatusCode] = constants.ERROR_STATUS_INVALID_DB_URL;
			err[constants.ErrorDescription] = "Database URL missing..";
			return cb(err);
		
		}
	} catch(err) {
		util.debug("\n Difference custom Query Error: ", err);
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
	require('request')(options, function(e, res, body) {
		/* Respond with hits when available */
		if(body) {
			try {
				body = JSON.parse(body);
			} catch(e) {
				util.debug("Error in Timing Query body parse ", e);
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
