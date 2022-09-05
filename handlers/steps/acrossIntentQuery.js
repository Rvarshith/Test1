const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class AcrossIntentQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap, commonmap) {
		super(input, decision, configuration, hname, actionmap, 'AcrossIntentQuery');
	}
	
	update(query) {
		if(this._decision && this._decision[constants.dataEntities] && 
		Array.isArray(this._decision[constants.dataEntities]) && 
		this._decision[constants.dataEntities].length > 0) {
			return util.getReplaceableQuery(query, this._step, this._decision);
		} else {
			return false;
		}
		
	}
	
}

module.exports = AcrossIntentQuery