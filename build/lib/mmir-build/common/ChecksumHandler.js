

//NOTE: the checksumUtils need to be already initialized, when this function is (first) called

var _checksumUtils;
/**
 * @param {String} rawContentText
 * 					the text content of the source (for which the checksum gets generated/checked against)
 * @param {String} targetFilePath
 * 					the path to file that will/may be generated/compiled
 * @param {String} checksumFilePath
 * 					the path to the checksum file (may exclude the file-extension, see param isAddChecksumFileExt)
 * @param {Boolean} [isAddChecksumFileExt] OPTIONAL
 * 					if TRUTHY the default file extension for checksum-files is added to checksumFilePath
 * 					before loading the checksum file
 */
function _isNeedCompile(rawContentText, targetFilePath, checksumFilePath, isAddChecksumFileExt){
	
	if(!fileExists(targetFilePath)){
		//generated file does not exist yet -> signal "changed" so that it gets created
		return true;
	}
	
	if(!_checksumUtils){
		_checksumUtils = require('mmirf/checksumUtils');
	}

	var checksumFileUrl = checksumFilePath;
	if(isAddChecksumFileExt){
		checksumFileUrl += _checksumUtils.getFileExt();
	}
	
	var text;
	try {
		text = loadLocalFile(checksumFileUrl, 'text');
	} catch(err){
		return true;
	}
	
	var checksumData = _checksumUtils.parseContent(text);
	
	return !_checksumUtils.isSame(rawContentText, checksumData);
};
