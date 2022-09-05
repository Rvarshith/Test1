//DialogIdentifier

const constants = require('./../constants');
const util = require('./../util');
const dtpl = require('./../load-conf-tpl');
const DataSelection = require('./dataSelection');
const DataFilter = require('./dataFilter');

class DataDecision {
	constructor(data, decision, configuration, input) {
		this._code = (data && data.code) ? data.code : "0";
		this._datarecords = (data && data.results) ? data.results : {};
		this._decision = (this._datarecords && this._datarecords.decision) ? this._datarecords.decision : decision;
		this._output = {};
		this._configuration = configuration;
		this._input = input;
	}
	
	hasStructuredData() {
		if(this._datarecords && (constants.structuredData in this._datarecords) && this._datarecords[constants.structuredData] &&
		(constants.body in this._datarecords[constants.structuredData]) && 
		(constants.CTX_RES_COUNT in this._datarecords[constants.structuredData][constants.body]) &&
		this._datarecords[constants.structuredData][constants.body][constants.CTX_RES_COUNT] > 0) {
			return this._datarecords[constants.structuredData][constants.body][constants.CTX_RES_COUNT];
		}
		return false;
	}
	
	hasUnstructuredData() {
		if(this._datarecords && (constants.unstructuredData in this._datarecords) && 
		(constants.body in this._datarecords[constants.unstructuredData]) && 
		(constants.CTX_RES_COUNT in this._datarecords[constants.unstructuredData][constants.body]) &&
		this._datarecords[constants.unstructuredData][constants.body][constants.CTX_RES_COUNT] > 0) {
			return this._datarecords[constants.unstructuredData][constants.body][constants.CTX_RES_COUNT];
		}
		return false;
	}
	
	getCount(data) {
		if(data && (constants.body in data) && (constants.CTX_RES_COUNT in data[constants.body]) &&
		    data[constants.body][constants.CTX_RES_COUNT] > 0) {
			return data[constants.body][constants.CTX_RES_COUNT];
		}
		return 0;
    }
	
	hasMoreThanOneTopRecord(data) {
		let dfilter = new DataFilter(this._configuration);
		return dfilter.hasMoreThanOneTopRecord(data, false);
	}

	limitResultCount(data) {
		let dfilter = new DataFilter(this._configuration);
		return dfilter.limitMoreThanOneRecord(data);
	}
	makeDecision() {
		let count;
		this.updateSecondaryLanguage();
		this._decision[constants.showFollowUp] = false;
		this._decision[constants.showNudges] = false;
		this._decision[constants.showSuggestion] = false;
		
		if(this._code !== constants.STATUS_SUCCESS) {
			this._decision[constants.DECISION_STATUS] = constants.DECISION_ERROR;
			this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_FIVE);
			this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
			this._decision[constants.errCode] = this._code;

		} else if(this._decision && (constants.IS_EXCEPTION_CASE in this._decision) && this._decision[constants.IS_EXCEPTION_CASE]) {
			//Exception scenarios
		} else {
			let dataSelection = new DataSelection(this._datarecords, this._decision);
			let sel = dataSelection.selectSearchType();
			let isGenericMerge = dataSelection.isGenericMerge;
			this.selectDataRecordTemplate(sel, isGenericMerge);
		}
	}
	
	selectDataRecordTemplate(sel, isGenericMerge) {

		this._decision[constants.isGenericMerge] = isGenericMerge;

		if(sel === constants.structuredData) {
	
			this.setDecisionForStructured();
			
		} else if(sel === constants.unstructuredData) {

			this._decision[constants.CTX_RES_COUNT] = this.getCount(this._datarecords[constants.unstructuredData]);
			this._decision[constants.ACTION_HANDLER] = this._datarecords[constants.unstructuredData][constants.TYPE];
			this._decision[constants.OBJECT_TYPE] = this._datarecords[constants.unstructuredData][constants.objType];
			this._decision[constants.objType] = this._decision[constants.OBJECT_TYPE];
			if(this._decision[constants.CTX_RES_COUNT] > 1) {
				if(this.hasMoreThanOneTopRecord(this._datarecords[constants.unstructuredData])) {
					
					this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_THREE;
					
					this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_THREE, constants.DIALOGUE_PICK_INDEX_ONE);

					this._decision[constants.showFollowUp] = true;
					
					this._decision[constants.DECISION_STATUS] = constants.DECISION_FOLLOW_UP;

				} else {

					this._decision[constants.showNudges] = true;
					this._decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
					this._decision[constants.DIALOGUE_PICK_INDEX] = constants.DIALOGUE_PICK_INDEX_ZERO;
					this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ZERO
				}

			} else {
				this._decision[constants.showNudges] = true;
				this._decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
				this._decision[constants.DIALOGUE_PICK_INDEX] = constants.DIALOGUE_PICK_INDEX_ZERO;
				this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ZERO;

			}
			this._output = this._datarecords[constants.unstructuredData];

		} else if(sel === constants.unstructuredAcross) {
			
			let count = this.getCount(this._datarecords[constants.unstructuredAcross]);

			this.setDecisionForSuggestion(this._datarecords[constants.unstructuredAcross], count);
			

		} else if(sel === constants.structuredAcross) {
			let count = this.getCount(this._datarecords[constants.structuredAcross]);

			this.setDecisionForSuggestion(this._datarecords[constants.structuredAcross], count);

		} else {

			if(constants.isSpecialBot in this._configuration && this._configuration[constants.isSpecialBot])
            {
                this._decision[constants.DECISION_STATUS] = constants.DECISION_UNSUPPORTED_INTENT;
                this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.Common, 
                    constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THREE);
                this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
                this._decision[constants.IS_EXCEPTION_CASE] = true;
                this._decision[constants.UNSUPPORTED_INTENT] = true;
            }
            else{
                this._decision[constants.DECISION_STATUS] = constants.DECISION_SEARCH_RESPONSE;
                this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_SIX;
                this._decision[constants.DIALOGUE_PICK_INDEX] = 
                    dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_SIX, constants.DIALOGUE_PICK_INDEX_ONE);
            }
		}
	}
	
	setDecisionForStructured() {

		this.limitResultCount(this._datarecords[constants.structuredData]);
		this._decision[constants.CTX_RES_COUNT] = this.getCount(this._datarecords[constants.structuredData]);
			
		this._decision[constants.OBJECT_TYPE] = this._datarecords[constants.structuredData][constants.objType];
		this._decision[constants.objType] = this._decision[constants.OBJECT_TYPE];
		this._decision[constants.ACTION_HANDLER] = this._datarecords[constants.structuredData][constants.TYPE];
		this._decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
		this._decision[constants.DIALOGUE_PICK_INDEX] = constants.DIALOGUE_PICK_INDEX_ZERO;
		this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ZERO;
		this._decision[constants.showNudges] = true;
		this._output = this._datarecords[constants.structuredData];
	}
	setDecisionForSuggestion(data, count) {
		
		this._decision[constants.CTX_RES_COUNT] = count;
		this._decision[constants.ACTION_HANDLER] = data[constants.TYPE];
		this._decision[constants.OBJECT_TYPE] = data[constants.objType];
		this._decision[constants.objType] = this._decision[constants.OBJECT_TYPE];
		this._decision[constants.ACROSS_INTENT] = true;

		
		if(count > 1) {
			if(this.hasMoreThanOneTopRecord(data)) {
				
				this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_THREE;
					
				this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_THREE, constants.DIALOGUE_PICK_INDEX_TWO);
				
				this._decision[constants.DECISION_STATUS] = constants.DECISION_FOLLOW_UP;

				this._decision[constants.showFollowUp] = true;
				this._decision[constants.showSuggestion] = true;

			} else {
				this._decision[constants.bestAnswer] = true;
				this._decision[constants.showNudges] = true;

				this._decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
				this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_FIVE;
				this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_FIVE, constants.DIALOGUE_PICK_INDEX_ONE);

			}
		} else {
			this._decision[constants.bestAnswer] = true;
			this._decision[constants.showNudges] = true;
			this._decision[constants.DECISION_STATUS] = constants.DECISION_SUCCESS;
			this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_FIVE;
			this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_FIVE, constants.DIALOGUE_PICK_INDEX_ONE);

		}
		this._output = data;
	}
	hasIntent(data) {
		
		return (data && (constants.STEP_COUNTER in data) &&  (data[constants.STEP_COUNTER] !== constants.AcrossIntentQuery));
	}
	
	getOutput() {
		return this._output;
	}
	
	getDecision() {
		return this._decision;
	}
	
	getGenericRecord() {
		return (this._datarecords && this._datarecords[constants.unstructuredData] && (this._datarecords[constants.unstructuredData][constants.body])) ? this._datarecords[constants.unstructuredData][constants.body] : {};
	}
	updateSecondaryLanguage() {
	
		this._decision[constants.SECONDARY_LANGUAGE_EXIST] = false;
		if(this._input.languageCode && (this._input.languageCode.toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS)) {
			if(this._configuration[constants.SUPPORTED_LANGUAGES] && 
				(this._configuration[constants.SUPPORTED_LANGUAGES].indexOf(this._input.languageCode.toUpperCase()) !== false)) {
				
				this._decision[constants.SECONDARY_LANGUAGE_EXIST] = true;
			}
		}
	}
}

module.exports = DataDecision;