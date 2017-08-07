
define(function(){
	
	//jQuery handling:
//	* create replacements for needed jQuery-functions
//	* create stubs for jQuery functions that are not needed (but are invoked -> avoid null-errors)
	
	var $ = function dummyJQuery (){ return $;};
	
	$.each = function(array, callback){//callback: function(index, obj)
		for(var i=0, size = array.length; i < size; ++i){
			callback.call(array[i], i, array[i]);
		}
	};

	$.isArray = Array.isArray;

	
	var jQuery = $;
	
	/////////////////////////////////////////////////////////
	//taken from jQuery v2.1.3 (MIT license)
	
	var arr = [];

	var push = arr.push;

	var class2type = {};

	var toString = class2type.toString;

	
	// results is for internal usage only
	$.makeArray = function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	};
	
	$.merge = function( first, second ) {
			var len = +second.length,
			j = 0,
			i = first.length;
	
		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}
	
		first.length = i;
	
		return first;
	};
	
	$.type = function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		// Support: Android<4.0, iOS<6 (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	};
	
	$.isWindow = function( obj ) {
		return obj != null && obj === obj.window;
	};
	
	function isArraylike( obj ) {
		var length = obj.length,
			type = jQuery.type( obj );

		if ( type === "function" || jQuery.isWindow( obj ) ) {
			return false;
		}

		if ( obj.nodeType === 1 && length ) {
			return true;
		}

		return type === "array" || length === 0 ||
			typeof length === "number" && length > 0 && ( length - 1 ) in obj;
	}
	
	////////////////////////////////////////////////////
	
	return $;
});
