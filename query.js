var util = require('./util.js');
var rc = require('./resultContainer/resultContainer.js');
var constants = require('./constants.js');
var fs = require('fs');
var action_overrides = {};

exports.run = function(actionmap, input, response, context, cb) {

	console.log("\n Inside RUN :"+actionmap.nodeName);
	/*
	Run Override if present 
	To make the override query.js copy paste source this file start with var util = require('../../util.js');
	and remove this if condition and remove walk_actions
	*/
	context[constants.STEP_COUNTER] = 0;
	var a;  if(a = action_overrides[actionmap.nodeName]) {
		a.run(actionmap, input, response, context, cb); 
		return; 
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
	if(!util.executeNextQuery(context, response[constants.decision], input)) {
		context[constants.STEP_COUNTER] = (context[constants.DYNAMIC_STEP_COUNTER]) ? context[constants.DYNAMIC_STEP_COUNTER] : context[constants.STEP_COUNTER];
		return cb('');
	}
	/* Step query replace ?now, ?today, ?userId, ?variable */
	context[constants.STEP_COUNTER] ++;

	let configuration = response[constants.configs];
	
	if((context[constants.STEP_COUNTER] > constants.STEP_P_PLUS_K) && (!(constants.enableFollowUpOptions in configuration) || !configuration[constants.enableFollowUpOptions])) {
		context[constants.STEP_COUNTER] = constants.STEP_P_PLUS_K;
		return cb('');
	}
	
	context[constants.DYNAMIC_STEP_COUNTER] = context[constants.STEP_COUNTER];
	
	var url, a, actionmap = step.parentNode.parentNode, elastic = actionmap.parentNode,
	
	query = util.at_xpath(step, "query/text()", 1).replace(/\s+/g, ' ')
	.replace(/(\?userId)/g, function() { return input.userId })
	.replace(/(\?today)/g, function() { return util.format_date(new Date()).replace(/\//g, '-') })
	.replace(/(\?nowhyphen)/g, function() { return util.format_date(new Date(), 1).replace(/\//g, '-') })
	.replace(/(\?now)/g, function() { return util.format_date(new Date(), 1).replace(/\//g, '-') })
	.replace(/(\?Input_Text)/g, function() { return input.text});
		
	query = util.updateElasticQuery(query, response, input, context);
	query = util.addIntentInWhereQuery(query, actionmap, context[constants.STEP_COUNTER]);
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
				let err = {};
				err[constants.StatusCode] = constants.ERROR_STATUS_JSON_PARSE_ERROR;
				err[constants.ErrorDescription] = e;
				util.debug("\n Query Execution Error : ", e);
				return cb(err); 
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


/*
Populate action_overrides with action overriden query.js
Walk folders inside the folder actions and register the actions. 
Each action is a mandatory map.xml and optional query.js
If query.js available run() in this file is ignored and the override runs
*/
exports.walk_actions = function(map) {

	var i, leni, arri, a, n, actions_root;
	fs.readdir(actions_root = __dirname + '/actionHandler', function(e, actions) { 
		if(e) return '';
		actions.forEach(function(action, fileIndex) {
			var p, actions_dir, actionmap, queryjs; fs.stat(actions_dir = actions_root + '/' + action, function(e, stat) {
				if(!stat.isDirectory() || !(actionmap = util.at_xpath(map, "*/" + action))) return;
				for(p = util.parse(fs.readFileSync(actions_dir + '/map.xml', { encoding:'utf8' })).firstChild;	
					p; p = p.nextSibling) actionmap.appendChild(p.cloneNode(true));
				if(fs.existsSync(queryjs = actions_dir + '/query.js')) {
					action_overrides[action] = require(queryjs);
				}
				if(fileIndex >= actions.length - 1) {
					/* If elastic is missing alias guess elastic alias */
					for(i = 0, leni = (arri = util.xpath(map, "*/*/attributes/*")).length; i < leni; i++) {
						n = arri[i]; a = n.nodeName.replace(/^CTX\_REQ\_/, '').replace(/^CTX\_RES\_/, '').replace(/^UAP\_RES\_/, '');
						if(!n.hasAttribute('intent')) n.setAttribute('intent', a);		
						if(!n.hasAttribute('elastic')) {
							//for(j = 0, lenj = (arrj = a.split('_')).length; j < lenj; j++) arrj[j] = util.title_case(arrj[j]);
							//if(arrj.length) arrj[0] = arrj[0].charAt(0).toLowerCase() + arrj[0].substr(1);
							//n.setAttribute('elastic', arrj.join(''));
							n.setAttribute('elastic', a);
						}
					}
				}
	        });		
		});
	});

}