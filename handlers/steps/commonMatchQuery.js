const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class CommonMatchQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap, commanmap) {

		super(input, decision, configuration, hname, actionmap, 'CommonMatchQuery');
		this._commonmap = commanmap;
		this._commonStep = null;
		this._updateCommonProperties();
    }
	
	_updateCommonProperties() {
		let a;
		this._commonStep =(a = util.at_xpath(this._commonmap, "steps/step")) ? a : '';
	}
	
	update(query) {
		
		return query;
	}
	
	getCommonQuery() {
		
		let query = null;
		
		if(this._commonStep) {
			query = util.at_xpath(this._commonStep, "query/text()", 1).replace(/\s+/g, ' ');
			
			return util.getReplaceableQuery(query, this._commonStep, this._decision);
		}
		
		return query;
	}
}

module.exports = CommonMatchQuery