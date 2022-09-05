var constants = require('./constants'),
request = require('request'),
util = require('./util');
exports.savelog = savelog = function(inputJSON, responseJSON, logObject, logURL) {
	if(inputJSON && inputJSON[constants.apiId] && (inputJSON[constants.apiId] == constants.API_DEVICE_SYNC)) {
        return true;
    }  
	if(inputJSON && responseJSON && logObject) {
        setTimeout(function() {         
            if((!(constants.sensitive in logObject) || !(logObject[constants.sensitive])) &&
                logObject[constants.RequestText] && (logObject[constants.RequestText].indexOf('N1') === -1)) {
                
				if(constants.sensitive in logObject) delete logObject[constants.sensitive];
				if(constants.apiId in logObject) delete logObject[constants.apiId];
				
                if(logURL && logObject) {
                    if(constants.RequestJSON in logObject) delete logObject[constants.RequestJSON];
                    if(constants.ResponseJSON in logObject) delete logObject[constants.ResponseJSON];

                    param = {
                        "request": inputJSON,
                        "response": responseJSON,
                        "appParams": logObject
                    };

                    util.printlog("6. Save data in Auditlog - Log Object", JSON.stringify(param));
                    request({ 
                        method: 'POST', 
                        uri: logURL, 
                        json: param, 
                        encoding: null, 
                        rejectUnauthorized: false
                    }, function(e, result, body) {
                        util.printlog("7 Audit log error:" + e + ":::result::" + result, body);
                    });
                }
            }
        }, 0);
    }
    else{
        console.log("ERROR:Could not save audit log as inputJSON or "
            +"responseJSON or Log parameter object is/are empty");
    }
}

exports.initializeLog = function(input, log) {
  log[constants.RequestDateTime] = util.format_date(new Date(), 1);
  log[constants.RequestJSON] = input;
  log[constants.ChangedBy] = process.env.EBSP_ENVIRONMENT;
  log[constants.ServedBy] = process.env.EBSP_ENVIRONMENT;
  if(input[constants.MessageId]) {
    log[constants.MessageId] = input[constants.MessageId];
  } else {
    log[constants.MessageId] = util.getUniqueId();
  }
  log[constants.UserID] = input[constants.userId] || '';			
  log[constants.RequestText] = input.text;
}