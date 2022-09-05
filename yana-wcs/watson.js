const wcs = require('ibm-watson/assistant/v1');
const moment = require('moment');
var constants = require('./constants');
var wcsWrapper = require('./lib/wcsWrapper');

exports.run = function(input, credentials, log, callback) {
	var response = {};
	/*This function call WCS to get intent and entities*/
	var WCSCall = function(conversation, input, credentials, callback) {
		console.log("Configurations "+JSON.stringify(credentials));
		conversation.message({
		    workspace_id: credentials[constants.WorkspaceID],
			input: { 'text':input.text },
			context: input.context || {}
		}, function(e, watsonresponse) {
			if(e) {
				log[constants.StatusCode] = constants.STATUS_WATSON_FAILED; 				
				return callback(e, {}, log);
			} else {
				GetEBSPResponse(watsonresponse, input, credentials, callback);
			}
		});
	};

	/*This function call WCS to get multiple intents and entities*/
	var WCSCallMultipleIntents = function(conversation, input, credentials, callback) {
		console.log("Configurations "+JSON.stringify(credentials));
		conversation.message({
		    workspace_id: credentials[constants.WorkspaceID],
			input: { 'text':input.text },
			alternate_intents: true,
			context: input.context || {}
		}, function(e, watsonresponse) {
			if(e) {
				log[constants.StatusCode] = constants.STATUS_WATSON_FAILED; 				
				return callback(e, {}, log);
			} else {
				GetEBSPResponse(watsonresponse, input, credentials, callback);
			}
		});
	};
	
	/*This function creates WCS object */
	var GetConversationObject = function(credentials, callback) {
		try {
			credentials.WorkspaceVersionDate = getFormattedDate(credentials.WorkspaceVersionDate, 'YYYY-MM-DD');
			let params = {name: credentials[constants.ENVIRONMENT], 
				version: credentials[constants.WorkspaceVersionDate], 
				workspace_id: credentials[constants.WorkspaceID], 
				username: credentials[constants.WorkspaceUser], 
				password: credentials[constants.WorkspacePwd], 
				url: credentials[constants.WorkspaceURL] };
			console.log(params);
			conversation = new wcs(params);
			WCSCallMultipleIntents(conversation, input, credentials, callback);
		} catch(e) {
			log[constants.StatusCode] = constants.STATUS_WATSON_FORMAT_FAILED; 				
			return callback(e, {}, log);
		}
	};
	/*This function create response object which will be input to the ebsp */
	var GetEBSPResponse = function(watsonresponse, input, credentials, callback) {

		if(watsonresponse && watsonresponse.intents) input[constants.intents] = watsonresponse.intents;
		if(watsonresponse && watsonresponse.entities) input[constants.entities] = watsonresponse.entities;
		if(watsonresponse && watsonresponse.context) input[constants.context] = watsonresponse.context;
		
		wcsWrapper.filterEntities(input);				
		return callback('', response, log);
	};
	
	GetConversationObject(credentials, callback);
}

function getFormattedDate(date, format) {
	
	if(moment(date).isValid()) {
		
		return moment(date).format(format);
	} else {
		return date;
	}
}

exports.getEntities = function(entities, credentials) {
	
	return new Promise((resolve, reject) => {
		credentials.WorkspaceVersionDate = getFormattedDate(credentials[constants.WorkspaceVersionDate], 'YYYY-MM-DD');
		
		let params = {name: credentials.ENVIRONMENT, 
			version: credentials[constants.WorkspaceVersionDate], 
			workspace_id: credentials[constants.WorkspaceID], 
			username: credentials[constants.WorkspaceUser], 
			password: credentials[constants.WorkspacePwd], 
			url: credentials[constants.WorkspaceURL] };

		let conversation = new wcs(params);//getEntity ,entity:Building entities.join(',').trim()
		conversation.message({
			workspace_id: credentials[constants.WorkspaceID],
			input: { 'text': entities.join(',')}
		}, function(err, watsonresponse) {
			if(err) {
				reject({code: constants.STATUS_WATSON_FAILED, desc:err});
			} else {
				resolve({code: constants.STATUS_SUCCESS, result:watsonresponse});
			}
		});
	});
}
