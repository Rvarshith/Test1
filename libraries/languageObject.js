var constants = require('./../constants.js');
exports.constructTextVoiceAndVoiceOnly = function(input, output, decision) {
    var a, languages;
    if(output[constants.CTX_RES_COUNT] && output[constants.CTX_RES_COUNT] > 0) {
        var objects = ((a=output[constants.results]) && (a=a[constants.objects])) ? a : {};
        for(var i in objects) {
            if(objects && objects.length === 1 && constants.CTX_RES_DAILOG_FLOW_ID in objects[i] && objects[i][constants.CTX_RES_DAILOG_FLOW_ID]) {
                input[constants.context][constants.dialogFlowID] = objects[i][constants.CTX_RES_DAILOG_FLOW_ID];
            }
            b = objects[i];
	        languages = b[constants.LANGUAGES];
	        delete b[constants.LANGUAGES];

	        if(languages) {
  	            console.log("Value of languages retrieved from elasticsearch::" + languages);
		        try {
			        languages = JSON.parse(languages);
		
			        let enObject = languages[constants.DEFAULT_LANGUAGE_CODE_CAPS];
                    console.log("English language object::" + JSON.stringify(enObject));

			        let lanvars = constants.CTX_LAN_VARS.split(',');
			        console.log("Value of lanvars::" + lanvars);
		
			        let inputLanguage = input[constants.languageCode].toUpperCase();
                    console.log("language got from input::" + inputLanguage);

			        let secondaryLanObject;

			        if(inputLanguage != constants.DEFAULT_LANGUAGE_CODE_CAPS)
      	                secondaryLanObject = languages[inputLanguage];
		
                    if(lanvars) {
                        for(k in lanvars) {
                            let key = lanvars[k].toString().trim();
                            console.log("fetching details for key::" + key);
                            console.log("value of i::" + i);
                            
                            console.log("inside i== 0 and !acad loop");

                            if(enObject && enObject[key]) {
                                if((decision[constants.ACTION_HANDLER] !== constants.DIFFERENCE_INTENT) && (i == 0)) {
                                    console.log("value of english object for::" + key + ":: is::" + JSON.stringify(enObject[key]));
                                    output[constants.CTX_RES+'_'+key] = enObject[key];					
                                    b[constants.CTX_RES+'_'+key] = enObject[key];
                                } else {
                                    b[constants.CTX_RES+'_'+key] = enObject[key];
                                }
                            }
                            if(secondaryLanObject && secondaryLanObject[key]) {
                                if(decision[constants.ACTION_HANDLER] !== constants.DIFFERENCE_INTENT && i == 0) {
                                    console.log("value of secondary object for::" + key + ":: is::" + JSON.stringify(secondaryLanObject[key]));
                                    output[constants.CTX_RES+'_'+key + '_' + inputLanguage] = secondaryLanObject[key];					
                                    b[constants.CTX_RES+'_'+ key + '_' + inputLanguage] = secondaryLanObject[key];
                                } else {
                                    b[constants.CTX_RES+'_'+ key + '_' + inputLanguage] = secondaryLanObject[key];
                                }
                            }
                            
                        }
                    }
                    console.log("context::" + JSON.stringify(output));
                    console.log("b::" + JSON.stringify(b));
                } catch(languageJsonParseError) {
                    console.log("Error parseing Language attribute from Elasticsearch");
                }
          } else {
                console.log("There is no language object defined in elasticsearch");
            //log error message stating we do not have lanuage object
            // return error as technical diffculties
          }
        }
    }
}