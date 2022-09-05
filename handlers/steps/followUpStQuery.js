const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class FollowUpStQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap, commanmap) {
		super(input, decision, configuration, hname, actionmap, 'FollowUpStQuery');
		
		this._commonmap = commanmap;
		this._commonStep = null;
		this._updateCommonProperties();
    }
	
	_updateCommonProperties() {
		let a;
		this._commonStep =(a = util.at_xpath(this._commonmap, "steps/step")) ? a : '';
	}
	
	getCommonQuery() {
		
		let query = null;
		
		if(this._commonStep) {
			query = util.at_xpath(this._commonStep, "query/text()", 1).replace(/\s+/g, ' ');
			query = query.replace(/(\?replace_keyword)/g, null);
			query = query.replace(/(\?replace_secondary)/g, null);
			
		}
		
		return query;
	}
	
	update(query) {
		
		let entityName = (this._decision && this._decision[constants.dataEntities] && Array.isArray(this._decision[constants.dataEntities]) && 
			this._decision[constants.dataEntities].length > 0) ? this._decision[constants.dataEntities][0] : "";
			
		query = JSON.parse(query);
		if(query && query.query && query.query.bool && query.query.bool.must && Array.isArray(query.query.bool.must)) {
			query.query.bool.must.splice(0);
			
			
			if(entityName) {
				query.query.bool.must.push({"match" : { "ENTITY_NAME" : { "query": entityName, "operator":"and" }}});
			} else {
				query = false;
			}
		}
		query = JSON.stringify(query);
		return query;
	}
}

module.exports = FollowUpStQuery