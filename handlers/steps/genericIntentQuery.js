const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class GenericIntentQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap) {
		super(input, decision, configuration, hname, actionmap, 'GenericIntentQuery');
		this._setStep();
    }
	
	_setStep() {
		let a; 
		this._step = (a = util.at_xpath(this._actionmap, "steps/step")) ? a : '';

	}
	
	update(query) {
		return query;
		
	}
	
}

module.exports = GenericIntentQuery