//DialogIdentifier

var constants = require('./../constants');
var util = require('./../util');

exports.resultFilter = function(output, decision, configs, input) {
	
	var i, leni, a, total, highest = 0, secondHighest=0;
	decision[constants.NUDGE_OPTIONS1] = [];
	var total = output[constants.CTX_RES_COUNT];
	var allentities = decision[constants.Entites];
	var wcsentities = decision[constants.WCS_ENTITIES];
	var contextentities = [];
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		contextentities = decision[constants.CONTEXT_ENTITIES];
	}
	var results = ((a=output[constants.results]) && (a=a[constants.objects])) ? a : {};
	var objectType = ((a=output[constants.results]) && (a=a[constants.objType])) ? a : ''; 
	leni = results.length;
	updateTopEntity(input, decision, wcsentities);
	if(total > 1) {
		for(i = 0; i < leni; i++) {
			a = results[i];
			let recordentities = [];
			let keyword = [];
			let secondary = [];
			recordentities.push(a[constants.CTX_RES_ENTITY_NAME]);
			if(a[constants.CTX_RES_KEYWORD]) {
				keyword = a[constants.CTX_RES_KEYWORD].toString().split(",");
				keyword = keyword.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(keyword);
			}
			if(a[constants.CTX_RES_SECONDARY_ENTITY]) {
				secondary = a[constants.CTX_RES_SECONDARY_ENTITY].toString().split(",");
				secondary = secondary.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(secondary);
			}
			if(!a[constants.RELAVANCE])
				a[constants.RELAVANCE] = calculateRelevance(wcsentities, contextentities, 
					allentities, recordentities, a, keyword, secondary);
			if(highest < a[constants.RELAVANCE]) {
				highest = a[constants.RELAVANCE];
			}
		}
		if(highest && (constants.rankingRange in configs) && (configs[constants.rankingRange] > 0)) {
			secondHighest = highest - configs[constants.rankingRange];
			if(secondHighest < 0) {
				secondHighest = 0;
			}
		}
		if(objectType === 'none') {
			secondHighest = highest;
		}
		let newresult = [];
		for(k in results) {
			if((a=results[k]) && ((a[constants.RELAVANCE] <= highest) && (a[constants.RELAVANCE] >= secondHighest))) {
				newresult.push(a);
			} else {
				decision[constants.NUDGE_OPTIONS1].push(a);
			}
		}
		customSorting(newresult, objectType, decision, input);
		entityNameSorting(newresult, wcsentities, highest);
		if(newresult.length > 1) {
			if(objectType === 'none') {
				if(configs && (constants.enableFollowUpOptions in configs) && configs[constants.enableFollowUpOptions]) {
					//commenting this block because after sorting and limiting to 5 if we get all nudge options of current intent then all 
					//these options will not be considered for nudbe option
					/*util.performSorting(newresult, constants.CTX_RES_ENTITY_NAME, constants.SORTING_ASCENDING);
					if(newresult.length > constants.MAX_FOLLOW_UP_OPTIONS) {
						newresult.splice(constants.MAX_FOLLOW_UP_OPTIONS);
					}*/
				} else {
					newresult.splice(1);
				}
			} else if((constants.resultLimit in configs) && configs[constants.resultLimit] > 0) {
				if(newresult.length > configs[constants.resultLimit]) {
					newresult.splice(configs[constants.resultLimit]);
				}
			}
		}
		if(newresult.length) {
			d = output[constants.results];
			d[constants.objects] = newresult;
		}
		
		a = newresult[0];
		for(k in a) {
			output[k] = a[k];
		}
		output[constants.CTX_RES_COUNT] = newresult.length;
		
	}
	return highest;
}

exports.addRelavanceAndSort = function(context, decision, input)
{
	var i, leni, a, total, relavance = 0;

	var total = context[constants.CTX_RES_COUNT];
	var allentities = decision[constants.Entites];
	var wcsentities = decision[constants.WCS_ENTITIES];
	var contextentities = [];
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		contextentities = decision[constants.CONTEXT_ENTITIES];
	}
	var results = ((a=context[constants.results]) && (a=a[constants.objects])) ? a : {};
	var objectType = ((a=context[constants.results]) && (a=a[constants.objType])) ? a : ''; 
	leni = results.length;
	updateTopEntity(input, decision, wcsentities);
	if(total > 1) {
		for(i = 0; i < leni; i++) {
			a = results[i];
			let recordentities = [];
			let keyword = [];
			let secondary = [];
			recordentities.push(a[constants.CTX_RES_ENTITY_NAME]);
			if(a[constants.CTX_RES_KEYWORD]) {
				keyword = a[constants.CTX_RES_KEYWORD].toString().split(",");
				keyword = keyword.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(keyword);
			}
			if(a[constants.CTX_RES_SECONDARY_ENTITY]) {
				secondary = a[constants.CTX_RES_SECONDARY_ENTITY].toString().split(",");
				secondary = secondary.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(secondary);
			}
			a[constants.RELAVANCE] = calculateRelevance(wcsentities, contextentities, allentities, 
				recordentities, a, keyword, secondary);
		}
	}
}


function performResultSorting(results) {
	results.sort(function(a, b) {
        return b[constants.RELAVANCE] - a[constants.RELAVANCE];
    });
}
var updateTopEntity = exports.updateTopEntity = function(input, decision, wcsentities) {
	if((constants.CONTEXTUAL_QUESTION in decision) && decision[constants.CONTEXTUAL_QUESTION]) {
		if(!wcsentities.length) {
			let ctx = input[constants.context] || {};
			let entities = ctx[constants.entities] || [];
			for(i=0; i< entities.length; i++) {
				etype = entities[i].entity;
				if(etype === constants.TOP_ENTITY_NAME) {
					wcsentities.push(entities[i].value);
				}
			}
		}
	}
}

function calculateRelevance(wcsentities, contextentities, allentities, recordentities, record, keyword, secondary) {
	let rel = getNumberOfPrimary(wcsentities, record, keyword) + getNumberOfSecondary(wcsentities, record, secondary);
	if(rel > 0) {
		rel += getWCSEntityRatio(wcsentities, recordentities) +  getContextualEntityRatio(contextentities, recordentities) - getNonInteractingEntityRatio(allentities, recordentities);
	}
	rel = parseFloat(rel).toFixed(2);
	return rel;
	
}

function getWCSEntityRatio(wcsentities, recordentities) {
	if(wcsentities.length === 0) {
		return 0;
	}
	let common = [];
	for(element in recordentities) {
		if(wcsentities.indexOf(recordentities[element]) !== -1) common.push(recordentities[element]);
	}
	return (common.length / wcsentities.length);
}
function getContextualEntityRatio(context, recordentities) {
	let common = [];
	for(element in recordentities) {
		if(context.indexOf(recordentities[element]) !== -1) common.push(recordentities[element]);
	}
	return (common.length * 0.1);
}
function getNonInteractingEntityRatio(allentities, recordentities) {
	let common = [];
	for(element in recordentities) {
		if(allentities.indexOf(recordentities[element]) === -1) common.push(recordentities[element]);
	}
	return (common.length * 0.01);
}
function getNumberOfPrimary(wcsentities, record, keyword) {
	let cnt = 0;
	let ln = wcsentities.length;
	for(i=0; i<ln; i++) {
		if(wcsentities[i] === record[constants.CTX_RES_ENTITY_NAME] || keyword.indexOf(wcsentities[i]) !== -1) {
			cnt += 2;
		}
	}
	return cnt;
}
function getNumberOfSecondary(wcsentities, record, secondary) {
	let cnt = 0;
	let ln = wcsentities.length;
	for(i=0; i<ln; i++) {
		if(record[constants.CTX_RES_SECONDARY_ENTITY] && secondary.indexOf(wcsentities[i]) !== -1) {
			cnt ++;
		}
	}
	return cnt;
}

exports.isValidResult = function(output, decision, input) {
	
	var i, leni, a, total, highest = 0;

	var total = output[constants.CTX_RES_COUNT];
	var allentities = decision[constants.Entites];
	var wcsentities = decision[constants.WCS_ENTITIES];
	var contextentities = decision[constants.CONTEXT_ENTITIES];
	var results = ((a=output[constants.results]) && (a=a[constants.objects])) ? a : {}; 
	leni = results.length;
	decision[constants.WCS_ENTITIES_RATIO] = 0;
	if(total > 0 && !wcsentities.length) {
		return 1;
	}
	updateTopEntity(input, decision, wcsentities);
	if(total > 0) {
		for(i = 0; i < leni; i++) {
			a = results[i];
			let recordentities = [];
			let keyword = [];
			let secondary = [];
			recordentities.push(a[constants.CTX_RES_ENTITY_NAME]);
			if(a[constants.CTX_RES_KEYWORD]) {
				keyword = a[constants.CTX_RES_KEYWORD].toString().split(",");
				keyword = keyword.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(keyword);
			}
			if(a[constants.CTX_RES_SECONDARY_ENTITY]) {
				secondary = a[constants.CTX_RES_SECONDARY_ENTITY].toString().split(",");
				secondary = secondary.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(secondary);
			}
			
			let ratio = getWCSEntityRatio(wcsentities, recordentities);
			if(ratio > decision[constants.WCS_ENTITIES_RATIO]) {
				decision[constants.WCS_ENTITIES_RATIO] = ratio;
			}
			a[constants.RELAVANCE] = calculateRelevance(wcsentities, contextentities, allentities, recordentities, a, keyword, secondary);
			if(highest < a[constants.RELAVANCE]) {
				highest = a[constants.RELAVANCE];
				break;
			}
		}	
	}
	return highest;
}
function entityNameSorting(newresult, wcsentities, highest) {
	if(newresult && (newresult.length > 1)) {
		let swap = '';
		if(Array.isArray(wcsentities) && wcsentities.length) {
			for(let k in newresult) {
				if(newresult[k][constants.RELAVANCE] == highest) {
					if(k && (wcsentities.indexOf(newresult[k][constants.CTX_RES_ENTITY_NAME]) !== -1)) {
						swap = newresult[k];
						newresult[k] = newresult[0];
						newresult[0] = swap;
						break;
					}
				}
			}
		}
	}
}
function customSorting(results, objectType, decision, input) {
	if(results && (results.length > 1)) {
		if(decision[constants.ACTION_HANDLER] && 
			(decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_ACAD_EVENTS
				|| decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_ASSIGNMENT_EVENTS)) {
			sortByDate(results);
		} else if(decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_CAMPUS_EVENTS &&
			(!(constants.FILTERED_TEXT_SEARCH in decision) || decision[constants.FILTERED_TEXT_SEARCH] !== true )) {
				sortByDate(results);
		
		} else if(decision[constants.ACTION_HANDLER] === constants.INTENT_LOCATION) {
			sortByDistance(results);
		}

		performResultSorting(results);
	}
}
function sortByDate(results) {
	results.sort(function(a, b) {
		if(a.CTX_RES_START_DATE && b.CTX_RES_START_DATE) {
			return new Date(a.CTX_RES_START_DATE).getTime() - new Date(b.CTX_RES_START_DATE).getTime();
		} else { 
			if(a.CTX_RES_START_DATE === null && b.CTX_RES_START_DATE === '') {
				return -1;
			} else if(a.CTX_RES_START_DATE === '' && b.CTX_RES_START_DATE === null) {
				return 1;
			} else if(!a.CTX_RES_START_DATE) {
				return -1;
			} else if(!b.CTX_RES_START_DATE) {
				return 1;
			} else {
				return 0;
			}
		}
	});
}

function sortByDistance(newresult) {
	newresult.sort(function(a, b) {
		console.log("a dist"+ a['CTX_RES_BLDG_NM']+"::"+a['CTX_RES_DISTANCE']);
        return a[constants.CTX_RES_DISTANCE] - b[constants.CTX_RES_DISTANCE];
    });
}