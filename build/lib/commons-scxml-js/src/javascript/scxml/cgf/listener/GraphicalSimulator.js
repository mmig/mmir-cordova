require.def("src/javascript/scxml/cgf/listener/GraphicalSimulator",
["src/javascript/scxml/cgf/util/svg"],
function(svg){
	return function(svgDoc){
		this.onEntry = function(stateId){
			var e = svgDoc.getElementById(stateId);
			//console.log(e);
			svg.addClass(e,"highlighted");
			e.ownerSVGElement.forceRedraw();
		}

		this.onExit = function(stateId){
			var e = svgDoc.getElementById(stateId);
			//console.log(e);
			svg.removeClass(e,"highlighted");
			e.ownerSVGElement.forceRedraw();
		}

		this.onTransition = function(sourceStateId,targetStateId,transitionId){
			var e = svgDoc.getElementById(transitionId);
			//console.log(e);
			svg.addClass(e,"highlighted");
			e.ownerSVGElement.forceRedraw();
			svg.removeClass(e,"highlighted");
			e.ownerSVGElement.forceRedraw();
		}
	}

})


