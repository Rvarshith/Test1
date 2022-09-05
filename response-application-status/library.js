const constants = require('./moduleConstants.js');

exports.isIllegalEntity = function(wcsEntities){
	var illegalEntity = false;
	if(Array.isArray(wcsEntities) && wcsEntities.length) {
		for(var i=0; i<wcsEntities.length; i++) {
			if(wcsEntities[0] && wcsEntities[0][constants.entity] == constants.ILLEGAL_ENTITY_TYPE) {
				illegalEntity = true;
				break;
			}
		}
	}
	return illegalEntity;
}

exports.isGenericIntent = function(wcsIntents) {
	var genericIntents = [constants.GREETING_INTENT, constants.ABOUT_BOT_INTENT, constants.THANKS_INTENT, constants.GOOD_BYE_INTENT, constants.PROMPT_A_QUESTION_INTENT,
	constants.PROMPT_A_SYMPATHY_INTENT, constants.REPLY_A_STATUS_INTENT];
	var genericIntent = false;
	var intent;
	if(Array.isArray(wcsIntents) && wcsIntents.length) {
		if(wcsIntents[constants.intents] && wcsIntents[constants.intents][0] && wcsIntents[constants.intents][0][constants.intent]) {
			intent = wcsIntents[constants.intents][0][constants.intent];
			if(genericIntents.indexOf(intent) !== -1) {
				genericIntent = true;
				
			}
		}
	}
	return genericIntent;
}
exports.getIntentEntityBits = function(input) {
	
	var intent_count = (input.intents) ? input.intents.length : 0;
	var switchcase = '';
	var entity_count = 0;

	if(input.entities) {	
		var entities = input.entities;	
		for(var i=0; i < entities.length; i++) {			
			if(exports.checkNonSysEntities(entities[i].entity)) {
				entity_count++;

			}
		}
	}		
	if(intent_count > 1) {
		switchcase = '1';
	} else {
		switchcase = intent_count;
	}
	
	if(entity_count > 0) {
		switchcase = switchcase + 'n';
	} else {
		switchcase = switchcase + '' + entity_count;
	}
		
	return switchcase;
}

exports.checkNonSysEntities = function(entity) {
	if(entity.indexOf("sys-") === -1 && entity.indexOf(constants.PlaceAnaphor) === -1 && entity.indexOf(constants.PersonalDataAnaphor) === -1 && entity.indexOf(constants.LocationAnaphor) === -1) {
		return true;
	} else {
		return false;
	}
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
function setIntentFrom(decision, input) {
	decision[constants.INTENT_FROM] = constants.NO_INTENT;
	//This block will check whether intent is from WCS or Context
	if((constants.WCS_INTENT in decision) && decision[constants.WCS_INTENT].length) {
		decision[constants.INTENT_FROM] = constants.ONE_INTENT;
	} else if(input && input[constants.intents] && input[constants.intents].length) {
		decision[constants.INTENT_FROM] = constants.CONTEXT_INTENT;
	}
	//This block will check whether result is from WCS or Context or Across intent search
	if((constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] == constants.AH_UNSTRUCTURED)) {
		if((constants.ACROSS_INTENT in decision) && decision[constants.ACROSS_INTENT]) {
			if((constants.WCS_INTENT in decision) && decision[constants.WCS_INTENT].length) {
				decision[constants.INTENT_FROM] = constants.ONE_INTENT_ACROSS_INTENT;
			} else if(input && input[constants.intents] && input[constants.intents].length) {
				decision[constants.INTENT_FROM] = constants.CONTEXT_INTENT_ACROSS_INTENT;
			}
		}

	} else if((constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] == constants.AH_NO_INTENT)) {
		if((constants.WCS_INTENT in decision) && decision[constants.WCS_INTENT].length) {
			decision[constants.INTENT_FROM] = constants.ONE_INTENT_ACROSS_INTENT;
		} else if(input && input[constants.intents] && input[constants.intents].length) {
			decision[constants.INTENT_FROM] = constants.CONTEXT_INTENT_ACROSS_INTENT;
		} else if(input && input[constants.entities] && input[constants.entities].length) {
			decision[constants.INTENT_FROM] = constants.NO_INTENT_ACROSS_INTENT;
		} else {
			decision[constants.INTENT_FROM] = constants.NO_INTENT;
		}
	} else if((constants.CTX_RES_COUNT in decision) && (decision[constants.CTX_RES_COUNT] === 0) &&
		(constants.objectType in decision) && (decision[constants.objectType] == constants.ObjectTypeNone)) {
		decision[constants.INTENT_FROM] = constants.ONE_INTENT_ACROSS_INTENT;	
	} else if((constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] == constants.GENERIC_INTENT)) {
		decision[constants.INTENT_FROM] = constants.ONE_INTENT_GENERIC;
	}
}
function setEntityFrom(decision, input) {

	decision[constants.ENTITY_FROM] = constants.NO_ENTITY;
	if((constants.WCS_ENTITIES in decision) && decision[constants.WCS_ENTITIES].length) {
		if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
			decision[constants.ENTITY_FROM] = constants.MIXED_ENTITY;
		} else {
			decision[constants.ENTITY_FROM] = constants.N_ENTITY;
		}
	} else if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		decision[constants.ENTITY_FROM] = constants.CONTEXT_ENTITY;
	}
	
	if((constants.STEP_COUNTER in decision) && decision[constants.STEP_COUNTER] == constants.STEP_CTX_PS_PLUS_KS) {
		decision[constants.ENTITY_FROM] = constants.MIXED_ENTITY;
	}

	if((constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_CAMPUS_EVENTS)) {
		//check sys dates or sys person before setting to WCS
		decision[constants.ENTITY_FROM] = constants.N_ENTITY;
		if(input && input[constants.entities] && input[constants.entities].length) {
			decision[constants.ENTITY_FROM] = constants.N_ENTITY;
		}
	}
}

function setIntentFromForMicrobot(decision, input) {
	decision[constants.INTENT_FROM] = constants.NO_INTENT;
	//This block will check whether intent is from WCS or Context
	if((constants.Intents in decision) && decision[constants.Intents].length) {
		decision[constants.INTENT_FROM] = constants.ONE_INTENT;
	} else if(input && input[constants.intents] && input[constants.intents].length) {
		decision[constants.INTENT_FROM] = constants.CONTEXT_INTENT;
	}
}
function setEntityFromForMicrobot(decision, input) {

	decision[constants.ENTITY_FROM] = constants.NO_ENTITY;
	if((constants.Entities in decision) && decision[constants.Entities].length) {
		if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
			decision[constants.ENTITY_FROM] = constants.MIXED_ENTITY;
		} else {
			decision[constants.ENTITY_FROM] = constants.N_ENTITY;
		}
	} else if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		decision[constants.ENTITY_FROM] = constants.CONTEXT_ENTITY;
	}
}

function removeTopEntity(decision) {
	if((constants.WCS_ENTITIES in decision) && decision[constants.WCS_ENTITIES].length) {
		if((constants.CONTEXT_ENTITIES in decision) && decision[constants.CONTEXT_ENTITIES].length) {
			for(var i=0; i<decision[constants.CONTEXT_ENTITIES].length; i++) {
				let entity = decision[constants.CONTEXT_ENTITIES][i];
				if(decision[constants.WCS_ENTITIES].indexOf(entity) !== -1) {
					let index = decision[constants.WCS_ENTITIES].indexOf(entity);
					decision[constants.WCS_ENTITIES].splice(index, 1);
				}
			}
		}
	}
}

function getIntentEntityBit(decision, input) {
	//Remove Top entity from decision->WCS_ENTITIES as this get added in case of contextual 
	//question
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		removeTopEntity(decision, input);
	}
	setIntentFrom(decision, input);
	setEntityFrom(decision, input);
	var bit;
	if((constants.INTENT_FROM in decision) && decision[constants.INTENT_FROM]) {
		bit = decision[constants.INTENT_FROM];
	}
	if((constants.ENTITY_FROM in decision) && decision[constants.ENTITY_FROM]) {
		bit = bit+''+decision[constants.ENTITY_FROM];
	}
	return bit;
}

function getIntentEntityBitForMicrobot(decision, input) {
	//Remove Top entity from decision->WCS_ENTITIES as this get added in case of contextual 
	//question
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		removeTopEntity(decision, input);
	}
	setIntentFromForMicrobot(decision, input);
	setEntityFromForMicrobot(decision, input);
	var bit;
	if((constants.INTENT_FROM in decision) && decision[constants.INTENT_FROM]) {
		bit = decision[constants.INTENT_FROM];
	}
	if((constants.ENTITY_FROM in decision) && decision[constants.ENTITY_FROM]) {
		bit = bit+''+decision[constants.ENTITY_FROM];
	}
	return bit;
}

exports.getApplicationStatus = function(decision, input) {
	var appStatus = '';
	var bit = getIntentEntityBit(decision, input);
	switch(bit) {
		case "00":
			//No intent, No entity will fall in exception
			appStatus = constants.ZERO_INTENT_ZERO_ENTITY;
			break;
		case "01":
			appStatus = constants.NO_INTENT_N_ENTITY;
			break;
		case "02":
			appStatus = constants.NO_INTENT_CONTEXT_ENTITY;
			break;
		case "03":
			appStatus = constants.NO_INTENT_MIXED_ENTITY;
			break;
		case "10":
			//If no entity from wcs as well as from context then
			//it will be decision status 3 and pick index 11
			appStatus = constants.ONE_INTENT_ZERO_ENTITY;
			break;
		case "11":
			appStatus = constants.ONE_INTENT_N_ENTITY;
			break;
		case "12":
			appStatus = constants.ONE_INTENT_CONTEXT_ENTITY;
			break;
		case "13":
			appStatus = constants.ONE_INTENT_MIXED_ENTITY;
			break;
		case "21":
			appStatus = constants.CONTEXT_INTENT_N_ENTITY;
			break;
		case "22":
			appStatus = constants.CONTEXT_INTENT_CONTEXT_ENTITY;
			break;
		case "23":
			appStatus = constants.CONTEXT_INENT_MIXED_ENTITY;
			break;
		//case "31":
			//In case of no intent from wcs as well as from context then across intent search results
			//fall in this case
			//appStatus = constants.NO_INTENT_N_ENTITY_ACROSS_INTENT;
			//break;
		case "31":
			//In case of one intent, n entities & search is
			appStatus = constants.ONE_INTENT_N_ENTITY_ACROSS_INTENT;
			break;
		case "32":
			//One intent, context entity & search is across intent
			appStatus = constants.ONE_INTENT_CONTEXT_ENTITY_ACROSS_INTENT;
			break;
		case "33":
			//One intent, mixed entity & search is across intent
			appStatus = constants.ONE_INTENT_MIXED_ENTITY_ACROSS_INTENT;
			break;
		case "41":
			//In case of no intent context intent will be considered and if there is no result
			//then across intent search result will fall in this case
			appStatus = constants.CONTEXT_INENT_N_ENTITY_ACROSS_INTENT;
			break;
		case "42":
			//context intent, mixed entity & search is across intent
			appStatus = constants.CONTEXT_INENT_CONTEXT_ENTITY_ACROSS_INTENT;
			break;
		case "43":
			//context intent, mixed entity & search is across intent
			appStatus = constants.CONTEXT_INENT_MIXED_ENTITY_ACROSS_INTENT;
			break;
		case "51":
			appStatus = constants.NO_INTENT_N_ENTITY_ACROSS_INTENT;
			break;
		case "52":
			appStatus = constants.NO_INTENT_CONTEXT_ENTITY;
			break;
		case "53":
			appStatus = constants.NO_INTENT_MIXED_ENTITY;
			break;
		case "60":
			appStatus = constants.GENERIC_INTENT_NO_ENTITIES;
			break;
	
	}
	return decision[constants.responseStatus]+''+appStatus;
}

exports.getApplicationStatusForMicrobot = function(decision, input) {
	var appStatus = '';
	var bit = getIntentEntityBitForMicrobot(decision, input);
	switch(bit) {
		case "00":
			//No intent, No entity will fall in exception
			appStatus = constants.ZERO_INTENT_ZERO_ENTITY;
			break;
		case "01":
			appStatus = constants.NO_INTENT_N_ENTITY;
			break;
		case "02":
			appStatus = constants.NO_INTENT_CONTEXT_ENTITY;
			break;
		case "03":
			appStatus = constants.NO_INTENT_MIXED_ENTITY;
			break;
		case "10":
			//If no entity from wcs as well as from context then
			//it will be decision status 3 and pick index 11
			appStatus = constants.ONE_INTENT_ZERO_ENTITY;
			break;
		case "11":
			appStatus = constants.ONE_INTENT_N_ENTITY;
			break;
		case "12":
			appStatus = constants.ONE_INTENT_CONTEXT_ENTITY;
			break;
		case "13":
			appStatus = constants.ONE_INTENT_MIXED_ENTITY;
			break;
		case "21":
			appStatus = constants.CONTEXT_INTENT_N_ENTITY;
			break;
		case "22":
			appStatus = constants.CONTEXT_INTENT_CONTEXT_ENTITY;
			break;
		case "23":
			appStatus = constants.CONTEXT_INENT_MIXED_ENTITY;
			break;
		//case "31":
			//In case of no intent from wcs as well as from context then across intent search results
			//fall in this case
			//appStatus = constants.NO_INTENT_N_ENTITY_ACROSS_INTENT;
			//break;
		case "31":
			//In case of one intent, n entities & search is
			appStatus = constants.ONE_INTENT_N_ENTITY_ACROSS_INTENT;
			break;
		case "32":
			//One intent, context entity & search is across intent
			appStatus = constants.ONE_INTENT_CONTEXT_ENTITY_ACROSS_INTENT;
			break;
		case "33":
			//One intent, mixed entity & search is across intent
			appStatus = constants.ONE_INTENT_MIXED_ENTITY_ACROSS_INTENT;
			break;
		case "41":
			//In case of no intent context intent will be considered and if there is no result
			//then across intent search result will fall in this case
			appStatus = constants.CONTEXT_INENT_N_ENTITY_ACROSS_INTENT;
			break;
		case "42":
			//context intent, mixed entity & search is across intent
			appStatus = constants.CONTEXT_INENT_CONTEXT_ENTITY_ACROSS_INTENT;
			break;
		case "43":
			//context intent, mixed entity & search is across intent
			appStatus = constants.CONTEXT_INENT_MIXED_ENTITY_ACROSS_INTENT;
			break;
		case "51":
			appStatus = constants.NO_INTENT_N_ENTITY_ACROSS_INTENT;
			break;
		case "52":
			appStatus = constants.NO_INTENT_CONTEXT_ENTITY;
			break;
		case "53":
			appStatus = constants.NO_INTENT_MIXED_ENTITY;
			break;
		case "60":
			appStatus = constants.GENERIC_INTENT_NO_ENTITIES;
			break;
	
	}
	return decision[constants.responseStatus]+''+appStatus;
}
exports.isContextualQuestion = function(decision) {
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		return true;
	} else {
		return false;
	}
}