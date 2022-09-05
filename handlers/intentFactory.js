const IntentHandler = require('./intentHandler');
const constants = require('./../constants');
const LocationContactHandler = require('./structured/locationContactHandler');
const TimingHandler = require('./structured/timingHandler');
const AcademicEventsHandler = require('./structured/academicEventsHandler');
const CampusEventsHandler = require('./structured/campusEventsHandler');
const UnstructuredIntentHandler = require('./unstructured/unstructuredIntentHandler');
const GenericIntentHandler = require('./unstructured/genericIntentHandler');
const StructuredAcrossIntent = require('./structured/structuredAcrossIntent');

class IntentFactory extends IntentHandler {
	constructor(input, decision, configuration, map) {
		super(input, decision, configuration, map);
		this.actionHandlerType = null;
		this.searchWithEntityName = false;
    }
	
	getAcrossIntentStructuredParallelIntentList() {
		
		let actions = [], actionHandlers = [];
		
		let options = this.getInputOptions();

		if(this.hasEntities() && !options[constants.searchWithEntityName]) {
			actions = StructuredAcrossIntent.getParallelIntentList(this._input, this._decision, this._configuration);
			
			for(let i=0; i<actions.length; i++) {
				actionHandlers = [...actionHandlers, this.getActionHandler(actions[i])];
			}
		}
		return actionHandlers;
	}
	
	getAcrossIntentUnstructuredParallelIntentList() {
		
		let actionHandlers = [];
		let options = this.getInputOptions();

		if(this.hasEntities() && !options[constants.searchWithEntityName]) {

			if(this.genericWithIgnoredEntity()) {
				return actionHandlers;
			}
			
			let apiId = this._decision[constants.apiId];
			
			actionHandlers = [...actionHandlers, new UnstructuredIntentHandler(constants.ACTION_HANDLER_UNSTRUCTURED, null, null, apiId, true)];
		}
		return actionHandlers;
	}
	
	getStructuredParallelIntentList(action) {
		
		action = (action) ? action : this.getPrimaryAction();
		let options = this.getInputOptions();
		let actions = [], actionHandlers = [];

		switch(action) {
			case constants.ACTION_HANDLER_ACAD_EVENTS :
				actions = AcademicEventsHandler.getParallelIntentList(this._input, this._decision, this._configuration, options);
				break;
			case constants.ACTION_HANDLER_TIMING :
				actions = TimingHandler.getParallelIntentList(this._input, this._decision, this._configuration, options);
				break;
			case constants.ACTION_HANDLER_LOCATION :
			case constants.INTENT_CONTACT :
				actions = LocationContactHandler.getParallelIntentList(this._input, this._decision, this._configuration, options);
				break;
			case constants.INTENT_CAMPUS_EVENT :
				actions = CampusEventsHandler.getParallelIntentList(this._input, this._decision, this._configuration, options);
				break;
			case constants.ACTION_HANDLER_GENERIC_INTENT :
				this.actionHandlerType = constants.ACTION_HANDLER_GENERIC_INTENT;
				
				break;
		}

		if(!action) {
			this.actionHandlerType = constants.AH_NO_INTENT;
			//actions = StructuredAcrossIntent.getParallelIntentList(this._input, this._decision, this._configuration);
		}
		
		for(let i=0; i<actions.length; i++) {
			actionHandlers = [...actionHandlers, this.getActionHandler(actions[i])];
		}
		
		return actionHandlers;
	}
	
	getUnstructuredParallelIntentList() {
		
		let actions = [], actionHandlers = [];
		
		let primary = this.getPrimaryIntent();
		
		let secondary = this.getSecondaryIntent();

		let apiId = this._decision[constants.apiId];
		
		if(this.isGenericIntent()) {

			actions = GenericIntentHandler.getParallelIntentList(this._input, this._decision);
			for(let i=0; i<actions.length; i++) {
				actionHandlers = [...actionHandlers, this.getActionHandler(actions[i])];
			}
			
			return actionHandlers;
		}
		
		if(this.isStructuredIntent()) {
			
			if(this.isSecondaryFunctionalIntent()) {
				actionHandlers = [...actionHandlers, new UnstructuredIntentHandler(constants.ACTION_HANDLER_UNSTRUCTURED, secondary, primary, apiId, false)];
			} else if(apiId !== constants.API_FOLLOW_UP_QUESTION) {
				//actionHandlers = [...actionHandlers, new UnstructuredIntentHandler(constants.ACTION_HANDLER_UNSTRUCTURED, null, null, apiId, false)];
			}
			
		} else if(this.isFunctionalIntent()) {
			if(this.isSecondaryStructuredIntent()) {
				actionHandlers = [...actionHandlers, new UnstructuredIntentHandler(constants.ACTION_HANDLER_UNSTRUCTURED, primary, secondary, apiId, false)];
			} else {
				actionHandlers = [...actionHandlers, new UnstructuredIntentHandler(constants.ACTION_HANDLER_UNSTRUCTURED, primary, null, apiId, false)];
			}
		}
		
		return actionHandlers;
	}
	
	getActionHandler(action) {
		let actionHandler;

		let options = this.getInputOptions();

		switch(action) {
			case constants.ACTION_HANDLER_ACAD_EVENTS :
				actionHandler = new AcademicEventsHandler(constants.ACTION_HANDLER_ACAD_EVENTS, options);
				break;
			case constants.ACTION_HANDLER_TIMING :
				actionHandler = new TimingHandler(constants.ACTION_HANDLER_TIMING, options);
				break;
			case constants.ACTION_HANDLER_LOCATION :
				actionHandler = new LocationContactHandler(constants.ACTION_HANDLER_LOCATION, options);
				break;
			case constants.ACTION_HANDLER_CAMPUS_EVENTS :
				actionHandler = new CampusEventsHandler(constants.ACTION_HANDLER_CAMPUS_EVENTS, options);
				break;
			case constants.ACTION_HANDLER_GENERIC_INTENT :
				//let intent = this.getPrimaryIntent();
				let intent = this.getPrimaryAction();
				actionHandler = new GenericIntentHandler(constants.ACTION_HANDLER_GENERIC_INTENT, intent);
				break;
		}
		return actionHandler;
	}

	getInputOptions() {
		let options = {};

		options[constants.apiId] = (this._decision && this._decision[constants.apiId]) ? this._decision[constants.apiId] : constants.API_CONVERSATION;
		
		options[constants.searchWithEntityName] = false;

		options[constants.CONTEXTUAL_QUESTION] = (this._decision && (constants.CONTEXTUAL_QUESTION in this._decision)) ? this._decision[constants.CONTEXTUAL_QUESTION] : false;
		
		if(options[constants.apiId] === constants.API_FOLLOW_UP_QUESTION) {
			options[constants.searchWithEntityName] = true;
			this.searchWithEntityName = true;
		} else if(options[constants.CONTEXTUAL_QUESTION] && this._decision && (constants.Entites in this._decision) && (this._decision[constants.Entites].length === 1)) {
			//options[constants.searchWithEntityName] = true;
			//this.searchWithEntityName = true;
		}

		return options;
	}

	genericWithIgnoredEntity() {
		let genericWithIgnoredEntity = false;

		if(this.isGenericIntent() && this.hasEntities()) {
			let ignoreTypes = process.env.IGNORE_ENTITY_TYPE_WITH_GEN_INTENT;
			
			if(ignoreTypes) {
				ignoreTypes = ignoreTypes.split(',').map((e) => {return e.trim()});
			}
	
			if(!Array.isArray(ignoreTypes)) ignoreTypes = [];
			
			let entities = (this._input && this._input.entities) ? this._input.entities : [];
			if(!Array.isArray(entities)) entities = [];
			
			let found = 0; 
			for(let i=0; i<entities.length; i++) {
				if(ignoreTypes.indexOf(entities[i].entity) !== -1) {
					found++;

					const index = this._decision[constants.Entites].indexOf(entities[i].value);
					if (index > -1) {
						this._decision[constants.Entites].splice(index, 1);
					}
				}
				
			}
			
			if(found > 0 && found === this._input.entities.length) {
				genericWithIgnoredEntity = true; 
			}
		}

		return genericWithIgnoredEntity;
	}
}

module.exports = {
	IntentFactory: IntentFactory
}