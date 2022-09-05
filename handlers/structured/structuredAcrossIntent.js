const constants = require('./../../constants');
const util = require('./../../util');
const EntityTypeIdentifier = require('./../entityTypeIdentifier');

class StructuredAcrossIntent {

    constructor(name, apiId) {
		this.actionName = name;
		this.actionHandler = null;
		this.actionMap = null;
		this.apiId = apiId;
		this._steps = [];
	}
	
	register(actionHandler) {
		if(!this.actionHandler) {
			this.actionHandler = actionHandler;
		}
	}
	
	static getParallelIntentList(input, decision, configuration) {
		//let entityType = new EntityTypeIdentifier.EntityTypeIdentifier(input, decision, configuration);
		let actionHandlers = [];
		
		actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_LOCATION];
		actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_TIMING];
		actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_ACAD_EVENTS];
			
		return actionHandlers;
	}

	preUpdate(query, step) {
		
		
	}

	postUpdate(query, step) {
		return query;
	}
}
module.exports = StructuredAcrossIntent