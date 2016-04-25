
function OnCompleteHandler(){
	
	var isCompleted = false;
	var completedValue;
	var _completedListeners = [];
	
	this.setCompleted = function(val){
		isCompleted = true;
		completedValue = val;
		if(_completedListeners.length > 0){
			var list = _completedListeners.splice(0, _completedListeners.length);
			for(var i=0,size=list.length; i < size; ++i){
				list[i](completedValue);
			}
		}
	};
	
	this.oncomplete = function(cb){
		if(isCompleted){
			cb(completedValue);
		} else {
			_completedListeners.push(cb);
		}
	};
}

module.exports = OnCompleteHandler;
