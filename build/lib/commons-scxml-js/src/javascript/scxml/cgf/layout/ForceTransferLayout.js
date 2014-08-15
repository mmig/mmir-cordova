/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *	 http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

/*
Based on ForceTransfer.py by Denis Dube as part of his Master's thesis work for the McGill University Modelling, Simulation, and Design Lab
*/

/*
Applies force to all nodes that are too close to each other
Loops until a stable configuration is reached
Times out after 50 iterations, to avoid depriving the user of interactivity for too long.
*/

//require.def("src/javascript/scxml/cgf/debugger/layout/ForceTransfer",

ForceTransfer = {
	//need to be given graphical objects
	applyLayout : function(options,svgGraphObjects,dc,statusText){

		options = options || {
			autoApply : false,
			useStatusBar : false,
			minNodeDist : 5,
			minLinkDist : 5,
			minControlDist : 5,
			seperationForce	: 1,
			animationTime : 0,
			maxAnimIterations : 15,
			maxIterations	: 50,
			borderDistance : 30
		};

		//TODO: convert SVG objects to abstract graphical objects
		var nodes = svgGraphObjects.nodes.map(function(n){
			//get the bounding box from the object, I guess in Canvas coordinates
			//although local coordinates might actually be more appropriate...
			var bbox = n.getBBox(); //getBBoxInCanvasSpace(n);
			var x = bbox.x, y = bbox.y, width = bbox.width, height=bbox.height;
			var center = [ x + width/2, y + height/2 ]

			return new NodeObject( n, center, [width,height], options.minNodeDist, [x,y] )
		});
		var edges = svgGraphObjects.edges.map(function(e){
			var bbox = n.getBBox(); //getBBoxInCanvasSpace(e);
			var x = bbox.x, y = bbox.y, width = bbox.width, height=bbox.height;
			var center = [ x + width/2, y + height/2 ]

			return new EdgeObject( obj, center, options.minLinkDist )
		});
		/*
		var controlPoints = svgGraphObjects.controlPoints.map(function(cp){
			new ControlPoint( c[i:i+2], options.minControlDist, itemHandler, i, dc )
		});
		*/

		graphicalObjectList = nodes.concat(edges);

		/*
		Sorts the nodes according to their distance from the origin (0,0) 
		This can have a large impact on performance, especially as the number
		of objects in contact with one another goes up.
		*/
		graphicalObjectList = graphicalObjectList.sort(function(n1,n2){return n1.distance > n2.distance});
							
		var totalNodes = graphicalObjectList.length;
			
		var isLayoutStable = false
					
		// Keep at it till the layout is stable
		var i = 0;
		while(! isLayoutStable ){
			isLayoutStable = true // Optimism is good...
			calculationLoop()
				
			if( i > options.maxIterations ){	 
				break;
			}

			i++;
		}
			
			
		// Hijack the status bar to show what the FTA is doing...
		if( i >= options.maxIterations ){
			statusText.textValue = "FTA halted at max iterations, layout unstable";
		}
		else{
			statusText.textValue  = "FTA needed "+i+" iterations to find stable layout";
		}

		// Keep the whole thing in the viewable area of the canvas
		minX = Math.min.apply(this,graphicalObjectList.map(function(o){return (o.topLeftPos && o.topLeftPos[0]) || o.pos[0]}));
		minY = Math.min.apply(this,graphicalObjectList.map(function(o){return (o.topLeftPos && o.topLeftPos[1]) || o.pos[1]}));
			
		minX = minX < options.borderDistance ? Math.abs(minX) + options.borderDistance : 0;
		minY = minY < options.borderDistance ? Math.abs(minY) + options.borderDistance : 0;

		// Push on it!
		//graphicalObjectList.forEach(function(n){n.recenteringPush(minX, minY)});
			
		// All that moving stuff around can mess up the connections...
		//TODO
		/*
		if( selection )
				optimizeConnectionPorts(atom3i, entityList=selection )
		else
				optimizeConnectionPorts(atom3i, doAllLinks=True )
		*/
				
		function calculationLoop(){
			
			// Go through all the nodes, and find the overlap forces
			graphicalObjectList.forEach(function(n1){
				graphicalObjectList.forEach(function(n2){
					if(n1!==n2) calculateForce( n1, n2 );
			})});
				
			// Go through all the nodes and apply the forces to the positions
			graphicalObjectList.forEach(function(n){n.commitForceApplication()});
		}
				
				
		function calculateForce( n1,n2 ){
			/*
			Evaluates distances betweens nodes (ie: do they overlap) and
			calculates a force sufficient to pry them apart.
			*/
			
			// Absolute distance along X and Y vectors between the nodes
			var pointA = n1.pos
			var pointB = n2.pos
	 
			var dx = Math.abs( pointB[0] - pointA[0] ) 
			var dy = Math.abs( pointB[1] - pointA[1] ) 
			
			// Zero division error prevention measures
			if (dx == 0.0)	dx = 0.1
			if (dy == 0.0)	dy = 0.1
			
			// Node-Node Distances
			var dist = Math.sqrt(dx*dx+dy*dy)
			
			// Normalized-Vector
			var norm = [ dx / dist , dy / dist ]

			// Overlap due to size of nodes
			var sizeA = n1.size
			var sizeB = n2.size
			var sizeOverlap = [ ( sizeA[0] + sizeB[0] ) / 2 , ( sizeA[1] + sizeB[1] ) / 2 ]	
			
			// Desired distance with resulting force
			var minSeperationDist = Math.min( n1.seperationDist,n2.seperationDist )
			var d1 = (1.0 / norm[0]) * (sizeOverlap[0] + minSeperationDist)
			var d2 = (1.0 / norm[1]) * (sizeOverlap[1] + minSeperationDist)
			var forceMagnitude = options.seperationForce * ( dist - Math.min(d1,d2) )
		
			// The force should be less than -1 (or it won't be having much of an effect)
			if (forceMagnitude < -1){
				var force = [ forceMagnitude * norm[0],	forceMagnitude * norm[1] ]
				
				// Maximize compactness by only pushing nodes along a single axis
				if( force[0] > force[1] ) 
					force[0] = 0
				else
					force[1] = 0
				
				// Determine the direction of the force
				var direction = [ 1, 1 ]
				if( pointA[0] > pointB[0] ) direction[0] = -1
				if( pointA[1] > pointB[1] ) direction[1] = -1
		
				// Add up the forces to the two interacting objects
				n1.incrementForce( force )
				n2.incrementForce( [ -force[0], -force[1] ] )
				
				// If a force was applied this iteration, definately not stable yet
				isLayoutStable = false			
			}
		}
				
		function GraphicalObject(visualObject, pos, size, seperationDist){
			/*
			A convenient class to store just the information necessary for the 
			application of the force transfer algorithm.
			*/
			
			this.visualObject = visualObject
			this.pos = pos
			this.size = size
			this.force = [0,0]
			this.seperationDist = seperationDist
			this.distance = Math.sqrt( pos[0]*pos[0] + pos[1]*pos[1] );

			this.incrementForce = function(force){
				this.force = force
			}
					 
			this.commitForceApplication = function(){
				/*
				Moves the object to the origin, then to the position it is forced to
				Forces are then reset
				*/

				translate( this.visualObject, {dx:this.force[0],dy:this.force[1]} ) 
				this.pos = [ this.pos[0] + this.force[0], this.pos[1] + this.force[1] ]
				this.force = [0,0] 
			}
				
			this.recenteringPush = function(x, y){
				// Puts the object back onto the canvas if it got forced off 
				translate( this.visualObject, {dx:x,dy:y} ) 
			}
					
		}
					
		function NodeObject(visualObject, pos, size, seperationDist, topLeftPos){
			// Regular node entity with position and size attributes 
			
			this.topLeftPos = topLeftPos

			GraphicalObject.apply(this,[visualObject, pos, size, seperationDist]);
				
		}
					
		function EdgeObject(visualObject, pos, seperationDist){
			/*
			Idea for improvement: find the label/drawing attached to the center of the
			edge, and use its size instead of treating this as an object with no size.
			*/

			GraphicalObject.apply(this,[visualObject, pos, [1,1],seperationDist]);
		}

		function ControlPoint(pos, seperationDist,itemHandler,index){
			/*
			Control point is merely a point along the edge, thus it needs a customized
			approach for moving it around. It also has no real size concept.
			*/

			GraphicalObject.apply(this,[None, pos, [1,1],seperationDist]);

			this.itemHandler = itemHandler
			this.index = index
				
			/*
			this.recenteringPush = function(x, y):
				// No need for this since the Edge 'Move' method handles it
				return
				cCoords = this.dc.coords( this.itemHandler )
				cCoords[this.index] += x
				cCoords[this.index+1] += y
				this.dc.coords( * [this.itemHandler] + cCoords )
			*/
				
			this.commitForceApplication = function(){
				var cCoords = dc.coords( this.itemHandler )
				cCoords[this.index] += this.force[0]
				cCoords[this.index+1] += this.force[1]
				dc.coords( * [this.itemHandler] + cCoords )
				
				this.pos = [ this.pos[0] + this.force[0], this.pos[1] + this.force[1] ]
				this.force = [0,0] 
			}
		}	
	}
}
