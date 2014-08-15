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

require.def("src/javascript/scxml/cgf/layout/LinkOptimizer",
["src/javascript/scxml/cgf/util/geometry"],
function(geometry){
	function optimizeConnectionPorts(linkNode){
		/*
		given a set of linkNodes (preferably semantic objects to start out)
			for each linkNode find what entities he connects to (in and out)
				for each of these entities
					snap to the nearest connection point on that entity
		*/

		//find the closest two connection points

		var startAndEndInfo = linkNode.getClosestStartAndEndConnectionPoints();
		
		linkNode.visualObject.setStartPoint(startAndEndInfo.fromConnector);

		linkNode.visualObject.setEndpoint(startAndEndInfo.toConnector); 

	}
 
	function optimizeLinks(selectedLinks, setSmooth, setCurved, curveDirection){
		/*
		Optimizes the links associated with the nodes in entityList or all the nodes
		in the graph if entityList is not provided.
		The links are set straight, with the endpoints at the nearest connectors of
		the nodes they connect.
		Optionally, additional control points can be added to make a smooth arrow,
		and give it some curvature (setCurved is a pixel distance perpendicular to
		what would have been a straight arrow ).
		It is possible to pass a list of link objects directly, and optimize those.
		It is also possible to specify the direction of the curve, Random=-1, Right=0, Left=1

		Created July 25, 2004 by Denis Dube
		*/
		setSmooth = setSmooth || true;
		setCurved = setCurved || 10;
		selectedLinks= selectedLinks || [];
		curveDirection = curveDirection || -1;

		// Optimize all the selected links
		//FIXME: s/obj/ln
		selectedLinks.forEach(function(ln){

			// Optimize the end point connection ports
			optimizeConnectionPorts(ln)

			// Find all the entities that the edge is linking to
			// (general enough to handle hyperedges)
			var graphicalObjectsFrom = ln.inConnections.map(function(en){return en.visualObject})
			var graphicalObjectsTo = ln.outConnections.map(function(en){return en.visualObject})

			// Edge with 2 endpoints
			if(graphicalObjectsFrom.length == 1 &&  graphicalObjectsTo.length == 1){

				// Edge with both endpoints on one object
				if( graphicalObjectsFrom[0] == graphicalObjectsTo[0] ){
					optimizeSelfLink(ln, graphicalObjectsFrom[0], setSmooth, setCurved)
				}

				// Regular edge
				else{
					optimizeRegularLink( ln, graphicalObjectsFrom[0], graphicalObjectsTo[0],
						setSmooth, setCurved, curveDirection)
				}
			}
			// Hyper-edge with multiple endpoints
			else{
				optimizerHyperLink( ln, graphicalObjectsFrom, graphicalObjectsTo,
					setSmooth, setCurved, curveDirection	)
			}
		})
	}

	function optimizeRegularLink( interObj, fromObj, toObj, setSmooth, curvature, curveDirection ){
		/* Optimizes one edge with 2 endpoints in 2 different objects */

		// Find the optimally near connector points
		//TODO: here
		var connectorInfo = fromObj.getClosestConnectorToGraphicalObject( toObj,interObj.visualObject );
		var inPoint = connectorInfo.toConnector, outPoint = connectorInfo.fromConnector;

		var newCenter = geometry.getMidpoint2D( inPoint, outPoint)

		// Move the intermediate object into the new center point
		var g = interObj.visualObject;
		var oldCenter = g.getCenterCoord()
		var dx = newCenter.x - oldCenter.x
		var dy = newCenter.y - oldCenter.y

		// Add a bit of curvature
		var finalCenter;
		if( curvature ){
			var v = curvinator( inPoint, outPoint, curvature, curveDirection )
			dx += v[0]
			dy += v[1]
			finalCenter = [ newCenter[0] + v[0], newCenter[1] + v[1] ]
		}
		else{
			finalCenter = newCenter
		}

		// Move the intermediate object
		g.move( dx, dy )

	}

	function curvinator( p1, p2, curveAmount, curveDirection ){
		/*
		Returns a vector that is orthongonal to the p1-p2 vector with length curveAmount
		*/
		var v = [ - ( p1.y - p2.y ), p1.x - p2.x ]
		var d = geometry.vectorLength2D( v )
		d = d || 1

		// Direction of the curvature bulge is random
		if( curveDirection == -1 && 
			(Math.round(Math.random()) || curveDirection == 1 )){
			curveAmount = -curveAmount
		}

		// Normalized orthogonal vector times the curvature bulge
		v = [ v[0] * curveAmount / d, v[1] * curveAmount / d	]

		return v
	}

	function optimizeSelfLink( interObj, selfObj, setSmooth, curvature ){
		/*
		 * Makes a nice loop positioned at upper right-hand corner.
		 */

		// Require this much distance between link and entity
		var labelMinDistY = 20,
			labelMinDistX = 20,
			bezierMinDistY = 40,
			bezierMinDistX = 40;

		// Add additional minimum distance according to link object size
		var g = interObj.visualObject;

		// Add additional minimum distance according to entity object size
		var box = selfObj.getBBoxInCanvasSpace();

		g.setStartPoint({x:box.width/2 + box.x,y:box.y})
		g.setEndpoint({x:box.width + box.x,y:box.height/2 + box.y})

		g.setControlPoint({x:box.width + box.x + bezierMinDistX,y:box.y - bezierMinDistY})
		g.moveLabelTo(box.width + box.x + labelMinDistX,box.y - labelMinDistY)

	}

	function optimizerHyperLink( interObj, objectsFrom, objectsTo, setSmooth, curvature, curveDirection, newCenter ){
		throw new Error("Hyperlinks are not supported yet.");
	}

	return {
		optimizeConnectionPorts : optimizeConnectionPorts,
		optimizeLinks: optimizeLinks
	}

})
