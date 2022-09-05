//DialogIdentifier
const constants = require('./../moduleconstants');
request = require('request');
exports.loadConfiguration = function(env) {
	return new Promise((resolve, reject) => {
		if(!process.env.KM_API_URL) {
			reject({error: 'Database Configuration URL is missing..', stCode: constants.STATUS_CONFIG_URL_NOT_FOUND});
		} else {
			var param = {
				"environment": env			
			};
			request({
				method: 'POST',
				uri: process.env.KM_API_URL+'micro-bot-configuration',
				json: param,
				headers: {
				  Authorization: 'Basic ' + process.env.KM_API_AUTH,
				  'Content-Type': "application/json"
				}
			}, async function (e, result, body) {
				if(e) {
					reject({error: e, stCode: constants.STATUS_CONFIG_FAILED});
				} else if(!Object.keys(body).length) {
					reject({error: 'Empty result for configuration: '+env, stCode: constants.STATUS_CONFIG_NO_RESULT});
				} else if(Object.keys(body).length) {
					resolve(body[env]);
				}
			});
		}
	});
}
