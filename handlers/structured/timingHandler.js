const constants = require('./../../constants');
const util = require('./../../util');
const EntityTypeIdentifier = require('./../entityTypeIdentifier');

class TimingHandler {

    constructor(name, options) {
		this.actionName = name;
		this.actionHandler = null;
		this.actionMap = null;
		this.options = options;
		this._steps = [];
		this.objectType = this._getObjectType(),
		this._updateSteps();
		//this._steps = [constants.KeywordMatchQuery, constants.KeySecMatchQuery];
		//constants.AllMatchQuery, constants.MostMatchQuery, constants.DefaultMatchQuery, constants.OnlySecondaryMatchQuery];
	}
	_getObjectType() {
		return util.getObjectType(this.actionName) || constants.ObjectTypeTiming;
	}
	_updateSteps() {
		if(this.options[constants.searchWithEntityName]) {
			this._steps = [...this._steps, constants.FollowUpStQuery];
		} else {
			this._steps = [constants.CommonMatchQuery];
		}
	}
	register(actionHandler) {
		if(!this.actionHandler) {
			this.actionHandler = actionHandler;
		}
	}
	
	static getParallelIntentList(input, decision, configuration, options) {
		let entityType = new EntityTypeIdentifier.EntityTypeIdentifier(input, decision, configuration);
		let actionHandlers = [];
		
		if(options[constants.searchWithEntityName]) {
			
			decision[constants.HandleStructuredIntent] = true;
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_TIMING];
			
		} else if(entityType.hasNounEntity()) {
			
			decision[constants.HandleStructuredIntent] = true;
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_TIMING];
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_ACAD_EVENTS];
			
		} else {
			actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_ACAD_EVENTS];
			//this._decision[constants.HandleStructuredIntent] = false;
			//this.actionHandlers = [...this.actionHandlers, constants.ACTION_HANDLER_UNSTRUCTURED];
		}
		return actionHandlers;
	}

	preUpdate(query, commonQuery, step) {
		
		try {
			if(!this.options[constants.searchWithEntityName]) {
				
				let dateOptions = util.getOptionArray(this.actionHandler._input, this.actionHandler._configuration);
				let counter=0;
			
				if(dateOptions[constants.sys_date_count] === 0) {
					dateOptions[constants.sys_date_count] = 1;
					dateOptions[constants.sys_date_one] = dateOptions[constants.curr_date];
				}
			
				if(dateOptions[constants.sys_date_count] === 1) {
					query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]);
				} else {
					query = JSON.parse(query);
					query.must.bool.should[0].bool.must.splice((0 - counter), 1);
					query = JSON.stringify(query);	
					counter ++;
				}
			
				if(dateOptions[constants.sys_date_count] == 2) {
					query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]).replace(/(\?sys_date2)/g, dateOptions[constants.sys_date_two]);
				} else {
					query = JSON.parse(query);
					query.must.bool.should[0].bool.must.splice((1 - counter),1);
					query = JSON.stringify(query);
					counter ++;
				}
			
				var cnt = 0;
				
				if(dateOptions[constants.sys_time_count] == 0 && dateOptions[constants.sys_date_count] == 1 && (dateOptions[constants.sys_date_one] == dateOptions[constants.curr_date])) {
					dateOptions[constants.sys_time_one] = dateOptions[constants.curr_time];
					query = query.replace(/(\?sys_time1)/g, dateOptions[constants.sys_time_one]);	
				} else {
					query = JSON.parse(query);
					query.must.bool.should[0].bool.must.splice((2 - counter), 1);
					query.must.bool.should[1].bool.must.splice((2 - cnt), 1);
					query = JSON.stringify(query);
					counter ++;
					cnt ++;
				}
			}
			
			if(query && commonQuery) {
				query = JSON.parse(query);
				commonQuery = JSON.parse(commonQuery);
				
				if(query.must && commonQuery && commonQuery.query  && commonQuery.query.bool && commonQuery.query.bool.must && Array.isArray(commonQuery.query.bool.must)) {
					commonQuery.query.bool.must.push(query.must);
				}
				if(query._source) {
					commonQuery._source = query._source;
				}
				
				query = JSON.stringify(commonQuery);
			}
			
			return query;
		} catch(e) {
			console.log(e);
		}
	}

	postUpdate(query, step) {
		return query;
	}
}
module.exports = TimingHandler
/*module.exports = {
	LocationContactHandler: LocationContactHandler
}*/
