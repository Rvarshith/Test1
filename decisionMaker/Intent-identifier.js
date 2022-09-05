const constants = require('./../constants');
const dtpl = require('./../load-conf-tpl');
const util = require('./../util');

/*
    Would update decision object with primary and seconadry intent detail like
    intentsIdentified: {
        "primary": {
            "ïntent": "2_location",
            "handler": "Location",
            "type": "Structured",
            "objectType": "2"
        }
        "secondary": {
            "ïntent": "admission_apply",
            "handler": "Unstructured",
            "type": "Unstructured",
            "objectType": "none"
        }
    }

    We would need input json which has wcs intent and entities identified. It should also have filtered entities.

    Above intentsIdentified JSON would be part of decision JSON.
 */

exports.getPrimaryAndSecondaryIntent = function(input, decision, config) {

    try {
        decision[constants.intentsIdentified] = {};
        var firstIntent, secondIntent, thirdIntent;
        var firstIntentType, secondIntentType, thirdIntentType, inputIntents; 
        if(input)
        {
            if(constants.intents in input && input[constants.intents]) {
                inputIntents = input[constants.intents];
            }
            if(inputIntents && inputIntents.length > 0 && inputIntents[0] ) {
                var intentList = dtpl.getIntentList();
                firstIntent = inputIntents[0][constants.intent];
				let intentDetails = intentList[firstIntent];

               if (intentDetails && ((intentDetails[constants.handler] === constants.ACTION_HANDLER_LOCATION) 
                || (intentDetails[constants.handler] === constants.ACTION_HANDLER_CONTACT))) {
                    firstIntent = config[constants.INTENT_LC_UNSTRUCTURED];

                } else if (intentDetails && ((intentDetails[constants.handler] === constants.ACTION_HANDLER_TIMING) 
                || (intentDetails[constants.handler] === constants.INTENT_FIRSTDAY) 
                || (intentDetails[constants.handler] === constants.INTENT_LASTDAY) 
                || (intentDetails[constants.handler] === constants.ACTION_HANDLER_ACAD_EVENTS))) {
                    firstIntent = config[constants.INTENT_TIMING_UNSTRUCTURED];
                }
                firstIntentType = identifyIntentType(firstIntent,intentList);
                //if primary intent is Generic it will be pickes as primary intent then we will come out
                if(firstIntentType != constants.FunctionalIntent) {
                    decision[constants.intentsIdentified][constants.primary] = intentList[firstIntent];
                } else {
                    let primary = {};
                    primary[constants.intent] = firstIntent;
                    primary[constants.handler] = constants.Unstructured;
                    primary[constants.type] = constants.Unstructured;
                    primary[constants.objectType] = constants.ObjectTypeNone;
                    decision[constants.intentsIdentified][constants.primary] = primary;
                }
            }
            if(firstIntentType == constants.Generic || config[constants.considerSecondaryIntent] == false) {
                return;
            } else {
                if(inputIntents[1]) {
                    secondIntent = inputIntents[1][constants.intent];
                    secondIntentType = identifyIntentType(secondIntent,intentList);
                    if(inputIntents[2]) {
                        thirdIntent = inputIntents[2][constants.intent];
                        thirdIntentType = identifyIntentType(thirdIntent,intentList);
                    }
                    if(firstIntentType == constants.FunctionalIntent) {
                        if(secondIntentType != constants.FunctionalIntent && secondIntentType != constants.Generic) {
                            decision[constants.intentsIdentified][constants.secondary] = intentList[secondIntent];
                            return;
                        } else if(thirdIntentType && thirdIntentType != constants.FunctionalIntent && thirdIntentType != constants.Generic) {
                            decision[constants.intentsIdentified][constants.secondary] = intentList[thirdIntent];
                            return;
                        }
                    } else if (firstIntentType == constants.Structured) {
                        if(secondIntentType != constants.Structured && secondIntentType != constants.Generic) {
                            var secondary = {};
                            secondary[constants.intent] = secondIntent;
                            secondary[constants.handler] = constants.Unstructured;
                            secondary[constants.type] = constants.Unstructured;
                            secondary[constants.objectType] = constants.ObjectTypeNone;
                            decision[constants.intentsIdentified][constants.secondary] = secondary;
                            return;
                        } else if(thirdIntentType && thirdIntentType != constants.Structured && thirdIntentType != constants.Generic) {
                            var secondary = {};
                            secondary[constants.intent] = thirdIntent;
                            secondary[constants.handler] = constants.Unstructured;
                            secondary[constants.type] = constants.Unstructured;
                            secondary[constants.objectType] = constants.ObjectTypeNone;
                            decision[constants.intentsIdentified][constants.secondary] = secondary;
                            return;
                        }
                    }
                }
            }      
        }
        else{
            util.print("\n Intent decision making error, no input variable: ", input);
            console.log(`\\n Intent decision making error, no input variable: ${input}`);
        }
    }
    catch(e) {
        util.print("\n Intent decision making error: ", e);
        console.log(`\\n Intent decision making error: ${e}`);
    }
}

function identifyIntentType(intent,intentList) {  
    if(!util.isEmpty(intentList)) {
        if(typeof(intentList[intent]) === 'object') {
            var type = intentList[intent][constants.type];
            return type;
        } else if(typeof(intentList[intent]) === 'undefined') {
            console.log("functional intent");
            return constants.FunctionalIntent;
        } else {
            console.log("Error in finding the type");
            return "Error in finding the type";
        }
    } else {
        return "intentList is empty";
    }
}

function identifyIntentHandler(intent,intentList) {  
    if(!util.isEmpty(intentList)) {
        if(typeof(intentList[intent]) === 'object') {
            var handler = intentList[intent][constants.handler];
            return handler;
        } else if(typeof(intentList[intent]) === 'undefined') {
            console.log("functional intent");
            return constants.Unstructured;
        } else {
            console.log("Error in finding the handler");
            return "Error in finding the handler";
        }
    } else {
        return "intentList is empty";
    }
}

exports.getAcademicEventHandler = function() {
    var intentList = dtpl.getIntentList();
    var handler = identifyIntentHandler("2_academic_event",intentList);
    return handler;
}

exports.getTimingHandler = function() {
    var intentList = dtpl.getIntentList();
    var handler = identifyIntentHandler("2_timing",intentList);
    return handler;
}

exports.getLocationHandler = function() {
    var intentList = dtpl.getIntentList();
    var handler = identifyIntentHandler("2_location",intentList);
    return handler;
}

exports.getPrimaryAndSecondaryIntentForFollowUp = function(input, decision, config) {
    
    if(input && (input.apiId === constants.API_FOLLOW_UP_QUESTION)) {
        let primary = {};
        firstIntentType = identifyIntentType(firstIntent,intentList);
        
        primary[constants.intent] = firstIntent;
        if(intentDetails) {
            primary[constants.handler] = intentDetails[constants.handler];
            primary[constants.type] = intentDetails[constants.type];
            primary[constants.objectType] = intentDetails[constants.objectType];
            
        } else if(firstIntentType === constants.FunctionalIntent) {
            primary[constants.handler] = constants.Unstructured;
            primary[constants.type] = constants.Unstructured;
            primary[constants.objectType] = constants.ObjectTypeNone;
        }
        decision[constants.intentsIdentified][constants.primary] = primary;

    }
}