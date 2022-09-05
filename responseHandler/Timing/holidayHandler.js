function getHolidays(configs) {
	
	url = response.configs[constants.EBDSURL] + '/' +response.configs.Index + '' + util.at_xpath(step, "query/@url", 1);
		
		query = {
			"query": {
				"match": {
					"ENVIRONMENT" : env						
				}
			},
			"size": 1
		};
		var options = {
			method: 'POST',
			uri: url, 
			encoding: null, 
			rejectUnauthorized: false,
			timeout:map.getAttribute(constants.timeout),
			headers: {
				'User-Agent': 'node.js',
				"Content-Type": "application/json"
			},
			body: JSON.stringify(query)
		};
		console.log(url + JSON.stringify(query));
		require('request')(options, function(e, res, body) {
			/* Respond with hits when available */
			if(e) {
				return cbk(e, {});
			}
			try {
				body = JSON.parse(body);
			} catch(e) {
				return cbk(e, {});
			}
				
			if(!e && body && (a = body['error'])) {			
				if((a = a['root_cause'][0]) && (a = a['reason'])) e = a;
				else if((a = body['error']['reason'])) e = a;
				else  e = 'Failed';
				e += ' ' + url + ' ' + query;
				return cbk(e, {});
			}
			leni = (body && (hits = body.hits) && (hits = hits.hits)) ? hits.length : 0;
			if(leni > 0 && (a = hits[0]._source)) {
				conf = {};
				conf[constants.Environment] = a[constants.ENVIRONMENT];
				conf[constants.EBSPVersion] = a[constants.EBSP_VERSION];
				conf[constants.Version] = a[constants.VERSION];
				conf[constants.Timezone] = a[constants.TIMEZONE];
				conf[constants.Timeout] = a[constants.TIMEOUT];
				conf[constants.AWSURL] = a[constants.AWS_URL];
				conf[constants.EBDSURL] = a[constants.EBDS_URL];
				conf[constants.ProxyURL] = a[constants.PROXY_URL];
				conf[constants.Index] = a[constants.INDEX];
				conf[constants.Name] = a[constants.WORKSPACE_NAME];
				conf[constants.Workspace] = a[constants.WORKSPACE_ID];
				conf[constants.Username] = a[constants.USERNAME];
				conf[constants.Password] = a[constants.PASSWORD];
				conf[constants.VersionDate] = a[constants.VERSION_DATE];
				conf[constants.Campus] = a[constants.UNIVERSITY_NAME];
				conf[constants.UniversityURL] = a[constants.UNIVERSITY_URL];
				conf[constants.GoogleSearchURL] = a[constants.GOOGLE_SEARCH_URL];
				conf[constants.DATE_FORMAT] = a[constants.DATE_FORMAT];
				conf[constants.DATE_TIME_FORMAT] = a[constants.DATE_TIME_FORMAT];
				conf[constants.TIME_FORMAT] = a[constants.TIME_FORMAT];
				conf[constants.EBSPURL] = "";
				return cbk('', conf);
			} else {
				return cbk('Configuration not found', {});
			}
		});
}