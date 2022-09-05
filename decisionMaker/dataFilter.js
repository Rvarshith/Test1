const constants = require('./../constants');
const util = require('./../util');
class DataFilter {

	constructor(configuration) {
		this._configuration = configuration;
	}
	
	hasMoreThanOneTopRecord(data, stCheck) {

		let records = (data && data.body && data.body.results && data.body.results.objects) ? data.body.results.objects : [];
		let count = 0;
		let len = records.length;
		let temp = [];
		//this._configuration[constants.GetTopRankSuggestions] = true;
		if(this.isSuggestion(data) && this._configuration && this._configuration[constants.GetTopRankSuggestions]) {
			if(len > constants.MAX_FOLLOW_UP_OPTIONS) {

				for(let i=0; i<records.length; i++) {
					if(!(constants.CTX_RES_IS_ALTERNATE in records[i]) || (records[i][constants.CTX_RES_IS_ALTERNATE] !== 1)) {					
						temp = [...temp, records[i]];
					}

					if(temp.length === constants.MAX_FOLLOW_UP_OPTIONS) {
						break;
					}
				}
				data.body.results.objects = temp;
				data.body[constants.CTX_RES_COUNT] = temp.length;
			}
			if(stCheck && (data.body.results.objects.length > 1)) {
				 
				return (data.body.results.objects[0][constants.RELAVANCE] === data.body.results.objects[1][constants.RELAVANCE]);
				
			} else {
				return (data.body.results.objects.length > 1) ? true : false;
			}
		}

		if(len > 1) {

			// remove all the alternate records and find highest rank.
			// Making a copy of records
			let copyOfRecords = records;
			let firstRecord = copyOfRecords[0];
            if(copyOfRecords[0]){
                let firstRecordRelavance = copyOfRecords[0][constants.RELAVANCE];
                for(let i=0; i<copyOfRecords.length; i++) {
                    if (firstRecordRelavance === copyOfRecords[i][constants.RELAVANCE] &&
                        (copyOfRecords[i][constants.CTX_RES_IS_ALTERNATE] == 1))
                    {
                            copyOfRecords.splice(i, 1);
                            i--;
                    }
                    else if( firstRecordRelavance > copyOfRecords[i][constants.RELAVANCE]
                    && constants.CTX_RES_IS_DEFAULT in copyOfRecords[i] 
                    && (copyOfRecords[i][constants.CTX_RES_IS_DEFAULT] != 1)) {                 
                        copyOfRecords.splice(i, 1);
                        i--;
                    }
                }
            }

			if(copyOfRecords.length == 0)
			{
				firstRecord[constants.CTX_RES_IS_ALTERNATE] = 0;
				records = data.body.results.objects = [firstRecord];
			}
			else{

			
				let highest = (copyOfRecords && copyOfRecords[0] && copyOfRecords[0][constants.RELAVANCE]) 
					? copyOfRecords[0][constants.RELAVANCE] : 0;

				for(let i=0; i<copyOfRecords.length; i++) {
					if(copyOfRecords[i][constants.RELAVANCE] === highest) {
						temp = [...temp, records[i]];
						copyOfRecords.splice(i, 1);
						i--;
					}
				}
				//performed sorting to bring down alternate record in array order
				util.performSorting(temp, constants.CTX_RES_IS_ALTERNATE, constants.SORTING_ASCENDING);
				if(temp.length > 1) {
					for(let i=1; i<temp.length; i++) {
						if((constants.CTX_RES_IS_ALTERNATE in temp[i]) 
						&& (temp[i][constants.CTX_RES_IS_ALTERNATE] == 1)) {					
							temp.splice(i, 1);
							i--;
						}
					}

				}
				records = data.body.results.objects = temp;
			}
			
			
			let limit = constants.MAX_FOLLOW_UP_OPTIONS;

			count = records.length;

			if(count > limit) {
				//do sorting
				count = limit;
				records.splice(count);
			}

			data.body[constants.CTX_RES_COUNT] = count;
		}
		return (records.length > 1) ? true : false;
		
	}

	limitMoreThanOneRecord(data) {
		let records = (data && data.body && data.body.results && data.body.results.objects) ? data.body.results.objects : [];
		let count = 0;
		let len = records.length;

		//This logic will remove records where library matched in secondary or low relavance record
		if(len > 1) {

			
			let highest = (records && records[0] && records[0][constants.RELAVANCE]) ? records[0][constants.RELAVANCE] : 0;

			let secondHighest = highest;

			if(highest && (constants.rankingRange in this._configuration) && (this._configuration[constants.rankingRange] > 0)) {
				secondHighest = highest - this._configuration[constants.rankingRange];
				if(secondHighest < 0) {
					secondHighest = 0;
				}
			}

			for(let i=0; i<records.length; i++) {
				if(records[i][constants.RELAVANCE] < secondHighest) {
					records.splice(i, 1);
					i--;
				}
			}
			
			count = records.length;
			
			let limit = (this._configuration && (constants.resultLimit in this._configuration)) ? this._configuration[constants.resultLimit] : count;

			

			if(count > limit) {
				//do sorting
				count = limit;
				records.splice(count);
			}

			data.body[constants.CTX_RES_COUNT] = count;
		}
		
	}

	isSuggestion(data) {
		return (data && (constants.STEP_COUNTER in data) &&  (data[constants.STEP_COUNTER] === constants.AcrossIntentQuery));
	}

}
module.exports = DataFilter;