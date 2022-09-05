const constants = require('../constants');
const ignoreSysEntityList = ['night'];

class FilterWCSEntities {
	constructor(intents, entities, inputText) {
		this._intents = intents;
		this._entities = entities;
		this._inputText = inputText;
		this._excludeList = [];
		this._total = this._entities.length;
	}

	applyFilter() {
		this.addLiteral();
		//console.log(this._entities);
		this.removeDuplicate();
		this.filterEnityValueAndLiterals();
		//console.log(this._entities);
		console.log(this._entities);
		console.log(this._excludeList);
		this.removeExcluded(this._excludeList);
		this.removeIgnoredEntities();
		console.log("***********************************");
		console.log(this._entities);
		console.log("***********************************");
		return this;
	}
	getFilteredEntities() {
		return this._entities;
	}

	filterEnityValueAndLiterals() {
		for (let i = 0; i < this._entities.length; i++) {
			//ignoring sys entities
			if(this._entities[i][constants.entity].indexOf('sys-') !== -1)
				continue;

			let iVal = this._entities[i][constants.value].toUpperCase();
			iVal = iVal.replace('.','');
			let iLit = this._entities[i][constants.literal].toUpperCase();
			iLit = iLit.replace('.','');
		
			for (var j = (i+1); j < this._entities.length; j++) {

				let jVal = this._entities[j][constants.value].toUpperCase();
				jVal = jVal.replace('.','');
				let jLit = this._entities[j][constants.literal].toUpperCase();
				jLit = jLit.replace('.','');

				let entityValueFilter = this.filterEntityValues(iVal, iLit, jVal, jLit);
				if((this.literalPositionCheck(this._entities[i], this._entities[j]) === true) ||
					entityValueFilter) {
					this.addToExcludeList(iVal, jVal, iLit, jLit, i, j);
				}
				
			}
		}
	}
	filterEntityValues(iVal, iLit, jVal, jLit, i, j) {
		if(this.isEqual(iVal, jVal)) {
			return true;
		} else if(iLit === jLit) {
			if(this.isPlaceAnaphor(i)) {
				return true;
			} else if(this.isPlaceAnaphor(j)) {
				return true;
			} else {
				return false;
			}
		} else if(this.isEqual(iLit, jLit)) {
			return true;
		} else {
			return false;
		}
	}
	
	addToExcludeList(iVal, jVal, iLit, jLit, i, j) {
		//Entity triggered because of placeanaphor then placeanaphor will be removed, IT, Information & Technology
		let addToListWithI = false;
		let addToListWithJ = false;
		let indexToAdd = 0;
		if(this.isPlaceAnaphor(i)) {
			//this.addInList(i);
			addToListWithI = true;
			indexToAdd = i;
		} else if(this.isPlaceAnaphor(j)) {
			//this.addInList(j);
			addToListWithJ = true;
			indexToAdd = j;

		} else {
			if(!(iVal.length != jVal.length && iLit.length == jLit.length) && //To retain entities if literals are same but entity values are different
				((iVal.length >= jVal.length && (iVal.indexOf(jVal) !== -1)) ||
				(iLit.length >= jLit.length && (iLit.indexOf(jLit) !== -1)))) {
					addToListWithJ = true;
					indexToAdd = j;
			} else if(!(iVal.length != jVal.length && iLit.length == jLit.length) && //To retain entities if literals are same but entity values are different
				((jVal.length >= iVal.length && (jVal.indexOf(iVal) !== -1)) ||
				(jLit.length >= iLit.length && (jLit.indexOf(iLit) !== -1)))) {
						addToListWithI = true;
						indexToAdd = i;
			} 
		} 

		if(addToListWithI || addToListWithJ)
		{
			if(this._excludeList.indexOf(indexToAdd) === -1) this._excludeList.push(indexToAdd);
		}
	}
	
	isPlaceAnaphor(i) {
		
		if(Array.isArray(this._entities) && this._entities[i] && this._entities[i].entity && 
			(this._entities[i].entity === constants.PlaceAnaphor)) {
			return true;
		} else {
			return false;
		}
	}
	removeExcluded() {
		var tempEntities = [];
		for (let k = 0; k < this._entities.length; k++) {
			console.log(this._excludeList.indexOf(k));
			if (this._excludeList.indexOf(k) === -1) {
				tempEntities.push(this._entities[k]);
			}
		}
		this._entities = tempEntities;
	}

	removeIgnoredEntities() {
		for (let i = 0; i < this._entities.length; i++) {
			if(this._entities[i][constants.entity].indexOf('sys-') !== -1) {
				if(this._entities[i][constants.literal] && ignoreSysEntityList.includes(this._entities[i][constants.literal].trim().toLowerCase())) {
					this._entities.splice(i, 1);
				}
			}
		}
	}
	literalPositionCheck(obj1, obj2) {
		try {
			if(Array.isArray(obj1.location) && Array.isArray(obj2.location)) {
				//To retain entities if literals are same but entity values are different
				if(obj1.location[0] === obj2.location[0] && obj1.location[1] === obj2.location[1] &&
					obj1[constants.value] != obj2[constants.value]) {
					return false;
				} else if(this.between(obj1.location[0], obj2.location[0], obj2.location[1])) {
					return true;
				} else if(this.between(obj2.location[0], obj1.location[0], obj1.location[1])) {
					return true;
				}
			}
			return false;
		} catch(e) {
			console.log(e);
		}
	}
	between(x, min, max) {
		return x >= min && x <= max;
	}
	addLiteral() {
		if(this._total > 0) {
			let loc;
			for(let m in this._entities) {
				if((loc = this._entities[m].location)) {
					if(Array.isArray(loc) && (loc.length === 2)) {
						this._entities[m][constants.literal] = this._inputText.substring(loc[0], loc[1]);
					}
				}
			}
		}
	}

	removeDuplicate() {
		
		if(this._total <= 0) return;

		const uniqueKeys = [];
		for (let i = 0; i < this._entities.length; i++) {
			//used key value combination for duplicate check - What are the hours of operation for ITS?
			let uniqueKey = this._entities[i][constants.entity] + this._entities[i][constants.value] +
			this._entities[i][constants.literal];

			if (uniqueKeys.indexOf(uniqueKey) === -1) {
				uniqueKeys.push(uniqueKey);
			} else {
				this._entities.splice(i, 1);
				i--;
			}
		}
	}

	isEqual(firstElement, secElement) {
		firstElement = firstElement.replace('-',' ');
		secElement = secElement.replace('-',' ');
	
		firstElement = firstElement.replace('.','');
		secElement = secElement.replace('.','');
	
		var array1 = firstElement.split(" ").sort();
		var array2 = secElement.split(" ").sort();
	
		if (array1.length < array2.length) {
			var temp = array1;
			array1 = array2;
			array2 = temp;
		}
		let allFounded = array2.every(ai => array1.includes(ai));
		return allFounded;
	}

	filterWCSIntents(){
		console.log("intents::"+this._intents);
		var tempIntents = [];
		for(let i=0; i<constants.MAX_INTENTS; i++){
			tempIntents.push(this._intents[i]);
		}
		return tempIntents;
	}
}

exports.filterEntities = function (input) {
	let filter = new FilterWCSEntities(input[constants.intents], input[constants.entities], input.text);
	input[constants.entities] = filter.applyFilter().getFilteredEntities();
	input[constants.intents] = filter.filterWCSIntents();
	return input;
}


/*let inputText = 'What is Pell and non Pell student night';
let entities = [
	{
		"entity": "sys-person",
		"location": [34, 39],
		"value": "Pell",
		"confidence": 1
	},
	{
		"entity": "StudentType",
		"location": [8, 12],
		"value": "Pell Student",
		"confidence": 1
	}, {
		"entity": "StudentType",
		"location": [17, 25],
		"value": "Non-Pell Student",
		"confidence": 1
	},
	{
		"entity": "StudentType",
		"location": [21, 33],
		"value": "Pell Student",
		"confidence": 1
	}
];

//let filter = new FilterWCSEntities(entities, inputText);
//	console.log(filter.applyFilter().getFilteredEntities());*/