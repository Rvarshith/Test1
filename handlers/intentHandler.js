const constants = require('./../constants');

class IntentHandler {

    constructor(input, decision, configuration, map) {
        this._input = input;
		this._decision = decision;
		this._configuration = configuration;
		this._map = map;
		this._updateIntentIdentified();
		//this._decision[constants.PRIMARY_INTENT] = {INTENT:"Timing", TYPE:"structured", ACTION_HANDLER:"Timing"};
		//this._decision[constants.SECONDARY_INTENT] = {INTENT:"IT_password_services", TYPE:"unstructured", ACTION_HANDLER:"Unstructured"};
	}
	_updateIntentIdentified() {
		let p = {}, s = {}, data = this._decision[constants.intentsIdentified];
		this._decision[constants.PRIMARY_INTENT] = p;
		this._decision[constants.SECONDARY_INTENT] = s;
		p[constants.INTENT] = (data && data[constants.primary] && data[constants.primary][constants.intent]) ? data[constants.primary][constants.intent] : "";
		p[constants.TYPE] = (data && data[constants.primary] && data[constants.primary][constants.type]) ? data[constants.primary][constants.type] : "";
		p[constants.ACTION_HANDLER] = (data && data[constants.primary] && data[constants.primary][constants.handler]) ? data[constants.primary][constants.handler] : "";
		p[constants.objectType] = (data && data[constants.primary] && data[constants.primary][constants.objectType]) ? data[constants.primary][constants.objectType] : "";
		
		s[constants.INTENT] = (data && data[constants.secondary] && data[constants.secondary][constants.intent]) ? data[constants.secondary][constants.intent] : "";
		s[constants.TYPE] = (data && data[constants.secondary] && data[constants.secondary][constants.type]) ? data[constants.secondary][constants.type] : "";
		s[constants.ACTION_HANDLER] = (data && data[constants.secondary] && data[constants.secondary][constants.handler]) ? data[constants.secondary][constants.handler] : "";
		s[constants.objectType] = (data && data[constants.secondary] && data[constants.secondary][constants.objectType]) ? data[constants.secondary][constants.objectType] : "";

	}
	getPrimaryIntent() {
		return ((this._decision) && (constants.PRIMARY_INTENT in this._decision) && (constants.INTENT in this._decision[constants.PRIMARY_INTENT])) ?
		this._decision[constants.PRIMARY_INTENT][constants.INTENT] : null;
	}
	getSecondaryIntent() {
		return ((this._decision) && (constants.SECONDARY_INTENT in this._decision) && (constants.INTENT in this._decision[constants.SECONDARY_INTENT])) ?
		this._decision[constants.SECONDARY_INTENT][constants.INTENT] : null;
	}
	getPrimaryAction() {
		return ((this._decision) && (constants.PRIMARY_INTENT in this._decision) && (constants.ACTION_HANDLER in this._decision[constants.PRIMARY_INTENT])) ?
		this._decision[constants.PRIMARY_INTENT][constants.ACTION_HANDLER] : null;
	}
	isStructuredIntent() {
		return ((this._decision) && (constants.PRIMARY_INTENT in this._decision) && (constants.TYPE in this._decision[constants.PRIMARY_INTENT]) &&
		(this._decision[constants.PRIMARY_INTENT][constants.TYPE] === constants.INTENT_TYPE_STRUCTURED));
	}
	isFunctionalIntent() {
		return ((this._decision) && (constants.PRIMARY_INTENT in this._decision) && (constants.TYPE in this._decision[constants.PRIMARY_INTENT]) &&
		(this._decision[constants.PRIMARY_INTENT][constants.TYPE] === constants.INTENT_TYPE_UNSTRUCTURED));
	}
	isSecondaryStructuredIntent() {
		return ((this._decision) && (constants.SECONDARY_INTENT in this._decision) && (constants.TYPE in this._decision[constants.SECONDARY_INTENT]) &&
		(this._decision[constants.SECONDARY_INTENT][constants.TYPE] === constants.INTENT_TYPE_STRUCTURED));
	}
	isSecondaryFunctionalIntent() {
		return ((this._decision) && (constants.SECONDARY_INTENT in this._decision) && (constants.TYPE in this._decision[constants.SECONDARY_INTENT]) &&
		(this._decision[constants.SECONDARY_INTENT][constants.TYPE] === constants.INTENT_TYPE_UNSTRUCTURED));
	}
	isGenericIntent() {
		return ((this._decision) && (constants.PRIMARY_INTENT in this._decision) && (constants.TYPE in this._decision[constants.PRIMARY_INTENT]) &&
		(this._decision[constants.PRIMARY_INTENT][constants.TYPE] === constants.GENERIC_INTENT));
	}
    isStructuredIntent2(intent) {
		try {
			if(this._configuration && (constants.INTENTS in this._configuration) && 
			(constants.STRUCTURED_INTENT in this._configuration[constants.INTENTS])) {
				if(this._configuration[constants.INTENTS][constants.STRUCTURED_INTENT].indexOf(intent) !== -1) {
					return true;
				}
			}
			return false;
		} catch(e) {
			this.returnError(constants.ERROR_IN_CHECK_STUCT_INTENT, e);
		}
	}
	isGenericIntent2(intent) {
		try {
			if(this._configuration && (constants.INTENTS in this._configuration) && 
			(constants.GENERIC_INTENT in this._configuration[constants.INTENTS])) {
				if(intent) {
					if(this._configuration[constants.INTENTS][constants.GENERIC_INTENT].indexOf(intent) !== -1) {
						return true;
					}	
				}
			}
			return false;
		} catch(e) {
			this.returnError(constants.ERROR_IN_CHECK_GENERIC_INTENT, e);
		}
	}
	isCampusEvent() {
		return (this._decision && (constants.PRIMARY_INTENT in this._decision) && (this._decision[constants.PRIMARY_INTENT] === constants.INTENT_CAMPUS_EVENT));
	}
	
	hasEntities() {
		if(this._decision && (constants.Entites in this._decision) && this._decision[constants.Entites].length) {
			return true;
		} else {
			return false;
		}
	}
	returnError(code, desc) {
		
	}
}
module.exports = IntentHandler
/*module.exports = {
	IntentHandler: IntentHandler
}*/