const util = require('./../util.js');
const constants = require('./../constants.js');
const QueryFactory = require('./steps/queryFactory');

class Handler {
	constructor(input, decision, configuration, map) {
		this._input = input;
		this._decision = decision;
		this._configuration = configuration;
		this._map = map;
		this._stmap = util.at_xpath(this._map, "*/*[@intent='"+constants.Structured+"']");
	}
	
	getPostOption() {
		let options = {
			method: 'POST',
			encoding: null, 
			rejectUnauthorized: false,
			timeout: this._configuration[constants.Timeout] || process.env.YANA_DEFAULT_TIMEOUT,
			headers: {
				'User-Agent': 'node.js',
				"Content-Type": "application/json"
			}
		};
		if(this._configuration[constants.ProxyURL]) {
			options.proxy = this._configuration[constants.ProxyURL];
		}
		
		return options;
	}
	
	
	executeStructured(hname, ahOrder, actionmap, searchType) {
		
		return new Promise((resolve, reject) => {
			try {
				let promises = [];
				
				let options = this.getPostOption();
				
				let queryFactory = new QueryFactory();
				
				let url = false;

				let steps = (Array.isArray(hname._steps)) ? hname._steps : [];

				steps.forEach(s => {
					
					let queryClass = queryFactory.getQueryClass(s, this._input, this._decision, this._configuration, hname.actionName, actionmap, this._stmap);
					
					url = queryClass.getURL();
					queryClass.updateEntities();
					
					if(url) {
						options.url = url;
					}
					
					let query = queryClass.getStepQuery();
					
					let commonQuery = queryClass.getCommonQuery();
					
					query = hname.preUpdate(query, commonQuery, s);
					
					query = queryClass.update(query);
					
					if(query) {
						query = hname.postUpdate(query, s);
						options.body = query;
					}
					console.log(url);
					console.log(query);

					if(query)
					promises.push(util.execute(url, query, options, s, hname.actionName, ahOrder, hname.objectType, searchType));
				});
			
				Promise.all(promises).then((results) => {
					console.log("All done", results);
					resolve(results);
				})
				.catch((e) => {
					// Handle errors here
					console.log(e);
					reject({code:constants.ERROR_STATUS_TECH_FAILED, desc:e});
				});
			} catch(e) {
				reject({code:constants.ERROR_STATUS_TECH_FAILED, desc:e});
			}
		}) 
		console.log("Inside main query--"+actionmap.nodeName);
	}
	
	executeUnstructured(hname, ahOrder, actionmap, searchType) {
		
		return new Promise((resolve, reject) => {
			try {
				let promises = [];
				
				let options = this.getPostOption();
				
				let queryFactory = new QueryFactory();
				
				let url = false;

				let steps = (Array.isArray(hname._steps)) ? hname._steps : [];

				let first = true;
				let mainQuery = null;
				steps.forEach(s => {
					
					let queryClass = queryFactory.getQueryClass(s, this._input, this._decision, this._configuration, hname.actionName, actionmap, null);
					
					if(first) {
						url = queryClass.getURL();
						queryClass.updateEntities();
						mainQuery = queryClass.getStepQuery();
						first = false;
					}
					if(url) {
						options.url = url;
					}
					let query = mainQuery;

					query = hname.preUpdate(query, s);
					query = queryClass.update(query);

					if(query) {
						query = hname.postUpdate(query, s);
						options.body = query;
					}
					console.log("EBDS URL:", url);
					console.log("Query to be executed:", query);

					if(query)
					promises.push(util.execute(url, query, options, queryClass.getName(), hname.actionName, ahOrder, hname.objectType, searchType));
				});
			
				Promise.all(promises).then((results) => {
					console.log("All done", results);
					resolve(results);
				})
				.catch((e) => {
					// Handle errors here
					console.log(e);
					let erCode = (e && e[constants.StatusCode]) ? e[constants.StatusCode] : constants.ERROR_STATUS_TECH_FAILED;
					reject({code:erCode, desc:e});
				});
			} catch(e) {
				reject({code:constants.ERROR_STATUS_TECH_FAILED, desc:e});
			}
		}) 
		console.log("Inside main query--"+actionmap.nodeName);
	}
}
module.exports = Handler