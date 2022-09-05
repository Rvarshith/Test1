var util = require('./../../util.js'),
constants = require('./../../constants.js');
const dtpl = require('./../../load-conf-tpl');

exports.customizeResponse = function(object, input, decision, configs) {
	let count = decision[constants.CTX_RES_COUNT] || 0;
		
	if(count < 1) {
		return false;
	}
	
	let currDateTime = util.getCurrentDateTime(configs[constants.Timezone]);
	let currDate = currDateTime.split(' ')[0];
	
	//Check if both dates are present in record
	if((object[constants.CTX_RES_START_DATE]) && (object[constants.CTX_RES_END_DATE])) {
		if(object[constants.CTX_RES_START_DATE] == object[constants.CTX_RES_END_DATE]) { //start & end date are same
			if(util.compareDate(currDate, object[constants.CTX_RES_END_DATE]) === 1) {
				decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THIRTEEN);
			} else {
				decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_TWELVE);
			}
		} else {//start & end dates are different
			if(util.compareDate(currDate, object[constants.CTX_RES_END_DATE]) === 1) {
				decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_FIFTEEN);
			} else {
				decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_FOURTEEN);
			}
		}
		//if record has just start date and end date is null or blank
	} else if((object[constants.CTX_RES_START_DATE])) {
		if(util.compareDate(currDate, object[constants.CTX_RES_START_DATE]) === 1) {
			decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THIRTEEN);
		} else {
			decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.BOT_Campus, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_TWELVE);
		}
	}
	
	decision[constants.START_DATE] = util.getFormattedDate(object[constants.CTX_RES_START_DATE], configs[constants.DATE_FORMAT]);
	decision[constants.END_DATE] = util.getFormattedDate(object[constants.CTX_RES_END_DATE], configs[constants.DATE_FORMAT]);
	decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_RULE_ONE;
}
