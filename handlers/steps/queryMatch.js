const util = require('./../../util.js');
const constants = require('./../../constants.js');

class QueryMatch {
	
	constructor(input, decision, configuration, handler, actionmap, name) {
		
		this._input = input;
		this._configuration = configuration;
		this._decision = decision;
		this._handler = handler;
		
		this._actionmap = actionmap;
		this._name = name;
		this._step = null;
		this._entities = [];
		this.getStep();
		this._len = 0;
    }
	
	getName() {
		return this._name;
	}
	
	getStep() {
		let a; 
		this._step = (a = util.at_xpath(this._actionmap, "steps/step")) ? a : '';

	}
	
	getSingleQueryStep() {
		return this._step;
	}
	getStepQuery() {
		
		let query = null;
		
		if(this._step) {
			query = util.at_xpath(this._step, "query/text()", 1).replace(/\s+/g, ' ');
		}
		
		return query;
	}
	
	getURL() {
		return util.getActionHandlerUrl(this._input, this._configuration, this._step); 
	}
	updateEntities() {
		
		if(constants.Entites in this._decision) {
			this._entities = this._decision[constants.Entites].slice();
		}
	
		this._len = this._entities.length;
		this._decision[constants.dataEntities] = this._entities;
	}
	
	updateQuery(query) {
		
		this.updateEntities();

		query = JSON.parse(query);
	
		//updateLanguageColumns(query, input, configs);
		if(this._handler == constants.ACTION_HANDLER_CAMPUS_EVENTS) {
			return JSON.stringify(query);
		}
		
		if((constants.CONTEXTUAL_QUESTION in this._decision) && this._decision[constants.CONTEXTUAL_QUESTION] && (this._decision[constants.WCS_ENTITIES].length === 0) && (entities.length === 1)) {
			if(this._name === constants.KeywordMatchQuery) {
				return util.updateQueryContextualQuestion(this._name, this._decision, query, this._entities);
			} else {
				return false;
			}
		}

		return this.update(query);
		
	}
}
module.exports = QueryMatch

