var constants = require('./../constants');

exports.customSorting = function(results, decision, input) {
	if(results && (results.length > 1)) {
        performResultSorting(results);
		if(decision[constants.ACTION_HANDLER] && 
			(decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_ACAD_EVENTS)) {
			sortByDate(results, input);
		} else if(decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_CAMPUS_EVENTS &&
			(!(constants.FILTERED_TEXT_SEARCH in decision) || decision[constants.FILTERED_TEXT_SEARCH] !== true )) {
				sortByDate(results, input);
		
		} else if(decision[constants.ACTION_HANDLER] === constants.INTENT_LOCATION) {
			sortByDistance(results);
		}
	}
}
function sortByDate(results, input) {
    if(input && constants.entities in input && input[constants.entities]) {
        var count = 0, date;
        for (var a in input[constants.entities]) {
            if(input[constants.entities][a][constants.entity] == "sys-date") {
                count++ ;
                date = input[constants.entities][a][constants.value];
                if(count > 1) {
                    break;
                }
            }
        }
        results.sort(function(a,b) {
            if(a[constants.RELAVANCE] == b[constants.RELAVANCE]) {
                if(a.START_DATE && b.START_TIME) {
                    if(count == 1 && date == b.START_DATE)
                        return 1;
                } else {
                    if(a.START_DATE === null && b.START_DATE === '') {
                        return -1;
                    } else if(a.START_DATE === '' && b.START_DATE === null) {
                        return 1;
                    } else if(!a.START_DATE) {
                        return -1;
                    } else if(!b.START_DATE) {
                        return 1;
                    } if(a.START_DATE && b.START_DATE) {
                        return new Date(a.START_DATE).getTime() - new Date(b.START_DATE).getTime();
                    } else {
                        return 0;
                    }
                }
            }
        });
    }
}

function sortByDistance(newresult) {
	newresult.sort(function(a, b) {
        if(a[constants.RELAVANCE] == b[constants.RELAVANCE] && a.sort && b.sort && 
            a.sort.length == 1 && b.sort.length == 1) {
                console.log("a dist"+ a['BLDG_NM']+"::"+a['DISTANCE']);
                return a.sort[0] - b.sort[0];
        } 
    });
}

function performResultSorting(results) {
	results.sort(function(a, b) {
        return b[constants.RELAVANCE] - a[constants.RELAVANCE];
    });
}