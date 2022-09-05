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
	//console.log("Inside main query--"+actionmap.nodeName);
	
	var step = util.at_xpath(actionmap, "steps/*");
	
	if(!step) {
		//util.ElasticResponse(actionmap, '', input, context);
	}
	/* First step */
	stepfn('', step, input, response, context, cb);

	
}
function stepfn(e, step, input, response, context, cb) {
	if(!step || e) {
		if(e) {
			util.debug("Error in Timing Query step Method ", e);
		}
		return cb(e);
		
	}
	if(!util.executeNextQuery(context, response[constants.decision], input)) {
		return cb('');
	}
	context[constants.STEP_COUNTER] ++;
	/* Step query replace ?now, ?today, ?userId, ?variable */

	var counter=0, actionmap = step.parentNode.parentNode, elastic = actionmap.parentNode, place, url, a;
	
	if(context[constants.STEP_COUNTER] == constants.STEP_PS_PLUS_KS) {
		place = '4';
	} else if(context[constants.STEP_COUNTER] == constants.STEP_P_NOT_S) {
		place = '3';
	} else if(context[constants.STEP_COUNTER] == constants.STEP_P_PLUS_K) {
		place = '2';
	}
	try {
		var dateOptions = util.getOptionArray(input, response.configs);
		
		query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ');
		var userId = input.userId || '0000';
		
		if((userId !== '0000') && ((a = response) && (a = a[constants.configs]) && (a = a[constants.defaultUserID]))) {
			userId = a;
		}
		query = query.replace(/(\?userId)/g, function() { return userId });
		
		if(dateOptions[constants.sys_date_count] == 1) {
			query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]);
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[place].bool.should[0].bool.must.splice((0 - counter), 1);
			query = JSON.stringify(query);	
			counter ++;
		}
		
		if(dateOptions[constants.sys_date_count] == 2) {
			query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]).replace(/(\?sys_date2)/g, dateOptions[constants.sys_date_two]);
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[place].bool.should[0].bool.must.splice((1 - counter),1);
			query = JSON.stringify(query);
			counter ++;
		}
		
		if(dateOptions[constants.sys_date_count] == 0) {
			query = query.replace(/(\?sys_date1)/g, dateOptions[constants.curr_date]);
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[place].bool.should[0].bool.must.splice((2 - counter),1);
			query = JSON.stringify(query);
			counter ++;
		}
		
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
		util.print("\n Assignment Custom Query Error: ", err);
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
