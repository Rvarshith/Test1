const constants = require('../constants');
const resultFilter = require('./resultFilter');
const rc = require('./../resultContainer/resultContainer');
const util = require('./../util');

class filterResponse {

    constructor(result, actionmap, context, response, input) {
        this._input = input;
        this._result = result;
        this._count = result.length;
        this._ranking = {};
        this._selectedIndex = false;
        this._selectedType = 0;
        this._finalResponse = {};
        this._nudges = {};
        this.__resp = [];
        this._actionmap = actionmap;
        this._getRanking();
        this._response = response;
        this._uniques = [];

        this._defaultIndex = false;
        this._withinIntentIndex = false;
        //this._structuredAcrossIntent = false;
        //this._unstructuredAcrossIntent = false;
    }
    _getRanking() {
        
        this._ranking[constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT] = 5;
        this._ranking[constants.HANDLER_UNSTRUCTURED_DEFAULT] = 4;
        //this._ranking[constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT] = 3;
        //this._ranking[constants.HANDLER_STRUCTURED_ACROSS_INTENT] = 3;
    }
    updateRecord() {
        try {
            this._result.forEach((r1, index) => {
                r1.forEach((r2) => { 
                    r2.total = this.getResultCount(r2);
                    this.updateRanking(r2, index);
                })
            });
        } catch(e) {
            console.log(e);
        }
    }
    updateRanking(row, index) {
        if(row.total > 0) {
            row.rank = this.getResultRank(row);
            this.updateIndex(row.rank, index);
            this.updateIndexType(row, index);
        } else {
            row.rank = 0;
        }
    }
    getFinalResponse() {
        return this._finalResponse;
    }
    getNudges() {
        if(!util.isEmpty(this._nudges)) {
            let temp2 = {}
            temp2[constants.ACTION_HANDLER] = constants.AH_NO_INTENT;
            temp2[constants.objType] = "none";
            temp2[constants.StatusCode] = constants.STATUS_SUCCESS;                   
            temp2[constants.output] = this._nudges;
            
            return [temp2];
        }
        return false;
    }
    updateIndex(rank, index) {
        if(this._ranking[constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT] === rank) {
            this._withinIntentIndex = index;
        } else if(this._ranking[constants.HANDLER_UNSTRUCTURED_DEFAULT] === rank) {
            this._defaultIndex = index;
        }/* else if(this._ranking[constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT] === rank) {
            this._unstructuredAcrossIntent = index;
        } else if(this._ranking[constants.HANDLER_STRUCTURED_ACROSS_INTENT] === rank) {
            this._structuredAcrossIntent = index;
        }*/
    }
    processResults() {
        this.updateRecord();
        if(!this.hasValidRecords()) {
            return this.noRecord();
        }
        this.logDetails();
        if(this.hasWithinIntent()) {
            this.processIntentWithinIntent();
        } else if(this.hasDefault()) {
            this.processDefaultWithinIntent();
        } /*else if(this.hasAcrossIntent()) {
            this.processAcrossIntent();
        } */
    }
    logDetails() {
        this._result.forEach(r1 => {
            let t=0;
            let rank=0;
            r1.forEach(r2 => {
                if(r2.total > 0) {
                    t += r2.total;
                }
                rank=r2.rank;
            });
            console.log('********************'+rank+':'+t+'*********************');
        });
    }
    processIntentWithinIntent() {
        
        this._finalResponse = this.getDataObject(this._selectedIndex);
        resultFilter.addRelavanceAndSort(this._finalResponse, this._response[constants.decision], this._input);
        this.separateResponseAndNudge();
        
        if(this.hasNudges()) {
            if(this._nudges.results.objects.length < 4) {
                this.addDefaultToNudges();
            }
        } else if(!this.hasNudges()) {
            this.addStructuredAndUnstructuredAcrossIntentNudges();
        }
    }
    processDefaultWithinIntent() {
        this._finalResponse = this.getDataObject(this._selectedIndex);
        resultFilter.addRelavanceAndSort(this._finalResponse, this._response[constants.decision], this._input);
        this.separateResponseAndNudgeForDefault();

        if(!this.hasNudges()) {
            this.addStructuredAndUnstructuredAcrossIntentNudges();
        }
    }
    processAcrossIntent() {
        this._finalResponse = this.mergeStAndUnStRecords();
        resultFilter.addRelavanceAndSort(this._finalResponse, this._response[constants.decision], this._input);
        
        this.separateResponseAndNudge();
        //this.separateResponseAndNudgeForDefault();
        
    }
    addDefaultToNudges() {
        if(this._defaultIndex !== false) {
            if(util.isEmpty(this._nudges)) {
                this.createNudgeObject(this._finalResponse);
            }
            let data = getDataObject(index);
            if(this.resultSetExist(data)) {
                this._nudges.results.objects = [...this._nudges.results.objects, data.results.objects[i]];
            }
        }
    }
    addStructuredAndUnstructuredAcrossIntentNudges() {
        this._nudges = this.mergeStAndUnStRecords();
        
    }
    hasValidRecords() {
        return ((this._selectedIndex !== false) && (this._selectedType > 0));
    }
    updateIndexType(row, index) {
        if(row.rank > this._selectedType) {
            this._selectedType = row.rank;
            this._selectedIndex = index;
        }
    }
    noRecord() {
        return {};
    }
    hasExactResult() {
        this._result[this._selectedIndex].forEach((r, index2) => {
            if((r[constants.STEP_COUNTER] === constants.STEP_EXACT_SEARCH) && (r2.total > 0)) {
                return index2;
            }
        });

        return false;
    }
    createResponse() {
        let temp = this._result[this._selectedIndex][0];
        temp.body.hits.hits = this.__resp;
        temp.body.hits.total = this.__resp.length;
        temp.total = this.__resp.length;
        temp.rank = this._selectedType;
        return temp;
        
    }
    separateResponseAndNudge() {
        try {
            let highest;
            if(this._finalResponse && this._finalResponse.results && this._finalResponse.results.objects && this._finalResponse.results.objects.length) {
        
                for(i=0; i<this._finalResponse.results.objects.length; i++) {
                    if(i===0) {
                        highest = this._finalResponse.results.objects[i][constants.RELAVANCE];
                        continue;
                    }
                    if(this._finalResponse.results.objects[i][constants.RELAVANCE] !== highest) {
                        if(util.isEmpty(this._nudges)) {
                            this.createNudgeObject(this._finalResponse);
                        }
                        this._nudges.results.objects = [...this._nudges.results.objects, this._finalResponse.results.objects[i]];
                        this._finalResponse.results.objects.splice(i, 1);
                        i--;
                    }
                }
            }
            if(this._finalResponse && this._finalResponse.results && this._finalResponse.results.objects && Array.isArray(this._finalResponse.results.objects)) {
                this._finalResponse[constants.CTX_RES_COUNT] = this._finalResponse.results.objects.length;
            }
        } catch(e) {
            console.log(e);
        }
        
    }
    separateResponseAndNudgeForDefault() {
        try {
            if(this._finalResponse && this._finalResponse.results && this._finalResponse.results.objects && this._finalResponse.results.objects.length) {
        
                for(i=0; i<this._finalResponse.results.objects.length; i++) {
                    if(i===0) {
                        continue;
                    } else {
                        if(util.isEmpty(this._nudges)) {
                            this.createNudgeObject(this._finalResponse);
                        }
                        this._nudges.results.objects = [...this._nudges.results.objects, this._finalResponse.results.objects[i]];
                        this._finalResponse.results.objects.splice(i, 1);
                        i--;
                    }
                }
            }
            if(this._finalResponse && this._finalResponse.results && this._finalResponse.results.objects && Array.isArray(this._finalResponse.results.objects)) {
                this._finalResponse[constants.CTX_RES_COUNT] = this._finalResponse.results.objects.length;
            }
        } catch(e) {
            console.log(e);
        }
    }
    mergeStAndUnStRecords() {
        
        let data = this.getDataObject(this._unstructuredAcrossIntent);
        let data2 = this.getDataObject(this._structuredAcrossIntent);

        if(this.resultSetExist(data) && this.resultSetExist(data2)) {
            return data.results.objects.concat(data2.results.objects);
        } else if(this.resultSetExist(data)) {
            return data;
        } else if(this.resultSetExist(data2)) {
            return data2;
        }
        return {};
    }
    getDataObject(index) {
        let data={};
        if(index !== false) {
            this._result[index].forEach((r) => {
                if(r.total > 0) {
                    if(util.isEmpty(data)) {
                        data = r;
                    } else {
                        if(this.elasticSearchHitExist(data) && this.elasticSearchHitExist(r)) {
                            data.body.hits.hits.concat(r.body.hits.hits);
                        }
                    }
                }
            });
        }
        if(this.elasticSearchHitExist(data)) {
            for(let i=0; i<data.body.hits.hits.length; i++) {
                if(!this.isUniqueRecord(data.body.hits.hits[i])) {
                    data.body.hits.hits.splice(i, 1);
                    i--;
                }
            }
        }
        if(this.elasticSearchHitExist(data)) {
            data.body.hits.total = data.body.hits.hits.length;
            let stepCounter = data[constants.STEP_COUNTER];
            data = rc.ParseResponse(this._actionmap, data.body, stepCounter, data.TYPE);
            data[constants.STEP_COUNTER] = stepCounter;
        }
        return data;
    }
    createNudgeObject(data) {
        for(key in data) {
            if(key === 'results') {
                this._nudges[key] = {objType: data[constants.objType], objects:[]}
            } else {
                this._nudges[key] = data[key];
            }
        }
    }
    isFollowUp() {
        return (this._finalResponse.results.objects.length > 1);
    }
    hasNudges() {
        return !util.isEmpty(this._nudges);
    }
    hasWithinIntent() {
        return (this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT]);
    }
    hasDefault() {
        return (this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_DEFAULT]);
    }
    hasAcrossIntent() {
        return (this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT] ||
            this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT] );
    }
    getResultCount(row) {
        let body, hits;
        return (row && (body = row.body) && (hits = body.hits) && (hits.hits.length)) ? hits.hits.length : 0;
    }
    isUniqueRecord(row) {
        let id = (row && row._id) ? row._id : false;
        if(this._uniques.indexOf(id) !== -1) {
            return false;
        } else {
            this._uniques = [...this._uniques, row._id];
            return true;
        }
    }
    getResultRank(row) {
        return (row && row[constants.TYPE] && (row[constants.TYPE] in this._ranking)) ? this._ranking[row[constants.TYPE]] : 0;
    }
    elasticSearchHitExist(data) {
        return (data && data.body && data.body.hits && data.body.hits.hits && Array.isArray(data.body.hits.hits) && data.body.hits.hits.length);
    }

    resultSetExist(data) {
        return (data && data.results && data.results.objects && Array.isArray(data.results.objects) && data.results.objects.length);
    }
}

exports.selectNoIntentResponse = function(result, actionmap, context, response, input) {
    let fresp = new filterResponse(result, actionmap, context, response, input);
    fresp.processResults();
    let data = fresp.getFinalResponse();
    for(let k in data) {
        context[k] = data[k]; 
    }

    let temp = fresp.getNudges();
    if(temp) response[constants.decision][constants.NUDGE_OPTIONS] = temp;
}