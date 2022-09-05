#Version - v5.10.0.1
- Integrated KB API - Intent handlers, Configurations & dialogs
- Changed done support execution on AWS lambda.

#Version - v5.9.0.0
- Application id will be taken from the input if env variable INPUT_APP_ID is set true.

#Version - v5.8.1.1
- Added processAgentTxnId as a filed in "processAgent" object in the ebsp response.

#Version - v5.8.0.1
- EBSP used to give responseCategory as NUdges  even though there were no nudges in response for across unstructured 
search. Code changes are done to give responseCategory as success instead of nudges

#Version - 5.8.0.0
Introduce Dialog flow changes, if a data record has dialog flow iD then retrieve it and add dialog flow id to context.
#Version - Branches\EBSP\EBSP-V5.7.0.1
Added fix for "Boost" query as it was not supporting in 7.9, and added fix for unstructuredWithin intent search.
#Version - Branches\EBSP\EBSP-V5.7.0.0
Added code chagnes to support new json format of elastic 7.9 data.
#Version - Branches\EBSP\EBSP-V5.6.0.4
Added condition to construct the result of response if there is a special bot.
#Version - Branches\EBSP\EBSP-V5.6.0.3
Added allowedIntentsEnabled to configure ebsp as special bot in the configuration.
#Version - Branches\EBSP\EBSP-V5.6.0.0
- (Sujana) When we have enabled page context during google search, page context was also going in the google search, in this release we are removing the page context for the google search. 
- (Sujana) 2)	We have also made sure we have introduced another feature where EBSP can or not return the google search based on the configuration.
#Version - Branches\EBSP\EBSP-V5.5.0.0
- (Ankit) Added fix for academic event issue for arabic language. 
#Version - Branches\EBSP\EBSP-V5.4.0.3
- (Latha) code altered to remove lowest ranking record irrespective of whether alternate ie enabled.
- (Latha) Removed sort option in the bulk query as it was getting 30 records with in the range of the latitude and longitude.
- (Latha)code changes done to consider first record of the data with highest relevance even if it is alternate record and thats the only record available. 
- We are always considering data entities for fetching nudges but according to the configuration property FetchNudgesFromDataRecords, if it is true we need to consider data entities, else we need to consider triggered and filtered entities.
#Version - Branches\EBSP\EBSP-V5.4.0.2
Fixed YA-2144-CSUCO Production_Alternates coming in nudges
#Version - Branches\EBSP\EBSP-V5.4.0.1
For Generic Intent with triggered entities, some entity type will not be considered for search.
These Entity type can be configured in environment variable “IGNORE_ENTITY_TYPE_WITH_GEN_INTENT”

#Version - Branches\EBSP\EBSP-V5.3.0.2
2020-09-15
code changes for error message to appear on the console when the base aws url is not configured properly

#Version - Branches\EBSP\EBSP-V5.3.0.1
2020-09-15
Latha Naganna - Changed the code to make decisionMaker.makeDecision call with await (Synchronised) as we are dependent on entities in decision
object to make decision. When ever we make a call to contextHandler which makes a call out of the process to
Redis, Program used to move on without having entities in decision object.
In order to control this have made decisionMaker.makeDecision call with await(Synchronised).
YA-2001: handling bot response when Generic intent is triggered along with some entities
YA-2002: Add line character when we append answers dynamically

#Version - Branches\EBSP\EBSP-V5.3.0.0
2020-09-04
#Changes are made for app not to start if the configurations and dialogue templates are not loaded properly

#Version - Branches\EBSP\EBSP-V5.2.0.3
2020-08-28
#Watson service has changed sys date and sys time JSON structure. Some of the timing question were failing. We have fixed this issue.

2020-08-24
#Fixed issue: applicationStatus is sent as 3 characters string instead of 2 characters in EBSP response.

#Version - Branches\EBSP\EBSP-V5.2.0.2
2020-08-18
EBSP: “statusCode” was missing in response in case of success scenario. It would be “0” if there is no error else it would be as per statusCode list excel placed in SharePoint.
New variables added in log as part of appParams which NandKishore will store in log table.
1.	applicationStatus 
2.	responseStatus

#Version - Branches\EBSP\EBSP-V5.2.0.1
2020-08-13
# Intent search will be done across structured if not foound then will be done in unstructured.

#Version - Branches\EBSP\EBSP-V5.2.0.0
2020-08-13
# Code changes done to fetch the SUBJECT_AREA from the elastic data

#Version - Branches\EBSP\EBSP-V5.1.1.3
2020-07-22
# If top ranked record was alternate it was removed as a part of removing all alternates from results. Code changes
are done to retain top ranked alternate records in the first pass. 
# If we have all the top ranked records are alternative then the top record will be picked as per 5.0 design.

#Version - Branches\EBSP\EBSP-V5.1.1.2
2020-07-10
# Introduced changes to get nudges for device sync up call from with in intent and should include alternate also.
# when we have FetchNudgesFromDataRecords as true, when cliking on nudges would bring answer and nudges. If it is false it was bringing answer but not nudges.
# Made changed in generateNudges file to consider data record entities when we have apiId as 8.

#Version - Branches\EBSP\EBSP-V5.1.1.1
2020-07-06
-- when we have default record with results from across intent too, we were ignoring default record action handler execution. This is been removed. When we have default record, we fetch the data of the action handler too.

-- code changes done to handlet academic events date mis match.
-- Code changes done to handle records having alternate as top records to be ignored.

#version - Branches\EBSP\EBSP-V5.1.0.20
2020-06-22: Changed IS_ALTERNATE comparision to string 1 to int 1.
#5 of version EBSP-V5.1.0.18 is commented
#5: Bring in suggestion when we are getting defualt. In this case we need to bring in default also as part of first suggestion.


version - Branches\EBSP\EBSP-V5.1.0.18
1.	Added configuration “GetTopRankSuggestions”. 
	a.	If it is set “true” then top 4 (sorted by ranking) records will be picked for suggestion.
	b.	If it is set “false” then highest ranking records will be picked.
		i.	If there are more than one highest ranking records then maximum 4 records will be picked and shown as suggestion.
		ii.	If there is one record with highest ranking then it will be shown as best answer.
2.	Added configuration “FetchNudgesFromDataRecords”.
	a.	If it is set “true” then data entities will be considered for getting nudges. 
	b.	If it is set “false” then only wcs entities will be considered for getting nudges.
	c.	In case of default record, only wcs entities will be considered irrespective of above configuration.
	d.	Removed salt entities.
3.	Added nudges for best answer.
4.	Cleaned up code and removed unwanted files. 
5. Bring in suggestion when we are getting defualt. In this case we need to bring in default also as part of first suggestion.

version - Branches\EBSP\EBSP-V5.1.0.17

-- Code changes in EBSP-V5.0.2.0 are merged into this version
    (Code changes done to resolve issue of technical difficulties in UAEU. 
    This Scenario happens when we are asking question as guest user.
    ContextManager request takes more than 3000 seconds. Infact for guest user we should not going to context manager.
    Fixed the code for above issue.)
