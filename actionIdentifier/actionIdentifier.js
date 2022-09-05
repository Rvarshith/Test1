var constants = require('./../constants');
var contextManager = require('./../contextManager.js');
var util = require('./../util');

exports.run = async function(input, response) {
	
	var decision = response.decision;
	decision[constants.ACTION_HANDLER] = '';
	decision[constants.ACTION_HANDLERS] = [];
	var configuration = response.configs;
	decision[constants.Entites] = [];
	decision[constants.Intents] = [];
	decision[constants.EntitesObject] = {};
	
	try {
		var entity_count = 0;
		if(input.entities) {
			
			entities = input.entities;
			if( util.hasNonSysEntities(input) && input && input.intents && input.intents.length > 0 && 
				input.intents[0].intent && 
				input.intents[0].intent != constants.GREETING_INTENT &&
				input.intents[0].intent != constants.THANKS_INTENT &&
				input.intents[0].intent != constants.GOOD_BYE_INTENT &&
				input.intents[0].intent != constants.PROMPT_A_QUESTION_INTENT &&
				input.intents[0].intent != constants.PROMPT_A_SYMPATHY_INTENT &&
				input.intents[0].intent != constants.REPLY_A_STATUS_INTENT &&
				configuration[constants.ContextManagerURL])
			{
				let finalEntities = entities;
				await contextManager.addContextEntities(finalEntities, input, configuration);
				entities = finalEntities;
			}
			for(var i=0; i < entities.length; i++) {
				entity = entities[i].entity;				
				if(util.checkNonSysEntities(entity)) {
					entity_count++;
					decision[constants.Entites].push(entities[i].value);
					
					if(!decision[constants.ENTITY_VALUE]) {
						decision[constants.ENTITY_VALUE] = entities[i].value;
					}
				}
				if(!decision[constants.EntitesObject][entity]) {
					decision[constants.EntitesObject][entity] = entities[i].value;
				}
			}
		}
		getActionHandler(decision, input, entity_count, configuration);		
		if(entity_count > 1) {
			decision[constants.ENTITY_LIST] = decision[constants.Entites].toString();
		}
		
		response[constants.decision] = decision;

	} catch(e) {
		console.log(e);
	}
}
function hasPersonalDataAnaphor(input) {
	let place_anaphor = false;
	if(input.entities) {
		for(var i=0; i < entities.length; i++) {
			entity = entities[i].entity;
			if(entity.indexOf(constants.PersonalDataAnaphor) !== -1) {
				place_anaphor = true;
			}
		}
	}
	return place_anaphor;
}
function hasNounEntity(eObject) {
	let noun = false;
	if(!util.isEmpty(eObject)) {
		for(k in eObject) {
			if(util.isEntityNoun(k)) {
				noun = true;
				break;
			}
		}
	}
	return noun;
}
function otherEntity(eObject, type) {
	let othere = false;
	if(!util.isEmpty(eObject)) {
		for(k in eObject) {
			if((k !== type) && util.checkNonSysEntities(k)) {
				othere = true;
				break;
			}
		}
	}
	return othere;
}
function getActionHandler(decision, input, entity_count, configuration) {
	
	var intent_count = (input.intents) ? input.intents.length : 0;
	if(intent_count > 0) {
		let name = input.intents[0].intent;
		decision[constants.INTENT_NAME] = input.intents[0].intent;
		decision[constants.Intents].push(input.intents[0].intent);
		decision[constants.ACTION_HANDLER] = name;
		decision[constants.VALID_WITHOUT_ENTITY] = false;
		
		var eObject = decision[constants.EntitesObject] || {};		
		switch(name) {
			case constants.INTENT_FIRSTDAY :
			case constants.INTENT_LASTDAY :
				if(!util.isEmpty(eObject) && (eObject[constants.ENTITY_ASSIGNMENT_EVENTS])) {
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_ASSIGNMENT_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ASSIGNMENT_EVENTS);

				} else if(entity_count === 0) {
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
				} else if(otherEntity(eObject, false)) {
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_ACAD_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ACAD_EVENTS);
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_UNSTRUCTURED);
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
				}
				break
			case constants.INTENT_EVENTS :
				if(!util.isEmpty(eObject) && (eObject[constants.ENTITY_ASSIGNMENT_EVENTS])) {
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_ASSIGNMENT_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ASSIGNMENT_EVENTS);

				} else if(!util.isEmpty(eObject) && eObject[constants.ENTITY_TYPE_ACTION] && otherEntity(eObject, constants.ENTITY_TYPE_ACTION)) {
					
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_ACAD_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ACAD_EVENTS);
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_UNSTRUCTURED);	
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);

				} else if(!util.isEmpty(eObject) && hasNounEntity(eObject)) {

					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);

				} else if(!util.isEmpty(eObject) && eObject[constants.SYS_PERSON]) {

					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);

				} else if(entity_count === 0) {

					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
					
				} else if(otherEntity(eObject, false)) {
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_ACAD_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ACAD_EVENTS);
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_UNSTRUCTURED);	
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
				}
				break;
			case constants.INTENT_TIMING :
				if(!util.isEmpty(eObject) && (eObject[constants.ENTITY_ASSIGNMENT_EVENTS])) {

					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_ASSIGNMENT_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ASSIGNMENT_EVENTS);
				} else if(!util.isEmpty(eObject) && hasNounEntity(eObject)) {
					if((constants.CONTEXTUAL_QUESTION in  decision) && decision[constants.CONTEXTUAL_QUESTION] === true) {
						
						decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_TIMING_UNSTRUCTURED;
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
						decision[constants.ACTION_HANDLERS].push(constants.INTENT_TIMING);
					} else {
						decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_TIMING_UNSTRUCTURED;
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
						decision[constants.ACTION_HANDLERS].push(constants.INTENT_TIMING);
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
					}
				} else if(!util.isEmpty(eObject) && eObject[constants.SYS_PERSON]) {

					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
				} else if(otherEntity(eObject, false)) {
					if((constants.CONTEXTUAL_QUESTION in  decision) && decision[constants.CONTEXTUAL_QUESTION] === true) {					
						decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_TIMING_UNSTRUCTURED;
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
						decision[constants.ACTION_HANDLERS].push(constants.INTENT_TIMING);
						
					} else {
						decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_TIMING_UNSTRUCTURED;
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
						decision[constants.ACTION_HANDLERS].push(constants.INTENT_TIMING);
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_ACAD_EVENTS);	
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_UNSTRUCTURED);	
						decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
					}
				} else if(util.isEmpty(eObject)) {
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
				}	
				break;
			case constants.INTENT_CAMPUS_EVENT:
				decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_CAMPUS_EVENTS;
				decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_CAMPUS_EVENTS);
				break;
			case constants.GREETING_INTENT :
			case constants.ABOUT_BOT_INTENT :
			case constants.THANKS_INTENT :
			case constants.GOOD_BYE_INTENT :
			case constants.PROMPT_A_QUESTION_INTENT :
			case constants.PROMPT_A_SYMPATHY_INTENT :
			case constants.REPLY_A_STATUS_INTENT :
				if(util.isEmpty(eObject) || !util.hasNonSysEntities(input)) {
					decision[constants.ACTION_HANDLER] = constants.GENERIC_INTENT;
					decision[constants.VALID_WITHOUT_ENTITY] = true;
				} else {
					decision[constants.ACTION_HANDLER] = constants.AH_NO_INTENT;
					decision[constants.ACTION_HANDLERS].push(constants.AH_NO_INTENT);
				}
				break;
			case constants.INTENT_LOCATION :
				decision[constants.ACTION_HANDLER] = constants.INTENT_LOCATION;
				decision[constants.ACTION_HANDLERS].push(constants.INTENT_LOCATION);
				decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_LC_UNSTRUCTURED);	
				decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_UNSTRUCTURED);
				break;				   
			case constants.INTENT_CONTACT :
				/*if(!util.isEmpty(eObject) && (eObject[constants.ENTITY_PEOPLE])) {
					decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_PERSON;
				}
				else{*/
					decision[constants.ACTION_HANDLER] = constants.INTENT_CONTACT;
					decision[constants.ACTION_HANDLERS].push(constants.INTENT_CONTACT);
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_LC_UNSTRUCTURED);	
					decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_UNSTRUCTURED);
				//}
				break;
			case constants.ACTION_HANDLER_LC_UNSTRUCTURED :
				decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_LC_UNSTRUCTURED;
				decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_LC_UNSTRUCTURED);
				decision[constants.ACTION_HANDLERS].push(constants.AH_NO_INTENT);
				break;
			case constants.ACTION_HANDLER_TIMING_UNSTRUCTURED :
				decision[constants.ACTION_HANDLER] = constants.ACTION_HANDLER_TIMING_UNSTRUCTURED;
				decision[constants.ACTION_HANDLERS].push(constants.ACTION_HANDLER_TIMING_UNSTRUCTURED);
				decision[constants.ACTION_HANDLERS].push(constants.AH_NO_INTENT);
				break;
			default:
				decision[constants.ACTION_HANDLER] = constants.INTENT_UNSTRUCTURED;
				decision[constants.ACTION_HANDLERS].push(constants.INTENT_UNSTRUCTURED);
				decision[constants.ACTION_HANDLERS].push(constants.AH_NO_INTENT);
				break;
		}
		if(!decision[constants.ACTION_HANDLERS].length && decision[constants.ACTION_HANDLER])
			decision[constants.ACTION_HANDLERS].push(decision[constants.ACTION_HANDLER]);
	} else if(configuration && (constants.enableFollowUpOptions in configuration) && configuration[constants.enableFollowUpOptions]) {
		decision[constants.ACTION_HANDLER] = constants.AH_NO_INTENT;
		decision[constants.VALID_WITHOUT_ENTITY] = true;
		decision[constants.ACTION_HANDLERS].push(constants.AH_NO_INTENT);
	}
	if(configuration && (constants.enableFollowUpOptions in configuration) && configuration[constants.enableFollowUpOptions])
	if(decision[constants.ACTION_HANDLERS] && Array.isArray(decision[constants.ACTION_HANDLERS]) 
		&& decision[constants.ACTION_HANDLERS].length && (decision[constants.ACTION_HANDLERS].indexOf(constants.AH_NO_INTENT) === -1)
		&& Array.isArray(decision[constants.Entites]) && decision[constants.Entites].length) {
			decision[constants.ACTION_HANDLERS].push(constants.AH_NO_INTENT);
	}

	/*if(decision && (constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] == constants.INTENT_UNSTRUCTURED)) {
		let index;
		if(decision && (constants.ACTION_HANDLERS in decision) && ((index = decision[constants.ACTION_HANDLERS].indexOf(constants.AH_NO_INTENT)) !== -1)) {
			decision[constants.ACTION_HANDLERS].splice(index, 1);
		}
	}*/

}