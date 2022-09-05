const constants = require('./../constants.js');
const util = require('./../util.js');
exports.getReplaceableQuery = function (mainQuery, step, decision, handler, enableIsAlternate) {
    let nudgeEntities;
    //mainQuery and replaceQuery would be string type
    if (mainQuery && step && decision && (nudgeEntities = decision[constants.nudgeEntities]) &&
        Array.isArray(nudgeEntities) && nudgeEntities.length > 0) {
        let replaceKeyQuery = util.at_xpath(step, "replace_keyword/text()", 1).replace(/\s+/g, ' ');
        let replaceSecQuery = util.at_xpath(step, "replace_secondary/text()", 1).replace(/\s+/g, ' ');
        let replaceAltQuery  =
        {
            "bool": {
                "must_not": {
                    "exists": {
                        "field": "IS_ALTERNATE"
                    }
                }
            }
        };

        if (mainQuery.indexOf(constants.replace_alternate) != -1 ) {
            if(enableIsAlternate)
                mainQuery = mainQuery.replace(/(\?replace_alternate)/g, '');
            else
                mainQuery = mainQuery.replace(/(\?replace_alternate)/g, ',' + JSON.stringify(replaceAltQuery));
        }

        let replaceKeyQryStr = '';
        let replaceSecQryStr = '';

        if (mainQuery.indexOf(constants.replace_keyword) != -1 || mainQuery.indexOf(constants.replace_secondary) != -1) {
            let updateComma = true;
            //consider data record entities for creating nudges
            for (i = 0; i < nudgeEntities.length; i++) {
                if (i == (nudgeEntities.length - 1)) {
                    updateComma = false;
                }

                if (replaceKeyQuery) {
                    replaceKeyQryStr += replaceKeyQuery.replace(/(\?KEYWORD)/g, nudgeEntities[i]);
                    if (updateComma)
                        replaceKeyQryStr += ',';
                }

                if (replaceSecQuery) {
                    replaceSecQryStr += replaceSecQuery.replace(/(\?SECONDARY)/g, nudgeEntities[i]);
                    if (updateComma)
                        replaceSecQryStr += ',';
                }
            }

            if (mainQuery.indexOf(constants.replace_keyword) != -1 && replaceKeyQuery && replaceKeyQryStr) {
                mainQuery = mainQuery.replace(/(\?replace_keyword)/g, replaceKeyQryStr);
            }

            if (mainQuery.indexOf(constants.replace_secondary) != -1 && replaceSecQuery && replaceSecQryStr) {
                mainQuery = mainQuery.replace(/(\?replace_secondary)/g, replaceSecQryStr);
            }

            if (handler && handler.toUpperCase() === (constants.STRUCTURED_LOCATION).toUpperCase()) {
                var a, len;

                if (decision[constants.latitude] && decision[constants.longitude] &&
                    !util.isEmpty(decision[constants.latitude]) &&
                    !util.isEmpty(decision[constants.longitude]) && (lat = decision[constants.latitude]) && (lon = decision[constants.longitude])) {
                    console.log("\n\n\n lat & lon ", lat, lon);
                    mainQuery = query.mainQuery(/(\?INTPUT_latitude)/g, function () {
                            return lat
                        })
                        .replace(/(\?INTPUT_longitude)/g, function () {
                            return lon
                        });
                } else {
                    mainQuery = mainQuery.replace(/(\?INTPUT_latitude)/g, function () {
                            return null
                        })
                        .replace(/(\?INTPUT_longitude)/g, function () {
                            return null
                        });
                    mainQuery = JSON.parse(mainQuery);
                    delete mainQuery.sort;
                    mainQuery = JSON.stringify(mainQuery);
                }
            }

        }
    }

    return mainQuery;
}

exports.addNudgeOptions = function (input, response, decision, configuration) {
    let objects, temp = [];


    if (decision && (constants.NUDGE_OPTIONS in decision) && Array.isArray(decision[constants.NUDGE_OPTIONS]) && decision[constants.NUDGE_OPTIONS].length) {
        objects = decision[constants.NUDGE_OPTIONS];
        for (i = 0; i < objects.length; i++) {

            //Checking whether same Intent and Entity Name Exist
            //If exist do not add to nudge

            if (decision[constants.dataRecord][constants.INTENT].indexOf(
                    objects[i][constants.INTENT]) != 0 ||
                decision[constants.dataRecord][constants.PRIMARY_ENTITY_NAME].indexOf(
                    objects[i][constants.PRIMARY_ENTITY_NAME]) != 0) {
                let recordentities = getRecordEntities(objects[i]);
                let re = ''
                if (Array.isArray(recordentities) && recordentities.length) {
                    re = recordentities.join();
                }
                if(configuration[constants.isSpecialBot]) {
                    temp.push({key: process.env.EBSP_ENVIRONMENT + '#' + objects[i][constants.INTENT] + ':' + objects[i][constants.UNIQUE_ID], value: objects[i][constants.PRIMARY_ENTITY_NAME]});
                }
                else {
                    //temp.push({key: objects[i][constants.INTENT] + ':' + objects[i][constants.PRIMARY_ENTITY_NAME] + '|' + re, value: objects[i][constants.PRIMARY_ENTITY_NAME]});
                    temp.push({key: objects[i][constants.INTENT] + ':' + objects[i][constants.UNIQUE_ID], value: objects[i][constants.PRIMARY_ENTITY_NAME]});
                }
            }
        }

        //util.performSorting(temp, constants.value, constants.SORTING_ASCENDING);
        if (temp.length > constants.MAX_FOLLOW_UP_OPTIONS) {
            temp.splice(constants.MAX_FOLLOW_UP_OPTIONS);
        }
        response[constants.NUDGE_OPTIONS] = temp;
    }

}

function getRecordEntities(record) {
    let recordentities = [];

    if (record[constants.KEYWORD]) {
        keyword = record[constants.KEYWORD].toString().split(",");
        recordentities = keyword.map(function (val) {
            return val.toString().trim();
        });
    }
    if (record[constants.PRIMARY_ENTITY_NAME]) {
        //recordentities.push(record[constants.CTX_RES_ENTITY_NAME]);
    }
    if (record[constants.SECONDARY_ENTITY_NAME]) {
        let secondary = [];
        secondary = record[constants.SECONDARY_ENTITY_NAME].toString().split(",");
        secondary = secondary.map(function (val) {
            return val.toString().trim();
        });
        recordentities = recordentities.concat(secondary);
    }
    return recordentities;
}


function updateQuery(query, response, input, context) {
    var a, len;

    if ((a = input.addtnlInputParams) && (lat = a.latitude) && (lon = a.longitude)) {
        console.log("\n\n\n lat & lon ", lat, lon);
        query = query.replace(/(\?INTPUT_latitude)/g, function () {
                return lat
            })
            .replace(/(\?INTPUT_longitude)/g, function () {
                return lon
            });
    } else {
        query = query.replace(/(\?INTPUT_latitude)/g, function () {
                return null
            })
            .replace(/(\?INTPUT_longitude)/g, function () {
                return null
            });
        query = JSON.parse(query);
        delete query.sort;
        query = JSON.stringify(query);
    }
}
