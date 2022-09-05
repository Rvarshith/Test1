const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class DefaultIntentQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap, commonmap) {
		super(input, decision, configuration, hname, actionmap, 'DefaultIntentQuery');
    }
	
	update(query) {
		try {
			query = query.replace(/(\?replace_keyword)/g, "");
			query = query.replace(/(\?replace_secondary)/g, "");
            
			query = JSON.parse(query);
			if(query && query.query && query.query.bool && query.query.bool.must && Array.isArray(query.query.bool.must)) {
				query.query.bool.must.splice(0);
				
				query.query.bool.must.push({"term": {"IS_DEFAULT": constants.IS_DEFAULT_VALUE}});
			}
			
			query = JSON.stringify(query);
			
		} catch(e) {
			console.log(e);
		}
		return query;
		
	}
	
}

module.exports = DefaultIntentQuery