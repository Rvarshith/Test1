function define(name, value) {
	Object.defineProperty(exports, name, {
		value:      value,
		enumerable: true
	});
}

define("WorkspaceName", "WORKSPACE_NAME");
define("WorkspaceID", "WORKSPACE_ID");
define("WorkspaceUser", "WORKSPACE_USER");
define("WorkspacePwd", "WORKSPACE_PASSWORD");
define("WorkspaceVersionDate", "WORKSPACE_VERSION_DATE");
define("WorkspaceURL", "WORKSPACE_URL");

define("STATUS_WATSON_FAILED", "40");
define("STATUS_WATSON_FORMAT_FAILED", "41");

define("RELAVANCE", "RELAVANCE");
define("SORTING_ASCENDING", 'asc');
define("SORTING_DESCENDING", 'desc');

define("StatusCode", "StatusCode");
define("applicationId", "applicationId");

define("intents", "intents");
define("entities", "entities");
define("context", "context");
define("literal", "literal");
define("entity", "entity");
define("value", "value");

define("ENVIRONMENT", "ENVIRONMENT");
define("Environment", "Environment");
define("PlaceAnaphor", "PlaceAnaphor");
define("PersonalDataAnaphor", "PersonalDataAnaphor");
define("LocationAnaphor", "LocationAnaphor");
define("MAX_INTENTS", 3);
define("STATUS_SUCCESS", "0");