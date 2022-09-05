const unstructuredQuery = require('./unstructuredQuery.js');
const structuredQuery = require('./structuredQuery.js');
const util = require('./../util.js');
const constants = require('./../constants.js');
const nudgeFollowUp = require('./../libraries/nudgesFollowUp');
const nudge_util = require('./nudge_util.js');
const ranking = require('./../libraries/ranking');
var fs = require('fs');

exports.getNudges = function (input, decision, response) {
    // we are looking at intents in decision object reather than input object.
    // Decision object will have primary intent and secondary intent
    //for nudges we will consider only primary intent
    // When we are looking across unstructured data we will have to consider only functional intent
    // which is other than structure and generic intent

    //check if we have primary intent in decision object
    // and this intent should be functional intent
    // we should also have entities to get nudges

    return new Promise((success, fail) => {
    var output = {};
    var actionmap, handler;
    var unstructuredOutput = [];
    var structuredOutput = [];
    var configs = (response && response.configs) ? response.configs : {};
       
    let nudgeEntities = "";

    //We are always considering data entities for fetching nudges but according to the configuration property FetchNudgesFromDataRecords, if it is true we need to consider data entities, else we need to consider triggered and filtered entities.
 
    if (((decision[constants.dataRecord][constants.IS_DEFAULT] != constants.IS_DEFAULT_VALUE) && 
                    configs && configs[constants.FetchNudgesFromDataRecords]) 
                    || 
            (input && (constants.apiId in input) && (input[constants.apiId] === constants.API_FOLLOW_UP_QUESTION))){
        if(decision && decision[constants.dataEntities] && Array.isArray(decision[constants.dataEntities])) {
            nudgeEntities = decision[constants.dataEntities].join(',');
        }
    } else {
        nudgeEntities = decision[constants.Entites]
    }
    
    decision[constants.nudgeEntities] = nudgeEntities.toString().split(",");
    
    var promise1 = new Promise((resolve, reject) => {
        actionmap = util.parse(fs.readFileSync(__dirname + '/unstructuredMap.xml', {
            encoding: 'utf8'
        }));
        console.log("current directory::" + __dirname);
        unstructuredQuery.run(actionmap, decision, response, input, output, false, function (e) {
            if (e) {
                console.log("output is::" + output + ":::error is::" + e);
                reject(e);
            } else {
                console.log("output is::" + JSON.stringify(decision[constants.NUDGE_OPTIONS]));
                unstructuredOutput = decision[constants.NUDGE_OPTIONS];
                resolve(unstructuredOutput);
            }
        });
    })

    var promise2 = new Promise((resolve, reject) => {
        actionmap = util.parse(fs.readFileSync(__dirname + '/structuredMap.xml', {
            encoding: 'utf8'
        }));
        structuredQuery.run(actionmap, decision, response, output, false, function (e) {
            if (e) {
                console.log("output is::" + output + ":::error is::" + e);
                reject(e);
            } else {
                console.log("output is::" + JSON.stringify(decision[constants.NUDGE_OPTIONS]));
                structuredOutput = decision[constants.NUDGE_OPTIONS];
                resolve(structuredOutput);
            }
        });
    })

    Promise.all([promise1, promise2]).then((results) => {
        //var recordsForRanking = unstructuredOutput.concat(structuredOutput);
        var recordsForRanking = unstructuredOutput;
        util.performSorting(recordsForRanking, constants.RELAVANCE, constants.SORTING_DESCENDING);
        decision[constants.NUDGE_OPTIONS] = recordsForRanking;
        nudge_util.addNudgeOptions(input, response, decision, configs);
        console.log("response is::" + JSON.stringify(response[constants.NUDGE_OPTIONS]));
		success(response[constants.NUDGE_OPTIONS]);
    }).catch((error) => {
        console.log(error);
		fail(error);
    });
});

}
