//import { AllMatchQuery } from 'allMatchQuery';
const CampusMatchQuery = require('./campusMatchQuery');
const AcrossIntentQuery = require('./acrossIntentQuery');
const WithinIntentQuery = require('./withinIntentQuery');
const DefaultIntentQuery = require('./defaultIntentQuery');
const GenericIntentQuery = require('./genericIntentQuery');
const FollowUpUnstQuery = require('./followUpUnstQuery');
const FollowUpStQuery = require('./followUpStQuery');
const CommonMatchQuery = require('./commonMatchQuery');


class QueryFactory {
	
	constructor() {
		this._factory = {
			"CampusMatchQuery": CampusMatchQuery,
			"AcrossIntentQuery": AcrossIntentQuery,
			"WithinIntentQuery": WithinIntentQuery,
			"DefaultIntentQuery": DefaultIntentQuery,
			"GenericIntentQuery": GenericIntentQuery,
			"FollowUpUnstQuery": FollowUpUnstQuery,
			"FollowUpStQuery": FollowUpStQuery,
			"CommonMatchQuery": CommonMatchQuery
		}
	}
	
	getQueryClass(type, input, decision, configuration, hname, actionmap, commonmap) {
		try {
			return new this._factory[type](input, decision, configuration, hname, actionmap, commonmap);
		} catch(e) {
			console.log(e);
		}
	}
}

module.exports = QueryFactory