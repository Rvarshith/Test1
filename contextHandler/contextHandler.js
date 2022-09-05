var constants = require('./../constants.js');
var util = require('./../util.js');
var query = require('./../query.js');
const watson = require('./../yana-wcs/watson');
const dtpl = require('./../load-conf-tpl');

//update intent & entities if it is follow-up question
exports.updateFollowupQuestion = function(input, decision) {
	if(input && (constants.apiId in input) && (input[constants.apiId] === constants.API_FOLLOW_UP_QUESTION)) {
		/*if(hasIntentInContext(input)) {
			addIntentInInput(input);
		}*/
		decision[constants.nudgeEntities] = [];
		if(input[constants.text]) {
			let temp = input[constants.text].split('|');
			if(temp[0] && temp[0].indexOf(":")) {
				let temp2 = temp[0].split(':');
				if(temp2[0]) {
					input.intents = [];
					input.intents.push({intent:temp2[0]});
				}
				if(temp2[1]) {
					input.entities = [];
					let virtual = {};
					virtual[constants.entity] = constants.VIRTUAL_ENTITY_NAME;
					virtual[constants.value] = temp2[1] ;
					input.entities.push(virtual);
				}
			}
			if(temp[1]) {
				let temp2 = temp[1].split(',');
				for(i=0; i<temp2.length; i++) {
					let virtual = {};
					virtual[constants.entity] = constants.nudgeEntities+i;
					virtual[constants.value] = temp2[i] ;
					decision[constants.nudgeEntities].push(virtual);
				}
			}
		}	
	}
}
//update the context	
exports.updateContext = async function(input, decision, configuration, cbk) {
		
	try {
		exports.updateFollowupQuestion(input, decision);

		decision[constants.setIntentIdentification] = true;
		decision[constants.CONTEXTUAL_QUESTION] = false;
		decision[constants.CONTEXT_ENTITIES] = [];
		decision[constants.CONTEXT_ENTITIES_OBJECT] = {};
		decision[constants.WCS_ENTITIES] = [];
		
		decision[constants.WCS_INTENT] = (input && input[constants.intents]) ? input[constants.intents] : [];
		decision[constants.apiId] = (input && (constants.apiId in input) && input[constants.apiId]) ? input[constants.apiId] : constants.API_CONVERSATION;
		
		updateLatLon(input);
		exports.updateWCSEntities(input, decision);

		let hasNonSysEntities = checkForNonSysEntities(input);

		if((!(constants.intents in input) || (input[constants.intents].length === 0)) && hasNonSysEntities) {
			//How freshman can apply for admission?
			//How about it for veteran? - In this case WCS may not give intent so we will take from prev intent from context

			if(hasIntentInContext(input) && configuration[constants.CONSIDER_INTENT_FROM_CONTEXT]) {
				if(hasPrimarySecondaryIntent(input)) {
					decision[constants.intentsIdentified] = input.context[constants.intentsIdentified];
					decision[constants.setIntentIdentification] = false;
				}
				addIntentInInput(input);
			}
		}

		if(!hasNonSysEntities && (!(constants.intents in input) || (input[constants.intents].length === 0))) {
			//If No Intent & No NonSys Entities then return - about it
			//input[constants.entities] = [];
			return cbk('');
		}
		
		exports.updateContextEntities(input, decision);

		if(hasPlaceAnaphor(input) && hasEntityInContext(input)) {
			
			decision[constants.CONTEXTUAL_QUESTION] = true;	
			replaceAnaphorWithContextEntity(input, decision);
			
		}	
		//await updateEntityTypes(input, decision, configuration);
		return cbk('');
	} catch(e) {
		util.print("updateContext Erorr", e);
		return cbk(e);
	}
}

async function updateEntityTypes(input, decision, configuration) {
	if(decision && (!(constants.CONTEXTUAL_QUESTION in decision) || !decision[constants.CONTEXTUAL_QUESTION])) {
		return ; //if it is not a contextual question then no need to update entity type
	}
	let recordEntities = [];
	let entity, replace = [];
	
	for(var i=0; i < input.entities.length; i++) {
		entity = input.entities[i].entity;
		if(util.identifyEntityType(entity)) {
			recordEntities.push(input.entities[i].value);	
			replace.push(i);
		}
	}
	
	try {
		if(recordEntities.length) {
			let results = await watson.getEntities(recordEntities, configuration);
			if(results && results.code === constants.STATUS_SUCCESS &&
				 results.result && results.result.entities.length) {
				
				let resentities = results.result.entities;
				for(let i=0; i<recordEntities.length; i++) {
					input.entities[replace[i]].entity = getEntityTypeByValue(resentities, recordEntities[i]);
				}
			}
		}
	} catch(err) {
		console.log(err);
	}
	
}
function hasPrimarySecondaryIntent(input) {
	let a;
	return ((a=input) && (a=a.context) && (a=a[constants.intentsIdentified]) && (a=a[constants.primary]) && (a=a[constants.intent]));
}
function getEntityTypeByValue(resentities, value) {
	for(let i=0; i<resentities.length; i++) {
		if(value === resentities[i].value) {
			return resentities[i].entity;
		}
	}
}
//Adding context entities in decision
exports.updateContextEntities = function(input, decision) {
	let ce = getContextEntities(input);
	for(i=0; i<ce.length; i++) {
		if(util.checkNonSysEntities(ce[i].entity)) {
			decision[constants.CONTEXT_ENTITIES].push(ce[i].value);
			decision[constants.CONTEXT_ENTITIES_OBJECT][ce[i].entity] = ce[i].value;
		}
	}
}
//Adding WCS entities in decision
exports.updateWCSEntities = function(input, decision) {
	let a;
	let wcse = ( (a = input) && (a = a[constants.entities])) ? a : [];
	for(i=0; i<wcse.length; i++) {
		if(util.checkNonSysEntities(wcse[i].entity)) {
			decision[constants.WCS_ENTITIES].push(wcse[i].value);
		}
	}
}
//Replace planceanaphor with context entities
function replaceAnaphorWithContextEntity(input, decision) {
	let ctxentities = getContextEntities(input);

	if(!Array.isArray(input.entities)) {
		input.entities = [];
	}
	if(ctxentities.length > 0) {
		
		//If we don't get entity from wcs for contextual question then just use TOP entity from context
		if(!checkForNonSysEntities(input)) {
			let usedTopEntity = false;
			/*for(var i=0; i < ctxentities.length; i++) {
				entity = ctxentities[i].entity;
				if(entity === constants.TOP_ENTITY_NAME) {
					input.entities.push(ctxentities[i]);	
					usedTopEntity = true;
				}
			} Commented this as we are not maintaining same ENTITY Name across intent and also we are searching
			through unstructured data for contextual question as well, so using top entity we can not search 
			top entity of structured data in unstructured records -  Discussed this with Latha*/
			if(!usedTopEntity) {
				for(var i=0; i < input.entities.length; i++) {
					entity = input.entities[i].entity;
					if(entity.indexOf(constants.PlaceAnaphor) === -1) {
						ctxentities.push(input.entities[i]);			
					}
				}
				input.entities = ctxentities;
			}
		} else {
			for(var i=0; i < input.entities.length; i++) {
				entity = input.entities[i].entity;
				if(entity.indexOf(constants.PlaceAnaphor) === -1) {
					ctxentities.push(input.entities[i]);			
				}
			}
			input.entities = ctxentities;
		}
	}
}

//Clear context
function clearContext(input) {
	if((a = input.context) && (a = a[constants.CONTEXT_ENTITY_LIST])) delete input.context[constants.CONTEXT_ENTITY_LIST];
	if((a = input.context) && (a = a[constants.CONTEXT_INTENT_LIST])) delete input.context[constants.CONTEXT_INTENT_LIST];
	if((a = input.context) && (a = a.intents)) delete input.context.intents;
	if((a = input.context) && (a = a.entities)) delete input.context.entities;
	if((a = input.context) && (a = a[constants.TOP_ENTITY_NAME])) delete input.context[constants.TOP_ENTITY_NAME];
}
exports.clearContext = clearContext;

//Check if placeanaphor exist
function hasPlaceAnaphor(input) {
	let place_anaphor = false;
	if(input.entities) {
		for(var i=0; i < input.entities.length; i++) {
			entity = input.entities[i].entity;
			if(entity.indexOf(constants.PlaceAnaphor) !== -1) {
				place_anaphor = true;
			}
		}
	}
	return place_anaphor;
}
//Get place anaphor value which may be it, them, this
function getPlaceAnaphorValue(input) {
	let place_anaphor_value = "";
	if(input.entities) {
		for(var i=0; i < input.entities.length; i++) {
			entity = input.entities[i].entity;
			value = input.entities[i].value;
			if(entity.indexOf(constants.PlaceAnaphor) !== -1) {
				place_anaphor_value = value;
			}
		}
	}
	return place_anaphor_value;
}

function intentInList(input, ipintent) {
	let a = '';
	let ctxintents = ( (a = input) && (a = a.context) && (a = a[constants.CONTEXT_INTENT_LIST])) ? a : '';
	
	if(ctxintents.indexOf(ipintent) !== -1) {
		return true;
	} else {
		return false;
	}
}
//Return context entities
function getContextEntities(input) {
	let a = [];
	return ( (a = input) && (a = a.context) && (a = a[constants.entities])) ? a : [];
	
	
}
//In case there is no intent in input then add intent from context provided all condition satisfied.
function addIntentInInput(input) {
	let a = '';
	let ctxintent = ((a = input) && (a = a.context) && (a = a.intents)) ? a : '';
	if(ctxintent) input.intents = ctxintent;
}

//Check whether context hase intent
function hasIntentInContext(input) {
	let a = '';
	let ctxintent = ( (a = input) && (a = a.context) && (a = a.intents) && (a = a[0])) ? true:false;
	return ctxintent;
}
//Check whether context has any entities
function hasEntityInContext(input) {
	let a = '';
	let ctxentity = ( (a = input) && (a = a.context) && (a = a.entities) && (a = a[0]) && (a = a.value)) ? a : false;
	if(ctxentity) {
		return true;
	} else {
		return false;
	}
}

//This function help to get intent & entity bits
function getIntentEntityBits(input) {
	
	let intent_count = (input.intents) ? input.intents.length : 0;
	let switchcase = '';
	let entity_count = 0;
	var types = {};
	if(input.entities) {
			
		entities = input.entities;	
		for(var i=0; i < entities.length; i++) {
			entity = entities[i].entity;				
			if(entity.indexOf("sys-") === -1 && entity.indexOf(constants.PlaceAnaphor) === -1 && !types[entity] &&  entity.indexOf(constants.PersonalDataAnaphor) === -1) {
				entity_count++;
				types[entity] = entities[i].value;
			}
		}
	}
			
	if(intent_count > 1) {
		switchcase = '1';
	} else {
		switchcase = intent_count;
	}
	
	if(entity_count > 1) {
		switchcase = switchcase + 'n';
	} else {
		switchcase = switchcase + '' + entity_count;
	}
		
	return switchcase;
}

//Take lat & lon from context and override values in addtnlInputParams
function updateLatLon(input, response) {

	if(util.hasGivenEntityType(input, constants.LocationAnaphor)) {
		if(input && input.context && (a=input.context[constants.lat_lon]) && a[constants.latitude] && a[constants.longitude]) {
			if(input && (c = input[constants.addtnlInputParams])) {
				c[constants.latitude] = a[constants.latitude];
				c[constants.longitude] = a[constants.longitude];
			} else {
				var c={};
				input[constants.addtnlInputParams] = c;
				c[constants.latitude] = a[constants.latitude];
				c[constants.longitude] = a[constants.longitude];
			}
		}
	}
}
function updateContextLatLon(output, response) {
	if((a=output) && a[constants.CTX_RES_LATITUDE] && a[constants.CTX_RES_LONGITUDE]) {
		response.context[constants.lat_lon] = {};
		response.context[constants.lat_lon][constants.latitude] = a[constants.CTX_RES_LATITUDE];
		response.context[constants.lat_lon][constants.longitude] = a[constants.CTX_RES_LONGITUDE];
	}
}
exports.setContext = function(response, input, decision, output) {
	try {
		var centities = getContextEntities(input);
		if(decision[constants.CLEAR_CONTEXT]) {
			clearContext(input);
		}
		if(decision[constants.SET_CONTEXT]) {
			if(!response.context) {
				response.context = {};
			}
			
			let recordentities = util.getRecordEntities(output);
			setResponseEntities(recordentities, response);

			let recordIntent1 = output[constants.CTX_RES_INTENT];
			let recordIntent2 = output[constants.CTX_RES_SECONDARY_INTENT];
			response.context[constants.entities] = [];
			response.context[constants.intents] = [];
			if(recordIntent1) {
				let intent = {};
				intent[constants.intent] = recordIntent1;
				response.context[constants.intents].push(intent);
			}
			if(recordIntent2) {
				let intent = {};
				intent[constants.intent] = recordIntent2;
				response.context[constants.intents].push(intent);
			}
			setIdentifiedIntent(recordIntent1, recordIntent2, decision, response);
			if(!recordIntent1 && !recordIntent2) {
				if(input && Array.isArray(input[constants.intents]) && (input[constants.intents].length > constants.MAX_INTENT_IN_CONTEXT)) {
					response.context[constants.intents] = input[constants.intents].splice(constants.MAX_INTENT_IN_CONTEXT);
				} else {
					response.context[constants.intents] = input[constants.intents] || [];
				}
			}
			

			let entities = JSON.stringify(input.entities) || [];
			if(!Array.isArray(entities)) {
				entities = JSON.parse(entities);
			}
			let etype = '';
			let evalue = '';
			//If it is contextual question then add context entities in new context of response.
			//if Search result is because of contextual entity even if it is not a contextual question then also 
			//we need to add contextual entities in new context of response
			//if((output[constants.STEP_COUNTER] == constants.STEP_CTX_PS_PLUS_KS) || ((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION])) {
			/*if( ((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION])) {
				if(Array.isArray(centities) && centities.length) {
					for(i=0; i< centities.length; i++) {
						entities.push(centities[i]);
					}
				}
			} else //Commented this as we are already added context entities in input entities
			*/if(input && input.apiId === constants.API_FOLLOW_UP_QUESTION) {
				if(decision[constants.nudgeEntities] && Array.isArray(decision[constants.nudgeEntities]) && 
					decision[constants.nudgeEntities].length) {
					for(i=0; i< decision[constants.nudgeEntities].length; i++) {
						entities.push(decision[constants.nudgeEntities][i]);
					}
				}
			}

			for(i=0; i< entities.length; i++) {
				etype = entities[i].entity;
				evalue = entities[i].value;
				if((constants.TOP_ENTITY_NAME in decision) && (decision[constants.TOP_ENTITY_NAME])) {
					if(etype === constants.TOP_ENTITY_NAME) continue;
				}
				if(util.checkNonSysEntities(etype) && recordentities && recordentities.length && ((index = recordentities.indexOf(evalue)) !== -1)) {
					response.context[constants.entities].push(entities[i]);
					recordentities.splice(index, 1);
				}
			}
			if((constants.TOP_ENTITY_NAME in decision) && (decision[constants.TOP_ENTITY_NAME])) {
				let top = {};
				top[constants.entity] = constants.TOP_ENTITY_NAME;
				top[constants.value] = decision[constants.TOP_ENTITY_NAME];
				response.context[constants.entities].push(top);
			}
			
			updateContextLatLon(output, response);
		}

	} catch(e) {
		util.print("\n set Context Error ", e);
	}
}
function checkForNonSysEntities(input) {
	let nosys = false;
	if(input && input.entities && input.entities.length > 0){
		
		for(var i=0; i < input.entities.length; i++) {
			entity = input.entities[i].entity;
			if(util.checkNonSysEntities(entity)) {
				nosys = true;	
			}
		}

	}
	
	return nosys;
}
function setResponseEntities(recordentities, response) {
	if(!Array.isArray(recordentities) || !recordentities.length) {
		return;
	}
	if(!response[constants.entity]) {
		response[constants.entity] = recordentities.join(',');
	} else {
		for(let i=0; i<recordentities.length; i++) {
			if(response[constants.entity].indexOf(recordentities[i]) === -1) {
				response[constants.entity] = response[constants.entity] + ',' + recordentities[i];
			}
		}
	}
}
function setIdentifiedIntent(recordIntent1, recordIntent2, decision, response) {

	let identifiedIntent = (decision && decision[constants.PRIMARY_INTENT] && decision[constants.PRIMARY_INTENT][constants.INTENT]) ? decision[constants.PRIMARY_INTENT][constants.INTENT] : "";
	
	if(recordIntent1 && (identifiedIntent !== recordIntent1)) {
		let a, p = {}, intentsIdentified = {};
		intentsIdentified[constants.primary] = p;

		p[constants.intent] = recordIntent1;
		p[constants.handler] = decision[constants.ACTION_HANDLER] ? decision[constants.ACTION_HANDLER] : "";
		p[constants.objectType] = decision[constants.OBJECT_TYPE] ? decision[constants.OBJECT_TYPE] : "";
		if(p[constants.objectType] === constants.ObjectTypeNone) {
			p[constants.type] = constants.INTENT_TYPE_UNSTRUCTURED;
		} else {
			p[constants.type] = constants.INTENT_TYPE_STRUCTURED;
		}
		if(recordIntent2) {
			let s = {};
			let intentList = dtpl.getIntentList();
			let object = intentList[recordIntent2];

			s[constants.intent] = recordIntent2;
			s[constants.handler] = decision[constants.ACTION_HANDLER] ? decision[constants.ACTION_HANDLER] : "";
			if(util.isEmpty(object)) {
				s[constants.type] = constants.INTENT_TYPE_UNSTRUCTURED;
				s[constants.objectType] = constants.ObjectTypeNone;

			} else {
				s[constants.type] = object[constants.type];
				s[constants.objectType] = object[constants.objectType];
			}
			intentsIdentified[constants.secondary] = s;
		}
		response.context[constants.intentsIdentified] = intentsIdentified;
	} else {
		response.context[constants.intentsIdentified] = decision[constants.intentsIdentified];
	}
}