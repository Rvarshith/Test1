//DialogIdentifier
const constants = require('./../moduleconstants');
request = require('request');
exports.loadDialogTemplate = function(env) {
	return new Promise((resolve, reject) => {
		if(!process.env.KM_API_URL) {
			reject({error: 'Database Configuration URL is missing..', stCode: constants.STATUS_CONFIG_URL_NOT_FOUND});
		} else {
			request({
				method: 'GET',
				uri: process.env.KM_API_URL+'microbot_dialogs_api',
				headers: {
					Authorization: 'Basic ' + process.env.KM_API_AUTH,
				}
			}, async function (e, result, body) {
				if(e) {
					return reject({error: e, stCode: constants.STATUS_TPL_LOADING_FAILED});
				} else if(!Object.keys(body).length) {
					return reject({error: 'Empty result for templates: '+env, stCode:constants.STATUS_TPL_LOADING_NO_RESULT});
				} else if(Object.keys(body).length) {
					try {
						resolve(JSON.parse(body.toString()));
					} catch(error) {
						return reject({error: body.toString()+env, stCode:constants.STATUS_CONFIG_URL_NOT_FOUND});
					}
				}
			});
		}
	});
}
