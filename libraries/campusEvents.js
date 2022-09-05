const constants = require('../constants');
const util = require('../util');
exports.hasToRemoveEntitySearch = function(decision, dateOptions, filteredText) {
    
    if((constants.Entites in decision) && !dateOptions[constants.locationName] && !dateOptions[constants.sys_person] && filteredText === '') {
        return true;         
    } else {
        return false;
    }
}
exports.filterInput = function(input, actionmap) { //
    var a;
    var literals = ((a=input[constants.context]) && (a=a[constants.literalEntities])) ? a : [];

	var sentence = input.text;
	var words = util.at_xpath(actionmap.parentNode.parentNode, "FilterWords/@words", 1);
	var str = '';
	words = JSON.parse(words);
	if (sentence) {
		
		for(k in literals) {
            a = literals[k] || {};
			if(a && (a[constants.entity]) && (!util.checkNonSysEntities(a[constants.entity]) || util.isEntityNoun(a[constants.entity]))) {
                if(a && (a[constants.literal]) && (sentence.indexOf(a[constants.literal]))) {
                    sentence = sentence.replace(a[constants.literal], '');
                }
            }
		}
		
		sentence = sentence.toString().replace(/\.|\?/g, "");
		sentence = sentence.replace(/\//g,' ');
		arr = sentence.split(' ');
		
		for(var i=0; i < arr.length; i++) {
			if((a = arr[i]) && (words.indexOf(a.toUpperCase()) == -1)) {
				if(str == '') str = a;
				else str = str+' '+a;
			}
		}
	}
	if(str) {
		str = str.replace(/\s+/g, '*');
	}
	
	return str;
}

exports.filterTextInput = function(input, configuration) { //
    var a;
    var literals = ((a=input[constants.context]) && (a=a[constants.literalEntities])) ? a : [];

	var sentence = input.text;
	var words = (configuration && configuration[constants.FilterWords]) ? configuration[constants.FilterWords] : [];
	var str = '';
	//words = JSON.parse(words);
	if (sentence) {
		
		for(k in literals) {
            a = literals[k] || {};
			if(a && (a[constants.entity]) && (!util.checkNonSysEntities(a[constants.entity]) || util.isEntityNoun(a[constants.entity]))) {
                if(a && (a[constants.literal]) && (sentence.indexOf(a[constants.literal]))) {
                    sentence = sentence.replace(a[constants.literal], '');
                }
            }
		}
		
		sentence = sentence.toString().replace(/\.|\?/g, "");
		sentence = sentence.replace(/\//g,' ');
		arr = sentence.split(' ');
		
		for(var i=0; i < arr.length; i++) {
			if((a = arr[i]) && (words.indexOf(a.toUpperCase()) == -1)) {
				if(str == '') str = a;
				else str = str+' '+a;
			}
		}
	}
	if(str) {
		str = str.replace(/\s+/g, '*');
	}
	
	return str;
}