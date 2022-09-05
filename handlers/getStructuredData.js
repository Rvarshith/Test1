const IntentFactory = require('./intentFactory');
const constants = require('./../constants');
const IntentActionHandler = require('./intentActionHandler');
const util = require('./../util');

class GetStructuredData {

    constructor(input, decision, configuration, map, action) {
		this._input = input;
		this._decision = decision;
		this._configuration = configuration;
		this._map = map;
		this.action = action;
		this._datarecords = {};
		this._structuredHandlerList = [];
    }
	
	getHandlers() {

		try {
			const intentFactory = new IntentFactory.IntentFactory(this._input, this._decision, this._configuration, this._map);
			
			this._structuredHandlerList = intentFactory.getStructuredParallelIntentList(this.action);
			
		} catch(e) {
			console.log(e);
		}
		
	}
	
	async execute() {
		return new Promise(async (resolve, reject) => {

			this.getHandlers();
			
			try {
				let ihandler = new IntentActionHandler(this._input, this._decision, this._configuration, this._map);
				
				if(this._structuredHandlerList.length) {
					this._structuredHandlerList.forEach((handler) => ihandler.registerStructuredHandler(handler));
				}
				
				if(this._structuredHandlerList.length === 0 ) {
					
					reject({code: constants.ERROR_ACTION_HANDLER_NOT_FOUND, desc:{}});
				
				} else {
					
					const results = await ihandler.executeStructuredParallelIntents(this._structuredHandlerList, constants.structuredWithinIntent);
					
					if(results && results.code && (results.code === constants.STATUS_SUCCESS)) {
						results.handlers = this._structuredHandlerList;
						resolve(results);
						
					} else {
						
						if(results && results.code) {
							reject({code: results.code, desc:results.desc});
						} else {
							reject({code: constants.ERROR_STATUS_TECH_FAILED, desc:err});
						}
					}
				}
			} catch(err) {
				reject({code: constants.ERROR_STATUS_TECH_FAILED, desc:err});
			}
		});
    }
}

module.exports = GetStructuredData