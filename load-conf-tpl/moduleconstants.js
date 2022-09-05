//
function define(name, value) {
	Object.defineProperty(exports, name, {
		value:      value,
		enumerable: true
	});
}

//Configuration variables:
define("Environment", "ENVIRONMENT");
define("Version", "EBSP_VERSION");
define("Timezone", "TIMEZONE");
define("Timeout", "TIMEOUT");
define("AWSURL", "AWS_URL");
define("EBDSURL", "EBDS_URL");
define("ProxyURL", "PROXY_URL");
define("Index", "INDEX");
define("WorkspaceName", "WORKSPACE_NAME");
define("WorkspaceID", "WORKSPACE_ID");
define("WorkspaceUser", "WORKSPACE_USER");
define("WorkspacePwd", "WORKSPACE_PASSWORD");
define("WorkspaceVersionDate", "WORKSPACE_VERSION_DATE");
define("WorkspaceURL", "WORKSPACE_URL");
define("UniversityName", "UNIVERSITY_NAME");
define("UniversityURL", "UNIVERSITY_URL");
define("GoogleSearchURL", "GOOGLE_SEARCH_URL");
define("SearchUrlEN", "SEARCH_URL_EN");
define("SearchUrlAR", "SEARCH_URL_AR");
define("DATE_FORMAT", "DATE_FORMAT");
define("TIME_FORMAT", "TIME_FORMAT");
define("DATE_TIME_FORMAT", "DATE_TIME_FORMAT");
define("SUPPORTED_LANGUAGES", "SUPPORTED_LANGUAGES");
define("rankingRange", "RANKING_RANGE");
define("resultLimit", "RESULT_LIMIT");
define("enableFollowUpOptions", "ENABLE_FOLLOWUP_OPTIONS");
define("defaultUserID", "DEFAULT_USERID");
define("ContextManagerURL", "CONTEXT_MANAGER_URL");
define("LoginURL", "LOGIN_URL");
define("LoginProxyURL", "LOGIN_PROXY_URL");
define("ProcessAgent", "PROCESS_AGENTS");
define("MICROBOT_AGENTS", "MICROBOT_AGENTS");
define("CallGetLikeDislikeReasonsURL", "CALL_GET_LIKEDISLIKE_REASONS_URL");
define("CallSaveLikeDislikeReasonsURL", "CALL_SAVE_LIKEDISLIKE_REASONS_URL");
define("UserInfoURL", "USER_INFO_URL");
define("ProxyAuth", "PROXY_AUTH");
define("GetNameByPersonID", "GET_NAME_BY_PERSONID");
define("GetUserInformation", "GET_USER_INFORMATION");
define("connectorURL", "CONNECTOR_URL");
define("connectorProxyURL", "CONNECTOR_PROXY_URL");
define("BotID", "BOT_ID");
define("FilterWords", "FILTER_WORDS");
define("BoostIntentRanking","BOOST_INTENT_RANKING");
define("BoostIntentRankingForAll", "BOOST_INTENT_RANKING_FOR_ALL");
define("considerSecondaryIntent", "CONSIDER_SECONDARY_INTENT");
//----------------------------------//

define("EBSPVersion", "Version");
define("VersionDate", "VersionDate");
define("TEXT", "TEXT");
define("VOICE", "VOICE");
define("VOICE_ONLY", "VOICE_ONLY");
define("Text", "Text");
define("Voice", "Voice");
define("VoiceOnly", "VoiceOnly");

define("BOT_Orchestrator", 1);
define("BOT_Campus", 2);
define("BOT_PersonDirectory", 3);
define("BOT_FinancialAid", 4);
define("BOT_AcademicPerformance", 5);
define("BOT_ClassSchedule", 6);

define("Template", "Template");
define("Code", "Code");
define("LanCode", "LanCode");
define("TechErrrorMessage", "There is an technical error while loading configurations & dialog templates.");
define("STATUS_SUCCESS", "0");
define("STATUS_CONFIG_FAILED", "42");
define("STATUS_CONFIG_NO_RESULT", "43");
define("STATUS_TPL_LOADING_FAILED", "4K");
define("STATUS_TPL_LOADING_NO_RESULT", "4L");
define("STATUS_CONFIG_URL_NOT_FOUND", "48");

define("INTENT_LIST" , "intentList");
define("INTENT_TYPE" , "INTENT_TYPE");
define("INTENT_NAMES" , "INTENT_NAMES");