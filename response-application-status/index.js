const constants = require('./moduleConstants');
const lib = require('./library');

exports.getApplicationResponseStatus = function(input, decision) {
	
	getErrorStatus(decision);
	if(!(constants.responseStatus in decision) || !decision[constants.responseStatus]) {
		getExceptionStatus(input, decision);
	}
	if(!(constants.responseStatus in decision) || !decision[constants.responseStatus]) {
		getSearchStatus(input, decision);
	}
	if(!(constants.responseStatus in decision) || !decision[constants.responseStatus]) {
		getNoDataStatus(input, decision);
	}
	if(!(constants.responseStatus in decision) || !decision[constants.responseStatus]) {
		getSuccessStatus(input, decision);
	}
	if(!(constants.responseStatus in decision) || !decision[constants.responseStatus]) {
		getFollowUpStatus(input, decision);
	}
	 
}

exports.getApplicationResponseStatusForMicrobot = function(input, decision) {
	
	getErrorStatusForMicrobot(decision);
	if((!(constants.responseStatus in decision) || !decision[constants.responseStatus]) && 
		!(constants.CTX_RES_COUNT in decision)) {
			getExceptionStatusForMicrobot(input, decision);
	}
	if(!(constants.responseStatus in decision) || !decision[constants.responseStatus]) {
		getSuccessStatusForMicrobot(input, decision);
	}
}

function getErrorStatus(decision) {
	
	if((constants.errCode in decision) && decision[constants.errCode]) {
		decision[constants.decisionStatus] = constants.DECISION_ERROR;
		decision[constants.responseStatus] = constants.ERROR;
		decision[constants.applicationStatus] = decision[constants.errCode];
	} 
}

function getErrorStatusForMicrobot(decision) {

	if((constants.errCode in decision) && decision[constants.errCode]) {
		if(decision[constants.errCode] === constants.ERROR_STATUS_UNSUPPORTED_INTENT)
		{
			decision[constants.decisionStatus] = constants.DECISION_UNSUPPORTED_INTENT;
			decision[constants.responseStatus] = constants.ERROR;
			decision[constants.applicationStatus] = decision[constants.errCode];
		}
		else {
			decision[constants.decisionStatus] = constants.DECISION_ERROR;
			decision[constants.responseStatus] = constants.ERROR;
			decision[constants.applicationStatus] = decision[constants.errCode];
		}
	} 
}

function getExceptionStatusForMicrobot(input, decision) {

	if((constants.allowedIntentsEnabled in decision && !decision[constants.allowedIntentsEnabled] &&
		(decision[constants.decisionStatus] != constants.DECISION_SUCCESS ||
		decision[constants.decisionStatus] != constants.DECISION_FOLLOW_UP)) || 
		(constants.UNSUPPORTED_INTENT in decision && decision[constants.UNSUPPORTED_INTENT])) {
		decision[constants.decisionStatus] = constants.DECISION_UNSUPPORTED_INTENT;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_UNSUPPORTED_INTENT;
	}
	else if((constants.ACTION_HANDLER in decision) && decision[constants.ACTION_HANDLER] &&  
			decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_UN_SUPPORTED) {
		decision[constants.decisionStatus] = constants.DECISION_UNSUPPORTED_INTENT;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_UNSUPPORTED_INTENT;
	} else if(lib.getIntentEntityBits(input) == constants.ZERO_INTENT_ZERO_ENTITY) {

		decision[constants.decisionStatus] = constants.DECISION_NO_INTENT_NO_ENTITY;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_NO_INTENT_NO_ENTITY;
	} else if(lib.hasGivenEntityType(input, constants.ILLEGAL_ENTITY_TYPE)) {

		decision[constants.decisionStatus] = constants.DECISION_ILLEGAL_ENTITY;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_ILLEGAL_ENTITY_TYPE;
	} else if((constants.sensitive in decision) && decision[constants.sensitive] && input && input.userId && input.userId === '0000') {
		
		decision[constants.decisionStatus] = constants.DECISION_NO_PERSONALISE;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_NO_PERSONALISE_QUESTION;
	} else if((lib.getIntentEntityBits(input) == constants.ONE_INTENT_ZERO_ENTITY) && (!lib.isContextualQuestion(decision)) && ((constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] != constants.GENERIC_INTENT))) {
		if(!(constants.ACTION_HANDLER in decision) || (decision[constants.ACTION_HANDLER] != constants.ACTION_HANDLER_CAMPUS_EVENTS)) {
			decision[constants.decisionStatus] = constants.DECISION_ONE_INTENT_NO_ENTITY;
			decision[constants.responseStatus] = constants.EXCEPTION;
			decision[constants.applicationStatus] = constants.EXCEPTION_ONE_INTENT_NO_ENTITY;
		}
	}
}

function getExceptionStatus(input, decision) {
	if((constants.ACTION_HANDLER in decision) && decision[constants.ACTION_HANDLER] &&  
			decision[constants.ACTION_HANDLER] == constants.ACTION_HANDLER_UN_SUPPORTED) {
		decision[constants.decisionStatus] = constants.DECISION_UNSUPPORTED_INTENT;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_UNSUPPORTED_INTENT;
	} else if(lib.getIntentEntityBits(input) == constants.ZERO_INTENT_ZERO_ENTITY) {

		decision[constants.decisionStatus] = constants.DECISION_NO_INTENT_NO_ENTITY;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_NO_INTENT_NO_ENTITY;
	} else if(lib.hasGivenEntityType(input, constants.ILLEGAL_ENTITY_TYPE)) {

		decision[constants.decisionStatus] = constants.DECISION_ILLEGAL_ENTITY;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_ILLEGAL_ENTITY_TYPE;
	} else if((constants.sensitive in decision) && decision[constants.sensitive] && input && input.userId && input.userId === '0000') {
		
		decision[constants.decisionStatus] = constants.DECISION_NO_PERSONALISE;
		decision[constants.responseStatus] = constants.EXCEPTION;
		decision[constants.applicationStatus] = constants.EXCEPTION_NO_PERSONALISE_QUESTION;
	} else if((lib.getIntentEntityBits(input) == constants.ONE_INTENT_ZERO_ENTITY) && (!lib.isContextualQuestion(decision)) && ((constants.ACTION_HANDLER in decision) && (decision[constants.ACTION_HANDLER] != constants.GENERIC_INTENT))) {
		if(!(constants.ACTION_HANDLER in decision) || (decision[constants.ACTION_HANDLER] != constants.ACTION_HANDLER_CAMPUS_EVENTS)) {
			decision[constants.decisionStatus] = constants.DECISION_ONE_INTENT_NO_ENTITY;
			decision[constants.responseStatus] = constants.EXCEPTION;
			decision[constants.applicationStatus] = constants.EXCEPTION_ONE_INTENT_NO_ENTITY;
		}
	}
}

function getSuccessStatus(input, decision) {
	
	if((constants.CTX_RES_COUNT in decision) && (decision[constants.CTX_RES_COUNT] > 0)) {
		
		if((constants.objectType in decision) && decision[constants.objectType] == constants.ObjectTypeNone) {
			if((decision[constants.CTX_RES_COUNT] == 1) && (constants.showFollowUp in decision) && !decision[constants.showFollowUp]) {
				decision[constants.decisionStatus] = constants.DECISION_SUCCESS;
				decision[constants.responseStatus] = constants.SUCCESS;
				decision[constants.applicationStatus] = lib.getApplicationStatus(decision, input);
			}
		} else {	
			decision[constants.decisionStatus] = constants.DECISION_SUCCESS;
			decision[constants.responseStatus] = constants.SUCCESS;
			decision[constants.applicationStatus] = lib.getApplicationStatus(decision, input);
		}
	}
}

function getSuccessStatusForMicrobot(input, decision) {
	decision[constants.decisionStatus] = constants.DECISION_SUCCESS;
	decision[constants.responseStatus] = constants.SUCCESS;
	decision[constants.applicationStatus] = lib.getApplicationStatusForMicrobot(decision, input);
}

function getFollowUpStatus(input, decision) {
	
	if((constants.CTX_RES_COUNT in decision) && (decision[constants.CTX_RES_COUNT] >= 1)) {
		if((constants.objectType in decision) && decision[constants.objectType] == constants.ObjectTypeNone) {
			if((constants.showFollowUp in decision) && decision[constants.showFollowUp]) {
				decision[constants.decisionStatus] = constants.DECISION_FOLLOW_UP;
				decision[constants.responseStatus] = constants.FOLLOW_UP;
				decision[constants.applicationStatus] = lib.getApplicationStatus(decision, input);
			}
		}
	}
}

function getNoDataStatus(input, decision) {
	if(!(constants.CTX_RES_COUNT in decision) || (decision[constants.CTX_RES_COUNT] === 0)) {
		decision[constants.decisionStatus] = constants.DECISION_NO_DATA;
		decision[constants.responseStatus] = constants.NO_DATA;
		decision[constants.applicationStatus] = lib.getApplicationStatus(decision, input);
	}
}

function getSearchStatus(input, decision) {
	if((constants.DIALOGUE_RULE in decision) && (decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_SIX)) {
		decision[constants.decisionStatus] = constants.DECISION_SEARCH_RESPONSE;
		decision[constants.responseStatus] = constants.SEARCH;
		decision[constants.applicationStatus] = lib.getApplicationStatus(decision, input);
	}
}