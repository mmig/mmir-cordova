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
Based on HierarchicalLayout.py by Denis Dube as part of his Master's thesis work for the McGill University Modelling, Simulation, and Design Lab
*/

require.def("src/javascript/scxml/cgf/layout/hierarchical/HierarchicalLayout",
[
	"src/javascript/scxml/cgf/layout/hierarchical/NodeWrapper",
	"src/javascript/scxml/cgf/layout/hierarchical/LayeringModule",
	"src/javascript/scxml/cgf/layout/hierarchical/CrossingModule",
	"src/javascript/scxml/cgf/layout/hierarchical/HorizontalPositioner",
	"src/javascript/scxml/cgf/layout/LinkOptimizer"],
function(NodeWrapper,LayeringModule,CrossingModule,HorizontalPositioner,LinkOptimizer){

	var HEURISTICS_ENUM = {
			LONGEST_PATH_LAYERING_TOP_DOWN : "LONGEST_PATH_LAYERING_TOP_DOWN",
			LONGEST_PATH_LAYERING_BOTTOM_UP : "LONGEST_PATH_LAYERING_BOTTOM_UP",
			MINIMUM_WIDTH_LAYERING : "MINIMUM_WIDTH_LAYERING"
	}

	function hierarchicalLayout(entityNodeList,wrappedNodeList,options){

		options = options || {}
		options['xOffset'] = options['xOffset'] || 30;	// Minimum X Distance; Minimum horizontal distance between any 2 tree nodes (negative values work too)
		options['yOffset'] = options['yOffset'] || 30;	// Minimum Y Distance; Minimum vertical distance between any 2 tree nodes   
		options['addEdgeObjHeight'] = options['addEdgeObjHeight'] || true;	// Add edge object height; Increment spacing between node layers with edge object drawing of maximum height between 2 given layers
		options['Origin'] = options['Origin'] || false;	// Start tree at origin?
		options['uncrossPhase1'] = options['uncrossPhase1'] || 5;	// Maximum uncrossing iterations
		options['uncrossPhase2'] = options['uncrossPhase2'] || 15;	// Maximum uncrossing random restarts
		options['baryPlaceMax'] = options['baryPlaceMax'] || 10;	// Maximum gridpositioning iterations
		options['Spline optimization']  = options['Spline optimization'] || false;	// Spline optimization
		options['Arrow curvature'] = options['Arrow curvature'] || 0	// Arrow curvature
		options['heuristic'] = options['heuristic'] || HEURISTICS_ENUM.LONGEST_PATH_LAYERING_TOP_DOWN

		var t = new Date();

		// Step 1: Get all entity nodes (semantic objects) and wrap them
		//entityNodeList, linkNodeDict = self.__getEntityLinkTuple(selection)    
		if(entityNodeList.length == 0)
			return
			
		// Build a connection map (rapid access maps to children && parents)
		wrappedNodeList.forEach(function(wrappedNode){
			wrappedNode.buildConnectivityMaps()
		});

		// Step 2: Build a proper layered hieararchy
		wrappedNodeList = LayeringModule.greedyCycleRemover(wrappedNodeList)
		var layerTime = new Date();
		var levelDictionary;

		switch(options['heuristic']){
			case HEURISTICS_ENUM.LONGEST_PATH_LAYERING_TOP_DOWN:
				levelDictionary = LayeringModule.longestPathLayeringTopDown(wrappedNodeList)
				levelDictionary = LayeringModule.addDummyNodes(levelDictionary, true)
				break;
			case HEURISTICS_ENUM.LONGEST_PATH_LAYERING_BOTTOM_UP:
				levelDictionary = LayeringModule.longestPathLayeringBottomUp(wrappedNodeList)
				levelDictionary = LayeringModule.addDummyNodes(levelDictionary, false)
				break;
			case HEURISTICS_ENUM.MINIMUM_WIDTH_LAYERING:
				var mwl = new LayeringModule.MinimumWidthLayering(wrappedNodeList)
				// UBW = 1..4, c = 1..2
				levelDictionary = mwl.execute(2, 2)
				levelDictionary = LayeringModule.addDummyNodes(levelDictionary, false)
				break;
		}

		console.log('Layering algorithm required', new Date() - layerTime, 'milliseconds to assign each node a layer');

		//return
		console.log( 'Added dummy nodes, dumping layers:');

		//debugLevelDict(levelDictionary)
					
		// Step 3: Minimize crossings		
		levelDictionary = CrossingModule.barycentricOrdering(levelDictionary, options['uncrossPhase1'], options['uncrossPhase2'])

		// Step 4: Horizontal grid positioner
		HorizontalPositioner.priorityBarycenterPositioner(levelDictionary,options['baryPlaceMax'] ) 

		// Step 5: Draw nodes && edges on the canvas
		var topLeft;
		if(entityNodeList.length != 0)
			topLeft = __getMaxUpperLeftCoordinate(entityNodeList)
		else
			topLeft = [0, 0]

		//TODO: hook up linkNodeDict
		//__drawNodes(levelDictionary, linkNodeDict, topLeft)
		__drawNodes(levelDictionary, null, topLeft)
						
		//debugLevelDict(levelDictionary)

		console.log( 'Hierarchical layout took', new Date() - t, 'milliseconds to compute')

		function __getMaxUpperLeftCoordinate(entityNodeList){
			/* 
			Returns the maximum upper left coordinate of all the nodes the layout is
			being applied to
			This corresponds to the minumum x && y coords of all the nodes
			*/
			var minX = Number.MAX_VALUE
			var minY = Number.MAX_VALUE
			entityNodeList.forEach(function(node){
				var bbox = node.visualObject.getBBox();
				if(bbox.y < minY)
					minY = bbox.y
				if(bbox.x < minX)
					minX = bbox.x
			});
			return [minX, minY]
		}
					
		function __drawNodes( levelDictionary, linkNodeDict, topLeft){
			/* 
			Takes size of nodes into account to translate grid positions into actual
			canvas coordinates
			*/
			var setSmooth		= options['Spline optimization']
			var setCurvature = options['Arrow curvature']
			var minOffsetY = options['yOffset']
			var minOffsetX = options['xOffset']
			var giveExtraSpaceForLinks = options['addEdgeObjHeight']

			// Caclulate x, y offsets
			var offsetX = 0
			var levelInt2offsetY = {}
			var currentLevel, levelInt;
			for(levelInt = 0; levelInt < levelDictionary.length; levelInt++){
				currentLevel = levelDictionary[levelInt]
				levelInt2offsetY[levelInt] = 0
				
				// Calculate maximum node size on a per level basis (X is for all levels)
				// Then add minimum seperation distance between nodes
				currentLevel.forEach(function(node){
					// getSize returns node width, && height of the node & child link icon
					var size = node.getSize(giveExtraSpaceForLinks)
					var x = size[0], y = size[1];
					offsetX = Math.max(offsetX, x)
					levelInt2offsetY[levelInt] = Math.max(levelInt2offsetY[levelInt], y)
				});
			}
																			 
					
			var maxOffsetX = offsetX + minOffsetX
			var halfOffsetX = offsetX / 2
					
			// Send nodes to their final destination, assign final pos to dummy edges
			var x = topLeft[0], y = topLeft[1];
			for(levelInt = 0; levelInt < levelDictionary.length; levelInt++){
				currentLevel = levelDictionary[levelInt]
				var longEdgeOffset = [halfOffsetX, levelInt2offsetY[levelInt] / 3]
											
				// Move each node in the level (Dummy edges save the pos but don't move)
				currentLevel.forEach(function(node){
					node.moveTo(x + node.getGridPosition() * maxOffsetX, y, longEdgeOffset)
				})
					
				// Increment y for the next iteration
				y += levelInt2offsetY[levelInt] + minOffsetY
			}
				
			// Self-looping edges (Must move these manually into position)
			NodeWrapper.SelfLoopList.forEach(function(selfLoopedEdge){
				var pos = selfLoopedEdge.getEdgePosition();
				x = pos[0]
				y = pos[1]
				selfLoopedEdge.moveTo(x,y)
			})

			//debugger;
			// Re-wire the links to take into account the new node positions
			/*
			var selectedLinks = []
			linkNodeDict.values().forEach(function(obj){
				selectedLinks.push(obj)
			})
			optimizeLinks(this.cb, setSmooth, setCurvature, selectedLinks=selectedLinks)
			*/
			//LinkOptimizer.optimizeLinks(linkNodeList);
			
			// Route multi-layer edges
			//__edgeRouter()
		}
			
		 function __edgeRouter(){
			/*
			Previously, edges traversing multiple layers were represented as a chain
			of dummy nodes. Now these nodes are used as points on a continuous spline.
			*/
			function getEndpoint(nodeTuple, pointList, direction, isReversedEdge){
				/* Gets the nearest arrow endpoint. Handles edge reversal */

				var ix,iy;
				if((direction == 'start' && ! isReversedEdge)
					 || (direction == 'end' && isReversedEdge)){
					var endNode = nodeTuple[0]
					if(isReversedEdge){
						ix = -2
						iy = -1
					}
					else{
						ix = 0
						iy = 1
					}
				}
				else{
					endNode = nodeTuple[1]
					if(isReversedEdge){
						ix = 0
						iy = 1
					}
					else{
						ix = -2 
						iy = -1				
					}
				}
						
				// Is it connected to a named port!?!
				if(endNode.isConnectedByNamedPort(edgeObject)){
					handler = endNode.getConnectedByNamedPortHandler(nodeTuple[2]) 
					return dc.coords(handler).slice(0,2)
				}
						
				// Not a named port...
				return list(endNode.getClosestConnector2Point( endNode, pointList[ix], pointList[iy]))	 
			}	
			
			
			//todo: improve method for spline arrows + add comments + optimize?
			console.log( '----------------Dummy Edge Routing-----------------')
			NodeWrapper.ID2LayerEdgeDict.keys().forEach(function(dummyEdge){
				
				var dummyList = NodeWrapper.ID2LayerEdgeDict[dummyEdge]
				var dummyNode = dummyList[0]
				var dummyChild = dummyNode.children[0]
				var linkFlagList = dummyNode.childNodeToLinkFlagListMap[dummyChild.id]
				
				// Real nodes at start/end of the edge
				var edgeSourceNode = dummyNode.parents[0]
				edgeSourceNode = edgeSourceNode.getASGNode().visualObject
				dummyNode = dummyList[-1]
				var edgeTargetNode = dummyNode.children[0]
				//print 'Dummy edge number', dummyEdge,
				//print dummyList[0].parents.keys()[0].getName(),	edgeTargetNode.getName()
				edgeTargetNode = edgeTargetNode.getASGNode().visualObject
				var nodeTuple = [edgeSourceNode, edgeTargetNode, null]
				
				// Some edges are internally reversed to break cycles, when drawing
				// this must be taken into account
				var isReversedEdge = false
				var edgesToRoute = []
				linkFlagList.forEach(function(flag){
					var linkNode = flag[0], isReversed = flag[1];
					edgesToRoute.push(linkNode)
					if(isReversed) isReversedEdge = true
				});
					
				// Get all the points the edge must pass through (sorted by layer order)
				dummyList.sort(function(a, b){ return a.getLayer() < b.getLayer()})
				if(isReversedEdge) dummyList.reverse()

				var sortedDummyRouteList = []
				dummyList.forEach(function(node){
					sortedDummyRouteList = 
						sortedDummyRouteList.concat(node.getEdgePosition())
				})
				
				// Set the coordinates of the edge directly 
				// This is complicated by the fact that AToM3 treats edges as two
				// segments that join poorly (for spline arrows)
				edgesToRoute.forEach(function(edgeObject){
					var dc = edgeObject.visualObject.dc
					var linkObj = edgeObject.visualObject
					var tag = linkObj.tag
					
					if(isReversedEdge){
						inPoint = dc.coords( tag + "2ndSeg0" ).slice(0,2)
						outPoint = dc.coords( tag + "1stSeg0" ).slice(0,2)
					}
					else{
						inPoint = dc.coords( tag + "1stSeg0" ).slice(0,2)
						outPoint = dc.coords( tag + "2ndSeg0" ).slice(0,2)
					}
					
					//print 'Dummy route', sortedDummyRouteList
					var numPoints = sortedDummyRouteList.length / 2;
					// Add 2 extra control points for odd case (to make splines nice)
					var center, start, end, newMid1, newMid2, centerIndex;
					if(numPoints % 2 == 1){
						if(numPoints == 1)
							center = sortedDummyRouteList
						else{
							start = sortedDummyRouteList.slice(0,numPoints - 1)
							end = sortedDummyRouteList.slice(0,numPoints + 1)
							center = sortedDummyRouteList.slice(numPoints - 1,numPoints + 1)
						}
						
						if(! isReversedEdge){
							newMid1 = [center[0], center[1] - 20]
							newMid2 = [center[0], center[1] + 20]
						}
						else{
							newMid2 = [center[0], center[1] - 20]
							newMid1 = [center[0], center[1] + 20]
						}
																
						if(numPoints == 1)
							sortedDummyRouteList = newMid1 + center + newMid2 
						else
							sortedDummyRouteList = start + newMid1 + center + newMid2 + end
						centerIndex = numPoints - 1 + 2
					}
						
					// Add 1 extra control point for even case (to make splines nice)
					else{
						start = sortedDummyRouteList.slice(0,numPoints)
						end = sortedDummyRouteList.slice(numPoints)
						center = [start[-2] + (end[0] - start[-2]) / 2, start[-1] + (end[1] - start[-1]) / 2]
						sortedDummyRouteList = start + center + end					
						centerIndex = numPoints
					}
						
					// Now I know where the center is... so lets move the center object
					// Is the edge object a hyperlink?
					if(edgeObject.inConnections + edgeObject.outConnections.length > 2){
						var fromObjs = []
						edgeObject.inConnections.forEach(function(semObj){
							fromObjs.push(semObj.visualObject)
						})
						var toObjs = []
						edgeObject.outConnections.forEach(function(semObj){
							toObjs.push(semObj.visualObject)
						})
						optimizerHyperLink(dc, linkObj, fromObjs, toObjs, 0, 0, 0, center )
					} else {
						linkObj.moveTo(center)
					}
					
					// Go through the 2 segments in the link
					nodeTuple[2] = edgeObject
					linkObj.connections.forEach(function(connTuple){
						var itemHandler = connTuple[0]
						var direction = connTuple[1]

						var inPoint, outPoint, segCoords;
						if( direction ){
							inPoint = getEndpoint(nodeTuple, sortedDummyRouteList,
																		'start', isReversedEdge)

							segCoords = inPoint + sortedDummyRouteList.slice(0,centerIndex+2)
						}
						else{
							outPoint = getEndpoint(nodeTuple, sortedDummyRouteList,
																		 'end', isReversedEdge) 
							segCoords = sortedDummyRouteList.slice(centerIndex) + outPoint
							segCoords = __reverseCoordList(segCoords)
						}
				
						// Applies the changed coords to the canvas
						dc.coords( [itemHandler] + segCoords )		
						
						// This may change the associated link drawings: 
						// move them to the new point 
						if( direction )
							linkObj.updateDrawingsTo(inPoint[0], inPoint[1], itemHandler, segmentNumber=1)
						else
							linkObj.updateDrawingsTo(outPoint[0], outPoint[1], itemHandler, segmentNumber=2)
					})
				});
			})
		}
			
			

		function __reverseCoordList( segCoords){
			/* 
			Input: list of coordinates [x0, y0, x1, y1, ..., xn, yn]
			Output: list of coordinates reversed [xn, yn, ..., x1, y1, x0, y0]
			*/		
			var reversedCoords = []
			for(var i = segCoords.length - 1; i > 0; i-=2){
				reversedCoords = reversedCoords.concat([segCoords[i - 1], segCoords[i]])
			}
			return reversedCoords
		}
			

	}

	function recursivelyApplyHierarchicalLayout(graphEntity,options){
		var nodeWrapperChildren = graphEntity.children.map(function(c){return new NodeWrapper(c,NodeWrapper.REGULAR_NODE)});
		graphEntity.children.filter(function(c){return c.children.length})
			.forEach(function(c){recursivelyApplyHierarchicalLayout(c,options)});
		hierarchicalLayout(graphEntity.children,nodeWrapperChildren,options);
	}

	return {
		recursivelyApplyHierarchicalLayout : recursivelyApplyHierarchicalLayout,
		hierarchicalLayout : hierarchicalLayout,
		HEURISTICS_ENUM : HEURISTICS_ENUM
	}


});
