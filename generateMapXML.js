/* 
  This is generate map.xml which will generate main map file
 */
const fs = require('fs');
const util = require('./util');
const query = require('./query');

let map = util.parse(fs.readFileSync(__dirname + '/master_map.xml', { encoding:'utf8' }));
walk_actions(map);




function walk_actions(map) {

	let i, leni, arri, a, n, actions_root;
	let actions = fs.readdirSync(actions_root = __dirname + '/actionHandler');

	actions.forEach(function(action, fileIndex) {
		let p, actions_dir, actionmap;
        let stat = fs.statSync(actions_dir = actions_root + '/' + action);
        if(stat.isDirectory() && (actionmap = util.at_xpath(map, "*/" + action))) {
            for(p = util.parse(fs.readFileSync(actions_dir + '/map.xml', { encoding:'utf8' })).firstChild;	
                p; p = p.nextSibling) {
                actionmap.appendChild(p.cloneNode(true));
            }
        }
        
				
        if(fileIndex >= actions.length - 1) {
            /* If elastic is missing alias guess elastic alias */
            for(i = 0, leni = (arri = util.xpath(map, "*/*/attributes/*")).length; i < leni; i++) {
                n = arri[i]; a = n.nodeName.replace(/^CTX\_REQ\_/, '').replace(/^CTX\_RES\_/, '').replace(/^UAP\_RES\_/, '');
                if(!n.hasAttribute('intent')) n.setAttribute('intent', a);		
                if(!n.hasAttribute('elastic')) {
                    //for(j = 0, lenj = (arrj = a.split('_')).length; j < lenj; j++) arrj[j] = util.title_case(arrj[j]);
                    //if(arrj.length) arrj[0] = arrj[0].charAt(0).toLowerCase() + arrj[0].substr(1);
                    //n.setAttribute('elastic', arrj.join(''));
                    n.setAttribute('elastic', a);
                }
            }
        }
	});
    fs.writeFileSync(__dirname + '/map.xml', map);
}