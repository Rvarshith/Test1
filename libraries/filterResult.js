const constants = require('../constants');
const util = require('./../util');
const rc = require('./../resultContainer/resultContainer');

class filterResults {

    constructor(result, actionmap) {
        this._result = result;
        this._defaultIndex = false;
        this._withinIntentIndex = false;
        this._ranking = {};
        this._getRanking();
        this._uniques = [];
        this._actionmap = actionmap;
        this._nudges = [];

        this._selectedIndex = false;
        this._selectedType = 0;
    }

    _getRanking() {
        
        this._ranking[constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT] = 5;
        this._ranking[constants.HANDLER_UNSTRUCTURED_DEFAULT] = 4;
        this._ranking[constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT] = 3;
    }
    updateRecord() {
        try {
            if(this._result && Array.isArray(this._result)) {
                this._result.forEach((r1, index) => {
                    r1.forEach((r2) => { 
                        r2.total = this.getResultCount(r2);
                        this.updateRanking(r2, index);
                    })
                });
            }
        } catch(e) {
            console.log(e);
        }
    }
    hasWithinIntent() {
        return (this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT]);
    }
    hasDefault() {
        return (this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_DEFAULT]);
    }
    hasArossIntent() {
        return (this._selectedType === this._ranking[constants.HANDLER_UNSTRUCTURED_ACROSS_INTENT]);
    }
    getResultCount(row) {
        let body, hits;
        return (row && (body = row.body) && (hits = body.hits) && (hits.hits.length)) ? hits.hits.length : 0;
    }
    elasticSearchHitExist(data) {
        return (data && data.body && data.body.hits && data.body.hits.hits && Array.isArray(data.body.hits.hits) && data.body.hits.hits.length);
    }
    getResultRank(row) {
        return (row && row[constants.TYPE] && (row[constants.TYPE] in this._ranking)) ? this._ranking[row[constants.TYPE]] : 0;
    }
    resultSetExist(data) {
        return (data && data.results && data.results.objects && Array.isArray(data.results.objects) && data.results.objects.length);
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
    updateIndexType(row, index) {
        if(row.rank > this._selectedType) {
            this._selectedType = row.rank;
            this._selectedIndex = index;
        }
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
    updateIndex(rank, index) {
        if(this._ranking[constants.HANDLER_UNSTRUCTURED_WITHIN_INTENT] === rank) {
            this._withinIntentIndex = index;
        } else if(this._ranking[constants.HANDLER_UNSTRUCTURED_DEFAULT] === rank) {
            this._defaultIndex = index;
        }
    }
    noRecord() {
        if(Array.isArray(this._result) && this._result.length) {
            if(this._result[0].length > 1)
            this._result[0].splice(1, (this._result[0].length-1));
            return [this._result[0]];
        } else {
            return this._result;
        }
    }
    hasValidRecords() {
        return ((this._selectedIndex !== false) && (this._selectedType > 0));
    }
    processIntentWithinIntent() {
        let temp = [];
        temp = [...temp, this.getDataObject(this._selectedIndex)];
        this.updateNudges();
        return [temp];
       
    }
    updateNudges() {
        //This function is called when result is picked from entity interaction within
        //Intent to consider Default results for Nudges
        if(this._defaultIndex !== false) {
            let data = this.getDataObject(this._defaultIndex);
            if(this.elasticSearchHitExist(data)) {
                data.body.hits.total = data.body.hits.hits.length;
                let stepCounter = data[constants.STEP_COUNTER];
                data = rc.ParseResponse(this._actionmap, data.body, stepCounter, data.TYPE);
                if(this.resultSetExist(data)) {
                    this._nudges = data.results.objects;
                }
            }
        }
    }
    getNudges() {
        return this._nudges;
    }
    processDefaultWithinIntent() {
        let temp = [];
        temp = [...temp, this.getDataObject(this._selectedIndex)];
        return [temp];
    }
    processResults() {
        this.updateRecord();
        if(!this.hasValidRecords()) {
            return this.noRecord();
        }
        this.logDetails();
        if(this.hasWithinIntent()) {
            return this.processIntentWithinIntent();
        } else if(this.hasDefault()) {
            return this.processDefaultWithinIntent();
        }else if(this.hasArossIntent()) {
            return this.processIntentWithinIntent();
        } else {
            return this.noRecord();
        }
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
        }
        return data;
    }
    logDetails() {
        this._result.forEach(r1 => {
            let t=0;
            let rank=0;
            r1.forEach(r2 => {
                if(r2.total > 0) {
                    t += r2.total;
                }
                if(r2.rank)
                rank=r2.rank;
            });
            console.log('********************'+rank+':'+t+'*********************');
        });
    }
}

exports.filterResults = function(result, actionmap, response) {
    let fresp = new filterResults(result, actionmap);
    let res = fresp.processResults();
    if(response && response[constants.decision]) 
    response[constants.decision][constants.NUDGE_OPTIONS2] = fresp.getNudges();
    return res;
}