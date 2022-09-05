//DialogIdentifier

const constants = require('./../constants');
const util = require('./../util');
const context = require('./../contextHandler/contextHandler');
const dtpl = require('./../load-conf-tpl');
const contextManager = require('./../contextManager.js');
const intentIdentifier = require('./Intent-identifier');

exports.makeDecision = async function(input, decision, configs) {
		
	try {
		await updateEntities(input, decision, configs);
		//resAppStatus.preResultDecisionStatus(input, decision);
		CheckSecondaryLanguage(input, configs, decision);
		switchcase = getIntentEntityBits(input, decision);
		decision[constants.INTENT_ENTITY_BITS] = switchcase;
		decision[constants.INTENT_ENTITY_COUNT] = switchcase;
		decision[constants.IS_EXCEPTION_CASE] = false;
		decision[constants.UNSUPPORTED_INTENT] = false;
		decision[constants.allowedIntentsEnabled] = false;

		decision[constants.CLEAR_CONTEXT] = true;
		decision[constants.SET_CONTEXT] = true;
		
		let specificIntent = false;
		
		if(decision[constants.setIntentIdentification]) {

			intentIdentifier.getPrimaryAndSecondaryIntent(input, decision, configs);
		}
		
		if(configs[constants.isSpecialBot]) {
			//check for specific intent. If received intent is not part of 
			//this list return unsupported intent response.
			let data = decision[constants.intentsIdentified];
			decision[constants.allowedIntentsEnabled] = configs[constants.allowedIntentsEnabled];
			let receivedIntent = (data && data[constants.primary] && 
				data[constants.primary][constants.intent]) ? data[constants.primary][constants.intent] : "";
			if(configs[constants.allowedIntentsEnabled] && configs[constants.allowedIntents].indexOf(receivedIntent) !== -1)
				specificIntent = true;
		}

		if(configs[constants.isSpecialBot] && configs[constants.allowedIntentsEnabled]) {
			if(specificIntent){
				decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
				decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ZERO;
			}
			else {
				decision[constants.DECISION_STATUS] = constants.DECISION_UNSUPPORTED_INTENT;
				decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.Common, 
					constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THREE);
				decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
				decision[constants.IS_EXCEPTION_CASE] = true;
				decision[constants.UNSUPPORTED_INTENT] = true;
			}
		} else if(util.hasGivenEntityType(input, constants.ILLEGAL_ENTITY_TYPE && !configs[constants.isSpecialBot] )) {
			
			decision[constants.IS_ILLEGAL_ENTITY] = true;
			decision[constants.DECISION_STATUS] = constants.DECISION_ILLEGAL_ENTITY;
			decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_SIX);
			decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
			decision[constants.IS_EXCEPTION_CASE] = true;
		
		} else {
			decision[constants.IS_ILLEGAL_ENTITY] = false;
			switch(switchcase) {
					
				case constants.ZERO_INTENT_ZERO_ENTITY:
			
					decision[constants.DECISION_STATUS] = constants.DECISION_NO_INTENT_NO_ENTITY;
					decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_SIX;
					decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_SIX, constants.DIALOGUE_PICK_INDEX_ONE);
					decision[constants.IS_EXCEPTION_CASE] = true;
					break;
						
				case constants.ZERO_INTENT_ONE_ENTITY:
				case constants.ZERO_INTENT_N_ENTITY:
					if(configs && (constants.enableFollowUpOptions in configs) && configs[constants.enableFollowUpOptions]) {
						decision[constants.DECISION_STATUS] = constants.DECISION_NO_INTENT_N_ENTITY;
						decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ZERO;
					} else {
						decision[constants.DECISION_STATUS] = constants.DECISION_NO_INTENT_N_ENTITY;
						decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THREE);
						decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
						decision[constants.IS_EXCEPTION_CASE] = true;
					}
					break;
				case constants.ONE_INTENT_ZERO_ENTITY:
				case constants.N_INTENT_ZERO_ENTITY:
					decision[constants.DECISION_STATUS] = constants.DECISION_ONE_INTENT_NO_ENTITY;
					break;
						
				case constants.N_INTENT_ONE_ENTITY:
				case constants.N_INTENT_N_ENTITY:
				case constants.ONE_INTENT_ONE_ENTITY:
				case constants.ONE_INTENT_N_ENTITY:					
					decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
					break;
			}

			if(decision[constants.IS_EXCEPTION_CASE]) {
				decision[constants.CLEAR_CONTEXT] = true;
				decision[constants.SET_CONTEXT] = false;
			}
		}
	} catch(e) {
		util.print("\n Decision making Error: ", e);
	}
}
function CheckSecondaryLanguage(input, configs, decision) {
	
	decision[constants.SECONDARY_LANGUAGE_EXIST] = false;
	if(input.languageCode && (input.languageCode.toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS)) {
		if(configs[constants.SUPPORTED_LANGUAGES] && (configs[constants.SUPPORTED_LANGUAGES].indexOf(input.languageCode.toUpperCase()) !== false)) {
			decision[constants.SECONDARY_LANGUAGE_EXIST] = true;
		}
	}
}
function getIntentEntityBits(input, decision) {
	
	let intent_count = (input.intents) ? input.intents.length : 0;
	let switchcase = '';
	let entity_count = 0;
	var types = [];
	if(input.entities) {
			
		let entities = input.entities;	
		for(var i=0; i < entities.length; i++) {
			let entity = entities[i].entity;				
			if((entity.indexOf("sys-") === -1) && (entity.indexOf(constants.PlaceAnaphor) === -1) && (types.indexOf(entities[i].value) === -1) &&  (entity.indexOf(constants.PersonalDataAnaphor) === -1)) {
				entity_count++;
				types.push(entities[i].value);
			}
		}
	}
			
	if(intent_count > 1) {
		switchcase = '1';
	} else {
		switchcase = intent_count;
	}
	console.log("\n WCS Entity Count: "+entity_count);
	decision[constants.WCS_ENTITY_COUNT] = entity_count;
	
	if(entity_count > 1) {
		switchcase = switchcase + 'n';
	} else {
		switchcase = switchcase + '' + entity_count;
	}
		
	return switchcase;
}

function getDecisionStatus(bits, count) {
	
	let status = '';
	switch(bits) {
					
		case constants.ZERO_INTENT_ZERO_ENTITY:
			status = constants.DECISION_NO_INTENT_NO_ENTITY;
			break;
				
		case constants.ZERO_INTENT_ONE_ENTITY:
			status = constants.DECISION_NO_INTENT_N_ENTITY;
			break;
			
		case constants.ZERO_INTENT_N_ENTITY:	
			status = constants.DECISION_NO_INTENT_N_ENTITY;				
			break;
				
		case constants.ONE_INTENT_ZERO_ENTITY:
		case constants.N_INTENT_ZERO_ENTITY:
			status = constants.DECISION_ONE_INTENT_NO_ENTITY;				
			break;
				
		case constants.N_INTENT_ONE_ENTITY:
		case constants.N_INTENT_N_ENTITY:
		case constants.ONE_INTENT_ONE_ENTITY:
		case constants.ONE_INTENT_N_ENTITY:
			if(count > 0)
				status = constants.DECISION_SUCCESS;
			else
				status = constants.DECISION_ONE_INTENT_N_ENTITY_NO_RESULT;
			break;
	}
	return status;
}

async function updateEntities(input, decision, configuration) {
	
	decision[constants.Entites] = [];
	decision[constants.Intents] = [];
	decision[constants.EntitesObject] = {};
	
	try {
		var entity_count = 0;
		if(input.entities) {
			
			let entities = input.entities;
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
		if(entity_count > 1) {
			decision[constants.ENTITY_LIST] = decision[constants.Entites].toString();
		}

	} catch(e) {
		console.log(e);
	}
}