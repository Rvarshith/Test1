var constants = require('./constants.js');

async function getUserInfo(input, configs, callback) {
    let url = configs[constants.ContextManagerURL];

    if(input.userId && input.userId === constants.GUEST_USER)
    {
        return callback('', '', '');
    }

    if(!url)
    {
       return callback("URL is not Set", '', '');
    }
	    
    /* Call the service with a timout */
	var options = {
		method: 'GET',
		uri: url+"/item/" + input.userId, 
		encoding: null, 
		rejectUnauthorized: false,
		timeout: 3000,
		headers: {
			'User-Agent': 'node.js',
			"Content-Type": "application/json"
		}
	};
	
	await require('request')(options, function(e, res, body) {
        let bodyParseStr;
        if(body)
        {
            try{
                bodyParseStr = JSON.parse(body);
            }
            catch(e) {
                console.log("error parsing context manager response::" + body);
            }
        }
            
        if(e || ! bodyParseStr || (body && bodyParseStr["status"] && bodyParseStr["status"] != 200))
        {
            console.log("could not get the information from context manager::userid::" 
                + input.userId + "::error::" + e + "::resonpse::" + JSON.stringify(body));
            return callback(e, res);
        }
        else{
            console.log("User Information in context manager::userid::" 
                + input.userId + "::userInfo::" + JSON.stringify(body));
            return callback(e, res, body);
        }
    });
}

exports.addContextEntities = function(wcsEntities, input, configs)
{
    return new Promise((resolve, reject) => { 
        console.log("WCS entities before adding context entities::" + JSON.stringify(wcsEntities));

        let addContextGenderEntity = true;
        for(var i=0; i < wcsEntities.length; i++) {
            let value = new String(wcsEntities[i].value);
            console.log("value typeof::" + typeof value);
            
            if(value.toLowerCase().indexOf("female") != -1 || value.toLowerCase().indexOf("male") != -1)
            {
                addContextGenderEntity = false;
            }
        }

        if(addContextGenderEntity)
        {
            getUserInfo(input, configs, function(error, status, result){
                if(error)
                {
                    console.log("Could not get context details for userID::" + input.userId + 
                        "::error response::" + error + "::resonse::" + status);
                        reject();
                }
                else{
                    if(result)
                    {
                        result = JSON.parse(result);

                        if(result[constants.UserInfo])
                        {
                            let userInfo = result[constants.UserInfo];
                            let gender = userInfo[constants.genderDesc];

                            let genderContextEntity = {
                                "entity" : "Student Type",
                                "value" : gender + constants.Gender_Postfix
                            };
                            wcsEntities.push(genderContextEntity);
                            resolve();
                        }
                    }
                    resolve();
                }
            });
        }
        else
        {
            resolve();
        }
    });
}

exports.updateQueryWithContextDetails = function updateQueryWithContextDetails(queryStr, input, configs) {
   return new Promise((resolve, reject) => { let query = JSON.parse(queryStr);
    let subQuery = {
        "bool": {
            "must_not": {
                "exists": {
                    "field": "SECONDARY_ENTITY_NAME"
                }
            }
        }
    };

    let subQueryStr = JSON.stringify(subQuery);

    console.log("Seconadry must not exists:::" + queryStr.includes(subQueryStr));
    if((query.query) && (query.query.bool) && (query.query.bool.must) && 
		Array.isArray(query.query.bool.must) && !queryStr.includes(subQueryStr)) {
        
            getUserInfo(input, configs, function(error, status, result){
            if(error)
            {
                console.log("Could not get context details for userID::" + input.userId + 
                    "::error response::" + error + "::resonse::" + status);
                    reject(queryStr);
            }
            else{
                if(result)
                {
                    result = JSON.parse(result);

                    if(result[constants.UserInfo])
                    {
                        let userInfo = result[constants.UserInfo];
                        let gender = userInfo[constants.genderDesc];
                        let genderQuery = {
                            "match":{
                                "SECONDARY_ENTITY_NAME":{
                                    "query": gender + constants.Gender_Postfix,
                                    "operator":"and",
                                    "boost":"4"
                                }
                            }
                        };
                        
                        query.query.bool.must.push(genderQuery);
                        queryStr = JSON.stringify(query);
                        resolve( JSON.stringify(query));
                    }
                }
            }
        });
    }
    else
    {
        resolve( JSON.stringify(query));
    }
    });
}

exports.setDisplayNameinInput = function(input, configs)
{
    return new Promise((resolve, reject) => { 
        getUserInfo(input, configs, function(error, status, result){
            if(error)
            {
                console.log("Could not get context details for userID::" + input.userId + 
                    "::error response::" + error + "::resonse::" + status);
                    resolve();
            }
            else{
                if(result)
                {
                    result = JSON.parse(result);

                    if(result[constants.UserInfo])
                    {
                        let userInfo = result[constants.UserInfo];
                        var inputLangCode = input[constants.languageCode].toUpperCase();
                        if((inputLangCode in userInfo[constants.first_name]) && userInfo[constants.first_name][inputLangCode]){
                            input[constants.userDisplayName] = userInfo[constants.first_name][inputLangCode];
                        } else if((constants.DEFAULT_LANGUAGE_CODE_CAPS in userInfo[constants.first_name]) &&
                                    userInfo[constants.first_name][constants.DEFAULT_LANGUAGE_CODE_CAPS]) {
                            input[constants.userDisplayName] = userInfo[constants.first_name][constants.DEFAULT_LANGUAGE_CODE_CAPS];
                        } else {
                            console.log("we couldnt get the user name either from userdiplayname or context"+
                                            "manager");
                        }
                        resolve();
                    }
                }
                resolve();
            }
        });
        
    });
}