/**
* 
* Transforms '{@link #x}' to '{@link longname#x x}'.
* 
* Allow using shortened links for references within
* the same context.
* 
*
* This looks in @description and @classdesc tags only.
* In addition, @see tags are either processed as 
* "single links" (i.e. '#x', '.x', or '~x') or as
* "description text" (i.e. containing {@link #x}).
* 
* original idea / code base from: https://gist.github.com/pnstickne/fb90239787bd74ca5753
*/

var path = require('path');

function expandLinks (text, scope) {

	var isModified = false;
	var returnValue = text.replace(/\{\s*@link\s+([#.~])([\w$]+)\s*\}/g, function (m, mod, name) {
		isModified = true;
        return "{@link " + scope + mod + name + "|" + name + "}";
    });
	
	if(isModified){
		return returnValue;
	}
	return;
}

function expandSeeTagPath(text, scope) {

	//do not proceed, if there is link-tag:
	if(/\{\s*@link\s+\S+\s*\}/g.test(text)){
		return;
	}
	
	var isModified = false;
	
	//expand:
	// #some
	// .some
	// ~some
	var returnValue = text.replace(/(^|\s)([#.~])([\w$]+)($|\s)/g, function (m, s1, mod, name, s2) {
		isModified = true;
//		//return "plain" expanded path:
//        return s1 + scope + mod + name + s2;
		//"pretty print": return path a link-tag, where the label is set to the original name:
		return "{@link " + scope + mod + name + "|" + name + "}";
    });
	
	if(isModified){
		return returnValue;
	}
	return;
}

function getScope(doclet){
	if(doclet.memberof){
		return doclet.memberof;
	}
	if(doclet.longname){
		return doclet.longname;
	}
	return '';
}

function processDescriptionText(doclet, p, scope){
	var t = doclet[p];
	var isModified = false;
	var modText;
	if (t) {
		modText = expandLinks( t, scope );
		if(modText){
			isModified = true;
			doclet[p] = modText;
		}
	}
	return isModified;
}

exports.handlers = {};
exports.handlers.newDoclet = function (e) {

    var doclet = e.doclet;
	var scope = getScope(doclet);
	if(!scope){
		return; /////////// EARLY EXIT ////////////////
	}
	
	var modText, t, ts;
	processDescriptionText(doclet, 'description', scope);
	processDescriptionText(doclet, 'classdesc', scope);
	
	//see-tag:
	// * process Array of Strings
	// * process either as comment text (i.e. text with {@link} elments
	// * ... or process see-tag as "single symbolic path" (i.e. no free text, only a symbolic link / path)
	t = doclet['see'];
	if (t) {
		
		if(typeof t !== 'string'){
			if(Array.isArray(t)){
				ts = t;
			}
			else {
				ts = [t.toString()];
			}
		}
		else {
			ts = [t];
		}
		
		if(!ts || ts.length < 1){
			return; /////////// EARLY EXIT ////////////
		}
		
		doclet['see'] = ts;
		
		for(var i=0,size=ts.length; i < size; ++i){
			if( ! processDescriptionText(ts, i, scope)){
				modText = expandSeeTagPath( ts[i], scope );
				if(modText){
					doclet['see'][i] = modText;
				}
			}
		}
		
		
	}
	
	//original impl.:
    // ['description', 'classdesc', 'see'].forEach(function (p) {
        // if (doclet[p]) {
            // modText = expandLinks( doclet[p], getScope(doclet) );
			// if(modText){
				// doclet[p] = modText;
			// }
        // }
    // });

};

////FIXM DEBUG and TEST:
//console.log('initialized plugin for short symbolic names...');
//try{
//	throw new Error('debug');//<- use this to catch the Error in the debugger...
//} catch(e){}
