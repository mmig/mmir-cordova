require.def("src/javascript/scxml/cgf/listener/Logger",
function(){
	return function(){
		this.onEntry = function(state){
			console.log("Entering ",state);
		}

		this.onExit = function(state){
			console.log("Exiting ",state);
		}

		this.onTransition = function(sourceStateId,targetStateId,transition){
			console.log("Taking transition ",transition);
		}
	}
});
