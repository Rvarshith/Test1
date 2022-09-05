const constants = require('./../constants');
const util = require('./../util');
exports.getTemporaryStatus = function(input, decision) {
	

  getExceptionStatus(input, decision);
	
	if(!(constants.temporaryStatus in decision) || !decision[constants.temporaryStatus]) {
		getSearchStatus(input, decision);
	}
	if(!(constants.temporaryStatus in decision) || !decision[constants.temporaryStatus]) {
		nudgeAnswer(input, decision);
	}
	if(!(constants.temporaryStatus in decision) || !decision[constants.temporaryStatus]) {
		getSuggestionStatus(input, decision);
	}
	if(!(constants.temporaryStatus in decision) || !decision[constants.temporaryStatus]) {
		getFollowUpStatus(input, decision);
	}
	if(!(constants.temporaryStatus in decision) || !decision[constants.temporaryStatus]) {
		getSuccessStatus(input, decision);
	}

	if(!(constants.temporaryStatus in decision) || !decision[constants.temporaryStatus]) {
		decision[constants.temporaryStatus] = constants.others;
	}
}
function nudgeAnswer(input, decision) {
	if(decision && decision[constants.bestAnswer]) {
		decision[constants.temporaryStatus] = constants.ResponseCategorySuccess;
	}
	/*if(input && input[constants.intents] && input[constants.intents].length && (constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_UNSTRUCTURED) && decision[constants.CTX_RES_COUNT] === 1) {
		if(!checkIntentMatches(input, decision)) {
			decision[constants.temporaryStatus] = constants.ResponseCategoryNudges;
		}
	}*/
}
function getSuggestionStatus(input, decision) {
	if(decision && decision[constants.showSuggestion]) {
		decision[constants.temporaryStatus] = constants.ResponseCategorySuggestion;
	}
	
}
function getExceptionStatus(input, decision) {
	if((getIntentEntityBits(input) == constants.ONE_INTENT_ZERO_ENTITY) && (!isContextualQuestion(decision))) {
		if(!(constants.CTX_RES_COUNT in decision) || (decision[constants.CTX_RES_COUNT] === 0)) {
			decision[constants.temporaryStatus] = constants.ResponseCategoryNoEntity;
		}
	} else if((getIntentEntityBits(input) == constants.ZERO_INTENT_ZERO_ENTITY)) {
		decision[constants.temporaryStatus] = constants.ResponseCategoryNoEntity;
	}
}
function getSearchStatus(input, decision) {
	if((constants.DIALOGUE_RULE in decision) && (decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_SIX)) {
		decision[constants.temporaryStatus] = constants.ResponseCategoryGoogleSearch;
	}
}
function isContextualQuestion(decision) {
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		return true;
	} else {
		return false;
	}
}
function getIntentEntityBits(input) {
	
	var intent_count = (input.intents) ? input.intents.length : 0;
	var switchcase = '';
	var entity_count = 0;

	if(input.entities) {	
		var entities = input.entities;	
		for(var i=0; i < entities.length; i++) {			
			if(checkNonSysEntities(entities[i].entity)) {
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
function getFollowUpStatus(input, decision) {
	decision[constants.resultType]
	if((constants.CTX_RES_COUNT in decision) && (decision[constants.CTX_RES_COUNT] > 1)) {
		if((constants.resultType in decision) && decision[constants.resultType] == constants.ObjectTypeFollowUp) {
			
			decision[constants.temporaryStatus] = constants.ResponseCategoryFollowUp;
		}
	}
}
function getSuccessStatus(input, decision) {
	
	if((constants.CTX_RES_COUNT in decision) && (decision[constants.CTX_RES_COUNT] > 0)) {
		
		if((decision[constants.CTX_RES_COUNT] == 1) && (constants.objType in decision) && decision[constants.objType] == constants.ObjectTypeNone) {
			
			decision[constants.temporaryStatus] = constants.ResponseCategorySuccess;
		} else if(decision[constants.objType] != constants.ObjectTypeNone) {
			
			decision[constants.temporaryStatus] = constants.ResponseCategorySuccess;
		}
	}
}
function checkNonSysEntities(entity) {
	if(entity.indexOf("sys-") === -1 && entity.indexOf(constants.PlaceAnaphor) === -1 && entity.indexOf(constants.PersonalDataAnaphor) === -1 && entity.indexOf(constants.LocationAnaphor) === -1) {
		return true;
	} else {
		return false;
	}
}

function checkIntentMatches(input, decision) {
	let intent = (input[constants.intents] && 
		input[constants.intents][0] && 
		input[constants.intents][0][constants.intent]) ? input[constants.intents][0][constants.intent] : ""; 
	
	if(intent && decision[constants.resultIntent] === intent) {
		return true;
	} else {
		return false;
	}
}