var constants = require('../constants');
var resultFilter = require('./resultFilter');
var util = require('./../util');
var sorting = require('./sorting');

//To rank and sort elastic data
exports.RankingAndSort = function(recordsForRanking, decision, input, rankingForNudges, considerIntent)
{
	var i, a, total, contextentities=[], allentities = [];
	var referenceSecondary = [], referenceKeyword = [];

	var total = recordsForRanking.length;
	if(rankingForNudges == true) {
		allentities = decision[constants.nudgeEntities];
		referenceKeyword = decision[constants.dataRecord][constants.KEYWORD].toString().split(",");
		referenceKeyword = referenceKeyword.map(function (val) { return val.toString().trim(); });
		referenceSecondary = decision[constants.dataRecord][constants.SECONDARY_ENTITY_NAME].toString().split(",");
		referenceSecondary = referenceSecondary.map(function (val) { return val.toString().trim(); });
	} else {
		allentities = decision[constants.Entites];
	}
	if((constants.CONTEXT_ENTITIES in decision) && decision[constants.CONTEXT_ENTITIES]) {
		contextentities = decision[constants.CONTEXT_ENTITIES];
	}
	resultFilter.updateTopEntity(input, decision, allentities);
	if(total > 0) {
		for(i = 0; i < total; i++) {
			a = recordsForRanking[i];
			let recordentities = [];
			let keyword = [];
			let secondary = [];
			//recordentities.push(a[constants.ENTITY_NAME]);
			if(a[constants.KEYWORD]) {
				keyword = a[constants.KEYWORD].toString().split(",");
				keyword = keyword.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(keyword);
			}
			if(a[constants.SECONDARY_ENTITY_NAME]) {
				secondary = a[constants.SECONDARY_ENTITY_NAME].toString().split(",");
				secondary = secondary.map(function (val) { return val.toString().trim(); });
				recordentities = recordentities.concat(secondary);
			}
			if(rankingForNudges == false) {
				a[constants.RELAVANCE] = calculateRelevance(decision, contextentities, 
					allentities, recordentities, a, keyword, secondary, considerIntent);
			} else {
				a[constants.RELAVANCE] = calculateRelevanceForNudges(allentities, 
					contextentities, recordentities, keyword, secondary, referenceKeyword, referenceSecondary);
			}	
		}
		sorting.customSorting(recordsForRanking, decision, input);
	}
}

var calculateRelevance = exports.calculateRelevance = function (decision, contextentities, allentities, 
	recordentities, record, keyword, secondary, considerIntent) {
	let rel = 0;
	if(considerIntent != false) {
		if(constants.intentsIdentified in decision && decision[constants.intentsIdentified] && 
			constants.primary in decision[constants.intentsIdentified] && decision[constants.intentsIdentified][constants.primary]) {
			var decisionIntent = decision[constants.intentsIdentified][constants.primary][constants.intent];
			if(constants.INTENT in record && record[constants.INTENT]) {
				rel = primaryIntentMatch(decisionIntent, record[constants.INTENT]);
			}
			else if(constants.CTX_RES_INTENT in record && record[constants.CTX_RES_INTENT]) {
				rel = primaryIntentMatch(decisionIntent, record[constants.CTX_RES_INTENT]);
			}
		}
		if(constants.intentsIdentified in decision && decision[constants.intentsIdentified] &&
			constants.secondary in decision[constants.intentsIdentified] && decision[constants.intentsIdentified][constants.secondary]) {
			var decisionIntent = decision[constants.intentsIdentified][constants.secondary][constants.intent];
			if(constants.SECONDARY_INTENT in record && record[constants.SECONDARY_INTENT]) {
				rel+= secondaryIntentMatch(decisionIntent, record[constants.SECONDARY_INTENT]);
			} 
			else if(constants.CTX_RES_SECONDARY_INTENT in record && record[constants.CTX_RES_SECONDARY_INTENT]) {
				rel+= secondaryIntentMatch(decisionIntent, record[constants.CTX_RES_SECONDARY_INTENT]);
			} 
		}
	}
	let entititesRel = keywordEntityMatchData(allentities, keyword) + 
					    secondaryEntityMatchData(allentities, secondary);
	if(entititesRel > 0) {
		if(decision && decision[constants.CONTEXTUAL_QUESTION])
			rel += entititesRel + getWCSEntityRatio(allentities, recordentities) +  
				getContextualEntityRatio(contextentities, recordentities) - 
				getNonInteractingEntityRatio(allentities, recordentities);
		else
			rel += entititesRel + getWCSEntityRatio(allentities, recordentities) - 
					getNonInteractingEntityRatio(allentities, recordentities);
	}
	rel = parseFloat(rel).toFixed(2);
	rel = parseFloat(rel); //to convert string to float
	return rel;
	
}

var calculateRelevanceForNudges = exports.calculateRelevanceForNudges = function (allentities, 
	contextentities, recordentities, keyword, secondary, referenceKeyword, referenceSecondary) {
	let rel = 0;
	let entititesRel = keywordMatchKeywordNudge(referenceKeyword, keyword) + 
					    keywordMatchNonKeywordNudge(referenceKeyword, allentities, keyword) + secondaryMatchNudge(allentities, secondary);
	if(entititesRel > 0) {
		rel += entititesRel + getWCSEntityRatio(allentities, recordentities) +  getContextualEntityRatio(contextentities, recordentities) - getNonInteractingEntityRatio(allentities, recordentities);
	}
	rel = parseFloat(rel).toFixed(2);
	rel = parseFloat(rel); //to convert string to float
	return rel;
	
}

function primaryIntentMatch(decisionIntent, intent) {
	let cnt = 0;
	if(decisionIntent == intent) {
		cnt = 4;
		return cnt;
	} else {
		return cnt;		
	}
}

function secondaryIntentMatch(decisionIntent, record) {
	let cnt = 0;
	if(decisionIntent == record[constants.SECONDARY_INTENT]) {
		cnt = 3;
		return cnt;
	} else {
		return cnt;		
	}
}

function keywordEntityMatchData(allentities, keyword) {
	let cnt = 0;
	if(keyword.length != 0) {
		let ln = allentities.length;
		for(i=0; i<ln; i++) {
			if(keyword.indexOf(allentities[i]) !== -1) {
				cnt += 2;
			}
		}
	}
	return cnt;
}

function secondaryEntityMatchData(allentities, secondary) {
	let cnt = 0;
	if(secondary.length != 0) {
		let ln = allentities.length;
		for(i=0; i<ln; i++) {
			if(secondary.indexOf(allentities[i]) !== -1) {
				cnt += 1;
			}
		}
	}
	return cnt;
}

function keywordMatchKeywordNudge(referenceKeyword, keyword) {
	let cnt = 0;
	if(referenceKeyword.length != 0) {
		let ln = keyword.length;
		for(i=0; i<ln; i++) {
			if(keyword.indexOf(referenceKeyword[i]) !== -1) {
				cnt += 3;
			}
		}
	}
	return cnt;
}

function keywordMatchNonKeywordNudge(referenceKeyword, allentities, keyword) {
	let cnt = 0;
	if(allentities.length != 0) {
		let ln = allentities.length;
		for(j=0; j<ln; j++) {
			for(i=0; i<referenceKeyword.length; i++) {
				if(allentities[j] != referenceKeyword[i] && keyword.indexOf(allentities[j]) !== -1) {
					cnt += 2;	 
				}
			}
		}
	}
	return cnt;
}

function secondaryMatchNudge(allentities, secondary) {
	let cnt = 0;
	if(secondary.length != 0) {
		let ln = secondary.length;
		for(i=0; i<ln; i++) {
			if(allentities.indexOf(secondary[i]) !== -1) {
				cnt += 1;
			}
		}
	}
	return cnt;
}

function getWCSEntityRatio(entitiesReferredTo, recordentities) {
	if(entitiesReferredTo.length === 0) {
		return 0;
	}
	let common = [];
	for(element in recordentities) {
		if(entitiesReferredTo.indexOf(recordentities[element]) !== -1) common.push(recordentities[element]);
	}
	return (common.length / entitiesReferredTo.length);
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

//To rank and sort CTX_RES data
exports.RankingAndSortForContext = function(recordsForRanking, decision, input, rankingForNudges)
{
	var i, leni, a, total, relavance = 0;

	var total = recordsForRanking.length;
	var allentities = decision[constants.Entites];
	var contextentities = [];
	if((constants.CONTEXT_ENTITIES in decision) && decision[constants.CONTEXT_ENTITIES]) {
		contextentities = decision[constants.CONTEXT_ENTITIES];
	}
	resultFilter.updateTopEntity(input, decision, allentities);
	if(total > 1) {
		for(i = 0; i < total; i++) {
			a = a = recordsForRanking[i];
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
			if(rankingForNudges == false) {
				a[constants.RELAVANCE] = calculateRelevance(decision, contextentities, 
					allentities, recordentities, a, keyword, secondary);
			} else {
				a[constants.RELAVANCE] = calculateRelevanceForNudges(allentities, 
					contextentities, recordentities, keyword, secondary, referenceKeyword, referenceSecondary);
			}	
		}
		util.performSorting(recordsForRanking, constants.RELAVANCE, constants.SORTING_DESCENDING);
	}
}
