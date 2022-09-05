const constants = require('./../constants');
const util = require('./../util');

class EntityTypeIdentifier {
	constructor(input, decision, configuration) {
		this._input = input;
		this._decision = decision;
		this._configuration = configuration;
		this._eObject = decision[constants.EntitesObject] || {};
	}
	hasDesignation() {
		return ((this._eObject) && (constants.DESIGNATION in this._eObject) && this._eObject[constants.DESIGNATION]);
	}
	
	hasSysPerson() {
		return ((this._eObject) && (constants.SYS_PERSON in this._eObject) && this._eObject[constants.SYS_PERSON]);
	}
	
	hasNounEntity() {
		return true;
		let noun = false;
		if(!util.isEmpty(this._eObject)) {
			for(let k in this._eObject) {
				if(util.isEntityNoun(k, this._configuration)) {
					noun = true;
					break;
				}
			}
		}
		/*if(!noun && (constants.CONTEXTUAL_QUESTION in this._decision) && this._decision[constants.CONTEXTUAL_QUESTION]) {
			
			for(let k in this._decision[constants.CONTEXT_ENTITIES_OBJECT]) {
				if(util.isEntityNoun(k, this._configuration)) {
					noun = true;
					break;
				}
			}
		}*/
		return noun;
	}
	
	otherEntity(type) {
		let othere = false;
		if(!util.isEmpty(_eObject)) {
			for(let k in _eObject) {
				if((k !== type) && util.checkNonSysEntities(k)) {
					othere = true;
					break;
				}
			}
		}
		return othere;
	}

	isSingleEntityContextualQuestion() {
		let singleEntity = false;
		if(this._decision && (constants.CONTEXTUAL_QUESTION in this._decision) && this._decision[constants.CONTEXTUAL_QUESTION]) {
			if((constants.Entites in this._decision) && (this._decision[constants.Entites].length === 1)) {
				singleEntity = true;
			}
		}
		return singleEntity;
	}
}

module.exports = {
	EntityTypeIdentifier: EntityTypeIdentifier
}