//DialogIdentifier

var constants = require('../constants');
var util = require('../util');
var fs = require('fs');
var dialogTemplates = {};

exports.loadCommonTemplates = function() {
	try {
		var dir = './'+constants.DIALOGUE_TEMPLATE_DIR;
		var filelist = [];
		var path = '';
		var key = {};
		walkSync(dir, filelist);
		filelist.forEach(function(filename) {
			console.log("\n\n filename:"+filename);
			content = fs.readFileSync(filename, 'utf-8');	  	
			path = filename.split('/');
			if(path && path[2]) {

				if(path && path[4]) {
					if(dialogTemplates[path[2]]) {
						dialogTemplates[path[2]][path[3]] = JSON.parse(content);
					} else {
						dialogTemplates[path[2]] = {};
						dialogTemplates[path[2]][path[3]] = JSON.parse(content);
					}
				} else {
					if(dialogTemplates[path[2]]) {
						key = JSON.parse(content);
						dialogTemplates[path[2]][constants.Template] = key[constants.Template];
						
					} else {
						dialogTemplates[path[2]] = JSON.parse(content);
					}
					
				}

			}
				
		});
	} catch(e) {
		util.print("Error while reading dialog files:", e);
	}
}
var walkSync = function(dir, filelist) {
	var fs = fs || require('fs'),
	files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function(file) {
		if (fs.statSync(dir + '/' + file).isDirectory()) {
			filelist = walkSync(dir + '/' + file, filelist);
		} else {
			filelist.push(dir + '/' + file);
		}
	});
	return filelist;
};

exports.getTemplateObject = function(lanCode, actionHandler, pickIndex) {
	let lanObj = dialogTemplates[lanCode] || dialogTemplates[constants.DEFAULT_LANGUAGE_CODE] || {};
	
	if(actionHandler) {
		lanObj = lanObj[actionHandler] || lanObj;
	}
	lanObj = lanObj[constants.Template] || {};

	return lanObj[pickIndex] || {};
}

exports.getTemplate = function(lanCode, actionHandler) {
	let lanObj = dialogTemplates[lanCode] || dialogTemplates[constants.DEFAULT_LANGUAGE_CODE] || {}
	if(actionHandler) {
		lanObj = lanObj[actionHandler] || {};
	}
	lanObj = lanObj[constants.Template] || {};
	return lanObj;
}