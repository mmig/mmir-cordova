
module.exports = function _getBoolean(raw){
	
	if(typeof raw === 'string'){
		return /true/.test(raw.trim());
	}
	return !!raw;
};
