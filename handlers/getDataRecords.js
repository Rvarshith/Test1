const IntentFactory = require('./intentFactory');
const constants = require('./../constants');
const IntentActionHandler = require('./intentActionHandler');
const Ranking = require('./../libraries/ranking');
const rc = require('./../resultContainer/resultContainer');
const util = require('./../util');
const DataFilter = require('./../decisionMaker/dataFilter');
const StructuredData = require('./getStructuredData');
const contextHandler = require('./../contextHandler/contextHandler');

class GetDataRecord {

    constructor(input, decision, configuration, map) {
		this._input = input;
		this._decision = decision;
		this._configuration = configuration;
		this._map = map;
		this._datarecords = {};
		this._separated = {};
    }
	getHandlers() {

		try {
			const intentFactory = new IntentFactory.IntentFactory(this._input, this._decision, this._configuration, this._map);
			
			this._structuredHandlerList = intentFactory.getStructuredParallelIntentList(null);
			this._unStructuredHandlerList = intentFactory.getUnstructuredParallelIntentList();
			//this._acrossIntentStructuredHandlerList = intentFactory.getAcrossIntentStructuredParallelIntentList();
			this._acrossIntentUnStructuredHandlerList = intentFactory.getAcrossIntentUnstructuredParallelIntentList();
			
			this.setDecisionVariables(intentFactory);
		} catch(e) {
			console.log(e);
		}
		
	}
	setDecisionVariables(intentFactory) {
		this._decision[constants.ACTION_HANDLER_TYPE] = intentFactory.actionHandlerType;
		this._decision[constants.searchWithEntityName] = intentFactory.searchWithEntityName;
	}
    execute() {
		return new Promise(async (resolve, reject) => {
			this._decision[constants.uniqueID] = [];
			this.getHandlers();
			
			try {
				let ihandler = new IntentActionHandler(this._input, this._decision, this._configuration, this._map);
				
				if(this._structuredHandlerList.length) {
					this._structuredHandlerList.forEach((handler) => ihandler.registerStructuredHandler(handler));
				}
				if(this._unStructuredHandlerList.length) {
					this._unStructuredHandlerList.forEach((handler) => ihandler.registerUnStructuredHandler(handler));
				}
				/*if(this._acrossIntentStructuredHandlerList.length) {
					this._acrossIntentStructuredHandlerList.forEach((handler) => ihandler.registerAcrossIntentStructuredHandler(handler));
				}*/
				if(this._acrossIntentUnStructuredHandlerList.length) {
					this._acrossIntentUnStructuredHandlerList.forEach((handler) => ihandler.registerAcrossIntentUnstructuredHandler(handler));
				}
				
				if(this._structuredHandlerList.length === 0 && 
					this._unStructuredHandlerList.length === 0 && 
					/*this._acrossIntentStructuredHandlerList.length === 0 &&*/
					this._acrossIntentUnStructuredHandlerList.length === 0) {
					
					reject({code: constants.ERROR_ACTION_HANDLER_NOT_FOUND, desc:{}});
				
				} else {
					
					const results = await ihandler.executeParallelIntents();
					
					if(results && results.code && (results.code === constants.STATUS_SUCCESS)) {
						
						await this.processData(results, ihandler._decision);
						this._datarecords[constants.decision] = ihandler._decision;
						resolve({code: constants.STATUS_SUCCESS, results:this._datarecords});
						
					} else {
						
						if(results && results.code) {
							reject({code: results.code, desc:results.desc});
						} else {
							reject({code: constants.ERROR_STATUS_TECH_FAILED, desc:err});
						}
					}
				}
			} catch(err) {
				let erCode = (err && err.code) ? err.code : constants.ERROR_STATUS_TECH_FAILED;
				reject({code: erCode, desc:err});
			}
		});
    }
	separateResults(results) {
		let b, a;
			
		for(let k=0; k<results.length; k++) {
			if((a=results[k].results) && Array.isArray(a)) {
				for(let l=0; l<a.length; l++) {
					if((b=a[l]) && Array.isArray(b)) {
						for(let m=0; m<b.length; m++) {
							if(b[m][constants.searchType] && this.elasticSearchHitExist(b[m])) {

								if(this.isWithinIntentAndNoKeyWord(b[m])) {
									continue;
								}
								if(this._separated[b[m][constants.searchType]]) {
									this._separated[b[m][constants.searchType]].push(b);
									break;
								} else {
									this._separated[b[m][constants.searchType]] = [];
									this._separated[b[m][constants.searchType]].push(b);
									break;
								}
							}
						}
					}
				}
			}
		}
	}
	isWithinIntentAndNoKeyWord(data) {
		if(data && data[constants.STEP_COUNTER] && 
			(data[constants.STEP_COUNTER] === constants.WithinIntentQuery) && 
			((data[constants.TYPE] === constants.Unstructured))) {
			return !this.hasKeyword(data);
		}
		return false;
	}
	async processData(data, decision) {
		if(data && data.code && (data.code === constants.STATUS_SUCCESS)) {
			
			let results = data.results;
			//this.separateAcrossIntent();
			this.separateResults(results);
			if(this._separated && (constants.structuredWithinIntent in this._separated)) {
				
				this._datarecords[constants.structuredData] = this.selectActionHandlerWiseStructuredRecord(
					this._separated[constants.structuredWithinIntent], 
					this._structuredHandlerList,
					false);
				
				this.addRanking(this._datarecords[constants.structuredData], decision, true);
				this.addCTXVariables(this._datarecords[constants.structuredData], this._structuredHandlerList);
			}
			if(this._separated && (constants.unStructuredWithinIntent in this._separated)) {

				let unst = this.selectRecord(this._separated[constants.unStructuredWithinIntent], 0, this._unStructuredHandlerList);
				this._datarecords[constants.unstructuredData] = (unst) ? unst : {};

				this.addRanking(this._datarecords[constants.unstructuredData], decision, true);
				this.addCTXVariables(this._datarecords[constants.unstructuredData], this._unStructuredHandlerList);
			}

			if(this._separated && (constants.structuredAcrossIntent in this._separated)) {

				let temp = this.selectStepWiseRecord(this._separated[constants.structuredAcrossIntent]);
				this.addRankingForStucturedAcrossIntent(temp, decision);
				this.addCTXVariablesForAcrossStructure(temp);
				this._datarecords[constants.structuredAcross] = this.mergeStructuredRecords(temp);
			}

			if(this._separated && (constants.unStructuredAcrossIntent in this._separated)) {
				let unst = this.selectRecord(this._separated[constants.unStructuredAcrossIntent], 0, this._acrossIntentUnStructuredHandlerList);
				this._datarecords[constants.unstructuredAcross] = (unst) ? unst : {};
				this.addRanking(this._datarecords[constants.unstructuredAcross], decision, false);
				this.addCTXVariables(this._datarecords[constants.unstructuredAcross], this._acrossIntentUnStructuredHandlerList);
			}
						
			if(this._datarecords && (constants.unstructuredData in this._datarecords)) { 
               if(!this._decision[constants.searchWithEntityName]) 
				await this.checkStructuredActionHandler(constants.unstructuredData, decision); 
               else                   
				await this.checkStructuredActionHandler(constants.unstructuredAcross, decision);          
			}
			
		}
	}
	selectStepWiseRecord(data) {
		let records = [];
		for(let i=0; i<data.length; i++) {
			for(let j=0; j<data[i].length; j++) {
				records = [...records, data[i][j]];
				
			}
		}
		return records;
	}
	selectActionHandlerWiseStructuredRecord(data, handlers, merge) {
		let records = {}
		for(let k=0; k<data.length; k++) {
			let index = this.getIndex(data, k); //Get Action handler wise index
			let temp;
			if(index !== null) temp = this.selectRecord(data, index, handlers);
			if(temp) {
				records = temp;
				break;
				/*if(merge) {
					continue; //Merge records of all action handlers
				} else {
					break; //select records of first action handler
				}*/
			}
		}
		return records;
	}
	addRankingForStucturedAcrossIntent(data, decision) {
		let a = data;
		if(a && Array.isArray(a) && a.length) {
			for(let i=0; i<a.length; i++) {
				if(this.elasticSearchHitExist(a[i])) {
					let recordsForRanking = a[i].body.hits.hits;
					this.reStructureDataForRanking(recordsForRanking);
					Ranking.RankingAndSort(recordsForRanking, decision, this._input, false, false);
				}
			}
		}
	}
	
	addRanking(data, decision, considerIntent) {
		try {
			if(this.elasticSearchHitExist(data)) {
				let recordsForRanking = data.body.hits.hits;
				decision[constants.ACTION_HANDLER] = data.TYPE;
				this.reStructureDataForRanking(recordsForRanking);
				Ranking.RankingAndSort(recordsForRanking, decision, this._input, false, considerIntent);
			}
			
		} catch(e) {
			console.log(e);
		}
	}
	reStructureDataForRanking(data) {
		for(let i=0; i<data.length; i++) {
			let source = data[i]._source;
			for(let j in source) {
				data[i][j] = source[j];
			}
			delete data[i]._source;
		}
	}
	getIndex(results, order) {
		for(let k=0; k<results.length; k++) {
			if(results[k] && Array.isArray(results[k]) && results[k][0] && (constants.ACTION_HANDLER_ORDER in results[k][0]) && (results[k][0][constants.ACTION_HANDLER_ORDER] === order)) {
				return k;
			}
		}
	}
	getSteps(result, actionHandlers) {
		let actionName = (Array.isArray(result) && result[0] && result[0][constants.TYPE]) ? result[0][constants.TYPE] : null;
		let steps = [];
		if(actionName) {
			let handler = actionHandlers.filter(ahandler => ahandler.actionName === actionName);
			if(Array.isArray(handler)) {
				steps = handler[0]._steps;
			}
		}
		return steps;
	}
	getActionMap(actionName, actionHandlers) {
		let actionmap = null;
		if(actionName) {
			let handler = actionHandlers.filter(ahandler => ahandler.actionName === actionName);
			if(Array.isArray(handler)) {
				actionmap = handler[0].actionMap;
			}
		}
		return actionmap;
	}
	selectRecord(results, index, actionHandlers) {
		let result = (Array.isArray(results)) ? results[index] : []
		let records;
		let steps = this.getSteps(result, actionHandlers);
		for(let i=0; i<steps.length; i++) {
			records = this.hasRecord(result, steps[i]);
			if(records !== false) {
				break;
			}
		}
		return records;
	}
	hasRecord(results, step) {
		for(let j=0; j<results.length; j++) {
			if(results[j][constants.STEP_COUNTER] === step) {
				if(this.elasticSearchHitExist(results[j])) {
					return results[j];
				}
			}
		}
		return false;
	}

	elasticSearchHitExist(data) {
        return (data && data.body && data.body.hits && data.body.hits.hits && Array.isArray(data.body.hits.hits) && data.body.hits.hits.length);
    }
	
	returnError(code, desc) {
		console.log(code);
		console.log(desc);
	}
	addCTXVariablesForAcrossStructure(data) {
		let a = data;
			if(a && Array.isArray(a) && a.length) {
				for(let i=0; i<a.length; i++) {
					if(this.elasticSearchHitExist(a[i])) {
						let recordsForRanking = a[i].body;
						let stepCounter = a[i][constants.STEP_COUNTER];
						let type = a[i][constants.TYPE];
						let objType = a[i][constants.objType];
						let actionmap = this.getActionMap(type, this._acrossIntentStructuredHandlerList);
						a[i].body = rc.ParseResponse(actionmap, recordsForRanking, stepCounter, objType);
					}
				}
			}
	}
	addCTXVariables(data, handlers) {
		try {
			if(this.elasticSearchHitExist(data)) {
				let recordsForRanking = data.body;
				let stepCounter = data[constants.STEP_COUNTER];
				let type = data[constants.TYPE];
				let objType = data[constants.objType];
				let actionmap = this.getActionMap(type, handlers);
				data.body = rc.ParseResponse(actionmap, recordsForRanking, stepCounter, objType);
				if(handlers && handlers.length > 0 && handlers[0][constants.apiId] && 
					handlers[0][constants.apiId] == constants.API_FOLLOW_UP_QUESTION)
				{
					if(data[constants.body][constants.results][constants.objects] && data[constants.body][constants.results][constants.objects].length > 0)
					{
						let objects = data[constants.body][constants.results][constants.objects][0];
						let valText = objects[constants.CTX_RES_INTENT]+':'+
							objects[constants.CTX_RES_ENTITY_NAME]+'|'+
							objects[constants.CTX_RES_KEYWORD]+','+
							objects[constants.CTX_RES_SECONDARY_ENTITY];
						valText = this.removeLastComma(valText);
						let valEntities = objects[constants.CTX_RES_ENTITY_NAME]+','+
							objects[constants.CTX_RES_KEYWORD]+','+
							objects[constants.CTX_RES_SECONDARY_ENTITY];
						valEntities = this.removeLastComma(valEntities);
						this._input[constants.text] = valText;
						this._input[constants.nudgeFollowUpId] = objects[constants.CTX_RES_UNIQUE_ID];
						contextHandler.updateFollowupQuestion (this._input, this._decision);
						if(valEntities)
							this._decision[constants.Entites] = valEntities.split(',');
					}
				}
			}
			
		} catch(e) {
			console.log(e);
		}
	}
	mergeStructuredRecords(data) {
		let a = data;
		
		let b = {};

		for(let i=0; i<a.length; i++) {

			let object = a[i].body.results.objects;
				//If data doesnt have intent value then adding action handler name as intent because intent
				//name is required in construction of follow-up or suggestions.
			for(let j=0; j<object.length; j++) {
				if(!object[j][constants.CTX_RES_INTENT]) object[j][constants.CTX_RES_INTENT] = a[i][constants.TYPE];
			} 
			a[i].body.results.objects = object;
			if(util.isEmpty(b)) {
				b = a[i];
			} else {
				
				b.body.results.objects = b.body.results.objects.concat(object);
				b.body[constants.CTX_RES_COUNT] = b.body.results.objects.length;
			}
		}
		if(this.resultSetExist(b[constants.body])) {
			util.performSorting(b[constants.body][constants.results][constants.objects], constants.RELAVANCE, constants.SORTING_DESCENDING);
		}
		
		return b;

	}
	resultSetExist(data) {
        return (data && data.results && data.results.objects && Array.isArray(data.results.objects) && data.results.objects.length);
	}
	
	async checkStructuredActionHandler(key, decision) {

		if(this.goToStructuredSearch(key)) {
			
			let record = this.getFirstObject(this._datarecords[key]);
			if((constants.CTX_RES_ACTION_HANDLER in record) && record[constants.CTX_RES_ACTION_HANDLER] && 
				(this._decision[constants.uniqueID].indexOf(record._id) === -1)) {
				try {
					this._decision[constants.uniqueID].push(record._id);
					let stdata = new StructuredData(this._input, decision, this._configuration, this._map, record[constants.CTX_RES_ACTION_HANDLER]);
					let data = await stdata.execute();
					if(data && data.code && (data.code === constants.STATUS_SUCCESS)) {
						this._separated[constants.structuredWithinIntent] = data.results;
						this._structuredHandlerList = data.handlers;
						this._datarecords[constants.structuredData] = this.selectActionHandlerWiseStructuredRecord(
							this._separated[constants.structuredWithinIntent], 
							this._structuredHandlerList,
							false);
						
						this.addRanking(this._datarecords[constants.structuredData], decision, true);
						this.addCTXVariables(this._datarecords[constants.structuredData], this._structuredHandlerList);
					}
				} catch(err) {
					console.log(err);
				}	
			}
		}
	}

	goToStructuredSearch(key) {
		let search = true;
		let data = this._datarecords[key];
		let defaultRecord = false;
		if(key === constants.unstructuredData) {
			if(data && (constants.STEP_COUNTER in data) &&  (data[constants.STEP_COUNTER] === constants.DefaultIntentQuery)) {
				defaultRecord = true;
			}
		}
		
		if(defaultRecord) {
			/*let count = this.getDataRecordCount(this._datarecords[constants.unstructuredAcross]);
			if(count > 1) {
				search = false;
			} else if(count === 1) {
				let firstObj = this.getFirstObject(this._datarecords[constants.unstructuredAcross]);
				if(firstObj && firstObj[constants.CTX_RES_IS_DEFAULT] != 1) {
					search = false;
				} 
			}*/
		}
		if(search) search = !this.hasMoreThanOneTopRecord(this._datarecords[key]);
		
		return search;
	}
	getDataRecordCount(data) {
		let count = 0;
		if(data && (constants.body in data) && (constants.CTX_RES_COUNT in data[constants.body]) &&
		    data[constants.body][constants.CTX_RES_COUNT] > 0) {
			count = data[constants.body][constants.CTX_RES_COUNT];
		}
		return count;
    }
	getFirstObject(data) {
		
		let a;
		return ((a=data) && (a=a.body) && (a=a[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};
		
	}
	
	hasMoreThanOneTopRecord(data) {
		let dfilter = new DataFilter(this._configuration);
		return dfilter.hasMoreThanOneTopRecord(data, false);
	}

	hasKeyword(data) {
		let records = data.body.hits.hits;
		let found = false;
		
		for(let i=0; i<records.length; i++) {
			let recordentities = this.getRecordsPrimaryEntities(records[i]._source);
			
			let cnt = this.getKeywordMatchingCount(this._decision[constants.Entites], recordentities);
			
			if(cnt > 0) {
				found = true;
				break;
			}
		}
		return found;
    }
    
    getRecordsPrimaryEntities(row) {
		let recordentities = [];
		recordentities.push(row[constants.ENTITY_NAME]);
		if(row[constants.KEYWORD]) {
			let keyword = row[constants.KEYWORD].toString().split(",");
			keyword = keyword.map(function (val) { return val.toString().trim(); });
			recordentities = recordentities.concat(keyword);
        }
        
        return recordentities;
    }
    
    getKeywordMatchingCount(allentities, keyword) {
		let cnt = 0;
		let ln = allentities.length;
		for(i=0; i<ln; i++) {
			if(keyword.indexOf(allentities[i]) !== -1) {
				cnt += 2;
			}
		}
		return cnt;
	}

	removeLastComma(str) {
		let val = str;
		let lastChar = val.slice(-1);
		if (lastChar == ',') {
			val = val.slice(0, -1);
		}
		return val;
	}
}
module.exports = GetDataRecord