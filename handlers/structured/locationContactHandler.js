const constants = require('./../../constants');
const util = require('./../../util');
const EntityTypeIdentifier = require('./../entityTypeIdentifier');

class LocationContactHandler {

    constructor(name, options) {
		this.actionName = name;
		this.actionMap = null;
		this.actionHandler = null;
		this.options = options;
		this._steps = [];
		this.objectType = this._getObjectType(),
		this._updateSteps();
	}
	_getObjectType() {
		return util.getObjectType(this.actionName) || constants.ObjectTypeLocation;
	}
	_updateSteps() {
		if(this.options[constants.searchWithEntityName]) {
			this._steps = [...this._steps, constants.FollowUpStQuery];
		} else {
			this._steps = [constants.CommonMatchQuery];
		}
	}
	register(actionHandler) {
		if(!this.actionHandler) {
			this.actionHandler = actionHandler;
		}
	}
	
	static getParallelIntentList(input, decision, configuration, options) {
		
		let entityType = new EntityTypeIdentifier.EntityTypeIdentifier(input, decision, configuration);
		let actionHandlers = [];
		
		if(options[constants.searchWithEntityName]) {

			decision[constants.HandleStructuredIntent] = true;
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_LOCATION];
			
		} else if(entityType.hasDesignation() || entityType.hasSysPerson()) {
			
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_PERSON_DIRECTORY];
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_LOCATION];
			//this.actionHandlers = [...this.actionHandlers, constants.ACTION_HANDLER_UNSTRUCTURED];

		} else if(entityType.hasNounEntity()) {
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_LOCATION];
			//this.actionHandlers = [...this.actionHandlers, constants.ACTION_HANDLER_UNSTRUCTURED];
			
		} 
		
		return actionHandlers;
	}

	preUpdate(query, commonQuery, s) {
		let a, lat, lon;
		
		if(this.options[constants.searchWithEntityName]) {
			
			query = query.replace(/(\?INTPUT_latitude)/g, function() { return null})
				.replace(/(\?INTPUT_longitude)/g, function() { return null});
			query = JSON.parse(query);
			delete query.sort;
			query = JSON.stringify(query);
		} else if((a = this.actionHandler._input.addtnlInputParams) && (lat = a.latitude) && (lon = a.longitude)) {
			console.log("\n\n\n lat & lon ", lat, lon);
			query = query.replace(/(\?INTPUT_latitude)/g, function() { return lat})
				.replace(/(\?INTPUT_longitude)/g, function() { return lon});
		} else {
			query = query.replace(/(\?INTPUT_latitude)/g, function() { return null})
				.replace(/(\?INTPUT_longitude)/g, function() { return null});
			query = JSON.parse(query);
			delete query.sort;
			query = JSON.stringify(query);
		}
		
		if(query && commonQuery) {
			query = JSON.parse(query);
			commonQuery = JSON.parse(commonQuery);
			if(query._source) {
				commonQuery._source = query._source;
			}
			if(query.sort) {
				commonQuery.sort = query.sort;
			}
			
			query = JSON.stringify(commonQuery);
		}
		return query;
		
	}

	isFollowUpOrSingleEntityContext() {

	}

	postUpdate(query) {
		return query;
	}
}
module.exports = LocationContactHandler
/*module.exports = {
	LocationContactHandler: LocationContactHandler
}*/
