const util = require('./util'),
auditlog = require('./auditlogHandler'),
constants = require('./constants');

class ApiResponse {
  constructor(err, resp, log, input, configuration) {
	this.err = err;
	this.response = (resp) ? resp : {};
	this.log = log;
	this.input = input;
	this.configuration = configuration;
  }

  savelogs() {
	auditlog.savelog(this.input, this.response, this.log, process.env.AWS_URL);
  }

  constructResponse() {
	this.response[constants.statusCode] = (this.log[constants.StatusCode]) ? this.log[constants.StatusCode] : constants.STATUS_SUCCESS;
	this.response[constants.MessageId] = this.log[constants.MessageId];
	this.response[constants.servedBy] = process.env.EBSP_ENVIRONMENT;
	
	this.log[constants.ResponseDateTime] = util.format_date(new Date(), 1);
	let a, b, k;
	if((a = this.response) && (a=a[constants.output])) {
	  for(k in a) {
		if((b=a[k]) && (typeof b === "object")) {
	      if(b && (b=b[constants.text]) && b.length) {							
		    if(this.log[constants.ResponseText]) {
			  this.log[constants.ResponseText] = this.log[constants.ResponseText]+"<br />"+k+": "+b[0];
			} else {
			  this.log[constants.ResponseText] = k+": "+b[0];
			}
		  }
		}
	  } 
	}
	//log[constants.ResponseText] = ((a = resp) && (a=a[constants.output]) && (a=a[constants.text]) && (a=a[0])) ? a : '';
	this.log[constants.DecisionStatus] = ((a = this.response) && (a=a[constants.DECISION_STATUS])) ? a : 0;
	this.log[constants.applicationStatus] = ((a = this.response) && (a=a[constants.applicationStatus])) ? a : 0;
	this.log[constants.responseStatus] = ((a = this.response) && (a=a[constants.responseStatus])) ? a : 0;
	
	this.log[constants.ResponseJSON] = JSON.stringify(this.response);
	this.log[constants.ConversationID] = ((a = this.response) && (a=a[constants.context]) && (a=a[constants.conversation_id])) ? a : '';
	this.log[constants.Entites] = (this.response[constants.entity]) ? this.response[constants.entity] : '';
	this.log[constants.Intent] =  (this.response[constants.intent]) ? this.response[constants.intent] : '';
	this.log[constants.sensitive] = (this.response[constants.sensitive]) ? this.response[constants.sensitive] : false;
	this.log[constants.version] = (this.configuration && this.configuration[constants.Version]) ? this.configuration[constants.Version] : process.env.EBSP_VERSION;	
	return this.response;
  }
}

module.exports = ApiResponse