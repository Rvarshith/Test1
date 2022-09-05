const QueryMatch = require('./queryMatch');
const constants = require('./../../constants');
const util = require('./../../util.js');

class FollowUpUnstQuery extends QueryMatch {
	
	constructor(input, decision, configuration, hname, actionmap, commonmap) {
		super(input, decision, configuration, hname, actionmap, 'FollowUpUnstQuery');
	}
	
	update(query) {
		try {
			query = query.replace(/(\?replace_keyword)/g, "");
			query = query.replace(/(\?replace_secondary)/g, "");
            
			query = JSON.parse(query);
			let entityName = (this._decision && this._decision[constants.dataEntities] && Array.isArray(this._decision[constants.dataEntities]) && 
				this._decision[constants.dataEntities].length > 0) ? this._decision[constants.dataEntities][0] : "";
			
			if(query && query.query && query.query.bool && query.query.bool.must && Array.isArray(query.query.bool.must)) {
				query.query.bool.must.splice(0);
				
				
				if(entityName) {
					query.query.bool.must.push({"match" : { "UNIQUE_ID" : { "query": entityName, "operator":"and" }}});
					query = JSON.stringify(query);
				} else {
					query = false;
				}
			}
		} catch(e) {
			console.log(e);
		}
		return query;
	}
}

module.exports = FollowUpUnstQuery