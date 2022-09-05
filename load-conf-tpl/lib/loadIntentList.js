//DialogIdentifier
const constants = require('./../moduleconstants');
request = require('request');
exports.intentList = function() {
	return new Promise((resolve, reject) => {
		if(!process.env.BASE_AWS_URL) {
			reject({error: 'Database Configuration URL is missing..', stCode: constants.STATUS_CONFIG_URL_NOT_FOUND});
		} else {
			request({
				method: 'GET',
				uri: process.env.KM_API_URL+'intent_handlers_api',
				headers: {
					Authorization: 'Basic ' + process.env.KM_API_AUTH,
				}
			}, async function (e, result, body) {
				if(e) {
					return reject({error: e, stCode: constants.STATUS_TPL_LOADING_FAILED});
				} else if(!Object.keys(body).length) {
					return reject({error: 'Empty result for templates: '+env, stCode:constants.STATUS_TPL_LOADING_NO_RESULT});
				} else if(Object.keys(body).length) {
					console.log(Object.keys(body).length);
					try {
						results = { "intentList" : JSON.parse(body.toString())};
						resolve(results);
					} catch(error) {
						return reject({error: body.toString()+env, stCode:constants.STATUS_CONFIG_URL_NOT_FOUND});
					}
				}
			});
		}
	});
}
//process.env.BASE_AWS_URL+'getIntentList',