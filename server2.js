var http = require('http'),
fs = require('fs'),
util = require('./util'),
constants = require('./constants'),
query = require('./query'), 
manager = require('./ebspManager'),
erresp = require('./errorHandler/errorHandler'),
watson = require('./yana-wcs/watson'), url = require('url'), request = require('request'),
auditlog = require('./auditlogHandler');
const conftpl = require('./load-conf-tpl');
const httpheaders = {"Content-Type": "application/json; charset=UTF-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers":"X-Requested-With"};

var server = http.createServer(function(req, res) {
	var input = '', q, error= false, log = {}, configuration = {};
	req.on('data', function(bytes) { input += bytes });
	req.on('end',function() {
		if(req.method == constants.POST_METHOD) {
			
			var log = {};
			if(auditlog.initializeLog(input, log)) {
				input = JSON.parse(input);
				GetConfigurations(input);
			} else {
				SendResponse(constants.ERROR_STATUS_INVALID_INPUT, {}, log);
			}
			
			/*This function get configurations from database */
			function GetConfigurations(input) {
			
				let env ;
				if(process.env.INPUT_APP_ID  &&  input[constants.applicationId]){
					env =  input.applicationId;
				}else{
					env =process.env.EBSP_ENVIRONMENT;
				}
				
				conftpl.loadTemplateConfiguration(env, function(e, st, conf) {
					if(e) {
						log[constants.StatusCode] = st;
						SendResponse(e, input, log);
					} else {
						configuration = conf;
						CallWCSOREBSP(input);
					}
				});
			};
			
			function CallWCSOREBSP(input) {
				var q = url.parse(req.url, true);
				if(q.pathname == '/wcs') {
					WcsCall(input);
				} else {
					EBSPCall(map, input, log);
				}
			}
			function EBSPCall(map, input, log) {
				console.log("EBSPCall function start");
				try {
					manager.run(map, input, log, configuration, (err, resp) => {
						console.log("Manager.run success output::" + resp);
						console.log("JSON.strigify::" + JSON.stringify(resp));
						console.log("EBSPCall function END");
						SendResponse(err, resp, log);
					});
				} catch(err) {
					console.log("Manager.run error output::" + err);
					console.log("JSON.strigify::" + JSON.stringify(err));
					util.print("\n Server.js ebsp Call: ", err);
					console.log("EBSPCall function END");
					if(typeof resp !== "undefined")
						SendResponse(err, resp, log);
					else
						SendResponse(err, {}, log);
				}
			}
			function WcsCall(input) {
				console.log("WCS call function start");
				try {						
					watson.run(input, configuration, log, (err, resp) => {
						if(!err) {
							EBSPCall(map, input, log);					
						} else {
							console.log("watson.run function call error");
							SendResponse(err, input, log);
						}
						
					});
				} catch(err) {
					console.log("exception calling WCS run method");
					util.print("\n Server.js WCS Call ", err);
					SendResponse(err, {}, log);
				}
			}
			function constructErrorResponse(err, resp, log) {
				console.log("SendResponse starts");
				if(err && err != null) {
					console.log("error has occured and it is::" + err);
					if(typeof err == 'object') {
						log[constants.ErrorDescription] = err.toString();
					} else {
						log[constants.ErrorDescription] = err;
					}
					util.print("Server.js Error: ", err);
					let st = log[constants.StatusCode] || '';
					//resp = erresp.getErrorResponse(st, map, input, resp);
					erresp.getErrorResponse(st, map, input, resp, function(err, response) {
						return constructResponse(err, response, log);
					});
				}
			}
			function SendResponse(err, resp, log) {
				if(err && err != null) {
					constructErrorResponse(err, resp, log);
				} else {
					constructResponse(err, resp, log);
				}
				//console.log("end of SendResponse");
			}

			function constructResponse(err, resp, log) {
				resp[constants.statusCode] = (log[constants.StatusCode]) ? log[constants.StatusCode] : constants.STATUS_SUCCESS;
				resp[constants.MessageId] = log[constants.MessageId];
				resp[constants.servedBy] = process.env.EBSP_ENVIRONMENT;
				log[constants.ResponseDateTime] = util.format_date(new Date(), 1);
				if((a = resp) && (a=a[constants.output])) {
					for(k in a) {
						if((b=a[k]) && (typeof b === "object")) {
							if(b && (b=b[constants.text]) && b.length) {							
								if(log[constants.ResponseText]) {
									log[constants.ResponseText] = log[constants.ResponseText]+"<br />"+k+": "+b[0];
								} else {
									log[constants.ResponseText] = k+": "+b[0];
								}
							}
						}
					} 
				}
				//log[constants.ResponseText] = ((a = resp) && (a=a[constants.output]) && (a=a[constants.text]) && (a=a[0])) ? a : '';
				log[constants.DecisionStatus] = ((a = resp) && (a=a[constants.DECISION_STATUS])) ? a : 0;
				log[constants.applicationStatus] = ((a = resp) && (a=a[constants.applicationStatus])) ? a : 0;
				log[constants.responseStatus] = ((a = resp) && (a=a[constants.responseStatus])) ? a : 0;
				
				log[constants.ResponseJSON] = JSON.stringify(resp);
				log[constants.ConversationID] = ((a = resp) && (a=a[constants.context]) && (a=a[constants.conversation_id])) ? a : '';
				log[constants.Entites] = (resp[constants.entity]) ? resp[constants.entity] : '';
				log[constants.Intent] =  (resp[constants.intent]) ? resp[constants.intent] : '';
				log[constants.sensitive] = (resp[constants.sensitive]) ? resp[constants.sensitive] : false;
				log[constants.version] = (configuration && configuration[constants.Version]) ? configuration[constants.Version] : version;
				res.writeHead(200, httpheaders);
				res.write(JSON.stringify(resp));
				console.log("returning response and response object is::" + JSON.stringify(resp));
				res.end();
				auditlog.savelog(input, resp, log, audit_service);			
				
			}
		} else {
			res.writeHead(200, httpheaders);
			res.write(JSON.stringify({Error: 'Call with POST method...'}));
			res.end();
		}
		
	});
});
	
map = util.parse(fs.readFileSync(__dirname + '/map.xml', { encoding:'utf8' }));
query.walk_actions(map);

//process.env.AWS_URL="https://uaeu-stg-auditlog.yanaimpl.com/saveAuditData";
//process.env.EBSP_ENVIRONMENT="MAIN-BOT";
//process.env.EBSP_VERSION="5.7.0.1";
//process.env.BASE_AWS_URL="https://uaeu-stg-auditlog.yanaimpl.com/";
//process.env.YANA_DEFAULT_TIMEOUT = "5000";
//process.env.INPUT_APP_ID == true;

 var audit_service = process.env.AWS_URL;
 var env = process.env.EBSP_ENVIRONMENT;
 var version = process.env.EBSP_VERSION;


conftpl.loadTemplateConfiguration(env, function(err, st, conf) {
	if(!err) {
		var dialogTemplates = conftpl.dialogTemplates();
    	if(conf != null && conf != "" && conf != undefined && dialogTemplates != null && dialogTemplates != "" && dialogTemplates != undefined) {
			server.listen(process.env.PORT || process.env.VCAP_APP_PORT || 5000);
			console.log("The app is started and ready");
		}
	} else {
		console.log(st+':'+err);
		console.log("configuration and template url was not loaded properly please check DB Url");
	}
});