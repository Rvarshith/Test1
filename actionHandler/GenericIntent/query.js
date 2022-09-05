var util = require('../../util.js');
var rc = require('../../resultContainer/resultContainer.js');
var constants = require('../../constants.js');
var contextManager = require('../../contextManager.js');
var fs = require('fs');

exports.run = async function(actionmap, input, response, context, cb) {

	if(input[constants.userId] && input[constants.userId] != '0000' &&
		(constants.ContextManagerURL in response.configs) && response.configs[constants.ContextManagerURL])
	{
		await contextManager.setDisplayNameinInput(input, response.configs);
	}

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
	var url, a, actionmap = step.parentNode.parentNode, elastic = actionmap.parentNode;
	
	query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ')
		.replace(/(\?INTENT)/g, function() { return ((a=response[constants.decision]) && (a=a[constants.INTENT_NAME])) ? a : ''; })
		.replace(/(\?today)/g, function() { return util.format_date(new Date()).replace(/\//g, '-') });
	
	query = util.updateElasticQuery(query, response, input, context);
	
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
