const constants = require('./../constants');
const util = require('./../util');
const QueryHandler = require('./queryHandler');

class IntentActionHandler extends QueryHandler {

    constructor(input, decision, configuration, map) {
        super(input, decision, configuration, map);
		this.structuredActionHandlers = [];
		this.unstructuredActionHandlers = [];
		this.acrossIntentStructuredHandlers = [];
		this.acrossIntentUnstructuredHandlers = [];
	}
	
	registerStructuredHandler(handler) {
		this.structuredActionHandlers = [...this.structuredActionHandlers, handler];
		handler.register(this);
	}
	
	registerUnStructuredHandler(handler) {
		this.unstructuredActionHandlers = [...this.unstructuredActionHandlers, handler];
		handler.register(this);
	}
	
	registerAcrossIntentStructuredHandler(handler) {
		this.acrossIntentStructuredHandlers = [...this.acrossIntentStructuredHandlers, handler];
		handler.register(this);
	}
	
	registerAcrossIntentUnstructuredHandler(handler) {
		this.acrossIntentUnstructuredHandlers = [...this.acrossIntentUnstructuredHandlers, handler];
		handler.register(this);
	}
	
    async executeParallelIntents() {

		return new Promise((success, error) => {
			
			let promises = [];
			
			if(this.structuredActionHandlers.length) {
				promises = [...promises, this.executeStructuredParallelIntents(this.structuredActionHandlers, constants.structuredWithinIntent)];
				
			} 
			
			if(this.unstructuredActionHandlers.length) {
				promises = [...promises, this.executeUnstructuredParallelIntents(this.unstructuredActionHandlers, constants.unStructuredWithinIntent)];
			}
			
			if(this.acrossIntentStructuredHandlers.length) {
				promises = [...promises, this.executeStructuredParallelIntents(this.acrossIntentStructuredHandlers, constants.structuredAcrossIntent)];
			}
			
			if(this.acrossIntentUnstructuredHandlers.length) {
				promises = [...promises, this.executeUnstructuredParallelIntents(this.acrossIntentUnstructuredHandlers, constants.unStructuredAcrossIntent)];
			}
			util.printlog("3.1 Structured Action handlers to be executed are:", this.structuredActionHandlers);
			util.printlog("3.2 Unstructured Action handlers to be executed are:", this.unstructuredActionHandlers);
			util.printlog("3.3 Across Intent Structured Action handlers to be executed are:", this.acrossIntentStructuredHandlers);
			util.printlog("3.4 Across Intent UnStructured Action handlers to be executed are:", this.acrossIntentUnstructuredHandlers);
			if(promises.length) {
				
				Promise.all(promises).then((outputs) => {
					
					console.log("------------Result of All execution----------------");
					console.log(JSON.stringify(outputs));
					return outputs;
					
				}).then((records) => {
					
					success({code: constants.STATUS_SUCCESS, results:records});
					
				}).catch((err) => {
					if(err && err.code) {
						error(err);
					} else {
						error({code: constants.ERROR_STATUS_TECH_FAILED, desc:err});
					}
								
				});
			
			} else {
				error({code:constants.ERROR_ACTION_HANDLER_NOT_FOUND, desc:{}});
			}
		});
	}
	
	executeStructuredParallelIntents(data, searchType) {
		return new Promise((success, error) => {
			let promises = [];
			
			data.forEach(function(handler, index) {
				promises.push(this.runStructured(handler, index, searchType));
			
			}.bind(this));
			
			Promise.all(promises).then((outputs) => {
						
				console.log("------------Result of Structured Action Handlers----------------");
				console.log(JSON.stringify(outputs));
				return outputs;
				
			}).then((records) => {
				
				success({code: constants.STATUS_SUCCESS, results:records});
				
			}).catch((err) => {
				if(err && err.code) {
					error(err);
				} else {
					error({code: constants.ERROR_STATUS_TECH_FAILED, desc:err});
				}
							
			});
		});
	}
	
	executeUnstructuredParallelIntents(data, searchType) {
		return new Promise((success, error) => {
			let promises = [];
			
			data.forEach(function(handler, index) {
				promises.push(this.runUnstructured(handler, index, searchType));
			
			}.bind(this));
			
			Promise.all(promises).then((outputs) => {
						
				console.log("------------Result of Unstructured Action Handlers----------------");
				console.log(JSON.stringify(outputs));
				return outputs;
				
			}).then((records) => {
				
				success({code: constants.STATUS_SUCCESS, results:records});
				
			}).catch((err) => {
				if(err && err.code) {
					error(err);
				} else {
					error({code: constants.ERROR_STATUS_TECH_FAILED, desc:err});
				}
							
			});
		});
	}
	
}

module.exports = IntentActionHandler