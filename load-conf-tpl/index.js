//index.js
const confLibrary = require('./lib/loadConfiguration'),
tempLibrary = require('./lib/loadTemplate');
const loadIntentList = require('./lib/loadIntentList');
var dialogTemplates = {};
var configurations = {};
var intentList = {};
const constants = require('./moduleconstants');

function loadTplConf(env, callback) {
	
	var confPromise = confLibrary.loadConfiguration(env);
	var tplPromise = tempLibrary.loadDialogTemplate(env);
	var intentListPromise = loadIntentList.intentList();
	
	Promise.all([confPromise, tplPromise, intentListPromise])
	.then((results) => {
		for(var i=0; i<results.length; i++) {
			/*if(Array.isArray(results[i])) {
				let len = results[i].length;
				let a = results[i];

				for(let j=0; j<len; j++) {
					let temp = {};
					if(!(a[j][constants.LanCode] in dialogTemplates)) {
						dialogTemplates[a[j][constants.LanCode]] = {};
					}
					temp[constants.Code] = (constants.Code in a[j]) ? a[j][constants.Code] : '';
					temp[constants.TEXT] = (constants.Text in a[j]) ? a[j][constants.Text] : '';
					temp[constants.VOICE] = (constants.Voice in a[j]) ? a[j][constants.Voice] : '';
					temp[constants.VOICE_ONLY] = (constants.VoiceOnly in a[j]) ? a[j][constants.VoiceOnly] : '';
					dialogTemplates[a[j][constants.LanCode]][a[j][constants.Code]] = temp;
				}
			} else {*/
				
			if(results && findKey(constants.Environment, results[i])===true) {
					var conf = results[i];
					configurations[env] = conf;
			} else if (findKey(constants.INTENT_LIST, results[i])===true) {
					intentList = results[i][constants.INTENT_LIST];
				} else {
					dialogTemplates = results[i];
				}
			//}
		}
		console.log(dialogTemplates);
		callback(null, constants.STATUS_SUCCESS);
	}, (errors) => {
		console.log(errors);
		callback(errors.error, errors.stCode);
	});
}

exports.dialogTemplates = function() {
	return dialogTemplates;
}

exports.getTemplateObject = function(lanCode, pickIndex) {
	if(lanCode)  lanCode = lanCode.toUpperCase();
	let lanObj = dialogTemplates[lanCode] || {};
	return lanObj[pickIndex] || {};
}

exports.getTemplate = function(lanCode) {
	if(lanCode)  lanCode = lanCode.toUpperCase();
	let lanObj = dialogTemplates[lanCode] || {}
	return lanObj;
}

exports.getDialogPickIndex = function(bot, rule, pickIndex) {
	return bot+''+rule+''+pickIndex;
}

function parseConfiguration(conf) {	
	if(conf)
	{
		if(constants.MICROBOT_AGENTS in conf && conf[constants.MICROBOT_AGENTS]) {
			conf[constants.MICROBOT_AGENTS] = JSON.parse(JSON.stringify(conf[constants.MICROBOT_AGENTS]));
		}

		if(constants.ProcessAgent in conf && conf[constants.ProcessAgent]) {
			conf[constants.ProcessAgent] = JSON.parse(JSON.stringify(conf[constants.ProcessAgent]));
		}
		if((constants.FilterWords in conf) && conf[constants.FilterWords]) {
			conf[constants.FilterWords] = JSON.parse(JSON.stringify(conf[constants.FilterWords]));
		}
	}
}

var confVariables = {};
confVariables[constants.Environment] = ['M', 'M'];
confVariables[constants.Version] = ['M', 'M'];
confVariables[constants.Timezone] = ['O', 'M'];
confVariables[constants.Timeout] = ['M', 'M'];
confVariables[constants.AWSURL] = ['O', 'O'];
confVariables[constants.EBDSURL] = ['O', 'M'];
confVariables[constants.ProxyURL] = ['O', 'O'];
confVariables[constants.Index] = ['O', 'O'];
confVariables[constants.WorkspaceName] = ['M', 'M'];
confVariables[constants.WorkspaceID] = ['M', 'M'];
confVariables[constants.WorkspaceUser] = ['M', 'M'];
confVariables[constants.WorkspacePwd] = ['M', 'M'];
confVariables[constants.WorkspaceVersionDate] = ['M', 'M'];
confVariables[constants.WorkspaceURL] = ['M', 'M'];
confVariables[constants.UniversityName] = ['O', 'M'];
confVariables[constants.UniversityURL] = ['O', 'M'];
confVariables[constants.GoogleSearchURL] = ['O', 'M'];
confVariables[constants.SearchUrlEN] = ['O', 'O'];
confVariables[constants.SearchUrlAR] = ['O', 'O'];
confVariables[constants.DATE_FORMAT] = ['O', 'M'];
confVariables[constants.TIME_FORMAT] = ['O', 'M'];
confVariables[constants.DATE_TIME_FORMAT] = ['O', 'M'];
confVariables[constants.SUPPORTED_LANGUAGES] = ['M', 'M'];
confVariables[constants.rankingRange] = ['O', 'M'];
confVariables[constants.resultLimit] = ['O', 'M'];
confVariables[constants.enableFollowUpOptions] = ['O', 'M'];
confVariables[constants.defaultUserID] = ['O', 'O'];
confVariables[constants.ContextManagerURL] = ['O', 'O'];
confVariables[constants.LoginURL] = ['O', 'O'];
confVariables[constants.LoginProxyURL] = ['O', 'O'];
confVariables[constants.ProcessAgent] = ['O', 'O'];
confVariables[constants.MICROBOT_AGENTS] = ['M', 'O'];
confVariables[constants.CallGetLikeDislikeReasonsURL] = ['M', 'O'];
confVariables[constants.CallSaveLikeDislikeReasonsURL] = ['M', 'O'];
confVariables[constants.CampusVoice] = ['M', 'M'];
confVariables[constants.UserInfoURL] = ['O', 'O'];
confVariables[constants.ProxyAuth] = ['O', 'O'];
confVariables[constants.GetNameByPersonID] = ['M', 'O'];
confVariables[constants.GetUserInformation] = ['M', 'O'];
confVariables[constants.ConnectorURL] = ['O', 'O'];
confVariables[constants.ConnectorProxyURL] = ['O', 'O'];
confVariables[constants.FilterWords] = ['O', 'O'];


function validateConfiguration(conf) {
	var notification = {};
	var emptyVariables = [];
	if(isEmptyObject(conf)) {
		notification['message'] = 'Configuration is empty';
		return notification;
	}
	var botId = ((constants.BotID in conf) && (conf[constants.BotID])) ? conf[constants.BotID] : false;

	if(!botId) {
		notification['message'] = 'BotID missing in configuration.';
		return notification;
	}
	var index = (botId - 1);
	
	for(var k in confVariables) {
		let validation = confVariables[k][index];
		if(validation == 'M' && (!(k in conf) || !(conf[k])))
			emptyVariables.push(k);
	}
	
	if(emptyVariables.length) {
		notification['message'] = 'These configuration variables are empty '+ emptyVariables.join(",");
		return notification;
	}
	
	return notification;
}

function isEmptyObject(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
function sendErrorNotification() {
	console.log("Inside send notionfication function");
	//constants.TechErrrorMessage;
}

function findKey(find, obj) {
	if (obj && (obj.constructor === Object)) { obj = Object.keys(obj); }
	for (var i = 0; i < obj.length; i++) {
	  if (find.toLowerCase() === obj[i].toLowerCase()) { return true; }
	}
	return false;
  }

exports.loadTemplateConfiguration = function(env, cbk){
	env = (env) ? env : process.env.EBSP_ENVIRONMENT;
	if(Object.keys(configurations).length > 0 && (env in configurations)) {
		cbk(null, constants.STATUS_SUCCESS, configurations[env]);
	} else {
		loadTplConf(env, function(e, st) {
			if(e) {
				console.error(e, st, {});
				sendErrorNotification();
				cbk(e, st, {});
			} else {
				try {
					parseConfiguration(configurations[env]);
					var notification = validateConfiguration(configurations[env]);
					console.log(notification);
					cbk(e, constants.STATUS_SUCCESS, configurations[env]);
				} catch(e) {
					cbk(e, constants.STATUS_CONFIG_FAILED, {});
				}
			}
		});
	}
}

exports.getIntentList = function() {
	
	return intentList;
}