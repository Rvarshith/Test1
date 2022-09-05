var util = require('./../../util.js'),
constants = require('./../../constants.js');
const dtpl = require('./../../load-conf-tpl');
var weekdays = {0: "CTX_RES_SUN", 1: "CTX_RES_MON", 2: "CTX_RES_TUE", 3: "CTX_RES_WED", 4: "CTX_RES_THU", 5: "CTX_RES_FRI", 6: "CTX_RES_SAT"};
var daysname = {0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY"};

exports.customizeResponse = function(object, input, response, decision, configs) {
	
	if(!object[constants.CTX_RES_COUNT] || object[constants.CTX_RES_COUNT] == 0) {
		return;
	}
	decision[constants.NA_RECORD] = false;
	filterResults(object, decision);

	if(decision[constants.NA_RECORD] === false) {
		decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_ELEVEN);
		decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
	}
}
//This function will update open close status for each record;
function filterResults(object, decision) {
	
	var naRecords = []; //Get all NA records
	var openRecords = []; //Get all records where status is open
	var closeRecords = []; // Get all records where status is closed

	if(object[constants.CTX_RES_COUNT] > 0) {
		var ob;
		
		if((ob = object) && (ob = ob.results) && (ob = ob.objects)) {
			for(var i=0; i < ob.length; i++) {
				if(isNARecord(ob[i])) {
					naRecords.push(ob[i]);

				} else {
					openRecords.push(ob[i]);
				}

			}
			if(openRecords.length === 0 && closeRecords.length === 0 && naRecords.length > 0) {
				decision[constants.NA_RECORD] = true;
			}
		}
	}
}
function isNARecord(nobj) {
	if(
		!nobj[constants.CTX_RES_WEEKDAY_START_TIME] &&
		!nobj[constants.CTX_RES_WEEKDAY_END_TIME] &&
		!nobj[constants.CTX_RES_WEEKEND_START_TIME] &&
		!nobj[constants.CTX_RES_WEEKEND_END_TIME] &&
		!nobj[constants.CTX_RES_MON_START_TIME] && 
		!nobj[constants.CTX_RES_MON_END_TIME] && 
		!nobj[constants.CTX_RES_TUE_START_TIME] && 
		!nobj[constants.CTX_RES_TUE_END_TIME] && 
		!nobj[constants.CTX_RES_WED_START_TIME] && 
		!nobj[constants.CTX_RES_WED_END_TIME] && 
		!nobj[constants.CTX_RES_THU_START_TIME] && 
		!nobj[constants.CTX_RES_THU_END_TIME] && 
		!nobj[constants.CTX_RES_FRI_START_TIME] && 
		!nobj[constants.CTX_RES_FRI_END_TIME] && 
		!nobj[constants.CTX_RES_SAT_START_TIME] && 
		!nobj[constants.CTX_RES_SAT_END_TIME] && 
		!nobj[constants.CTX_RES_SUN_START_TIME] && 
		!nobj[constants.CTX_RES_SUN_END_TIME]
	) {
		return true;
	} else {
		return false;
	}
}
