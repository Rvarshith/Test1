var util = require('./../util.js');
var constants = require('./../constants.js');
/*
ElasticResponse: Alias eastic variables to context variables prepare context and repsoneObj
CTX_RES_STATUS 0-SUCCESS, 1- TESTMODE, 2 - UNDER CONSTRUCTION, 3- INTERNAL ERROR, 4- TIMEOUT
*/
var operators = {
    '+': function(a, b) { return a + b },
    '<': function(a, b) { return a < b },
    '-': function(a, b) { return a - b },
    '*': function(a, b) { return a * b },
    '%': function(a, b) { return a / b },
};
exports.MasterQueryResponse = function(actionmap, body, input, context) {
	var i, leni, a, key, val, total, matching, arr1=[], arr2=[], hmatch, selindex = -1, b;
	
	leni = (body && (hits = body.hits) && (hits = hits.hits)) ? hits.length : 0;
	total = (body.hits.total.value || body.hits.total);
	console.log("Output:"+JSON.stringify(context));
	if(total == 1) {	
		selindex = 0;
	} else if(total > 1 && context[constants.WCS_ENTITY_COUNT] == 1) {
		selindex = 0;
	} else if(total > 1 && context[constants.WCS_ENTITY_COUNT] > 1) {
		
		for(i = 0; i < leni; i++) {
			a = hits[i]._source;
			arr1 = context[constants.WCS_ENTITY_TYPE_LIST].splice();
			var index = arr1.indexOf(a[constants.PRIMARY_ENTITY_TYPE]);
			if (index > -1) {
			  arr1.splice(index, 1);
			}
			util.debug("\n result ", JSON.stringify(a));
			
			if(a[constants.SECONDARY_ENTITY_TYPE]) {
				arr2 = a[constants.SECONDARY_ENTITY_TYPE].toString().split(",");
				arr2 = arr2.map(function (val) { return val.toString().trim(); });
				matching = 0;
				for(b in arr1) {
					if (arr2.indexOf(arr1[b]) > -1) {
						matching ++;
					}
				}
			} else {
				matching = constants.NONE_SECONDARY_ENTITY_TYPE_MATCH;
			}
			
			if(hmatch) {
				if(matching && (matching > hmatch)) {
					hmatch = matching;
					selindex = i;
				}
			} else {
				hmatch = matching;
				selindex = i;
			}
		}
	}
	util.debug("\n Highest matching Index: ", selindex);
	if(selindex >= 0) {
		a = hits[selindex]._source;
		for(key in a) {
			if(!(attribute = util.at_xpath(actionmap, "attributes/*[@elastic='" + key + "']"))) continue; 
			val = ((a[key] === 0) ? a[key] : (a[key] || '')).toString().trim().replace(/\s+/g, ' ');
			context[attribute.nodeName] = val;
		}
		for(p = util.at_xpath(actionmap, "attributes/*"); p; p = p.nextSibling) {
			if(p.getAttribute('elastic') == 'total') {
				context[p.nodeName] = (body.hits.total.value || body.hits.total) || 0;
			}
		}

		arr1 = context[constants.WCS_ENTITY_TYPE_LIST];
		index = arr1.indexOf(a[constants.PRIMARY_ENTITY_TYPE]);
		if (index > -1) {
		  arr1.splice(index, 1);
		}
		if(arr1.length >= 1) {
			if(a[constants.SECONDARY_ENTITY_TYPE]) {
				arr2 = a[constants.SECONDARY_ENTITY_TYPE].toString().split(",");
				arr2 = arr2.map(function (val) { return val.toString().trim(); });
				matching = 0;
				for(b in arr1) {
					if (arr2.indexOf(arr1[b]) > -1) {
						matching ++;
					}
				}

				if((arr1.length == arr2.length) && (arr2.length == matching)) {

					context[constants.SEARCH_TYPE] = constants.SUCCESS_SEARCH;
				} else {
					context[constants.SEARCH_TYPE] = constants.FALLBACK_SEARCH;
				}
			} else {
				context[constants.SEARCH_TYPE] = constants.FALLBACK_SEARCH;
			}
		}
	}
	
}

exports.ElasticResponse = function(actionmap, body, input, context) {

	var i, leni, a, b, key, val, contextKey, res_status, objects, hits, response = {}, m, attribute, objects = [];
	
	leni = (body && (hits = body.hits) && (hits = hits.hits)) ? hits.length : 0;
	
	console.log("Elastic response----------------------------------->\n" + JSON.stringify(body));

	context['CTX_RES_STATUS'] = res_status = actionmap.getAttribute('CTX_RES_STATUS') || '0'; 

	if(a = context['results']) {		
		objects = a['objects'];
	} else if(((objType = actionmap.getAttribute('objType') || '1')) && leni != 0) {
		context['results'] = { objType: actionmap.getAttribute('objType') || '1', objects: objects };
	}	
	
	
  let lanobj = (input && input[constants.languageCode] && 
	(input[constants.languageCode].toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS)) ? true: false;
	for(i = 0; i < leni; i++) {
		
		a = hits[i]._source;
		b = {};
		b['_id'] = hits[i]._id;
		for(p = util.at_xpath(actionmap, "attributes/*"); p; p = p.nextSibling) {
			
			key = p.hasAttribute('elastic') ? p.getAttribute('elastic') : '';
			
			if(p.hasAttribute('default')) {
				b[p.nodeName] = p.getAttribute('default');					
				if(i == 0) context[p.nodeName] = p.getAttribute('default') || '';
			}
			if(i == 0 && key == 'total') {
				if(i == 0) context[p.nodeName] =(body.hits.total.value || body.hits.total) || 0;
			} else if(i == 0 && key == 'count') {
				if(i == 0) context[p.nodeName] = leni || 0;
			}
			if((key == 'total' || key == 'count') && b[p.nodeName]) {
				delete b[p.nodeName];
			}
			var attrtype = p.hasAttribute('type') ? p.getAttribute('type') : '';
			val = ((a[key] === 0) || a[key]) ? a[key] : '';
			
			console.log("Attribute name to be picked::" + p.nodeName + "::::Value is::" + val);
			
			if(!val && attrtype == 'json' && p.hasAttribute('default'))
			{
				val = p.getAttribute('default');
			}
			if(attrtype == 'latlon') {
				
				if(p.getAttribute('col') == 'lat') {
					if(val && (typeof val == 'object')) {
						b[p.nodeName] = val.lat;
					} else if(val && (typeof val == 'string')) {
						b[p.nodeName] = val.split(',')[0] || '';
					}
				} else if(p.getAttribute('col') == 'lon') {
					if(val && (typeof val == 'object')) {
						b[p.nodeName] = val.lon;
					} else if(val && (typeof val == 'string')) {
						b[p.nodeName] = val.split(',')[1] || '';
					}
				}
				
				if(!val)
				{
					b[p.nodeName] = null;
				}
				
				if(i == 0) {
					if(b[p.nodeName]) context[p.nodeName] = b[p.nodeName]						
				}
				
			} else if(attrtype == 'distance') {
				b[p.nodeName] = (hits[i].sort && hits[i].sort.length && hits[i].sort[0]) ? hits[i].sort[0] : 0;
			} else if((val === 0) || val) {
				if(val && (typeof val == 'string')) {
					val = val.toString().trim().replace(/\s+/g, ' ');
				}
				
				if(val && (attrtype == 'date' || attrtype == 'datetime')) {
					val = util.getFormattedDate(val, attrtype);
				}
				console.log(p.nodeName + "val------------------------------>" + val);
				if(val && attrtype == 'json') {
					try{
						val = JSON.parse(val);
					}
					catch(jsonParseError)
					{
						console.log("Could not parse JSON::" + val);
					}
				}
				
				b[p.nodeName] = val;
				if(i == 0) {
					context[p.nodeName] = val;
				}
			}
			if(p.hasAttribute('calculate')) {
			
				var formula = p.getAttribute('calculate').split(' ');
			 
				var cal = operators[formula[1] || '+'](parseInt(b[formula[0]] || 0), parseInt(b[formula[2]] || 0));
				b[p.nodeName] = cal;
				if(i == 0 ) context[p.nodeName] = cal;
			}
			
		}

		if(!util.arrayContiansObject(objects, b))
			objects.push(b);
		
	}

	//console.log("\n User Acad plan: "+JSON.stringify(input));
	if(leni == 0) {
		context['CTX_RES_STATUS'] = 5;
		if(objects.length == 0) {
			objects.push(b = {});
		} else {
			b = objects[objects.length - 1];
		}				
		for(p = util.at_xpath(actionmap, "attributes/*"); p; p = p.nextSibling) {
			
			var default_val = p.getAttribute('default') || '';
			if(default_val != '') {
				default_val = (util.at_xpath(actionmap, "attributes/*[@watson='" + default_val + "']")) ? '' : default_val;
			}
			
			if((p.getAttribute('elastic') != 'total' && p.getAttribute('elastic') != 'count') && !(p.nodeName in b)) {
				b[p.nodeName] = default_val;
			}
			
			if(p.getAttribute('elastic') == 'total' || p.getAttribute('elastic') == 'count') {
				context[p.nodeName] = 0;
				
			} else if(!(p.nodeName in b)) {
				context[p.nodeName] = default_val;
			}					
		}
	}
}

exports.ParseResponse = function(actionmap, body, step, type) {

	var i, attbuts, leni, a, b, key, val, contextKey, res_status, objects, hits, response = {}, m, attribute, objects = [], context = {};
	
	leni = (body && (hits = body.hits) && (hits = hits.hits)) ? hits.length : 0;

	context['CTX_RES_STATUS'] = res_status = actionmap.getAttribute('CTX_RES_STATUS') || '0'; 

	if(a = context['results']) {		
		objects = a['objects'];
	} else if(type && leni != 0) {
		context['results'] = { objType: type, objects: objects};
	}	
	
	for(i = 0; i < leni; i++) {
		
		if('_source' in hits[i]) {
			a = hits[i]._source;
		} else {
			a = hits[i];
		}
		
		
		objects.push(b = {});
		b['_id'] = hits[i]._id;
		if(actionmap && actionmap.nodeName && actionmap.nodeName == constants.AH_NO_INTENT)
			attbuts = util.at_xpath(actionmap, type+'/attributes/*');
		else
			attbuts = util.at_xpath(actionmap, 'attributes/*');

		for(p = attbuts; p; p = p.nextSibling) {
			
			key = p.hasAttribute('elastic') ? p.getAttribute('elastic') : '';
			
			if(p.hasAttribute('default')) {
				b[p.nodeName] = p.getAttribute('default');					
			
			}
			if(i == 0 && key == 'total') {
				if(i == 0) context[p.nodeName] = (body.hits.total.value || body.hits.total) || 0;
			} else if(i == 0 && key == 'count') {
				if(i == 0) context[p.nodeName] = leni || 0;
			}
			if((key == 'total' || key == 'count') && b[p.nodeName]) {
				delete b[p.nodeName];
			}
			var attrtype = p.hasAttribute('type') ? p.getAttribute('type') : '';
			val = ((a[key] === 0) || a[key]) ? a[key] : '';
			if(attrtype == 'latlon') {
				
				if(p.getAttribute('col') == 'lat') {
					if(val && (typeof val == 'object')) {
						b[p.nodeName] = val.lat;
					} else if(val && (typeof val == 'string')) {
						b[p.nodeName] = val.split(',')[0] || '';
					}
				} else if(p.getAttribute('col') == 'lon') {
					if(val && (typeof val == 'object')) {
						b[p.nodeName] = val.lon;
					} else if(val && (typeof val == 'string')) {
						b[p.nodeName] = val.split(',')[1] || '';
					}
				}
				if(!val)
                {
                    b[p.nodeName] = null;
                }
                
                if(i == 0) {
                    if(b[p.nodeName]) context[p.nodeName] = b[p.nodeName]                       
                }	
			} else if(attrtype == 'distance') {
				b[p.nodeName] = (hits[i].sort && hits[i].sort.length && hits[i].sort[0]) ? hits[i].sort[0] : 0;
			} else if(attrtype == 'step') {
				b[p.nodeName] = step;
			} else if((val === 0) || val) {
				if(val && (typeof val == 'string')) {
					val = val.toString().trim().replace(/\s+/g, ' ');
				}
				
				if(val && (attrtype == 'date' || attrtype == 'datetime')) {
					val = util.getFormattedDate(val, attrtype);
				}
				
				if(val && attrtype == 'json') {
					try{
						
						val = JSON.parse(val);
						if(key == 'LANGUAGES') {
							val.EN.TEXT = null;
						}
					}
					catch(jsonParseError)
					{
						console.log("Could not parse JSON::" + val);
					}
				}
				if(p.hasAttribute('prefix')) {
					val =  p.getAttribute('prefix') + ' ' + val;
				}
				if(p.hasAttribute('suffix')) {
					val =  val + ' ' + p.getAttribute('suffix');
				}
				b[p.nodeName] = val;
				
			}
			if(p.hasAttribute('calculate')) {
			
				var formula = p.getAttribute('calculate').split(' ');
			 
				var cal = operators[formula[1] || '+'](parseInt(b[formula[0]] || 0), parseInt(b[formula[2]] || 0));
				b[p.nodeName] = cal;
			}
			
		}
		
	}
	//console.log("\n User Acad plan: "+JSON.stringify(input));
	if(leni == 0) {
		context['CTX_RES_STATUS'] = 5;
		if(objects.length == 0) {
			objects.push(b = {});
		} else {
			b = objects[objects.length - 1];
		}				
		for(p = util.at_xpath(actionmap, "attributes/*"); p; p = p.nextSibling) {
			
			var default_val = p.getAttribute('default') || '';
			if(default_val != '') {
				default_val = (util.at_xpath(actionmap, "attributes/*[@watson='" + default_val + "']")) ? '' : default_val;
			}
			
			if(p.getAttribute('elastic') == 'total' || p.getAttribute('elastic') == 'count') {
				context[p.nodeName] = 0;
				
			} else if(!(p.nodeName in b)) {
				b[p.nodeName] = default_val;
			}
		}
	}
	return context;
}