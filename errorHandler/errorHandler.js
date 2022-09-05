var util = require('./../util');
var constants = require('./../constants');
var rh = require('./../responseHandler/responseHandler');
var libtemplate = require('./../load-conf-tpl');
/* This function construct response in case of error occured */
exports.getErrorResponse = function(st, map, input, response, b) {
	
	var text;
	var decision = response.decision || {};
	var configs = response.configs || {};
	var pickup_index = '';
	//var response = GetResponseObject(input, decision);
	decision[constants.errCode] = st;
	switch(st) {
		case constants.ERROR_STATUS_INVALID_INPUT:
			pickup_index = libtemplate.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THREE);
			break;
		case constants.ERROR_STATUS_INVALID_INTENT:
			pickup_index = libtemplate.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_THREE);
			break;
		default:
			pickup_index = libtemplate.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_FIVE);
			break;
	}
	constructErrorResponse(pickup_index, input, response, function(e) {
		//response = buildResponse(input, response, map);
		rh.ConstructResponse(response, configs, decision, {}, input);
		return b(e, response);
	});
}


function constructErrorResponse(pickup_index, input, response, cb) {
	try {
		var decision = response.decision || {};
		var configs = response.configs || {};
		var lan = {}, op = {}, olan = {}, output = {}; 
		if(response[constants.output]) {
			op = response[constants.output];
		} else {
			response[constants.output] = op;
		}

		op[constants.DEFAULT_LANGUAGE_CODE_CAPS] = lan;
		
		output = libtemplate.getTemplateObject(constants.DEFAULT_LANGUAGE_CODE, pickup_index);
			
		lan[constants.text] = [output.TEXT.toString()];
		lan[constants.voice] = output.VOICE.toString();
		lan[constants.voiceonly] = output.VOICE_ONLY.toString();
			
		replaceVariablesInTemplate(lan, decision, output, input, response, configs, cb);
		if((constants.SECONDARY_LANGUAGE_EXIST in decision) && decision[constants.SECONDARY_LANGUAGE_EXIST] && !util.isEmpty(otherlantpl)) {
			op[input.languageCode.toUpperCase()] = olan;
			output = libtemplate.getTemplateObject(input.languageCode.toLowerCase(), pickup_index);
			olan[constants.text] = [output.TEXT.toString()];
			olan[constants.voice] = output.VOICE.toString();
			olan[constants.voiceonly] = output.VOICE_ONLY.toString();
			replaceVariablesInTemplate(olan, decision, output, input, response, configs, cb);
		}
		cb(false);	
	} catch(e) {
		util.debug("Catch inside run ", JSON.stringify(e));
		cb(e);
	}
}

function replaceVariablesInTemplate(b, decision, output, input, response, configs, cb) {
	try {
		if(b[constants.text]) {
			for(i = 0; i < b[constants.text].length; i++) {
				if(b[constants.text][i]) {
					b[constants.text][i] = b[constants.text][i].replace(/(<\w+>)/g, function(x) {
						x = x.replace('<','').replace('>', '').trim();
							return (output ? output[x] : false) || (decision ? decision[x] : false) || (input[x] ? input[x] : false) || (configs ? configs[x] : false) || '';
					});
				}
				
			}
		}
		
		if(b[constants.voice]) {
			b[constants.voice] = b[constants.voice].replace(/(<\w+>)/g, function(x) {
				x = x.replace('<','').replace('>', '');
				return (output ? output[x] : false) || (decision ? decision[x] : false) || (input[x] ? input[x] : false) || (configs ? configs[x] : false) || '';
			});
		}
		
		if(b[constants.voiceonly]) {
		
			b[constants.voiceonly] = b[constants.voiceonly].replace(/(<\w+>)/g, function(x) {
				x = x.replace('<','').replace('>', '');
				return (output ? output[x] : false) || (decision ? decision[x] : false) || (input[x] ? input[x] : false) || (configs ? configs[x] : '') || '';
			});
		}
	} catch(e) {
		util.print('Response Handler ReplaceVariablesInTemplate Method Error: ', e);
		return cb(e, response);
	} 
}