var util = require('../../util.js');
var rc = require('./../../resultContainer/resultContainer.js');
var fs = require('fs');
var errhandler = require('./../../errorHandler/errorHandler.js');

exports.run = function(actionmap, input, response, context, cb) {
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	
	var step = util.at_xpath(actionmap, "steps/*");
	//console.log("Main query step: "+step);
	if(!step) {
		rc.ElasticResponse(actionmap, '', input, context);
	}
	/* First step */
	stepfn('', step, input, response, context, cb);
	
}
function stepfn(e, step, input, response, context, cb) {
	if(!step || e) { 
		if(e) {
			e = response = errhandler.buildResponse(input, response, '', true);
		}
		cb(e); 	
		return; 
	}
	
	/* Step query replace ?now, ?today, ?userId, ?variable */
	var url, a, actionmap = step.parentNode.parentNode, elastic = actionmap.parentNode,
		query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ')
		.replace(/(\?userId)/g, function() { return input.userId });
				
	console.log("\n Query: "+step);
	console.log("\n Query: "+JSON.stringify(response));
	
	/* Allow relative and absolute urls */
	url = util.getActionHandlerUrl(input, response.configs, step);
		//url = response.configs.EBDSURL + '/' +response.configs.Index + '' + util.at_xpath(step, "query/@url", 1);
	util.debug("\n Main URL : ", url);
	util.debug("\n Main Query: "+query);

	if(!url) {
		e = response = errhandler.buildResponse(input, response, '', true);
		return cb(e); 	
	
	}

	/* Call the service with a timout */
	var options = {
		method: 'POST',
		uri: url, 
		encoding: null, 
		rejectUnauthorized: false,
		timeout:util.at_xpath(util.root(step), './@timeout', 1),
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
		//console.log("\n Query Result:"+JSON.stringify(body));
		/* Respond with hits when available */
		if(body) {
			try {
				body = JSON.parse(body);
			} catch(e) {
				e = response = errhandler.buildResponse(input, response, '', true);
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
		//console.log("\n Query Result:"+JSON.stringify(body));
		/* Ignore error Simulate response on demand */
		if(util.at_xpath(actionmap, "./@CTX_RES_STATUS", 1) != '0') e = '';
		
		/* Format json response using output attributes to a matching query  */
		if(!e) { console.log("Test");
			rc.ElasticResponse(actionmap, body, input, context);
			custom_logic(actionmap, body, input, context);
			//console.log('Output 2'+JSON.stringify(context));
		}
		
		/* Next step */
		var p; for(p = step.nextSibling; p && p.nodeName != 'step'; p = p.nextSibling);
		stepfn(e, p, input, response, context, cb);
		
	});	
}

function custom_logic(actionmap, body, input, context) {

	if(('CTX_RES_ACAD_STANDING' in context) && (context['CTX_RES_ACAD_STANDING'] == 'Good Standing')) {
		context['Status'] = 'Your academic standing is in '+context['CTX_RES_ACAD_STANDING'];
		context['Reason'] = 'Your GPA is above 2.0';
		context['Action'] = '';
	} else if(('CTX_RES_ACAD_STANDING' in context) && (context['CTX_RES_ACAD_STANDING'] != 'Good Standing')) {
		context['Status'] = 'Your academic standing is in '+context['CTX_RES_ACAD_STANDING'];
		context['Reason'] = 'Your GPA is below 2.0';
		context['Action'] = 'Meet advisor at the nearest student success center';
	} else {
		context['Status'] = '';
		context['Reason'] = '';
		context['Action'] = '';
	}
}