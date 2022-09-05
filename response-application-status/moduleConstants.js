function define(name, value) {
	Object.defineProperty(exports, name, {
		value:      value,
		enumerable: true
	});
}

//Response Status
define("SUCCESS", 0);
define("FOLLOW_UP", 1);
define("NO_DATA", 2);
define("SEARCH", 3);
define("ERROR", 4);
define("EXCEPTION", 5);

//Application Status
define("isSpecialBot", "isSpecialBot");
define("allowedIntentsEnabled", "allowedIntentsEnabled");

define("SUCCESS_ONE_INTENT_N_ENTITY", "00");
define("SUCCESS_ONE_INTENT_CONTEXT_ENTITY", "01");
define("SUCCESS_ONE_INTENT_MIXED_ENTITY", "02");
define("SUCCESS_ONE_INTENT_N_ENTITY_ACROSS_INTENT", "03");
define("SUCCESS_CONTEXT_INTENT_N_ENTITY", "04");
define("SUCCESS_CONTEXT_INTENT_CONTEXT_ENTITY", "05");
define("SUCCESS_CONTEXT_INENT_MIXED_ENTITY", "06");
define("SUCCESS_CONTEXT_INTENT_N_ENTITY_ACROSS_INTENT", "07");
define("SUCCESS_NO_INTENT_N_ENTITY", "08");
define("SUCCESS_NO_INTENT_CONTEXT_ENTITY", "09");
define("SUCCESS_NO_INTENT_MIXED_ENTITY", "0A");
define("SUCCESS_NO_INTENT_N_ENTITY_ACROSS", "0B");

define("FOLLOW_UP_ONE_INTENT_N_ENTITY", "10");
define("FOLLOW_UP_ONE_INTENT_CONTEXT_ENTITY", "11");
define("FOLLOW_UP_ONE_INTENT_MIXED_ENTITY", "12");
define("FOLLOW_UP_ONE_INTENT_N_ENTITY_ACROSS_INTENT", "13");
define("FOLLOW_UP_CONTEXT_INTENT_N_ENTITY", "14");
define("FOLLOW_UP_CONTEXT_INTENT_CONTEXT_ENTITY", "15");
define("FOLLOW_UP_CONTEXT_INENT_MIXED_ENTITY", "16");
define("FOLLOW_UP_CONTEXT_INTENT_N_ENTITY_ACROSS_INTENT", "17");
define("FOLLOW_UP_NO_INTENT_N_ENTITY", "18");
define("FOLLOW_UP_NO_INTENT_CONTEXT_ENTITY", "19");
define("FOLLOW_UP_NO_INTENT_MIXED_ENTITY", "1A");
define("FOLLOW_UP_NO_INTENT_N_ENTITY_ACROSS", "1B");

define("NO_DATA_ONE_INTENT_N_ENTITY", "20");
define("NO_DATA_ONE_INTENT_CONTEXT_ENTITY", "21");
define("NO_DATA_ONE_INTENT_MIXED_ENTITY", "22");
define("NO_DATA_ONE_INTENT_N_ENTITY_ACROSS_INTENT", "23");
define("NO_DATA_CONTEXT_INTENT_N_ENTITY", "24");
define("NO_DATA_CONTEXT_INTENT_CONTEXT_ENTITY", "25");
define("NO_DATA_CONTEXT_INENT_MIXED_ENTITY", "26");
define("NO_DATA_CONTEXT_INTENT_N_ENTITY_ACROSS_INTENT", "27");
define("NO_DATA_NO_INTENT_N_ENTITY", "28");
define("NO_DATA_NO_INTENT_CONTEXT_ENTITY", "29");
define("NO_DATA_NO_INTENT_MIXED_ENTITY", "2A");
define("NO_DATA_NO_INTENT_N_ENTITY_ACROSS", "2B");

define("SEARCH_ONE_INTENT_N_ENTITY", "30");
define("SEARCH_ONE_INTENT_CONTEXT_ENTITY", "31");
define("SEARCH_ONE_INTENT_MIXED_ENTITY", "32");
define("SEARCH_ONE_INTENT_N_ENTITY_ACROSS_INTENT", "33");
define("SEARCH_CONTEXT_INTENT_N_ENTITY", "34");
define("SEARCH_CONTEXT_INTENT_CONTEXT_ENTITY", "35");
define("SEARCH_CONTEXT_INENT_MIXED_ENTITY", "36");
define("SEARCH_CONTEXT_INTENT_N_ENTITY_ACROSS_INTENT", "37");
define("SEARCH_NO_INTENT_N_ENTITY", "38");
define("SEARCH_NO_INTENT_CONTEXT_ENTITY", "39");
define("SEARCH_NO_INTENT_MIXED_ENTITY", "3A");
define("SEARCH_NO_INTENT_N_ENTITY_ACROSS", "3B");

define("ERROR_STATUS_WATSON_FAILED", "40");
define("ERROR_STATUS_WATSON_FORMAT_FAILED", "41");
define("ERROR_STATUS_CONFIG_FAILED", "42");
define("ERROR_STATUS_CONFIG_QUERY_FAILED", "43");
define("ERROR_STATUS_QUERY_NO_RESULT", "44");
define("ERROR_STATUS_QUERY_FAILED", "45");
define("ERROR_STATUS_DIALOGUE_TPL_FAILED", "46");
define("ERROR_STATUS_INVALID_INTENT", "47");
define("ERROR_STATUS_INVALID_DB_URL", "48");
define("ERROR_STATUS_CONTEXT_FAILED", "49");
define("ERROR_STATUS_TECH_FAILED", "4A");
define("ERROR_STATUS_INVALID_INPUT", "4B");
define("ERROR_STATUS_JSON_PARSE_ERROR", "4C");
define("ERROR_STATUS_INVALID_HTTP_METHOD", "4D");
define("ERROR_STATUS_UNSUPPORTED_LANGUAGE", "4E");
define("ERROR_MICROBOT_RESPONSE_ERROR", "4F");
define("ERROR_STATUS_MAP_XML_NOT_FOUND", "4G");
define("ERROR_STATUS_MICROBOT_CALL_ERROR", "4H");
define("ERROR_STATUS_INVALID_USER_PWD", "4I");
define("ERROR_STATUS_UNSUPPORTED_INTENT", "4J");
define("STATUS_TPL_LOADING_FAILED", "4K");
define("STATUS_TPL_LOADING_NO_RESULT", "4L");
define("STATUS_DISLIKE_REASON_URL_UNREACHABLE", "4M");
define("ERROR_STATUS_LANGUAGES_NULL", "4N");

define("EXCEPTION_INVALID_USER_PWD", "50");
define("EXCEPTION_UNSUPPORTED_INTENT", "51");
define("EXCEPTION_NO_PERSONALISE_QUESTION", "52");
define("EXCEPTION_ILLEGAL_ENTITY_TYPE", "53");
define("EXCEPTION_NO_INTENT_NO_ENTITY", "54");
define("EXCEPTION_ONE_INTENT_NO_ENTITY", "55");

define("entity", "entity");
define("ILLEGAL_ENTITY_TYPE", 'Illegal');
define("ENTITY_TYPE", 'ENTITY_TYPE');
define("Intents", "Intents");
define("Intent", "Intent");


define("GREETING_INTENT", "Greeting");
define("ABOUT_BOT_INTENT", "AboutUs");
define("THANKS_INTENT", "ThankYou");
define("GOOD_BYE_INTENT", "GoodBye");
define("GENERIC_INTENT", "GenericIntent");
define("PROMPT_A_QUESTION_INTENT", "PromptAQuestion");
define("PROMPT_A_SYMPATHY_INTENT", "PromptASympathy");
define("REPLY_A_STATUS_INTENT", "ReplyAStatus");
define("STEP_COUNTER", "STEP_COUNTER");

define("STEP_PS_PLUS_KS", 1);
define("STEP_P_NOT_S", 10);
define("STEP_P_PLUS_K", 2);
define("STEP_CTX_PS_PLUS_KS", 3);
define("STEP_ONLY_S", 4);
define("STEP_OTHER_INTENT", 5);

define("intents", "intents");
define("intent", "intent");
define("entities", "entities");
define("Entities", "Entities");
define("context", "context");

define("WCS_ENTITIES", "WCS_ENTITIES");
define("WCS_INTENT", "WCS_INTENT");

define("INTENT_FROM", "INTENT_FROM");
define("ENTITY_FROM", "ENTITY_FROM");
define("CONTEXTUAL_QUESTION", "CONTEXTUAL_QUESTION");
define("CONTEXT_ENTITIES", "CONTEXT_ENTITIES");

define("STEP_COUNTER", "STEP_COUNTER");
define("ACTION_HANDLER", "ACTION_HANDLER");
define("AH_NO_INTENT", "NoIntent");
define("ACTION_HANDLER_CAMPUS_EVENTS", "CampusEvent")
define("AH_UNSTRUCTURED", "Unstructured");
define("ACTION_HANDLER_UN_SUPPORTED", "unSupported");

define("PlaceAnaphor", "PlaceAnaphor");
define("PersonalDataAnaphor", "PersonalDataAnaphor");
define("LocationAnaphor", "LocationAnaphor");


define("ZERO_INTENT_ZERO_ENTITY", "00");
define("ZERO_INTENT_ONE_ENTITY", "01");
define("ZERO_INTENT_N_ENTITY", "0n");
define("ONE_INTENT_ZERO_ENTITY", "10");
define("ONE_INTENT_ONE_ENTITY", "11");
define("ONE_INTENT_NN_ENTITY", "1n");
define("N_INTENT_ZERO_ENTITY", "n0");

define("decisionStatus", "decisionStatus");
define("responseStatus", "responseStatus");
define("applicationStatus", "applicationStatus");
define("sensitive", "sensitive");

define("DECISION_SUCCESS", 0);
define("DECISION_NO_INTENT_NO_ENTITY", 1);
define("DECISION_NO_INTENT_N_ENTITY", 2);
define("DECISION_ONE_INTENT_NO_ENTITY", 3);
define("DECISION_ONE_INTENT_N_ENTITY_NO_RESULT", 4);
define("DECISION_ILLEGAL_ENTITY", 6);
define("DECISION_FOLLOW_UP", 7);
define("DECISION_SEARCH_RESPONSE", 8);
define("DECISION_UNSUPPORTED_INTENT", 9);//
define("DECISION_NO_PERSONALISE", 10);
define("DECISION_NO_DATA", 12);
define("DECISION_ERROR", 11);

define("UNSUPPORTED_INTENT", "UNSUPPORTED_INTENT");
define("ILLEGAL_ENTITY_TYPE", 'Illegal');
define("CTX_RES_COUNT", "CTX_RES_COUNT");

define("TBD", "TBD");
define("objectType", "objType");
define("ObjectTypeNone", "none");
define("errCode", "errCode");
define("showFollowUp", "showFollowUp");

define("ONE_INTENT_N_ENTITY", "0");
define("ONE_INTENT_CONTEXT_ENTITY", "1");
define("ONE_INTENT_MIXED_ENTITY", "2");
define("ONE_INTENT_N_ENTITY_ACROSS_INTENT", "3");
define("ONE_INTENT_CONTEXT_ENTITY_ACROSS_INTENT", "4");
define("ONE_INTENT_MIXED_ENTITY_ACROSS_INTENT", "5");

define("CONTEXT_INTENT_N_ENTITY", "6");
define("CONTEXT_INTENT_CONTEXT_ENTITY", "7");
define("CONTEXT_INENT_MIXED_ENTITY", "8");
define("CONTEXT_INENT_N_ENTITY_ACROSS_INTENT", "9");
define("CONTEXT_INENT_CONTEXT_ENTITY_ACROSS_INTENT", "A");
define("CONTEXT_INENT_MIXED_ENTITY_ACROSS_INTENT", "B");

define("NO_INTENT_N_ENTITY", "C");
define("NO_INTENT_CONTEXT_ENTITY", "D");
define("NO_INTENT_MIXED_ENTITY", "E");
define("NO_INTENT_N_ENTITY_ACROSS_INTENT", "F");
define("NO_INTENT_CONTEXT_ENTITY_ACROSS_INTENT", "G");
define("NO_INTENT_MIXED_ENTITY_ACROSS_INTENT", "H");

define("GENERIC_INTENT_NO_ENTITIES", "I");

define("NO_ENTITY", "0");
define("N_ENTITY", "1");
define("CONTEXT_ENTITY", "2");
define("MIXED_ENTITY", "3");

define("NO_INTENT", "0");
define("ONE_INTENT", "1");
define("CONTEXT_INTENT", "2");
define("ONE_INTENT_ACROSS_INTENT", "3");
define("CONTEXT_INTENT_ACROSS_INTENT", "4");
define("NO_INTENT_ACROSS_INTENT", "5");

define("ONE_INTENT_GENERIC", "6");



define("ACROSS_INTENT", "ACROSS_INTENT");
define("DIALOGUE_RULE_SIX", 6);
define("DIALOGUE_RULE", "dialogRule");