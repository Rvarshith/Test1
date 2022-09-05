const dataDecision = require('../decisionMaker/dataDecision');
const liblang = require('./../libraries/languageObject');
const constants = require('./../constants');
const resAppStatus = require('../response-application-status');
const contextHandler = require('./../contextHandler/contextHandler');
const acadResponse = require('./AcademicEvent/responseHandler');
const nudgeFollowUp = require('./../libraries/nudgesFollowUp');
const tempStatus = require('./../libraries/tempStatus');
const util = require('./../util');
const dtpl = require('./../load-conf-tpl');
const genNudge = require('./../nudge/generateNudge');
class ResponseHandler {
	
	constructor(data, decision, configuration, input) {
		this.dataDecision = new dataDecision(data, decision, configuration, input);
		this._configuration = configuration;
		this._decision = {};
		this._output = {};
		this._input = input;
		this.response = {};
	}
	
	async buildResponse() {

		try {

			this.dataDecision.makeDecision();
			this._decision = this.dataDecision.getDecision();
			let output = this.dataDecision.getOutput();
			this._output = (constants.body in output) ? output[constants.body] : {};
			this.updateCustomStructuredDialog(output);
			this.addLanObject();
			liblang.constructTextVoiceAndVoiceOnly(this._input, this._output, this._decision);
			this._decision[constants.TOP_ENTITY_NAME] = this.getTopEntity();

			if(this._decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_ZERO) {
				this.addDbOutput();
			} if((this._decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_ONE) || 
				(this._decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_SIX) ) {
				this.addTempateOutput();
			} else if(this._decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_THREE) {
				nudgeFollowUp.addFollowUPOptions(this._input, this._output, this._decision, this._configuration);
				this.setVirtualEntities();
				this.addTempateOutput();
			} else if(this._decision[constants.DIALOGUE_RULE] === constants.DIALOGUE_RULE_FIVE) {
				
				let obj = dtpl.getTemplateObject(constants.DEFAULT_LANGUAGE_CODE, this._decision[constants.DIALOGUE_PICK_INDEX]);
				if(util.isEmpty(obj)) {
					this.setErrorResponse(constants.ERROR_IN_CHECK_GENERIC_INTENT);
				} else {
					this.addContextVariables(constants.DEFAULT_LANGUAGE_CODE_CAPS, obj);
					this.appendTextVoiceVoiceOnly();
				}
			}
			
			if(this._decision && this._decision[constants.isGenericMerge]) {
				let genericdata = this.dataDecision.getGenericRecord();
				liblang.constructTextVoiceAndVoiceOnly(this._input, genericdata, this._decision);
				this.mergeTextVoiceVoiceOnly(genericdata);
			}
			ConstructResponse(this.response, this._configuration, this._decision, this._output, this._input);
			this.translateUrl();
			this.addResponseCategory();
			this.setContext();
			this.clearIDs();
			if(this._input[constants.apiId] !== constants.API_DEVICE_SYNC) {
				await this.addNudges();
			}

			return this.response;
		} catch(e) {
			console.log(e);
		}
	}
	setVirtualEntities() {
		let a;
		this._decision[constants.VIRTUAL_ENTITY_ONE] = ((a=this._output[constants.results]) && (a=a[constants.objects]) && (a=a[0]) && (a=a[constants.value])) ? a : "";
		this._decision[constants.VIRTUAL_ENTITY_TWO] = ((a=this._output[constants.results]) && (a=a[constants.objects]) && (a=a[1]) && (a=a[constants.value])) ? a : "";
	}
	addResponseCategory() {
		let a;
		this._decision[constants.resultType] = ((a=this.response[constants.results]) && (a=a[constants.objType])) ? a : '';

		var firstResult = ((a=this.response[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};
		console.log(firstResult);
		if(!util.isEmpty(firstResult) && ((constants.CTX_RES_INTENT in firstResult) || (constants.key in firstResult))) {
			if((this._decision[constants.resultType]) && (this._decision[constants.resultType] !== constants.ObjectTypeFollowUp) && (constants.key in firstResult)) {
				this._decision[constants.resultIntent] = firstResult[constants.key].split(":")[0];
			} else {
				this._decision[constants.resultIntent] = firstResult[constants.CTX_RES_INTENT];
			}
		}
		tempStatus.getTemporaryStatus(this._input, this._decision);
		if((constants.temporaryStatus in this._decision) && this._decision[constants.temporaryStatus]) {
			this.response[constants.temporaryStatus] = this._decision[constants.temporaryStatus];
		}
	}
	addLanObject() {
		var lang = {};
		lang[constants.DEFAULT_LANGUAGE_CODE_CAPS] = {};

		if(this._decision[constants.SECONDARY_LANGUAGE_EXIST]) {
			lang[this._input.languageCode.toUpperCase()] = {};
		}
		this.response[constants.output] = lang;
	}
	
	getTopEntity() {
		let a;
		return ((a=this._output) && (a=a[constants.results]) && (a=a[constants.objects]) && (a=a[0]) && (a=a[constants.CTX_RES_ENTITY_NAME])) ? a : '';
	}
	setErrorResponse(code) {
		this._decision[constants.DECISION_STATUS] = constants.DECISION_ERROR;
		this._decision[constants.DIALOGUE_PICK_INDEX] = dtpl.getDialogPickIndex(constants.Common, constants.DIALOGUE_RULE_ONE, constants.DIALOGUE_PICK_INDEX_FIVE);
		this._decision[constants.DIALOGUE_RULE] = constants.DIALOGUE_PICK_INDEX_ONE;
		this.response[constants.statusCode] = code;
		this._decision[constants.errCode] = code;
		this.addTempateOutput();

	}
	async addNudges() {
		if(this._configuration && (constants.enableFollowUpOptions in this._configuration) && 
		this._configuration[constants.enableFollowUpOptions]) {	

			if((constants.showNudges in this._decision) && this._decision[constants.showNudges]) {

				let output = ((a=this.response[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};
				if(!util.isEmpty(output)) {
					let temp = {}, a;
					this._decision[constants.dataRecord] = temp;
					temp[constants.ENTITY_NAME] = (output && output[constants.CTX_RES_ENTITY_NAME]) ? output[constants.CTX_RES_ENTITY_NAME] : "";
					temp[constants.INTENT] = (output && output[constants.CTX_RES_INTENT]) ? output[constants.CTX_RES_INTENT] : "";
					temp[constants.IS_DEFAULT] = (output && output[constants.CTX_RES_IS_DEFAULT]) ? output[constants.CTX_RES_IS_DEFAULT] : "";
					
					temp[constants.KEYWORD] = (output && output[constants.CTX_RES_KEYWORD]) ? output[constants.CTX_RES_KEYWORD] : "";
					temp[constants.KEYWORD] = this.removeSaltEntities(temp[constants.KEYWORD]);
					temp[constants.SECONDARY_ENTITY_NAME] = (output && output[constants.CTX_RES_SECONDARY_ENTITY]) ? output[constants.CTX_RES_SECONDARY_ENTITY] : "";
					temp[constants.SECONDARY_ENTITY_NAME] = this.removeSaltEntities(temp[constants.SECONDARY_ENTITY_NAME]);
					temp[constants.NUMBER_OF_RECORDS] = ((a = this.response) && (a = a[constants.output]) && (a=a[constants.CTX_RES_COUNT])) ? a : 0;
					temp[constants.HANDLER] = (this._decision && this._decision[constants.ACTION_HANDLER]) ? this._decision[constants.ACTION_HANDLER] : "";
					
					if(temp[constants.KEYWORD])
                    {
                        let dataEntities = [];
                        
                        dataEntities.push(temp[constants.KEYWORD]);
                        
                        if(temp[constants.SECONDARY_ENTITY_NAME]) {
                            dataEntities.push(temp[constants.SECONDARY_ENTITY_NAME]);
                        }

                        this._decision[constants.dataEntities] = dataEntities;
                    }

					this._decision[constants.latitude] = (this._input && this._input[constants.latitude]) ? this._input[constants.latitude] : "";
					this._decision[constants.longitude] = (this._input && this._input[constants.longitude]) ? this._input[constants.longitude] : "";
					this._decision[constants.languageCode] = (this._input && this._input[constants.languageCode]) ? this._input[constants.languageCode] : "";
					try {
						this.response[constants.NUDGE_OPTIONS] = await genNudge.getNudges(this._input, this._decision, {configs:this._configuration, decision:this._decision});
					} catch(err) {
						console.log(err);
					}
				}
			}
		}
	}
	removeSaltEntities(text) {
		return text.replace(',Salt').replace(', Salt').replace(',salt').replace(', salt').replace('Salt').replace('salt');
	}
	addDbOutput() {
		let dlan = {}, olan = {}, op = {};
		let output = this.getFirstObject();
		
		if(this.response[constants.output]) {
			op = this.response[constants.output];
		} else {
			this.response[constants.output] = op;
		}
	
		op[constants.DEFAULT_LANGUAGE_CODE_CAPS] = dlan;
	
		dlan[constants.text] = [output[constants.CTX_RES_TEXT]];
		dlan[constants.voice] = output[constants.CTX_RES_VOICE];
		dlan[constants.voiceonly] = output[constants.CTX_RES_VOICE_ONLY] ? output[constants.CTX_RES_VOICE_ONLY] : "";

		this.replaceVariablesInDialog(dlan, output);

		if(this._decision[constants.SECONDARY_LANGUAGE_EXIST]) {
			op[this._input.languageCode.toUpperCase()] = olan;
 
            olan[constants.text] = [ (output[constants.CTX_RES_TEXT+'_'+ this._input.languageCode.toUpperCase()]
                    ? output[constants.CTX_RES_TEXT+'_'+ this._input.languageCode.toUpperCase()] : "")];
            olan[constants.voice] = output[constants.CTX_RES_VOICE+'_'+ this._input.languageCode.toUpperCase()] ? 
                output[constants.CTX_RES_VOICE+'_'+ this._input.languageCode.toUpperCase()] : "";
            olan[constants.voiceonly] = (output[constants.CTX_RES_VOICE_ONLY+'_'+ this._input.languageCode.toUpperCase()]) ? 
                output[constants.CTX_RES_VOICE_ONLY+'_' + this._input.languageCode.toUpperCase()] : "";
            this.replaceVariablesInDialog(olan, output);
		}
	}

	getFirstObject() {
		let a;
		return ((a=this._output) && (a=a[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};
	}

	replaceVariablesInDialog(b, output) {
		try {
			if(b[constants.text]) {
				for(i = 0; i < b[constants.text].length; i++) {
					if(b[constants.text][i]) {
						b[constants.text][i] = this.replaceVariable(b[constants.text][i], output);
					}
				}
			}
			if(b[constants.voice]) {
				b[constants.voice] = this.replaceVariable(b[constants.voice], output);
			}
			if(b[constants.voiceonly]) {
				b[constants.voiceonly] = this.replaceVariable(b[constants.voiceonly], output);
			}
		} catch(e) {
			console.log(e);
		} 
	}

	replaceVariable(obj, output) {
		
		return	obj.replace(/(<\w+>)/g, function(x) {
			x = x.replace('<','').replace('>', '');
			return (output ? output[x] : false) || 
			(this._decision ? this._decision[x] : false) || 
			(this._input[x] ? this._input[x] : false) || 
			(this._configuration ? this._configuration[x] : false) || "";
		}.bind(this));
	}

	addTempateOutput() {
		let obj = dtpl.getTemplateObject(constants.DEFAULT_LANGUAGE_CODE, 
			this._decision[constants.DIALOGUE_PICK_INDEX]);
		this.addContextVariables(constants.DEFAULT_LANGUAGE_CODE_CAPS, obj);
		
		if(this._decision[constants.SECONDARY_LANGUAGE_EXIST]) {
			let obj2 = dtpl.getTemplateObject(this._input.languageCode.toLowerCase(), 
			this._decision[constants.DIALOGUE_PICK_INDEX]);
			this.addContextVariables(this._input.languageCode.toUpperCase(), obj2);
		}
	}

	addContextVariables(lncode, object) {

		try {
			var lan = {}, op = {};
			if(this.response[constants.output]) {
				op = this.response[constants.output];
			} else {
				this.response[constants.output] = op;
			}
			
			op[lncode] = lan;
			if(!util.isEmpty(object)) {
				lan[constants.text] = [object.TEXT.toString()];
				lan[constants.voice] = object.VOICE.toString();
				lan[constants.voiceonly] = object.VOICE_ONLY.toString();
			}
			if(this._decision[constants.DIALOGUE_RULE] == constants.DIALOGUE_RULE_SIX) {
				if(this._configuration[constants.IsSearchResultEnabled] === undefined || 
					this._configuration[constants.IsSearchResultEnabled] == true)
						this.addSearchURLObject()
			}
			let firstObject = this.getFirstObject();
			this.replaceVariablesInDialog(lan, firstObject);
		} catch(e) {
			util.print("Catch inside AddContextVariables ", e);
		}
	}

	addSearchURLObject() {
		var search = this._input.text;
		if(this._configuration[constants.IsPageContextRequired] == true)
		{
			if(this._configuration[constants.PageContextPattern])
			{
				var patternArray = this._configuration[constants.PageContextPattern].split(",");
				patternArray.forEach(element => {
					search = search.replace(new RegExp(element + '$'), '')
				 });
			}
		}
		search = search.trim()
		var url = this._configuration[constants.GoogleSearchURL];
		var languageCODE;
		if(this._input && constants.languageCode in this._input && constants.SearchUrl in this._configuration)
		{
			languageCODE = this._input.languageCode.toUpperCase();
			if(this._configuration[constants.SearchUrl][languageCODE]){
				url = this._configuration[constants.SearchUrl][languageCODE];
			}
			else
				url = this._configuration[constants.SearchUrl]["EN"];
		}
		else if(this._configuration[constants.UniversityURL]){
			url = url + this._configuration[constants.UniversityURL];
		}
		else{
			console.log("google search url is selected::"+url);
		}
		var searchQueryDelimiter;
		if(this._configuration[constants.searchQueryDelimiter] && constants.searchQueryDelimiter in this._configuration){
			searchQueryDelimiter = this._configuration[constants.searchQueryDelimiter];
		}
		else{
			searchQueryDelimiter = "+";
		}
		url = url+ searchQueryDelimiter + search.toLowerCase().replace(/\s/g, searchQueryDelimiter);

		this.addSearchURL(url);
	}

	addSearchURL(url) {
		let objects = [];
		let obj = {};
		let result = {};
		result[constants.objType] = constants.ObjectTypeNone;
		obj[constants.CTX_RES_REF_URL] = url;
		objects.push(obj);
		result[constants.objects] = objects;
		this.response['results'] = result;
	}
	isSupportedLang(lncode) {
		if((constants.SUPPORTED_LANGUAGES in this._configuration) && (this._configuration[constants.SUPPORTED_LANGUAGES].indexOf(lncode) !== -1))
			return true;
		else
			return false;
	}
	isNotDefaultLang() {
		if(this._input && this._input[constants.languageCode] && (this._input[constants.languageCode].toUpperCase() != constants.DEFAULT_LANGUAGE_CODE_CAPS))
			return true;
		else 
			return false;
	}

	translateUrl() {
	let a;
		if(this._input && this._input[constants.languageCode]) {
			let lncode = this._input[constants.languageCode].toLowerCase();
			if(this.isNotDefaultLang() && this.isSupportedLang(lncode.toUpperCase())) {
				if((a=this.response) && (a=a[constants.results]) && (a=a[constants.objects])) {
					for(let m in a) {
						let n = a[m];
						if(!n || !n[constants.CTX_RES_REF_URL]) continue;
						n[constants.CTX_RES_REF_URL] = n[constants.CTX_RES_REF_URL].replace(constants.DEFAULT_LANGUAGE_CODE, lncode);
						if((constants.CTX_RES_MAP_URL in n) && n[constants.CTX_RES_MAP_URL]) {
							n[constants.CTX_RES_MAP_URL] = n[constants.CTX_RES_MAP_URL]+'?hl='+lncode;
						}
					}
				}
				
			}
		}
	}

	setContext() {
		try {
			let a;
			let output = ((a=this.response[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};
			contextHandler.setContext(this.response, this._input, this._decision, output);
		} catch(e) {
			util.debug('Response Handler setContext Method Error: ', e);
		}
	}
	appendTextVoiceVoiceOnly() {
		try {
			let a;
			let output = this.getFirstObject();
			var dlan = ((a=this.response[constants.output]) && (a=a[constants.DEFAULT_LANGUAGE_CODE_CAPS])) ? a : {};
			if(!util.isEmpty(dlan) && !util.isEmpty(output)) {
				
				dlan[constants.text][0] = dlan[constants.text][0].toString().trim() + "\n" + output[constants.CTX_RES_TEXT];
				
				if(!output[constants.CTX_RES_VOICE]) output[constants.CTX_RES_VOICE] = "";
				dlan[constants.voice] = dlan[constants.voice].toString().trim() + "\n" + output[constants.CTX_RES_VOICE];
				
				if(!dlan[constants.voiceonly]) dlan[constants.voiceonly] = "";

				if(!output[constants.CTX_RES_VOICE_ONLY]) output[constants.CTX_RES_VOICE_ONLY] = "";
				dlan[constants.voiceonly] = dlan[constants.voiceonly].toString().trim() + "\n" + output[constants.CTX_RES_VOICE_ONLY];
			}
		} catch(e) {
			util.print("Error in appendTextVoiceVoiceOnly", e);
		} 
	}

	mergeTextVoiceVoiceOnly(data) {
		try {
			let a;
			let output = ((a=data) && (a=a[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};
			
			var dlan = ((a=this.response[constants.output]) && (a=a[constants.DEFAULT_LANGUAGE_CODE_CAPS])) ? a : {};
			
			if(!util.isEmpty(dlan) && !util.isEmpty(output)) {
				if((constants.CTX_RES_SHORT_TEXT in output) && output[constants.CTX_RES_SHORT_TEXT]) {
					dlan[constants.text][0] = output[constants.CTX_RES_SHORT_TEXT] + "\n\n" + dlan[constants.text][0].toString().trim();
					dlan[constants.voice] = output[constants.CTX_RES_SHORT_TEXT] + "\n\n" + dlan[constants.voice].toString().trim();
					dlan[constants.voiceonly] = output[constants.CTX_RES_SHORT_TEXT] + "\n\n" + dlan[constants.voiceonly].toString().trim();
					this.replaceVariablesInDialog(dlan, output);
				} else {

					dlan[constants.text][0] = output[constants.CTX_RES_TEXT] + "\n\n" + dlan[constants.text][0].toString().trim();
					
					if(!output[constants.CTX_RES_VOICE]) output[constants.CTX_RES_VOICE] = "";
					dlan[constants.voice] = output[constants.CTX_RES_VOICE] + "\n\n" + dlan[constants.voice].toString().trim();
					
					if(!output[constants.CTX_RES_VOICE_ONLY]) output[constants.CTX_RES_VOICE_ONLY] = "";
					dlan[constants.voiceonly] = output[constants.CTX_RES_VOICE_ONLY] + "\n\n" + dlan[constants.voiceonly].toString().trim();
					this.replaceVariablesInDialog(dlan, output);
				}
			}

			if(this._decision[constants.SECONDARY_LANGUAGE_EXIST]) {
				let seclan = input.languageCode.toUpperCase();
				let olan = ((a=this.response[constants.output]) && (a=a[seclan])) ? a : {};

				if(util.isEmpty(olan)) {
					if(output[constants.CTX_RES_TEXT+'_'+seclan]) {
						olan[constants.text][0] = output[constants.CTX_RES_TEXT+'_'+seclan] + "\n\n" + olan[constants.text][0].toString().trim();
					}
					if(output[constants.CTX_RES_VOICE+'_'+seclan]) {
						olan[constants.voice] = output[constants.constants.CTX_RES_VOICE+'_'+seclan] + "\n\n" + olan[constants.voice].toString().trim();
					}
					if(output[constants.CTX_RES_VOICE_ONLY+'_'+seclan]) {
						olan[constants.voice] = output[constants.CTX_RES_VOICE_ONLY+'_'+seclan] + "\n\n" + olan[constants.voice].toString().trim();
					}
				}
				this.replaceVariablesInDialog(olan, output);
			}
		} catch(e) {
			util.print("Error in appendTextVoiceVoiceOnly", e);
		} 
	}
	updateCustomStructuredDialog() {
		let output = this.getFirstObject();
		if(!util.isEmpty(output) && (this._decision[constants.ACTION_HANDLER] === constants.ACTION_HANDLER_ACAD_EVENTS)) {
			acadResponse.customizeResponse(output, this._input, this._decision, this._configuration);
		}
	}

	clearIDs() {
		let a;
		if((a=this.response) && (a=a[constants.results]) && (a=a[constants.objects])) {
			a.forEach(element => {
				if(element._id) delete element._id;
			});
		}
	}
}

function ConstructResponse(response, configs, decision, output, input) {
	//FilterResponse(decision, output);
	if (constants.isSpecialBot in configs && configs[constants.isSpecialBot]) {
		resAppStatus.getApplicationResponseStatusForMicrobot(input, decision);
		liblang.constructTextVoiceAndVoiceOnly(input, output, decision);
	}
	else
	{
		resAppStatus.getApplicationResponseStatus(input, decision);
	}
	
	
	if(!response[constants.additionalPersistentInformation] && input[constants.additionalPersistentInformation]) {
		response[constants.additionalPersistentInformation] = input[constants.additionalPersistentInformation];
	}
	response[constants.userDisplayName] = response[constants.userDisplayName] ? response[constants.userDisplayName] : input[constants.userDisplayName] || '';            
	response[constants.version] = configs[constants.Version] || process.env.EBSP_VERSION || '';
	if(input[constants.text] != 'undefined') { response[constants.input] = {}; response[constants.input][constants.text] = input[constants.text]; }
	if(input[constants.apiId] != 'undefined') response[constants.apiId] = input[constants.apiId];
	if(input[constants.userId] != 'undefined') response[constants.userId] = input[constants.userId];
	if(input[constants.languageCode] != 'undefined') response[constants.languageCode] = input[constants.languageCode];
	if(input[constants.token] != 'undefined') response[constants.token] = input[constants.token];
	if(input[constants.applicationId] != 'undefined') response[constants.applicationId] = input[constants.applicationId];
	if(input[constants.source] != 'undefined') response[constants.source] = input[constants.source];
	if(input[constants.intents] != 'undefined') response[constants.intents] = input[constants.intents];
	if(input[constants.entities] != 'undefined') response[constants.entities] = input[constants.entities];
	if(decision[constants.ACTION_HANDLER] != 'undefined') response[constants.action] = decision[constants.ACTION_HANDLER];
	if((constants.Intents in decision) && (decision[constants.Intents].length > 0)) {
		response[constants.intent] = decision[constants.Intents][0];
	}
	if((constants.Entites in decision) && (decision[constants.Entites])) {
		response[constants.entity] = decision[constants.Entites].toString();
	}
	response[constants.sensitive] = false;
	if((constants.sensitive in decision) && decision[constants.sensitive]) {
		response[constants.sensitive] = decision[constants.sensitive];
	}
	if((constants.responseStatus in decision)) {
		response[constants.responseStatus] = decision[constants.responseStatus];
	}
	if((constants.applicationStatus in decision) && decision[constants.applicationStatus]) {
		response[constants.applicationStatus] = decision[constants.applicationStatus];
	}
	//if(!(constants.DECISION_STATUS in response)) {
		response[constants.DECISION_STATUS] = (decision[constants.DECISION_STATUS]) ? decision[constants.DECISION_STATUS] : 0;
	//}
	let processAgent = {};
	let firstResult;
	response[constants.processAgent] = processAgent;
	if((!(constants.showFollowUp in decision) || !decision[constants.showFollowUp])) {
		firstResult = ((a=output[constants.results]) && (a=a[constants.objects]) && (a=a[0])) ? a : {};

		if(firstResult && firstResult[constants.CTX_RES_PROCESS_AGENT_ID]) {
			processAgent[constants.processAgentId] = firstResult[constants.CTX_RES_PROCESS_AGENT_ID];
		}
		if(firstResult && firstResult[constants.CTX_RES_PROCESS_ID]) {
			processAgent[constants.processId] = firstResult[constants.CTX_RES_PROCESS_ID];
		}
		if(input[constants.MessageId] ) {
			processAgent[constants.processAgentTxnId] = input[constants.MessageId];
		}
	}

	var a; if(output && (a = output[constants.results])) response[constants.results] = a; 
	if(output[constants.results]) delete output[constants.results];
	
	if(constants.CTX_RES_COUNT in output) {
		(a = response) && (a = a[constants.output]) ? (a[constants.CTX_RES_COUNT] = output[constants.CTX_RES_COUNT]) : 0;
	}
	if(input && (input[constants.context])) {
		if(constants.context in response) {
			response[constants.context] = {...response[constants.context], ...input[constants.context] };
		} else {
			response[constants.context] = input[constants.context];
		}
	}

	if(constants.context in response && (constants.CTX_RES_COUNT in response && response[constants.CTX_RES_COUNT] === 1) && 
		(firstResult && firstResult[constants.CTX_RES_DIALOG_FLOW_ID])) {
			let dialogFlow = {
				"dialogFlowID": firstResult[constants.CTX_RES_DIALOG_FLOW_ID]
			}
		response[constants.context]["dialogFlow"] = dialogFlow;
	}
	
}
module.exports = {
	ConstructResponse:ConstructResponse,
	ResponseHandler:ResponseHandler
}