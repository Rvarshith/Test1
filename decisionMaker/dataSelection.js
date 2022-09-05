const constants = require('./../constants');

class DataSelection {

    constructor(datarecords, decision) {
        this._datarecords = datarecords;
		this._decision = decision;
		this.isGenericMerge = false;
	}
	
	//need to put condition for campus data

    selectSearchType() {
		let sel = false;
		if(this.hasStructuredData()) {
			if(this.isCampusEventData(this._datarecords[constants.structuredData])) {
				sel = constants.structuredData;
			} else if(this.hasKeyword(this._datarecords[constants.structuredData])) {
				sel = constants.structuredData;
				if(this.hasUnstructuredData() && this.isGenericData(this._datarecords[constants.unstructuredData])) {
					this.isGenericMerge = true;
				}
			}
		}

		if(!sel) {

			if(this.hasUnstructuredData()) {
				if(this.isGenericData(this._datarecords[constants.unstructuredData])) {
					sel = constants.unstructuredData;
					if(this.hasAcrossUnstructuredData()) {
						if(this.hasKeyword(this._datarecords[constants.unstructuredAcross])) {
							this.isGenericMerge = true;
							sel = constants.unstructuredAcross;
						}
					}
				} else if(this.isDefaultData(this._datarecords[constants.unstructuredData])) {
					sel = constants.unstructuredData;
					/*if(this.hasAcrossUnstructuredData() && this.showSuggestions()) {
						if(!this.isAlternative(this._datarecords[constants.unstructuredData])) {
							this.mergeDefaultWithSuggestions(this._datarecords[constants.unstructuredData]);
						}
						sel = constants.unstructuredAcross;
					}*/
				} else if(this.hasKeyword(this._datarecords[constants.unstructuredData])) {
					sel = constants.unstructuredData;
				} 
			}
		}

		if(!sel) {
			if(this.hasAcrossUnstructuredData()) {
				if(this.hasKeyword(this._datarecords[constants.unstructuredAcross])) {
					sel = constants.unstructuredAcross;
				}
			}
		}


		if(!sel) {
			if(this.hasAcrossStructuredData()) {
				if(this.hasKeyword(this._datarecords[constants.structuredAcross])) {
					sel = constants.structuredAcross;
					//suggestion or best answer
				}
			}
		}

		if(!sel && this.hasUnstructuredData()) {
            sel=constants.unstructuredData;
        }
        else if(!sel){
            if(this.hasAcrossUnstructuredData()) {
                sel = constants.unstructuredAcross;
            }
        }
		return sel;
    }
	
	showSuggestions() {
		let showSuggestions = false;
		let count = this.getDataRecordCount(this._datarecords[constants.unstructuredAcross]);
		if(count > 1) {
			showSuggestions = true;
		} else if(count === 1) {
			let firstObj = this.getFirstObject(this._datarecords[constants.unstructuredAcross]);
			if(firstObj && firstObj[constants.CTX_RES_IS_DEFAULT] != 1) {
				showSuggestions = true;
			} 
		}
		return showSuggestions;
	}
	mergeDefaultWithSuggestions(data) {
		let firstObj = this.getFirstObject(data);
		this._datarecords[constants.unstructuredAcross].body.results.objects.unshift(firstObj);

		this._datarecords[constants.unstructuredAcross].body[constants.CTX_RES_COUNT] = this._datarecords[constants.unstructuredAcross].body.results.objects.length;

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
    hasStructuredData() {
        return this.hasData(this._datarecords[constants.structuredData]);
    }
    hasUnstructuredData() {
        return this.hasData(this._datarecords[constants.unstructuredData]);
    }
    hasAcrossUnstructuredData() {
        return this.hasData(this._datarecords[constants.unstructuredAcross]);
    }
    hasAcrossStructuredData() {
        return this.hasData(this._datarecords[constants.structuredAcross]);
    }
    hasData(data) {
		if(data && (constants.body in data) && (constants.CTX_RES_COUNT in data[constants.body]) &&
		    data[constants.body][constants.CTX_RES_COUNT] > 0) {
			return data[constants.body][constants.CTX_RES_COUNT];
		}
		return false;
    }
    
    hasKeyword(data) {
		let records = data.body.results.objects;
		let found = false;
		
		for(let i=0; i<records.length; i++) {
			let recordentities = this.getRecordsPrimaryEntities(records[i]);
			
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
		recordentities.push(row[constants.CTX_RES_ENTITY_NAME]);
		if(row[constants.CTX_RES_KEYWORD]) {
			let keyword = row[constants.CTX_RES_KEYWORD].toString().split(",");
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
    
    isDefaultData(data) {
        if(data && (constants.STEP_COUNTER in data) &&  (data[constants.STEP_COUNTER] === constants.DefaultIntentQuery)) {
			return true;
		} else {
			let a;
			if((a=data) && (a=a.body) && (a=a.results) && (a=a.objects) && (Array.isArray(a)) && (a=a[0])) {
				if(a[constants.CTX_RES_IS_DEFAULT] == 1) {
					return true;
				}
			}
		}
		return false;
    }
	isAlternative(data) {
		let a, isAlternative=false;
		if((a=data) && (a=a.body) && (a=a.results) && (a=a.objects) && (Array.isArray(a)) && (a=a[0])) {
			if(a[constants.CTX_RES_IS_ALTERNATE] == 1) {
				isAlternative = true;
			}
		}
		return isAlternative;
	}
    isGenericData(data) {
        return (data && (constants.STEP_COUNTER in data) &&  (data[constants.STEP_COUNTER] === constants.GenericIntentQuery));
        
	}
	
	isCampusEventData(data) {
        return (data && (constants.STEP_COUNTER in data) &&  (data[constants.STEP_COUNTER] === constants.CampusMatchQuery));
        
    }
}

module.exports = DataSelection;