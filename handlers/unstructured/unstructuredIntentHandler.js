const constants = require('./../../constants');
const util = require('./../../util');
const EntityTypeIdentifier = require('./../entityTypeIdentifier');

class UnstructuredIntentHandler {

    constructor(name, primary, secondary, apiId, isAcrossIntent) {
		this.actionName = name;
		this.actionMap = null;
		this.actionHandler = null;
		this.apiId = apiId;
		this.primary = primary;
		this.secondary = secondary;
		this.isAcrossIntent = isAcrossIntent;
		this.objectType = constants.ObjectTypeNone;
		this._steps = [];
		this._updateSteps();

	}
	
	_updateSteps() {
		if(this.apiId === constants.API_FOLLOW_UP_QUESTION) {

			this._steps = [...this._steps, constants.FollowUpUnstQuery];
			
		} else if(this.isAcrossIntent) {
			
			this._steps = [...this._steps, constants.AcrossIntentQuery];
		
		} else if(this.primary) {
			
			this._steps = [...this._steps, constants.WithinIntentQuery, constants.DefaultIntentQuery];
			
		} 
		
	}
	
	register(actionHandler) {
		if(!this.actionHandler) {
			this.actionHandler = actionHandler;
		}
	}
	
	static getParallelIntentList(input, decision, configuration) {
		
		let entityType = new EntityTypeIdentifier.EntityTypeIdentifier(input, decision, configuration);
		let actionHandlers = [];
		
		
		actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_UNSTRUCTURED];
			
		return actionHandlers;
	}

	preUpdate(query, step) {
		
		return query;
		
	}

	postUpdate(query, step) {
		if(step !== constants.AcrossIntentQuery) {
			if(this.primary) {
				query = JSON.parse(query);
				if(query && query.query && query.query.bool && query.query.bool.must) {
					query.query.bool.must.push({"term": {"INTENT": this.primary}});
				}
				if(this.secondary) {
					if(query && query.query && query.query.bool && query.query.bool.must) {
						query.query.bool.must.push({"term": {"SECONDARY_INTENT": this.secondary}});
					}
				}
				query = JSON.stringify(query);
			}
		}
		return query;
	}
	
}
module.exports = UnstructuredIntentHandler