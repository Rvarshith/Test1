const constants = require('./../constants'),
util = require('./../util');

function addFollowUPOptions(input, response, decision, configuration) {
    try {
		if(configuration && (constants.enableFollowUpOptions in configuration) && configuration[constants.enableFollowUpOptions]) {	
			let a, i;
			let temp = [];
			let temp2 = [];
			let duplicateCheck = [];

			if((constants.showFollowUp in decision) && decision[constants.showFollowUp]) {
				response[constants.results][constants.objType] = constants.ObjectTypeFollowUp;
				let objects = response[constants.results][constants.objects];
				for(i=0; i<objects.length; i++) {
					let recordentities = util.getRecordEntities(objects[i]);
					let re = ''
					if(Array.isArray(recordentities) && recordentities.length) {
						re = recordentities.join();
					}
					let prefix = '';
					if(!objects[i][constants.CTX_RES_IS_DEFAULT]) objects[i][constants.CTX_RES_IS_DEFAULT] = 0;
					
					if(configuration[constants.isSpecialBot]) {
						//temp.push({key: process.env.EBSP_ENVIRONMENT + '#' + objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_ENTITY_NAME]+'|'+re, value:'' + objects[i][constants.CTX_RES_ENTITY_NAME]});
						temp.push({isDefault:objects[i][constants.CTX_RES_IS_DEFAULT], key: process.env.EBSP_ENVIRONMENT + '#' + objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_UNIQUE_ID], value:'' + objects[i][constants.CTX_RES_ENTITY_NAME]});
					} else {
						//temp.push({key:objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_ENTITY_NAME]+'|'+re, value:'' + objects[i][constants.CTX_RES_ENTITY_NAME]});
						temp.push({isDefault:objects[i][constants.CTX_RES_IS_DEFAULT], key:objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_UNIQUE_ID], value:'' + objects[i][constants.CTX_RES_ENTITY_NAME]});
					}
				}
				util.performSorting(temp, constants.value, constants.SORTING_ASCENDING);
				bringDefaultOnTop(temp);

				if(temp.length > constants.MAX_FOLLOW_UP_OPTIONS) {
					temp.splice(constants.MAX_FOLLOW_UP_OPTIONS);
				}
				response[constants.results][constants.objects] = temp;
				if(response && response[constants.output]) {
					response[constants.output][constants.CTX_RES_COUNT] = temp.length;
				}
				decision[constants.CTX_RES_COUNT] = temp.length;
			}
		}
    } catch(e) {
        console.log(e);
    }
}

function bringDefaultOnTop(temp) {
	util.performSorting(temp, constants.isDefault, constants.SORTING_DESCENDING);
	for(let i in temp) {
		if(temp[i] && (constants.isDefault in temp[i])) delete temp[i][constants.isDefault];
	}
}
function addNudgeOptions2(input, response, decision, configuration) {
console.log("addNudgeOptions2");
	if(configuration && (constants.enableFollowUpOptions in configuration) && configuration[constants.enableFollowUpOptions]) {
		let a, i, objects;
		let temp = [];
		let objectType = ((a=response[constants.results]) && (a=a[constants.objType])) ? a : ''; 
		//if((objectType === constants.ObjectTypeNone) && (output[constants.CTX_RES_COUNT] === 1)) {
			//if((objectType === constants.ObjectTypeNone) && (constants.showFollowUp in decision) && !decision[constants.showFollowUp]) {
			//Removing object none condition as we need to show these options for both structure and non structure data
			if((constants.showFollowUp in decision) && !decision[constants.showFollowUp] && (constants.showNudges in decision) && decision[constants.showNudges]) {
			//Check if we have nudge options in decision array
			if(decision && (constants.NUDGE_OPTIONS in decision) && Array.isArray(decision[constants.NUDGE_OPTIONS])) {
				let el = decision[constants.NUDGE_OPTIONS][0];
				////Check if nudge option query get fired successfully
				//Check if nudge option query get fired successfully
				//if(el && (constants.StatusCode in el) && (el[constants.StatusCode] === constants.STATUS_SUCCESS) && (el[constants.ACTION_HANDLER] === constants.AH_NO_INTENT)) {
				if(el && (constants.StatusCode in el) && (el[constants.StatusCode] === constants.STATUS_SUCCESS)) {
					//Check we got results by nudge query
					if((constants.output in el) && (p=el[constants.output]) && (constants.CTX_RES_COUNT in p) && (p[constants.CTX_RES_COUNT] > 0) && (constants.STEP_COUNTER in p) && (p[constants.STEP_COUNTER] <= constants.STEP_P_PLUS_K)) {
						objects = p[constants.results][constants.objects];
						if(decision[constants.ACTION_HANDLER] === constants.INTENT_UNSTRUCTURED) {
							//objects.splice(0,1);
							//p[constants.CTX_RES_COUNT] = objects.length;
						}
						for(i=0; i<objects.length; i++) {
							//Check intent of nudge options are not same.
							//if(objects[i][constants.CTX_RES_INTENT] != decision[constants.ACTION_HANDLER]) {
								let recordentities = util.getRecordEntities(objects[i]);
								let re = ''
								if(Array.isArray(recordentities) && recordentities.length) {
									re = recordentities.join();
								}
                                
								//temp.push({key:objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_ENTITY_NAME]+'|'+re, value:objects[i][constants.CTX_RES_ENTITY_NAME] });
								temp.push({key:objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_UNIQUE_ID], value:objects[i][constants.CTX_RES_ENTITY_NAME] });
                              
							//}
						}
					}
				}
				//util.performSorting(temp, constants.value, constants.SORTING_ASCENDING);
				if(temp.length > constants.MAX_FOLLOW_UP_OPTIONS) {
					temp.splice(constants.MAX_FOLLOW_UP_OPTIONS);
				}
				response[constants.NUDGE_OPTIONS] = temp;
			}
		}
	}
}

function addNudgeOptions(input, response, decision, configuration) {
	let objects, temp=[];
	console.log("addNudgeOptions---");
	if(configuration && (constants.enableFollowUpOptions in configuration) && configuration[constants.enableFollowUpOptions]) {
		if((constants.showFollowUp in decision) && !decision[constants.showFollowUp] && (constants.showNudges in decision) && decision[constants.showNudges]) {
			if(decision && (constants.NUDGE_OPTIONS in decision) && Array.isArray(decision[constants.NUDGE_OPTIONS]) && decision[constants.NUDGE_OPTIONS].length) {
				objects = decision[constants.NUDGE_OPTIONS];
				for(i=0; i<objects.length; i++) {
					let recordentities = util.getRecordEntities(objects[i]);
					let re = ''
					if(Array.isArray(recordentities) && recordentities.length) {
						re = recordentities.join();
					}
                    //temp.push({key:objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_ENTITY_NAME]+'|'+re, value:objects[i][constants.CTX_RES_ENTITY_NAME] });
					temp.push({key:objects[i][constants.CTX_RES_INTENT]+':'+objects[i][constants.CTX_RES_UNIQUE_ID], value:objects[i][constants.CTX_RES_ENTITY_NAME] });
				}

				//util.performSorting(temp, constants.value, constants.SORTING_ASCENDING);
				if(temp.length > constants.MAX_FOLLOW_UP_OPTIONS) {
					temp.splice(constants.MAX_FOLLOW_UP_OPTIONS);
				}
				response[constants.NUDGE_OPTIONS] = temp;
			}
		}
	}
}
function mergeNudges(output, decision, configuration) {

	let uniqueIDs = getUniqueIDS(output);

	if((constants.showFollowUp in decision) && !decision[constants.showFollowUp] && 
	(constants.showNudges in decision) && decision[constants.showNudges]) {
		
		let nudges = [];
		
		if(decision && (constants.NUDGE_OPTIONS1 in decision) && decision[constants.NUDGE_OPTIONS1].length) {
			nudges = decision[constants.NUDGE_OPTIONS1];
		}
		if(decision && (constants.NUDGE_OPTIONS2 in decision) && decision[constants.NUDGE_OPTIONS2].length) {
			if(nudges.length < 4) {
				decision[constants.NUDGE_OPTIONS2].forEach(a => {
					if(isUniqueRecord(a, uniqueIDs)) {
						uniqueIDs = [...uniqueIDs, a._id];
						nudges = [...nudges, a];
					}
				});
			}
		}
		if(nudges.length === 0) {
			nudges = addNoIntentNudge(decision, nudges, uniqueIDs);
		} else if(nudges.length  && (constants.MERGE_ACROSS_INTENT_NUDGES in configuration) && configuration[constants.MERGE_ACROSS_INTENT_NUDGES]) {
			nudges = addNoIntentNudge(decision, nudges, uniqueIDs);
		} 
		decision[constants.NUDGE_OPTIONS] = nudges;
	}
	console.log(output);
}
function getUniqueIDS(output) {
	let uniqueIDs = [];
	if(output && output.results && output.results.objects && Array.isArray(output.results.objects)
	 && output.results.objects.length) {
		output.results.objects.forEach( a => {
			if(a._id) {
				uniqueIDs = [...uniqueIDs, a._id];
				delete a._id;
			}
		})
	}
	return uniqueIDs;
}
function isUniqueRecord(a, uniqueIDs) {
	if(a._id) {
		if(uniqueIDs.indexOf(a._id) !== -1) {
			return false;
		} else {
			return true;
		}
	}
	return true;
}
function addNoIntentNudge(decision, nudges, uniqueIDs) {
	let p;
	if(decision && (constants.NUDGE_OPTIONS in decision) && Array.isArray(decision[constants.NUDGE_OPTIONS])) {
		let el = decision[constants.NUDGE_OPTIONS][0];
		if((constants.output in el) && (p=el[constants.output]) && (constants.CTX_RES_COUNT in p) && 
			(p[constants.CTX_RES_COUNT] > 0) && (constants.STEP_COUNTER in p) && (p[constants.STEP_COUNTER] <= constants.STEP_P_PLUS_K)) {
			
			let objects = p[constants.results][constants.objects];
			if(Array.isArray(objects)) {
				objects.forEach(a => {
					if(isUniqueRecord(a, uniqueIDs)) {
						uniqueIDs = [...uniqueIDs, a._id];
						nudges = [...nudges, a];
					}
				});
			}
		}
		return nudges;
	}
}
module.exports.mergeNudges = mergeNudges
module.exports.addFollowUPOptions = addFollowUPOptions
module.exports.addNudgeOptions = addNudgeOptions
