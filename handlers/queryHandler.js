const util = require('./../util.js');
const constants = require('./../constants.js');
const Handler = require('./handler');

class QueryHandler extends Handler {
	constructor(input, decision, configuration, map) {
		super(input, decision, configuration, map);
	}
	
	runStructured(hname, ahOrder, searchType) {
		return new Promise((resolve, reject) => {
			let actionmap = null;
			if((actionmap = util.at_xpath(this._map, "*/*[@intent='" + (hname.actionName || '') + "']"))) {
				hname.actionMap = actionmap;
				this.executeStructured(hname, ahOrder, actionmap, searchType).then((output) => {
					resolve(output);
				}).catch((e) => {
					reject(e);
				});
			} else {
				reject(e);
			}
		});
	}
	
	runUnstructured(hname, ahOrder, searchType) {
		return new Promise((resolve, reject) => {
			let actionmap = null;
			if((actionmap = util.at_xpath(this._map, "*/*[@intent='" + (hname.actionName || '') + "']"))) {
				hname.actionMap = actionmap;
				this.executeUnstructured(hname, ahOrder, actionmap, searchType).then((output) => {
					resolve(output);
				}).catch((e) => {
					reject(e);
				});
			} else {
				reject(e);
			}
		});
	}
}
module.exports = QueryHandler