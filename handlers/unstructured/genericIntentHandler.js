const constants = require('./../../constants');
const util = require('./../../util');
const EntityTypeIdentifier = require('./../entityTypeIdentifier');

class GenericIntentHandler {

    constructor(name, iname) {
		this.actionName = name;
		this.actionHandler = null;
		this.actionMap = null;
		this.intentName = iname;
		//this.intentName = 'PromptAQuestion';
		this.objectType = this._getObjectType(),
		this._steps = [constants.GenericIntentQuery];
	}
	_getObjectType() {
		return util.getObjectType(this.actionName) || constants.ObjectTypeGeneric;
	}
	register(actionHandler) {
		if(!this.actionHandler) {
			this.actionHandler = actionHandler;
		}
	}
	
	static getParallelIntentList(input, decision, configuration) {
		
		//let entityType = new EntityTypeIdentifier.EntityTypeIdentifier(input, decision);
		let actionHandlers = [];
		
		//this._decision[constants.HandleStructuredIntent] = true;
		actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_GENERIC_INTENT];
			
		return actionHandlers;
	}

	preUpdate(query, step) {
		
		return query;
		
	}

	postUpdate(query, step) {
		
		return query.replace(/(\?INTENT)/g, this.intentName).replace(/(\?today)/g, (util.format_date(new Date()).replace(/\//g, '-')));
	}
}
module.exports = GenericIntentHandler
