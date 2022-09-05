const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class CampusMatchQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap, commanmap) {
		super(input, decision, configuration, hname, actionmap, 'CampusMatchQuery');
    }
	
	update(query) {
		
		return query;
	}
	getCommonQuery() {
		return null;
	}
}

module.exports = CampusMatchQuery