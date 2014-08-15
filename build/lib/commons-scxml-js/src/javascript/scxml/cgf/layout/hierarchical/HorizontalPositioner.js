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
Based on HorizontalPositioner.py by Denis Dube as part of his Master's thesis work for the McGill University Modelling, Simulation, and Design Lab
*/

/*

Algorithms dealing with the third phase of Sugiyama-style hierarchical layout,
horizontal position assignment of each node (while respecting node order).

*/

require.def("src/javascript/scxml/cgf/layout/hierarchical/HorizontalPositioner",
["src/javascript/scxml/cgf/layout/hierarchical/NodeWrapper"],
function(NodeWrapper){

	function priorityBarycenterPositioner(levelDictionary, maxIterations){
		/*
		Given a layering & ordering of nodes, this will set them on a grid such
		that they respect the layering && ordering but such that nodes are as
		close as possible (horizontally) to their children && parents.
		This is done by sweeping up/down using barycenters.
		*/		
		var gridSize = 0
			
		// Re-order each level so that self-loops are close to their node 
		// NOTE: self-loops are drawn on the level below their node
		// This actually decreases the // of crossings although they're undetectable
		// by the crossing counting algorithm
		levelDictionary.forEach(function(level){
			__updateOrder(level)
			level.forEach(function(node){
				if(NodeWrapper.SelfLoopList.indexOf(node) !== -1){
					var childParent = node.parents[0]
					
					// Get the orders of all the children of the self-loop's parent
					var childOrders = childParent.children.map(function(child){
						return child.getOrder();
					});
					childOrders.sort()
					
					// Use the median order of all the children
					var newOrder = childOrders[Math.ceil(childOrders.length / 2)]
					level.splice(level.indexOf(node),1)
					level.splice(newOrder, 0, node)
				}
			})
		});
				
					
					
		// Set priorities for node placements according to fan in, fan out, edges
		levelDictionary.forEach(function(level){
			var i = 0
			level.forEach(function(node){
				// Set initial grid position && calculate node priority
				node.setGridPosition(i)
				node.calculatePriority() 

				// Get maximum horizontal grid size
				i += 1
				gridSize = Math.max(gridSize , i)
			})
		});
						
		//maxIterations = self.__optionsDatabase.get('baryPlaceMax')	
		var movements = 1
		var iterations = 0
		// Iterate up/down, preserver order, but move to take advantage of barycenter
		while(movements > 0 && iterations < maxIterations){
			movements = 0
			// Sweep down/up
			for(var i = 0; i < levelDictionary.length - 1; i++){
				movements += __prettyNodeBarycenter(levelDictionary[i], true, gridSize)
				movements += __prettyNodeBarycenter(levelDictionary[i + 1], false, gridSize)
			}
			iterations += 1
		}
			
		// Make sure we are globally flushed to the left
		var minGridX = Number.MAX_VALUE;
		levelDictionary.forEach(function(level){
			minGridX = Math.min(minGridX, level[0].getGridPosition())
		});
		if(minGridX != 0){
			levelDictionary.forEach(function(level){
				level.forEach(function(node){
					node.setGridPosition(node.getGridPosition() - minGridX)
				})
			})
		}
	}
			

	function __prettyNodeBarycenter(levelList, isGoingDown, gridSize){
		/*
		Submethod of the node placer, works on one level, in given direction
		*/				 
		var movements = 0
		var nodeInLevelIndex = 0
		// Iterate over all nodes, get their bary center, try to move them to it
		levelList.forEach(function(node){
			var baryCenterFloat = node.getGridBarycenter(isGoingDown)
			
			// No children/parent
			if(baryCenterFloat == null) return
				
			var desiredGridPosition = Math.round(baryCenterFloat)
			var currentGridPosition = node.getGridPosition()
			
			// If not at desired spot, try to move there
			if(currentGridPosition != desiredGridPosition){
				var isMovingRight = desiredGridPosition > currentGridPosition
				movements += __move(levelList, nodeInLevelIndex, node, isMovingRight, gridSize)
			}
				
			nodeInLevelIndex += 1	 
		});
		return movements
	}
		

	function __move(levelList, nodeInLevelIndex, moveNode, isMovingRight, gridSize){
		/*
		Sub-submethod... this will recusively try to move a node horizontally
		to the right or left. The recursion occurs if a node moving to a new
		location must displace a node already occupying the spot. Move will
		fail if a node being nudged away has priority or grid boundary reached
		*/
		var newGridPosition = moveNode.getGridPosition() + (isMovingRight ? 1 : -1)
		
		// Can we move there? Target in bounds?
		if(newGridPosition < 0 || newGridPosition > gridSize) return 0
					
		var neighborIndex = nodeInLevelIndex + (isMovingRight ? 1 : -1) // +/- 1 index

		var isMoving;
		// No neighbor to the right! We can move there
		if(isMovingRight && neighborIndex > levelList.length - 1){
			isMoving = true
		}
			
		// No neighbor to the left! We can move there
		else if(! isMovingRight && neighborIndex < 0){
			isMoving = true
		}
			
		// Have to shove the neighbor out of his spot...
		else {
			isMoving = false	 
			var neighborNode = levelList[neighborIndex]
			var neighborGridPosition = neighborNode.getGridPosition()
			// Neighbor definately in our spot...
			if(neighborGridPosition == newGridPosition){
				var movePriority = moveNode.getPriority()
				var neighborPriority = neighborNode.getPriority()
				// Do we out-prioritize the neighbor?
				if(movePriority > neighborPriority)
					isMoving = __move(levelList, neighborIndex, neighborNode, isMovingRight, gridSize)
			}
			else{
				isMoving = true
			}
		}
			
		// We can move, set new grid position
		if(isMoving){
			moveNode.setGridPosition(newGridPosition)
			return 1	
		}
		return 0
	}


		
			
	function __updateOrder(orderedLayer){
			/* 
			The ordering is implicit in the node sequence in the list
			However to do a node sort, it's handy to have each node know its order
			This order is used only within __barycentricOrdering() except for debug
			*/
			var i = 0
			orderedLayer.forEach(function(node){
				node.setOrder(i)
				i += 1
			});
	}

	return {
		priorityBarycenterPositioner : priorityBarycenterPositioner 
	}
});
