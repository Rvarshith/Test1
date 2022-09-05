const constants = require('./../../constants');
const util = require('./../../util');
const ce = require('./../../libraries/campusEvents');
const EntityTypeIdentifier = require('./../entityTypeIdentifier');

class CampusEventsHandler {

    constructor(name) {
		this.actionName = name;
		this.actionHandler = null;
		this.actionMap = null;
		
		this.objectType = this._getObjectType(),
		this._steps = [constants.CampusMatchQuery];
		//constants.AllMatchQuery, constants.MostMatchQuery, constants.DefaultMatchQuery, constants.OnlySecondaryMatchQuery];
	}
	_getObjectType() {
		return util.getObjectType(this.actionName) || constants.ObjectTypeTiming;
	}
	register(actionHandler) {
		if(!this.actionHandler) {
			this.actionHandler = actionHandler;
		}
	}
	
	static getParallelIntentList(input, decision, configuration) {
		
		let entityType = new EntityTypeIdentifier.EntityTypeIdentifier(input, decision, configuration);
		let actionHandlers = [];
		
		actionHandlers = [...actionHandlers, constants.ACTION_HANDLER_CAMPUS_EVENTS];
			
		return actionHandlers;
	}

	preUpdate(query, commonQuery, step) {
		
		var counter=0, a, pos = '1';
		
		var dateOptions = util.getOptionArray(this.actionHandler._input, this.actionHandler._configuration);
		
		var filteredText = ce.filterTextInput(this.actionHandler._input, this.actionHandler._configuration); 
		
		if(dateOptions[constants.sys_date_count] == 1) {
			query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]);
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[pos].bool.should[0].bool.must.splice((0 - counter), 1);
			query = JSON.stringify(query);	
			counter ++;
		}
		
		if(dateOptions[constants.sys_date_count] == 2) {
			query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]).replace(/(\?sys_date2)/g, dateOptions[constants.sys_date_two]);
			
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[pos].bool.should[0].bool.must.splice((1 - counter),1);
			query = JSON.stringify(query);
			counter ++;
		}
		//if(dateOptions[constants.sys_date_count] == 0 && !dateOptions[constants.sys_person] && !dateOptions[constants.locationName] && filteredText !== '') {
		
		if(dateOptions[constants.sys_date_count] == 0) {
			//dateOptions[constants.sys_date_count] = 1;
			dateOptions[constants.sys_date_one] = dateOptions[constants.curr_date];
			query = query.replace(/(\?sys_date1)/g, dateOptions[constants.sys_date_one]);
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[pos].bool.should[0].bool.must.splice((2 - counter),1);
			query = JSON.stringify(query);
			counter ++;
		}
		
		counter = 0;
		
		if(dateOptions[constants.sys_person]) {
			console.log("\n Person exist");
			query = query.replace(/(\?person)/g, dateOptions[constants.sys_person]);
		} else {
			console.log("\n Person not exist");
			query = JSON.parse(query);
			delete query.query.bool.must[0].bool.should.splice((0 - counter), 1);
			query = JSON.stringify(query);
			counter ++;
		}
		if(dateOptions[constants.locationName]) {
			query = query.replace(/(\?venue)/g, dateOptions[constants.locationName]);
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[0].bool.should.splice((1 - counter), 1);
			query = JSON.stringify(query);
			counter ++;
		}
		if(filteredText !== '') {
			query = query.replace(/(\?input_text)/g, '*'+filteredText+'*');
			this.actionHandler._decision[constants.FILTERED_TEXT_SEARCH] = true;
			this.actionHandler._decision[constants.FILTERED_TEXT] = filteredText;
		} else {
			query = JSON.parse(query);
			delete query.query.bool.must[0].bool.should.splice((2 - counter), 1);
			query = JSON.stringify(query);
		}
		
		if(ce.hasToRemoveEntitySearch(this.actionHandler._decision, dateOptions, filteredText)) {
			query = JSON.parse(query);
			delete query.query.bool.must.splice(0, 1);
			query = JSON.stringify(query);
		} else {
			//query = JSON.parse(query);
			//delete query.sort;
			//query = JSON.stringify(query);
		}
		
		return query;
		
	}

	postUpdate(query, step) {
		return query;
	}
}
module.exports = CampusEventsHandler
/*module.exports = {
	LocationContactHandler: LocationContactHandler
}*/
		