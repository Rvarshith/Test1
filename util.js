var xpath = require('xpath.js');
var fs = require('fs');
var moment = require('moment-timezone');
var DOMParser = require('xmldom')['DOMParser'];
var at_xpath, to_s, debug, getFormattedDate, getCurrentDateTime, isEmpty;
var constants = require('./constants.js');
var uniqid = require('uniqid');
var lib = require('./libraries/resultFilter');
const dtpl = require('./load-conf-tpl');
const { resolve } = require('path');
const { reject } = require('promise');
/*
ContextAttribute: Return attribute name in context for attribute name in elastic
*/
function ContextAttribute(actionmap, elasticattribute) {
	var a; return (a = at_xpath(actionmap, "attributes/*[@elastic='" 
		+ elasticattribute + "']")) ? a.nodeName : '';
}

function getConfigDB() {
	return process.env.CONFIG_DB || '';
}
/*
ElasticAttribute: Return attribute name in elastic for attribute name in watson 
*/
function ElasticAttribute(actionmap, watsonattribute) {
	var a; return (a = at_xpath(actionmap, "attributes/*[@watson='" 
		+ watsonattribute + "']")) ? a.getAttribute('elastic') : '';
}
/*
WatsonAttribute: Return attribute name in elastic for attribute name in watson 
*/
function WatsonAttribute(actionmap, contextattribute) {
	var a; return a = at_xpath(actionmap, "attributes/" +  contextattribute) ? (a.getAttribute('elastic') || '') : '';
}

/*
AttributeType: Return attribute type 
*/
exports.AttributeType = AttributeType = function(actionmap, name) {
	return at_xpath(actionmap, "attributes/*[@watson='" + name + "']/@type", 1)
		|| at_xpath(actionmap, "attributes/"+ name + "/@type", 1);
}
/*
AttributeDefault: Return attribute default 
*/
exports.AttributeDefault = AttributeDefault = function(actionmap, name) {
	return at_xpath(actionmap, "attributes/*[@watson='" + name + "']/@default", 1)
		|| at_xpath(actionmap, "attributes/"+ name + "/@default", 1);
}
/*
AttributePadding: Return attribute padding 
*/
exports.AttributePadding = AttributePadding = function(actionmap, name) {
	return at_xpath(actionmap, "attributes/*[@watson='" + name + "']/@padding", 1)
		|| at_xpath(actionmap, "attributes/"+ name + "/@padding", 1);
}

/*
ElasticQuery: Return elastic json query object from contextAttribtues in Watson response 
Match query for the action that has all the contextAttribtues. Return null if no query matches.
*/
exports.ElasticQuery = function(actionmap, input, watsonresponse) {	
	var a, b, k, i, leni, arri, query, json; 
	json = function(querynode, query) {
		var attribute, j = {};
		if(querynode) j[querynode.nodeName] = (attribute = querynode.getAttribute('attribute')) 
			? query[attribute] : json(querynode.firstChild);
		return j;
	};
	query = {};
	if(a = input['userId']) query['userId'] = a;
	for(k in watsonresponse.output) {
		if(a = ElasticAttribute(actionmap, k)) if(b = watsonresponse.output[k].trim()) if(a != 'fromDate') query[a] = b;
	}
	for(queryroot = actionmap.firstChild; queryroot; queryroot = queryroot.nextSibling) {
		if(queryroot.nodeName != 'query') continue;
		for(i = 0, leni = (arri = xpath(queryroot, ".//*[@attribute]")); i < leni; i++) {
			if(!query[arri[i].getAttribute('attribute')]) break;
		}
		if(i == leni) return json(queryroot, query);
	}
	return query;
}
function pad0(a,b){ return(1e15 + a + '').slice(-b); }
exports.parse = function(s) {
	var i, arri, leni, n, a; if(!(s || '').trim() 
		|| !(n = new DOMParser({ errorHandler: {
			warning: function(e) { debug('parse Warning:', e) },
			error: function(e) { debug('PARSE:', e, s.substring(0, 1300)) },
			fatalError: function(e) { debug('PARSE:', e, s.substring(0, 130)) } } })) 
		|| !(n = n.parseFromString(s, 'application/xml'))
		|| !(n = n.documentElement)
		|| !n.getAttribute) return ''; 	
	for(i = 0, leni = (arri = xpath(n, "//text()[normalize-space(.) = '']"))
		.length; i < leni; i++) (a = arri[i]).parentNode.removeChild(a);
	return n;
}
exports.format_date = format_date = function(date, time_flag) {
	return ("%Y/%m/%d"  + (time_flag ? ' %H:%i:%s' : ''))
		.replace('%Y', (date = date || (new Date())).getFullYear())
		.replace('%m', pad0(date.getMonth() + 1, 2))
		.replace('%d', pad0(date.getDate(), 2))
		.replace('%H', pad0(date.getHours(), 2))
		.replace('%i', pad0(date.getMinutes(), 2))
		.replace('%s', pad0(date.getSeconds(), 2));
}
/*
Return hash XML node n attributes 
*/
exports.hash = function(n) { 
	var i, leni, a, h, k; for(i = 0, h = {}, leni = !n ? 0 : !(a = n.attributes) ? 0 : a.length; i < leni;
		i++) h[a[i].name] = a[i].value;
	return h;
}
/*
Return XML first node for xpath query if !stringv
Return XML attribute as text for xpath query if stringv
*/
exports.at_xpath = at_xpath = function(nn, p, stringv) {
	if(/^\/\//.test(p = p || '')) { nn = root(nn); p = '.' + p; } 
	else if(/^\//.test(p)) { nn = root(nn); p = p.substring(1); } 
	var arr; return !p ? nn : (!nn || (arr = xpath(nn, p)).length == 0) ? ''
		: (stringv && /text\(\)$/.test(p)) ? (arr[0].data || '').trim()
		: (stringv && /\@[\w\-]+$/.test(p)) ? (arr[0].value || '').trim() : arr[0];
}
exports.xpath = function(nn, p) { return xpath(nn, p); }
exports.root = function(x) { var y; return ((!x || !(y = x.ownerDocument) || !(y = y.documentElement)) ? '' : y) || x.parentNode || x;}
exports.title_case = function(s) {
    return (s || '').replace(/([A-Z])/g, function($1, $2) { return ' ' + $2;})
    .replace(/\w\S*/g, function(s1){
    	return s1.charAt(0).toUpperCase() + s1.substr(1).toLowerCase();
    }).trim().replace(/\s+/g, ' ');
}
exports.camel = function(title) { return (title || '').replace(/\s/g, ''); }
exports.remove = function(n) {
	if(n && n.parentNode) n.parentNode.removeChild(n);
}

exports.indent = function(s, limit, eol, tab) { // fatal on src=base 64 word document
	if(typeof s != 'string') s = to_s(s);
	eol = eol || '\r\n'; tab = tab || '\t';
	var s1, i, leni, n, arri, j, ind, padding, pad;
	for(i = 0, s1 = '', pad = 0, padding = '', leni = (arri = ('' + s).replace(/\t/g, '').replace(/(>)(<)(\/*)/g,
		'$1'+ eol + '$2$3').split(eol)).length; i < leni;
		i++, pad += ind, s1 += padding + n + eol) {
		ind = 0;
		if((n = arri[i]).match(/.+<\/\w[^>]*>$/)) ind = 0;
		else if(n.match(/^<\/\w/)) { if(pad != 0) pad -= 1; }
		else if(n.match(/^<\w[^>]*[^\/]>.*$/)) ind = 1;
		// gt followed by plus is a formula not ind
		// else if(n.match(/^<\w[^>]*[^\/]>[^\+]*$/)) ind = 1;
		else ind = 0;
		padding = '';
		for(j = 0; j < pad; j++) padding += tab;
    }
	return limit ? s1.substring(0, parseInt('' + limit, 10)) : s1;
}
exports.add_child = function(nn, name, attrs, index) {
	if(!nn || !name) return  '';
	var k, m, n = nn.ownerDocument.createElement(name);
	nn.appendChild(n);
	if(attrs) for(k in attrs) n.setAttribute(k, attrs[k]);
	return n;
}
/* 
Convert XML to String
*/
exports.to_s = to_s = function(s, limit) { return limit ? ('' + s).substring(0, 100) : '' + s };
function rand(len) {
	for(var c = 'b c d f g h j k l m n p qu r s t v w x z ch cr fr nd ng nk nt ph pr rd sh sl sp st th tr tr'.split(' '),
		v = 'a e i o u y y'.split(' '), i = 0, f = true, r = ''; i < (len || 5); f = !f, i++) {
		r += (f ? c[Math.round(Math.random() * (c.length -1))] : v[Math.round(Math.random() * (v.length - 1))])
	}
	return r.substring(0, len);
}

exports.getFormattedDate = getFormattedDate = function(date, format) {
	
	if(moment(date).isValid()) {
		
		return moment(date).format(format);
	} else {
		return date;
	}
}
exports.getFormattedTime = function(time, format) {
	
	date = constants.SAMPLE_DATE+' '+time;
	if(moment(date, 'YYYY-MM-DD HH:mm:ss').isValid()) {
		
		return moment(date).format(format);
	} else {
		return time;
	}
}
exports.getTextDay = function(date, format) {
	
	if(moment(date).isValid()) {
		if(moment(date).isSame(moment(), 'day')) {
			return 'today';
		} else if(moment().endOf('day').diff(moment(date).endOf('day'), 'days') == -1) {
			return 'tomorrow';
		} else {
			return 'on '+moment(date).format(format);
		}
	}
	
	return date;
}
exports.isEmpty = isEmpty = function(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
exports.cloneObject = cloneObject = function(src) {
	return Object.assign({}, src);
}
exports.debug = debug = function(b) {
	var i, leni; for(i = 0, s = [], leni = arguments.length; i < leni; i += 1) {
		s.push('' + arguments[i]);
	}
	console.log(s.join(' '));
	return 1;
}
exports.getActionHandlerUrl = function (input, configs, step) {
	
	if(step === '') {
		console.log("Query step is empty");
	}
	var url;
	if(!configs[constants.EBDSURL]) return false;
	url = configs[constants.EBDSURL] + '/' + '' + at_xpath(step, "query/@url", 1);
	
//	url = configs[constants.EBDSURL]  + at_xpath(step, "query/@url", 1);
	console.log("Is it other than default language:", input[constants.languageCode].toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS);
	console.log("Language specific EBDS URL:", configs[constants.EBDSURL + "_" + input[constants.languageCode].toUpperCase()] );
	if(input && input[constants.languageCode] && 
		input[constants.languageCode].toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS &&
		configs[constants.EBDSURL + "_" +input[constants.languageCode].toUpperCase()] ) {
			url = configs[constants.EBDSURL + "_" + input[constants.languageCode].toUpperCase()] +
			'/' + at_xpath(step, "query/@url", 1);
	}
	console.log("Returning EBDS URL:", url);
	return url;


}
exports.getUniqueId = function() {
	return uniqid();
}
exports.printlog = function(msg, obj) {
  if(process.env.ENABLE_LOG) {
	console.log(msg, obj);
  }
}
exports.print = function(st, err) {
	console.log(st);
	console.error(err);
}
exports.getCurrentDateTime = getCurrentDateTime = function(tzval) {
	tzval = (tzval) ? tzval : constants.DEFAULT_TIMEZONE;
	return moment().tz(tzval).format("YYYY-MM-DD HH:mm:ss");
}
exports.addIntentInWhereQuery = function (query, actionmap, counter) {
	//Search for specific intent in elastic query
	if(actionmap.getAttribute('objType') === 'none' && counter != 6) {
		
		let intent = actionmap.getAttribute('intent');
		if(intent) { 
			intent = intent.toLowerCase();
			query = JSON.parse(query);
			if(query.query.bool.must) {
				query.query.bool.must.push({"term": {"INTENT": intent}});
			}
			query = JSON.stringify(query);
		}
	}
	return query;
}

exports.addUnstructuredIntentInWhereQuery = function (query, input) {
	//Search for specific intent in elastic query
	let intent;
	if((intent = exports.getIntent(input))) {
		query = JSON.parse(query);
		if(query && query.query && query.query.bool && query.query.bool.must) {
			query.query.bool.must.push({"term": {"INTENT": intent}});
		}
		query = JSON.stringify(query);
	}
	return query;
}

exports.removeStructuredIntentFromUnstructuredWhereQuery = function (query, intent) {
	query = JSON.parse(query);
	if(query && query.query && query.query.bool && query.query.bool.must) {
		
		let alternateUnstrtNotEq = {
			"bool": {
				"must_not": {
					"term": {
						"INTENT": intent
					}
				}
			}
		};
		query.query.bool.must.push(alternateUnstrtNotEq);
	}
	query = JSON.stringify(query);
	return query;
}

exports.removeUnstructuredCopiedFromWhereQuery = function (query) {
	query = JSON.parse(query);
	if(query && query.query && query.query.bool && query.query.bool.must) {
		
		let alternateUnstrtNotEq = {
			"bool": {
				"must_not": {
					"term": {
						"COPIED_FROM": constants.COPIED_FROM_DEFAULT
					}
				}
			}
		};
		query.query.bool.must.push(alternateUnstrtNotEq);
	}
	query = JSON.stringify(query);
	return query;
}
exports.addUnstructuredCopiedFromWhereQuery = function (query) {
	query = JSON.parse(query);
	if(query && query.query && query.query.bool && query.query.bool.must) {
		query.query.bool.must.push({"term": {"COPIED_FROM": constants.COPIED_FROM_DEFAULT}});
	}
	query = JSON.stringify(query);
	return query;
}

exports.addIntentInCopiedFromWhereQuery = function (query, actionmap, counter) {
	//Search for specific intent in elastic query
	if(actionmap.getAttribute('objType') === 'none' && counter != 6) {
		
		let intent = actionmap.getAttribute('intent');
		console.log('addIntentInCopiedFromWhereQuery ::intent::' + intent);
		if(intent) { 
			intent = intent.toLowerCase();
			query = JSON.parse(query);
			if(query.query.bool.must) {
				query.query.bool.must.push({
                    "bool": {
                        "should": [
                            {
                                "term": {
                                    "INTENT": intent
                                }
                            },
                            {
                                "term": {
                                    "COPIED_FROM": intent
                                }
                            }
                        ]
                    }
                });
			}
			query = JSON.stringify(query);
		}
	}
	return query;
}

exports.updateContextualQuery = function(context, decision, query, entities) {
	if(context[constants.STEP_COUNTER] && context[constants.STEP_COUNTER] === constants.STEP_PS_PLUS_KS) {
		if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION] && (decision[constants.WCS_ENTITIES].length === 0) && (entities.length === 1)) {
			delete query.query.bool.must.splice(1, 2);
			delete query.query.bool.must[0].bool.should.splice(1, 1);
			let a;
			a = ((a = entities) && (a = a[0])) ? a : '';
			if(a) {
				query = JSON.stringify(query);
				query = query.replace(/(\?PRIMARY_ENTITY)/g, a);
				query = JSON.parse(query);
			}
			context[constants.DYNAMIC_STEP_COUNTER] = constants.STEP_PS_PLUS_KS;
			return query;
		}
	}
	return false;
}
exports.updateQueryContextualQuestion = function(name, decision, query, entities) {
	
	query.query.bool.must.splice(1, 1);
	delete query.query.bool.must[0].bool.should.splice(1, 1);
	let a;
	a = ((a = entities) && (a = a[0])) ? a : '';
	if(a) {
		query = JSON.stringify(query);
		query = query.replace(/(\?PRIMARY_ENTITY)/g, a);
		query = JSON.parse(query);
	}
	return query;

}
exports.updateElasticQuery = function (query, response, input, context) {
	var a, len;
	var decision = response.decision || {};
	var configs = response.configs || {};
	var entities = [];
	if(constants.Entites in decision) {
		entities = decision[constants.Entites].slice();
	}
	 if(input && (constants.apiId in input) && (input[constants.apiId] === constants.API_FOLLOW_UP_QUESTION) && (constants.ACTION_HANDLER in context) && (context[constants.ACTION_HANDLER] == constants.AH_NO_INTENT)) {
		if(constants.nudgeEntities in decision) {
			for(j=0; j<decision[constants.nudgeEntities].length; j++) {
				entities.push(decision[constants.nudgeEntities][j][constants.value]);
			}
		}
	}
	var elen = entities.length;
	query = JSON.parse(query);
	
	//updateLanguageColumns(query, input, configs);
	if(decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_CAMPUS_EVENTS) {
		return JSON.stringify(query);
	}
	let newQuery = exports.updateContextualQuery(context, decision, query, entities);
	if(newQuery) {
		return JSON.stringify(newQuery);
	}

	if(elen === 0) {
		if(decision && (constants.ACTION_HANDLER in decision) && 
				(decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_UNSTRUCTURED || 
					decision[constants.ACTION_HANDLER] == constants.AH_NO_INTENT)) {
				return false;
			}
	}
	if(context && (constants.STEP_COUNTER in context) && context[constants.STEP_COUNTER] === constants.STEP_EXACT_SEARCH) {
		
		if(elen > 1) {
			delete query.query.bool.must.splice(1, 1);
		}
		let primary = cloneObject(query.query.bool.must[0].bool.should[0]);
		let keyword = cloneObject(query.query.bool.must[0].bool.should[1]);
		query.query.bool.must[0].bool.should.splice(0, 2);

		for(i=0; i< elen; i++) {
				
			let p = JSON.stringify(primary);
			p = p.replace(/(\?PRIMARY_ENTITY)/g, entities[i]);
			let k = JSON.stringify(keyword);
			k = k.replace(/(\?KEYWORD)/g, entities[i]);

			if(elen > 1) {
				let stepZero = exports.getStepZeroQuery();
				stepZero = stepZero.replace(/(\?PRIMARY_ENTITY)/g, entities[i])
					.replace(/(\?KEYWORD)/g, entities[i])
					.replace(/(\?SECONDARY_ENTITY)/g, entities[i]);

				query.query.bool.must = [...query.query.bool.must, JSON.parse(stepZero)];
			}
			
			query.query.bool.must[0].bool.should.push(JSON.parse(p));
			query.query.bool.must[0].bool.should.push(JSON.parse(k));
		}
	} else if(context[constants.STEP_COUNTER] && context[constants.STEP_COUNTER] === constants.STEP_PS_PLUS_KS) {
		if((Array.isArray(entities)) && (elen == 1)) {
			delete query.query.bool.must.splice(1, 1);
			a = ((a = entities) && (a = a[0])) ? a : '';
			if(a) {
				query = JSON.stringify(query);
				query = query.replace(/(\?PRIMARY_ENTITY)/g, a).replace(/(\?KEYWORD)/g, a);
				query = JSON.parse(query);
			}			
			//Here step 1 query will be modified as step 2 query
			context[constants.DYNAMIC_STEP_COUNTER] = constants.STEP_PS_PLUS_KS;
		} else if((Array.isArray(entities)) && (elen > 1)) {
			delete query.query.bool.must.splice(2, 1);
			var primary = cloneObject(query.query.bool.must[0].bool.should[0]);
			var keyword = cloneObject(query.query.bool.must[0].bool.should[1]);
			var secondry = cloneObject(query.query.bool.must[1].bool.should[0]);
			
			query.query.bool.must[0].bool.should.splice(0, 2);
			query.query.bool.must[1].bool.should.splice(0, 1);
			for(i=0; i< elen; i++) {
				
				let p = JSON.stringify(primary);
				p = p.replace(/(\?PRIMARY_ENTITY)/g, entities[i]);
				let k = JSON.stringify(keyword);
				k = k.replace(/(\?KEYWORD)/g, entities[i]);
				let s = JSON.stringify(secondry);
				s = s.replace(/(\?SECONDARY_ENTITY)/g, entities[i]);

				query.query.bool.must[0].bool.should.push(JSON.parse(p));
				query.query.bool.must[0].bool.should.push(JSON.parse(k));
				query.query.bool.must[1].bool.should.push(JSON.parse(s));
			}
		}
		
	} else if(context[constants.STEP_COUNTER] && (context[constants.STEP_COUNTER] === constants.STEP_P_PLUS_K || context[constants.STEP_COUNTER] === constants.STEP_P_NOT_S)) {
		if(elen > 0) { 
			var primary = cloneObject(query.query.bool.must[0].bool.should[0]);
			var keyword = cloneObject(query.query.bool.must[0].bool.should[1]);
			
			query.query.bool.must[0].bool.should.splice(0, 2);
			for(i=0; i< elen; i++) {
				let p = JSON.stringify(primary);
				p = p.replace(/(\?PRIMARY_ENTITY)/g, entities[i]);
				let k = JSON.stringify(keyword);
				k = k.replace(/(\?KEYWORD)/g, entities[i]);
				query.query.bool.must[0].bool.should.push(JSON.parse(p));
				query.query.bool.must[0].bool.should.push(JSON.parse(k));
			}
			if(elen === 1 && context[constants.STEP_COUNTER] === constants.STEP_P_NOT_S  && query.query.bool.must 
				&& query.query.bool.must[1]) {
				//commenting this as this is step 2, for 1 entity we have to get record where keyword 
				//or entity name matches but secondary is null -- not sure why i have added
				delete query.query.bool.must.splice(1, 1);
			}
		}
	} else if(context[constants.STEP_COUNTER] && (context[constants.STEP_COUNTER] === constants.STEP_CTX_PS_PLUS_KS)) {
		//If there are context entities need to use in Query.
		if((constants.CONTEXT_ENTITIES in decision) && decision[constants.CONTEXT_ENTITIES].length) {

			var primary = cloneObject(query.query.bool.must[0].bool.should[0]);
			var keyword = cloneObject(query.query.bool.must[0].bool.should[1]);
			var secondry;
			
			if(query.query.bool.must[1])
				secondry = cloneObject(query.query.bool.must[1].bool.should[0]);

			query.query.bool.must[0].bool.should.splice(0, 2);
			
			if(query.query.bool.must[1])
				query.query.bool.must[1].bool.should.splice(0, 1);
			
			var contexts = decision[constants.CONTEXT_ENTITIES];

			var elen = entities.length;
			var clen = contexts.length;
			if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION])
			{
				for(i=0; i< clen; i++) {
					let p = JSON.stringify(primary);
					p = p.replace(/(\?PRIMARY_ENTITY)/g, contexts[i]);
					let k = JSON.stringify(keyword);
					k = k.replace(/(\?KEYWORD)/g, contexts[i]);

					query.query.bool.must[0].bool.should.push(JSON.parse(p));
					query.query.bool.must[0].bool.should.push(JSON.parse(k));
				}
			}
			for(i=0; i< elen; i++) {
				let s = JSON.stringify(secondry);
				s = s.replace(/(\?SECONDARY_ENTITY)/g, entities[i]);
				query.query.bool.must[1].bool.should.push(JSON.parse(s));
			}
		} else {
			//if there is no context entities
			//This should be removed as we dont have STEP_ONLY_S for all the cases.
			// currenlty removing this for Unstructure action handler
			if(decision && (constants.ACTION_HANDLER in decision) && 
				(decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_UNSTRUCTURED || 
					decision[constants.ACTION_HANDLER] == constants.AH_NO_INTENT)) {
				query = false;
			}
			console.log("Console log error:"+context[constants.STEP_COUNTER]+':::'+JSON.stringify(query));
			console.log(context);
			var elen = entities.length;
			if(query && query.query && query.query.bool && query.query.bool.must &&
				query.query.bool.must.length > 1)
			{
				var secondry = cloneObject(query.query.bool.must[1].bool.should[0]);
				query.query.bool.must[1].bool.should.splice(0, 1);
				query.query.bool.must.splice(0, 1);
				for(i=0; i< elen; i++) {
					let s = JSON.stringify(secondry);
					s = s.replace(/(\?SECONDARY_ENTITY)/g, entities[i]);
					query.query.bool.must[0].bool.should.push(JSON.parse(s));
				}
			}
			//Here step 4 query will be modified as step 5 query
			context[constants.DYNAMIC_STEP_COUNTER] = constants.STEP_ONLY_S;

		}
	} else if(context[constants.STEP_COUNTER] && (context[constants.STEP_COUNTER] === constants.STEP_ONLY_S)) {
		//If there is context entities but not matched in DB
		var secondry = cloneObject(query.query.bool.must[0].bool.should[0]);

		var elen = entities.length;

		query.query.bool.must[0].bool.should.splice(0, 1);

		for(i=0; i< elen; i++) {
			let s = JSON.stringify(secondry);
			s = s.replace(/(\?SECONDARY_ENTITY)/g, entities[i]);
			query.query.bool.must[0].bool.should.push(JSON.parse(s));
		}
	} else if(context[constants.STEP_COUNTER] && (context[constants.STEP_COUNTER] === constants.STEP_OTHER_INTENT)) {
		
		var elen = entities.length;

		var primary = cloneObject(query.query.bool.must[0].bool.should[0]);
		var keyword = cloneObject(query.query.bool.must[0].bool.should[1]);

		if(query.query.bool.must[1] && elen > 1) {
			var secondry = cloneObject(query.query.bool.must[1].bool.should[0]);
			query.query.bool.must[1].bool.should.splice(0, 1);
		} else {
			query.query.bool.must.splice(1, 1);
		}

		query.query.bool.must[0].bool.should.splice(0, 2);

		for(i=0; i< elen; i++) {

			let p = JSON.stringify(primary);
			p = p.replace(/(\?PRIMARY_ENTITY)/g, entities[i]);
			let k = JSON.stringify(keyword);
			k = k.replace(/(\?KEYWORD)/g, entities[i]);
			query.query.bool.must[0].bool.should.push(JSON.parse(p));
			query.query.bool.must[0].bool.should.push(JSON.parse(k));

			if(query.query.bool.must[1] && elen > 1) {
				let s = JSON.stringify(secondry);
				s = s.replace(/(\?SECONDARY_ENTITY)/g, entities[i]);
				query.query.bool.must[1].bool.should.push(JSON.parse(s));
			}
		}
	}
	if(query) query = JSON.stringify(query);
	return query;
}
exports.addIntentFilterCondition = function (query, searchAlterantive, input) {
	query = JSON.parse(query)
	
	if((query.query) && (query.query.bool) && (query.query.bool.must) && 
		Array.isArray(query.query.bool.must)) {
		console.log("Condition mateched to add COPIED_FROM clause");
		let alternateUnstrtNotEq = {
			"bool": {
				"must_not": {
					"exists" : {
						"field": "COPIED_FROM"
				    }
				}
			}
		};
		let timingUnstrtNotEq = {
			"bool" : {
				"must_not" : {
					"term" : {
						  "INTENT" : constants.ACTION_HANDLER_TIMING_UNSTRUCTURED
					}
				}
			}
		};

		let LCUnstrtNotEq = {
			"bool" : {
				"must_not" : {
					"term" : {
						  "INTENT" : constants.ACTION_HANDLER_LC_UNSTRUCTURED
					}
				}
			}
		};
		
		if(!searchAlterantive)
		query.query.bool.must.push(alternateUnstrtNotEq);
		query.query.bool.must.push(timingUnstrtNotEq);
		query.query.bool.must.push(LCUnstrtNotEq);
	}
	return JSON.stringify(query);
}

exports.boostQueryForRightIntent = function (query, input) {
	query = JSON.parse(query)
	
	if(input && input[constants.intents] && Array.isArray(input[constants.intents]) &&
		input[constants.intents].length > 0 && input[constants.intents][0] &&
		input[constants.intents][0].intent &&
		(query.query) && (query.query.bool) && (query.query.bool.must) && 
		Array.isArray(query.query.bool.must) && query.query.bool.must.length > 1 && 
		query.query.bool.must[1] && query.query.bool.must[1].bool ) {
			if(query.query.bool.must[1].bool.should ) {
			let intentMatchWithBoost = {
				"match" : {
					"INTENT" : {
						"query" : input[constants.intents][0].intent,
						"operator" : "and",
						"boost" : "10"
					}
				}
			};
			query.query.bool["should"] = intentMatchWithBoost;
			} else {
				let intentMatchWithBoost = {
					"bool": {
						"should": [
							{
								"match" : { 
									"INTENT" : { 
										"query":input[constants.intents][0].intent, 
										"operator":"and", 
										"boost": "10" 
									}
								}
							}
							
						]
					}
				};
				query.query.bool.must.push(intentMatchWithBoost);
			}
			//query.query.bool.push(intentMatchWithBoost);
	}
	return JSON.stringify(query);
}

exports.updateUTCTime = function(input, tzval) {
	console.log("Has literal now: "+input[constants.text].indexOf(constants.now));
	if(input && input[constants.text] && (input[constants.text].indexOf(constants.now) !== -1)) {
		if(entities = input.entities) {
			for(var i=0; i < entities.length; i++) {
				if((entities[i].entity === constants.sys_time) && (entities[i].interpretation[constants.timezone] == constants.GMT)) {
					var d = new Date();
					var date = d.getUTCFullYear()+'-'+(d.getUTCMonth() + 1)+'-'+d.getUTCDate()+' '+entities[i].value;
					console.log("UTC Date & Time: "+ date);
					var m = moment.tz(date, "YYYY-MM-DD HH:mm:ss", "Etc/GMT");
					entities[i].value = m.tz(tzval).format("HH:mm:ss");
					console.log("TZ converted Time: "+tzval+" : "+ entities[i].value);

				}
			}
		}
	}
}
exports.addEntitiesInDecision = function(input, decision) {
	let entities = input.entities || [];
	decision[constants.Entites] = [];
	for(var i=0; i < entities.length; i++) {
		entity = entities[i].entity;				
		if(exports.checkNonSysEntities(entity)) {
			decision[constants.Entites].push(entities[i].value);
		}
	}
}
function updateLanguageColumns(query, input, configs) {
	if(input && input[constants.languageCode] && (input[constants.languageCode].toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS)) {
		if((constants.SUPPORTED_LANGUAGES in configs) && (configs[constants.SUPPORTED_LANGUAGES].indexOf(input.languageCode.toUpperCase()) !== false)) {
			let lanvars = constants.CTX_LAN_VARS.split(',').map((v) => v.toString().trim()+'_'+input[constants.languageCode].toUpperCase());
			if(lanvars)
				for(k in lanvars) query._source.push(lanvars[k]);
		}
	}
}
exports.getOptionArray = function(input, configs) {
	var options = {};
		options[constants.sys_date_count] = 0;
		options[constants.sys_time_count] = 0;
		options[constants.sys_date_one] = null;
		options[constants.sys_date_two] = null;
		options[constants.sys_time_one] = null;
		options[constants.sys_time_two] = null;
		options[constants.sys_person] = null;
		options[constants.locationName] = null;
	
	if((entities=input.entities)) {
		for(var i=0; i < entities.length; i++) {
			if(entities[i].entity == 'sys-date' && !options[constants.sys_date_one]) {
				options[constants.sys_date_one] = entities[i].value;
				options[constants.sys_date_count] = options[constants.sys_date_count] + 1;
			} else if(entities[i].entity == 'sys-date' && !options[constants.sys_date_two]) {
				options[constants.sys_date_two] = entities[i].value;
				options[constants.sys_date_count] = options[constants.sys_date_count] + 1;
			} else if(entities[i].entity == 'sys-time' && !options[constants.sys_time_one]) {
				options[constants.sys_time_one] = entities[i].value;
				options[constants.sys_time_count] ++;
			} else if(entities[i].entity == 'sys-time' && ! options[constants.sys_time_two]) {
				options[constants.sys_time_two] = entities[i].value;
				options[constants.sys_time_count] ++;
			} else if(entities[i].entity == 'sys-person') {
				options[constants.sys_person] = entities[i].value;
			} else if(configs && Array.isArray(configs[constants.NOUN_ENTITY_TYPE]) && (configs[constants.NOUN_ENTITY_TYPE].indexOf(entities[i].entity) !== -1)) {
				options[constants.locationName] = entities[i].value;
			} else if(entities[i].entity == constants.ENTITY_TYPE_BUILDING || entities[i].entity == constants.ENTITY_TYPE_OFFICE || entities[i].entity == constants.ENTITY_TYPE_PARKING || entities[i].entity == constants.ENTITY_TYPE_DINING) {
				options[constants.locationName] = entities[i].value;
			}
		}
	}
	if(options[constants.sys_date_one]) {
		options[constants.sys_date_one] = getFormattedDate(options[constants.sys_date_one], 'YYYY-MM-DD').replace(/\//g, '-');
	}
	if(options[constants.sys_date_two]) {
		options[constants.sys_date_two] = getFormattedDate(options[constants.sys_date_two], 'YYYY-MM-DD').replace(/\//g, '-');
	}
	curr_date_time = getCurrentDateTime(configs[constants.Timezone]);
	console.log("\n\n Important date: "+curr_date_time);
	//curr_date_time = util.format_date(new Date(), 1).replace(/\//g, '-');
		
	options[constants.curr_date] = curr_date_time.split(' ')[0] || '';
	options[constants.curr_time] = curr_date_time.split(' ')[1] || '';
	return options;
}
exports.setSensitiveFlag = function(input, decision, response) {
	if(decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_ASSIGNMENT_EVENTS) {
		response[constants.sensitive] = true;
	} else {
		response[constants.sensitive] = false;
	}
}
exports.isEntityNoun = function(etype, configuration) {

	if(configuration && (constants.NOUN_ENTITY_TYPE in configuration) &&
		(configuration[constants.NOUN_ENTITY_TYPE].indexOf(etype) !== -1)) {
			return true;
	} else {
		return false;
	}
}
function hasEntityType(input, etype) {
	let place_anaphor = false;
	if(input.entities) {
		for(var i=0; i < input.entities.length; i++) {
			entity = input.entities[i].entity;
			if(entity.indexOf(etype) !== -1) {
				place_anaphor = true;
			}
		}
	}
	return place_anaphor;
}
exports.hasGivenEntityType = function(input, etype) {
	let etexist = false;
	if(input.entities) {
		for(var i=0; i < input.entities.length; i++) {
			let entity = input.entities[i].entity;
			if(entity.indexOf(etype) !== -1) {
				etexist = true;
			}
		}
	}
	return etexist;
}

exports.hasNonSysEntities = function(input)
{
	let etexist = false;
	if(input.entities) {
		for(var i=0; i < input.entities.length; i++) {
			entity = input.entities[i].entity;
			if(exports.checkNonSysEntities(entity))
			{
				etexist = true;
				break;
			}
		}
	}
	return etexist;
}

exports.checkNonSysEntities = function(entity) {
	if(entity.indexOf("sys-") === -1 && entity.indexOf(constants.PlaceAnaphor) === -1 && entity.indexOf(constants.PersonalDataAnaphor) === -1 && entity.indexOf(constants.LocationAnaphor) === -1) {
		return true;
	} else {
		return false;
	}
}
exports.getDateRange = function(dateOptions, configs) {
	if(dateOptions[constants.sys_date_count] == 2) {
		return;
	}
	if(constants.academicTerms in configs) {
		let term = getTerm(configs);
		if(!isEmpty(term)) {
			if(dateOptions[constants.sys_date_count] == 0) {
				dateOptions[constants.sys_date_one] = term[constants.START_DATE];
				dateOptions[constants.sys_date_two] = term[constants.END_DATE];
			} else if(dateOptions[constants.sys_date_count] == 1) {
				dateOptions[constants.sys_date_two] = term[constants.END_DATE];
			}
			dateOptions[constants.sys_date_count] = 2;
		}
	}
}
function getTerm(configs) {
	let term = [], k, obj, currentTerm={};
	
	var date = getCurrentDateTime(configs[constants.Timezone]);
	date = date.split(' ')[0];
	if((constants.academicTerms in configs) && (term=configs[constants.academicTerms])) {
		for(k in term) {
			obj = term[k];
			if(obj[constants.START_DATE] && obj[constants.END_DATE]) {
				if(checkDateWithinRange(obj[constants.START_DATE], obj[constants.END_DATE], date)) {
					currentTerm = obj;
					break;
				}
			}
		}
	}
	return currentTerm;
}
function checkDateWithinRange(db_date1, db_date2, date) {
	if(db_date1 <=  date && db_date2 >= date) {
		return true;
	} else {
		return false;
	}
}

exports.getDegreeAuditStatus = function(actionmap, body, input, context) {
	var a;
	if((a=context['results']) && (a=a['objects'])) {
		
		for(var i=0; i < a.length; i++) {
			
			if(a[i]['CTX_RES_DEGREE_AUDIT_RUN_DATE']) {
				var date1 = new Date(a[i]['CTX_RES_DEGREE_AUDIT_RUN_DATE']);
				var date2 = new Date(); 
				a[i]['CTX_RES_DEGREE_AUDIT_RUN_DATE'] = (a[i]['CTX_RES_DEGREE_AUDIT_RUN_DATE']).replace(/\//g, '-');
				var timeDiff = Math.abs(date2.getTime() - date1.getTime());
				var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
				if(diffDays <= 60) {
					a[i]['CTX_RES_DEGREE_AUDIT_STATUS'] = 0;
				} else if(diffDays > 60) {
					a[i]['CTX_RES_DEGREE_AUDIT_STATUS'] = 1;
				} else {
					a[i]['CTX_RES_DEGREE_AUDIT_STATUS'] = 2;
				}
				
				if(i == 0) {
					context['CTX_RES_DEGREE_AUDIT_RUN_DATE'] = format_date(date1).replace(/\//g, '-');
					context['CTX_RES_DEGREE_AUDIT_STATUS'] = a[i]['CTX_RES_DEGREE_AUDIT_STATUS'];
				}
			} else {
				a[i]['CTX_RES_DEGREE_AUDIT_STATUS'] = 2;
				context['CTX_RES_DEGREE_AUDIT_STATUS'] = 2;
			}
		}
	} else if('CTX_RES_DEGREE_AUDIT_RUN_DATE' in context) {
		if(context['CTX_RES_DEGREE_AUDIT_RUN_DATE']) {
			var date1 = new Date(context['CTX_RES_DEGREE_AUDIT_RUN_DATE']);
			var date2 = new Date(); 
			context['CTX_RES_DEGREE_AUDIT_RUN_DATE'] = (context['CTX_RES_DEGREE_AUDIT_RUN_DATE']).replace(/\//g, '-');
			var timeDiff = Math.abs(date2.getTime() - date1.getTime());
			var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
			if(diffDays <= 60) {
				context['CTX_RES_DEGREE_AUDIT_STATUS'] = 0;
			} else if(diffDays > 60) {
				context['CTX_RES_DEGREE_AUDIT_STATUS'] = 1;
			} else {
				context['CTX_RES_DEGREE_AUDIT_STATUS'] = 2;
			}
		} else {
			context['CTX_RES_DEGREE_AUDIT_STATUS'] = 2;
		}
	}
}
exports.getRecordEntities = function(record) {
	let recordentities = [];
	
	if(record[constants.CTX_RES_KEYWORD]) {
		keyword = record[constants.CTX_RES_KEYWORD].toString().split(",");
		recordentities = keyword.map(function (val) { return val.toString().trim(); });
	}
	if(record[constants.CTX_RES_ENTITY_NAME]) {
		//recordentities.push(record[constants.CTX_RES_ENTITY_NAME]);
	}
	if(record[constants.CTX_RES_SECONDARY_ENTITY]) {
		let secondary = [];
		secondary = record[constants.CTX_RES_SECONDARY_ENTITY].toString().split(",");
		secondary = secondary.map(function (val) { return val.toString().trim(); });
		recordentities = recordentities.concat(secondary);
	}
	return recordentities;
}

exports.getRecordEntitiesAsString = function(record) {
	let recordentities = '';
	
	if(record[constants.CTX_RES_KEYWORD]) {
		keyword = record[constants.CTX_RES_KEYWORD].toString().split(",");
		for(key in keyword)
		{
			recordentities += keyword[key];
		}
	}
	if(record[constants.CTX_RES_ENTITY_NAME]) {
		//recordentities.push(record[constants.CTX_RES_ENTITY_NAME]);
	}
	if(record[constants.CTX_RES_SECONDARY_ENTITY]) {
		let secondary = [];
		secondary = record[constants.CTX_RES_SECONDARY_ENTITY].toString().split(",");
		//secondary = secondary.map(function (val) { return val.toString().trim(); });
		for(sec in secondary)
		{
			recordentities += secondary[sec];
		}
		//recordentities = recordentities.concat(secondary);
	}
	return recordentities;
}
exports.executeNextQuery = function(context, decision, input) {
	if(context[constants.CTX_RES_COUNT] && context[constants.CTX_RES_COUNT] > 0) {
		if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
			let hmatch = lib.isValidResult(context, decision, input);
			if(hmatch > 0) {
				
				return false;
			} else {
				if(decision[constants.CONTEXT_ENTITIES].length && input.entities.length) {
					let newentities = [];
					for(var i=0; i < input.entities.length; i++) {
						value = input.entities[i].value;
						//separate context entities from input entities.
						if(decision[constants.CONTEXT_ENTITIES].indexOf(value) === -1) {
							newentities.push(input.entities[i]);			
						}
					}
					input.entities = newentities;
					delete context.results;
					exports.addEntitiesInDecision(input, decision);
				}
				return true;
			}
		} else  {
			if(context[constants.STEP_COUNTER] == constants.STEP_CTX_PS_PLUS_KS) {
				//For query four check if all wcs entities matches
				let hmatch = lib.isValidResult(context, decision, input);
				if((constants.WCS_ENTITIES_RATIO in decision) && (decision[constants.WCS_ENTITIES_RATIO] === 1)) {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		} 
	} else {
		return true;
	}
}

exports.compareDate = function(date1, date2) {
	if(date1 > date2) {
		return 1;
	} else if(date1 == date2) {
		return 0;
	} else {
		return -1;
	}
}

exports.execute = function(url, query, options, counter, handler, ahOrder, objType, searchType) {

	return new Promise((resolve, reject) => {
		var results = {};

		results[constants.ACTION_HANDLER_ORDER] = ahOrder;
		results[constants.STEP_COUNTER] = counter;
		results[constants.TYPE] = handler;
		results[constants.objType] = objType;
		results[constants.searchType] = searchType;
		//results[constants.StatusCode] = constants.ERROR_STATUS_QUERY_FAILED;

		require('request')(options, function(e, res, body) {
			/* Respond with hits when available */
			let a;
			if(e || (body && (a = body['error']))) {
				if(a && a['root_cause'] && ((a = a['root_cause'][0]) && (a = a['reason']))) e = a;
				else if(a && (a = a['reason'])) e = a;
				else if(!e) e = 'Failed';
				e += ' ' + url + ' ' + query;
				results[constants.StatusCode] = constants.ERROR_STATUS_QUERY_FAILED;
				results[constants.body] = e;
				console.error("Query in util.execute failed and the error is::" + e.toString(), a['reason']);
				reject(results);

			} else if(body) {
				try {
					body = JSON.parse(body);
					results[constants.StatusCode] = constants.STATUS_SUCCESS;
					results[constants.body] = body;
					resolve(results);
				} catch(e) {
					results[constants.StatusCode] = constants.ERROR_STATUS_JSON_PARSE_ERROR;
					results[constants.body] = e;
					reject(results);
				}
			} else {
				reject(results);
			}
			
		});
	});
}

exports.arrayContiansObject = function(array, object) {
	if(array && Array.isArray(array) && array.length > 0) {
		for(let i = 0; i < array.length; i++) {
			let arrayObj = array[i];
			let entityName = arrayObj[constants.CTX_RES_ENTITY_NAME];
			let keyword = arrayObj[constants.CTX_RES_KEYWORD];
			let secondaryEntity = arrayObj[constants.CTX_RES_SECONDARY_ENTITY];

			if(entityName === ((object && object[constants.CTX_RES_ENTITY_NAME]) 
					? object[constants.CTX_RES_ENTITY_NAME]: "") && 
				keyword === ((object && object[constants.CTX_RES_KEYWORD]) 
					? object[constants.CTX_RES_KEYWORD]: "") &&
				secondaryEntity === ((object && object[constants.CTX_RES_SECONDARY_ENTITY]) 
					? object[constants.CTX_RES_SECONDARY_ENTITY]: ""))
			{
					return true;
					break;
			}
		}
		return false
	}
}
//
exports.performSorting = function(resp, key, sort) {
	
	if(sort === constants.SORTING_DESCENDING) {
		resp.sort(function(a, b) {
			if(a[key] < b[key])
				return 1;
			else if(a[key] > b[key]) 
				return -1;
			else
				return 0;
		});
	} else {
		resp.sort(function(a, b) {
			if(a[key] < b[key])
				return -1;
			else if(a[key] > b[key]) 
				return 1;
			else
				return 0;
		});
		console.log(resp);
	}
	
}

exports.IncreaseRevalanceForTriggeredIntentObject = function(context, response) {
	let temp, sortingNeeded = false;
	let objects;
	let boostRanking = (response && response.configs && response.configs[constants.BoostIntentRanking]) ? response.configs[constants.BoostIntentRanking] : false;
	let boostRankingForAll = (response && response.configs && response.configs[constants.BoostIntentRankingForAll]) ? response.configs[constants.BoostIntentRankingForAll] : false;
	let triggeredIntent = (response && (temp = response[constants.decision]) && 
		(temp = temp[constants.Intents]) && temp.length > 0) ? temp[0]: undefined;

	if(context && context[constants.results] && 
		(objects = context[constants.results][constants.objects]) && objects.length > 1) {
			
		let relavance, highestRelavance = objects[0][constants.RELAVANCE];
		if(boostRanking || boostRankingForAll) {
			for(let i=0; i< objects.length; i++) {
				//Removed below condition to boost intent for all the intent matching records instead of just highest 
				//ranking record (objects[i][constants.RELAVANCE] === highestRelavance) &&
				if(boostRankingForAll && triggeredIntent && 
					(triggeredIntent === objects[i][constants.CTX_RES_INTENT])) {
						objects[i][constants.RELAVANCE] = (parseFloat(objects[i][constants.RELAVANCE]) + 1).toString();
						if(i != 0)
							sortingNeeded = true;
						} else if(boostRanking && (objects[i][constants.RELAVANCE] === highestRelavance) && triggeredIntent && (triggeredIntent === objects[i][constants.CTX_RES_INTENT])) {
							objects[i][constants.RELAVANCE] = (parseFloat(objects[i][constants.RELAVANCE]) + 1).toString();
							if(i != 0)
								sortingNeeded = true;
				} 
			}
		}

		if(sortingNeeded)
		exports.performSorting(objects, constants.RELAVANCE, constants.SORTING_DESCENDING);
		//objects[0][constants.CTX_RES_INTENT] = 'Alternative';
		//Check if alternative intent is top record then select that otherwise remove all records which has alternate intent
		
		var highRelavance = objects[0][constants.RELAVANCE];
		finalTopRecord = [];highRelavanceRecords = [];
		for(let i=0; i< objects.length; i++) {
			if(objects[0][constants.RELAVANCE] === highRelavance){
				highRelavanceRecords.push(objects[i]);
				objects.splice(0,1);
				i--;
			}
			else if ((constants.CTX_RES_COPIED_FROM in objects[i]) && (objects[i][constants.CTX_RES_COPIED_FROM] == constants.INTENT_ALTERNATIVE)) {
				objects.splice(i, 1);
				i--;
			}
		}
		if(highRelavanceRecords.length > 1){
			for(j=0; j<highRelavanceRecords.length; j++){
				if( highRelavanceRecords[j][constants.CTX_RES_COPIED_FROM] != constants.INTENT_ALTERNATIVE){
						finalTopRecord.push(highRelavanceRecords[j]);
				}
			}
			if(finalTopRecord.length == 0){
				finalTopRecord.push(highRelavanceRecords[0]);
			}	
		} else {
			finalTopRecord.push(highRelavanceRecords[0]);
		}
		objects = finalTopRecord.concat(objects);
		context[constants.results][constants.objects] = objects;	
	}
}

exports.getIntent = function(input) {
	if(input && input[constants.intents] && Array.isArray(input[constants.intents]) &&
		input[constants.intents].length > 0 && input[constants.intents][0] &&
		input[constants.intents][0].intent) {
		return input[constants.intents][0].intent;
	} else {
		return false;
	}
}

exports.updateLatLonInQuery = function(query, input) {
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
	return query;
	
}

exports.getStepZeroQuery = function() {

	let step = {
		"bool": {
			"should": [
				{"match" : { "ENTITY_NAME" : { "query":"?PRIMARY_ENTITY", "operator":"and" }}},
				{"match" : { "KEYWORD" : { "query":"?KEYWORD", "operator":"and"}}},
				{"match" : { "SECONDARY_ENTITY_NAME" : { "query":"?SECONDARY_ENTITY", "operator":"and"}}}		
			]
		}
	}

	return JSON.stringify(step);
}
exports.getReplaceableQuery = function(mainQuery, step, decision) {
    let dataEntities;
    //mainQuery and replaceQuery would be string type
    if(mainQuery && step && decision && (dataEntities=decision[constants.dataEntities]) && 
        Array.isArray(dataEntities) && dataEntities.length > 0)
    {
        let replaceKeyQuery = at_xpath(step, "replace_keyword/text()", 1).replace(/\s+/g, ' ');
        let replaceSecQuery = at_xpath(step, "replace_secondary/text()", 1).replace(/\s+/g, ' ');
        
        let replaceKeyQryStr = '';
        let replaceSecQryStr = '';
        
        if(mainQuery.indexOf(constants.replace_keyword) != -1 || mainQuery.indexOf(constants.replace_secondary) != -1)
        {
            let updateComma = true;
            //consider data record entities for creating nudges
            for(i=0; i < dataEntities.length; i++) {
                if(i == (dataEntities.length - 1))
                {
                    updateComma = false;
                }

                if(replaceKeyQuery)
                {
                    replaceKeyQryStr += replaceKeyQuery.replace(/(\?KEYWORD)/g, dataEntities[i]);
                    if(updateComma)
                        replaceKeyQryStr += ',';
                }

                if(replaceSecQuery)
                {
                    replaceSecQryStr += replaceSecQuery.replace(/(\?SECONDARY)/g, dataEntities[i]);
                    if(updateComma)
                     replaceSecQryStr += ',';
                }
            }

            if(mainQuery.indexOf(constants.replace_keyword) != -1 && replaceKeyQuery && replaceKeyQryStr)
            {
                mainQuery = mainQuery.replace(/(\?replace_keyword)/g, replaceKeyQryStr);
            }

            if(mainQuery.indexOf(constants.replace_secondary) != -1 && replaceSecQuery && replaceSecQryStr)
            {
                mainQuery = mainQuery.replace(/(\?replace_secondary)/g, replaceSecQryStr);
            }
        }
    }

    return mainQuery;
}

exports.addErrorDescription = function(log, err) {
	if(typeof err == 'object') {
		log[constants.ErrorDescription] = err.toString();
	} else {
		log[constants.ErrorDescription] = err;
	}
}

exports.getObjectType = function(actionHandler) {
	let intentList = dtpl.getIntentList();
	let objType = null;
	
	for(let k in intentList) {
		if(intentList[k][constants.handler] === actionHandler) {
			objType = intentList[k][constants.objectType];
			break;
		}
	}
	
	return objType;
}

exports.identifyEntityType = function(type) {
	return ((type.indexOf(constants.nudgeEntities) !== -1) || (type === constants.VIRTUAL_ENTITY_NAME) || (type === constants.CONTEXT_ENTITY_NAME));
			
}