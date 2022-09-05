var constants = require('../constants');
var util = require('../util');
var rc = require('./../resultContainer/resultContainer');
var resultFilter = require('./resultFilter');
exports.selectObject = function(outputs, decision) {
	var result = {}, obj = {};
	var objType = '';
	//get action handlers count
	let len = (Array.isArray(decision[constants.ACTION_HANDLERS])) ? decision[constants.ACTION_HANDLERS].length : 0;
	//If action handlers count is greater than one then sort then result in a same order as action handler kept in array.
	if(len > 1) {
		util.performSorting(outputs, constants.ACTION_HANDLER_ORDER, constants.SORTING_ASCENDING);
	}
	//if action handler count is greater than one then last action handler is always NoIntent action handler. Remove result provided by NoIntent action handler 
	//before starting logic to select response of appropriate action handler.
	if(len > 1 && decision[constants.ACTION_HANDLERS][len-1] === constants.AH_NO_INTENT) {
		decision[constants.ACTION_HANDLERS].splice(-1, 1);
		outputs.forEach((el, i) => {
			if(el && (constants.ACTION_HANDLER in el) && (el[constants.ACTION_HANDLER] == constants.AH_NO_INTENT)) {
				//Remove result provided by NoIntent action handler and stored in decision array which will be later used for nudges.
				decision[constants.NUDGE_OPTIONS] = outputs.splice(i, 1);
			}
		});
	}
	result[constants.StatusCode] = constants.STATUS_SUCCESS;
	if(decision[constants.ACTION_HANDLERS].length && outputs.length) {
		decision[constants.ACTION_HANDLERS].forEach((element) => {
			outputs.forEach((el) => {
				if(el && (constants.StatusCode in el) && (el[constants.StatusCode] !== constants.STATUS_SUCCESS)) {
					result[constants.StatusCode] = el[constants.StatusCode];
				}
				//check if result count is greater than one in each result in same order as action handlers there in array and select the the result.
				if(el && el[constants.ACTION_HANDLER] && (el[constants.ACTION_HANDLER] === element)) {
					if(util.isEmpty(obj) && (constants.output in el) && (p=el[constants.output]) && (constants.CTX_RES_COUNT in p) && (p[constants.CTX_RES_COUNT] > 0)) {
						objType = el[constants.objType] || 1;
						obj = el[constants.output];
						decision[constants.ACTION_HANDLER] = el[constants.ACTION_HANDLER] || decision[constants.ACTION_HANDLER] || '';
					}
				}
			});
		})
	}
	if(util.isEmpty(obj)) {
		if(Array.isArray(outputs)) {
			len = outputs.length || 0;
			if(len > 0) {
				len = len - 1;
				obj = ((p=outputs[len]) && (p[constants.output])) ? (p[constants.output]) : {};
				objType = p[constants.objType] || 1;
				decision[constants.ACTION_HANDLER] = (p[constants.ACTION_HANDLER]) ? p[constants.ACTION_HANDLER] : decision[constants.ACTION_HANDLER];
			}
		}
	}
	result[constants.output] = getNoIntentResult(objType, obj, decision);
	try {
		if(!util.isEmpty(obj)) {
			var tmp;
			if(obj && obj[constants.results] && (tmp = obj[constants.results][constants.objects]) && tmp.length > 0) {
				if((constants.CTX_RES_INTENT in tmp[0]) && (tmp[0][constants.CTX_RES_INTENT] == constants.INTENT_ALTERNATIVE)) {
					decision[constants.NUDGE_OPTIONS] = [];
				}
			}
		}
	} catch(e) {
		console.log(e);
	}
	return result;
}
function getNoIntentResult(objType, obj, decision) {
	let a = {}, update=false;
	if(objType == constants.ObjectTypeNone) {
		if(!(constants.output in obj) && !(constants.CTX_RES_COUNT in obj)) {
			update = true;
		} else if((constants.output in obj) && (constants.CTX_RES_COUNT in obj[constants.output]) && (obj[constants.output][constants.CTX_RES_COUNT] == "0")) {
			update = true;
		} else if((constants.CTX_RES_COUNT in obj) && (obj[constants.CTX_RES_COUNT] == "0")) {
			update = true;
		}
	}
	if(update) {
		let a = ((constants.NUDGE_OPTIONS in decision) && decision[constants.NUDGE_OPTIONS]) ? decision[constants.NUDGE_OPTIONS][0] : {}; 
		if(!util.isEmpty(a)  && (constants.CTX_RES_COUNT in a[constants.output]) && (a[constants.output][constants.CTX_RES_COUNT] != "0")) {
			obj = a[constants.output];
			decision[constants.ACTION_HANDLER] = a[constants.ACTION_HANDLER];
			delete decision[constants.NUDGE_OPTIONS];
		}
		
	}
	return obj;
}
function getUniqueResulsOfStep(entityNameArray, body, noIntentResultCount)
{
	let hits, a;
	leni = (body && (body = body.body) && (hits = body.hits) && (hits.total.value || hits.total)) ? (hits.total.value || hits.total) : 0;

	if(leni > 0)
	{
		hits = hits.hits;		
		for(i = 0; i < hits.length; i++) {
			/*if(entityNameArray.length >= 5)
			{
				hits.splice(i);
				break;
			}*/
			
			a = hits[i]._source;

			let intentName = hits[i]._index;
			if(intentName == constants.UNSTRUCTURED_INTENT)
				intentName = a["INTENT"];

			if(entityNameArray.indexOf(intentName + a[constants.PRIMARY_ENTITY_NAME]) === -1)
				entityNameArray.push(intentName + a[constants.PRIMARY_ENTITY_NAME]);
			else
			{
				hits.splice(i, 1);
				i--;
			}
		}
	}
}

exports.selectNoIntentResponse = function(result, actionmap, context, response, input) {
	var noIntentResult = [];
	//select result by lowest step from structured and unstructured array
	if(Array.isArray(result)) {
		
		for(var i=0; i< result.length; i++) {
			util.performSorting(result[i], constants.STEP_COUNTER, constants.SORTING_ASCENDING);
			let res = result[i];
			let hits, leni;
			let entityNameArray = [];
			let noIntentResultCount = 0;
			for(var j=0; j<res.length; j++) {
				let body = res[j];

				getUniqueResulsOfStep(entityNameArray, body);

				leni = (body && (body = body.body) && (hits = body.hits) && (hits.hits.length)) ? hits.hits.length : 0;
				noIntentResultCount += leni;
				if(leni > 0 ) {
					noIntentResult.push(res[j]);
					//commenting this break and adding all the results.
					// if we have a question like tell me about business seminars.
					// we have one record with only keyword for business seminars in description.
					// we have few more records with keyword business seminars with one seconadry value
					// In Step 1 here we would get one result which is exactly the same result we 
					// would get it from with intent query
					// we break here with no nudges
					/*if(noIntentResultCount >= 5)
						break;*/
				}
				
				
			}
        }
	}
	//map to ctx variables and merge the structure and unstructure results
	if(Array.isArray(noIntentResult) && noIntentResult.length) {
		for(k=0; k < noIntentResult.length; k++) {
			let body = (noIntentResult[k] && noIntentResult[k].body) ? noIntentResult[k].body : {};
			body = rc.ParseResponse(actionmap, body, noIntentResult[k][constants.STEP_COUNTER], noIntentResult[k].TYPE);
			if(body && (body[constants.CTX_RES_COUNT] > 0)) {
				if((constants.results in context) && (constants.objects in context[constants.results]) && context[constants.results][constants.objects]) {
					if((constants.results in body) && body[constants.results] && body[constants.results][constants.objects]) {
					 let a = body[constants.results][constants.objects];
						for(var l=0; l < a.length; l++) {
							context[constants.results][constants.objects].push(a[l]);
						}
						if(constants.CTX_RES_COUNT in context) {
							context[constants.CTX_RES_COUNT] = context[constants.results][constants.objects].length;
						}
						if((constants.STEP_COUNTER in context) && (noIntentResult[k][constants.STEP_COUNTER] < context[constants.STEP_COUNTER])) {
							context[constants.STEP_COUNTER] = noIntentResult[k][constants.STEP_COUNTER];
						}
						//sort results by step counter
						util.performSorting(context[constants.results][constants.objects], constants.CTX_RES_STEP_COUNTER, constants.SORTING_ASCENDING);
					}
				} else {
					if(body) {
						for(var d in body) {
							context[d] = body[d];
						}
					}
					context[constants.STEP_COUNTER] = noIntentResult[k][constants.STEP_COUNTER];
					context[constants.TYPE] = noIntentResult[k][constants.TYPE];
					context[constants.StatusCode] = noIntentResult[k][constants.StatusCode];
				}
			}
		}
	}

	resultFilter.addRelavanceAndSort(context, 
		response[constants.decision], input);

	if(context && context.results && context.results.objects	)
		util.performSorting(context.results.objects, constants.RELAVANCE, constants.SORTING_DESCENDING);
	console.log("value of context::\n" + JSON.stringify(context));
}

exports.selectStepResponse = function(result, actionmap, context) {
	var stepResult = [];
	//select result by lowest step from structured and unstructured array
	if(Array.isArray(result)) {
		for(var i=0; i< result.length; i++) {
			util.performSorting(result[i], constants.STEP_COUNTER, constants.SORTING_ASCENDING);
			let res = result[i];
			let hits, leni;
			for(var j=0; j<res.length; j++) {
                let body = res[j];
				leni = (body && (body = body.body) && (hits = body.hits) && (hits.total.value || hits.total)) ? (hits.total.value || hits.total) : 0;
				if(leni > 0) {
					stepResult.push(res[j]);
					break;
				}
			}
        }
	}
}

exports.selectQuestionEntitiesFromElasticResponse = function(body, decision) {
		
	let questionEntitiesResults = [];
		leni = (body && (hits = body.hits) && (hits.total.value || hits.total)) ? (hits.total.value || hits.total): 0;
		if(leni != 0)
		{
			hits = hits.hits;		
			for(i = 0; i < hits.length; i++) {
				a = hits[i]._source;
				let keyword = a[constants.KEYWORD];
				let seconadryEntities = a[constants.SECONDARY_ENTITY];
				var allentities = decision[constants.Entites];
				let dataMatchEntities = []
				let keywordExists = true;
				let secondaryExists = true;

				if(keyword && (allentities && allentities.length))
				{
					let keywordArray = keyword.split(",");

					keywordArray.forEach(function(entity, index){
						console.log("Index in keyword::" + index);
						console.log("allentities.indexOf(entity)::" + allentities.indexOf(entity));
						if(allentities.indexOf(entity.trim()) == -1)
						{
							keywordExists = false;
							return;
						}
						else{
							dataMatchEntities.push(entity.trim());
						}
					});
				}

				if(seconadryEntities && (allentities && allentities.length))
				{
					let secondaryEntitiesArray = seconadryEntities.split(",");
					secondaryEntitiesArray.forEach(function(entity, index){
						console.log("Index in secondary entities::" + index);
						if(allentities.indexOf(entity.trim()) == -1)
						{
							secondaryExists = false;
							return;
						}
						else{
							dataMatchEntities.push(entity.trim());
						}
					});
				}

				if(keywordExists && secondaryExists && (dataMatchEntities && allentities
					 && dataMatchEntities.length == allentities.length)) {
					questionEntitiesResults.push(a);
					hits = questionEntitiesResults;
				}
				else
				{
					hits.splice(i, 1);
					i--;
				}
			}
		}

	console.log("questionEntitiesResults:::" + JSON.stringify(questionEntitiesResults));
}

exports.hasIntentMatch = function(input, response, decision) {
	var a;
	decision[constants.ACROSS_INTENT] = true;
	let objects = ((a=response[constants.results]) && (a=a[constants.objects])) ? a : ''; 
	let objectType = ((a=response[constants.results]) && (a=a[constants.objType])) ? a : '';
	let intent = ((a=input[constants.intents]) && (a=a[0]) && (a=a[constants.intent])) ? a : '';
	if(objects && objectType && intent) {
		for(let i=0; i<objects.length; i++) {
			if(objects[i] && (objectType == constants.followUp)) {
				if(objects[i][constants.key].startsWith(intent)) {
					decision[constants.ACROSS_INTENT] = false;
					break;
				}
			} else if(objects[i]) {
				if(objects[i][constants.CTX_RES_INTENT] === intent) {
					decision[constants.ACROSS_INTENT] = false;
					break;
				}
			}
		}
	}
}