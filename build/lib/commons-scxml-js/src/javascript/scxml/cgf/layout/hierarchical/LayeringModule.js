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
Based on LayeringModule.py by Denis Dube as part of his Master's thesis work for the McGill University Modelling, Simulation, and Design Lab
*/

/*
This module is responsible for creating a proper layering of an arbitrary
directed graph. The optimal solution (minmal height and width layering) is an
NP-complete problem.

Responsibilities:
	1) Eliminate cycles
	2) Assign each node to a layer
	3) Assign dummy nodes to layers wherever edges traverse multipler layers

Known layering algorithms:
	1) Longest-path heuristic, minimizes height
	2) Coffman-Graham heuristic, minimizes width given an upperbound on the width
	3) Gansner et al. ILP, minimizes dummy edges
	4) Healy et al. ILP, minimizes width and dummy edges, given upperbound on
											both the width and the height
	5) Tarassov et al. heuristic, minimizes width and width of dummy edges

*/
require.def("src/javascript/scxml/cgf/layout/hierarchical/LayeringModule",
["src/javascript/scxml/cgf/layout/hierarchical/NodeWrapper"],
function(NodeWrapper){


	function longestPathLayeringTopDown(wrappedNodeList){
		/*
		This algorithm assigns each node in the wrappedNodeList a layer, working
		its way from the root nodes all the way to the leafs.
		This algorithm is the simplest & fastest for layering, and minimizes height.
		Unfortunately, it does not bound the width at all!
		The algorithm works in O(n)
		Requires approximately 0 seconds for 127 nodes, 135 edges on P4-3.2ghz
		*/

		// Get roots in the acyclic graph (wrappedNodeList is topologically sorted)
		var rootNodes = []
		wrappedNodeList.forEach(function(wrappedNode){
			if(wrappedNode.parents.length == 0)
				rootNodes.push(wrappedNode)
		})

		console.log("rootNodes")
		rootNodes.forEach(function(node){
			console.log('	 ', node.getName())
		})

		// Place each node on a layer
		// NOTE: This may set a single node's layer more than once but since
		//			 a topological sort is in effect, the last one is the "right" one...
		var queuedNodes = rootNodes.slice()
		var currentLevelInt = 0
		while(queuedNodes.length > 0){
			var tempQueue = []
			queuedNodes.forEach(function(node){
				node.setLayer(currentLevelInt) // Make each node aware of its layer
				tempQueue = tempQueue.concat(node.children) // Children of this node
			});
			queuedNodes = tempQueue
			currentLevelInt += 1
		}

		return __buildLevelDictionary(wrappedNodeList)
	}

	function longestPathLayeringBottomUp(wrappedNodeList){
		/*
		This is a simple layering algorithm that places nodes in layers from the
		leaves to the root. The height is no greater than the longest path from
		a leaf to the root.
		The implementation is provided for reference in the LNCS article:
			A Heuristic for Minimum-Width Graph Layering with Consideration of Dummy
			odes.
			By: Alexandre Tarassov and Nikola S. Nikolov and Jurgen Branke
		This algorithm is O(n^2)
		Requires approximately 0.3 seconds for 127 nodes, 135 edges on P4-3.2ghz
		*/

		var rejectedNodeList = []
		var unassignedNodeList = wrappedNodeList.slice()
		var assignedNodesCurrentLayer = []
		var assignedNodesInSubLayers = []
		var currentLayerInt = 0
		console.log('-------------------- Layer 0 --------------')
		while(unassignedNodeList.length){

			// Choose an unassigned node
			var wasNodeSelected = false
			for(var i=0; i < unassignedNodeList.length; i++){
				var node = unassignedNodeList[i];

				// Slight optimization: ignore already rejected nodes on current layer
				if(rejectedNodeList.indexOf(node) !== -1)
					continue;

				console.log('Node:', node, node.children)

				// Check if this node has a successor that is not already layer assigned
				wasNodeSelected = true
				for(var j=0; j < node.children.length; j++){
					var child = node.children[j];

					if(assignedNodesInSubLayers.indexOf(child) === -1){
						wasNodeSelected = false
						break;
					}
				}

				// If selected, no successor in unassigned layer, set the nodes layer!
				if(wasNodeSelected){
					unassignedNodeList.splice(unassignedNodeList.indexOf(node),1);
					node.setLayer(currentLayerInt) // Make each node aware of its layer
					assignedNodesCurrentLayer.push(node)
					break;
				}
				else{
					rejectedNodeList.push(node)
				}
			}

			if(! wasNodeSelected){
				currentLayerInt += 1
				assignedNodesInSubLayers = assignedNodesInSubLayers.concat(assignedNodesCurrentLayer)
				rejectedNodeList = []
				console.log('-------------------- Layer ', currentLayerInt, ' --------------')
			}
		}


	//	// Re-order all the layers to be consistent with my other layering alg.
	//	wrappedNodeList.forEach(function(node){
	//		node.setLayer(currentLayerInt - node.getLayer())

		return __buildLevelDictionary(wrappedNodeList)

	}



	function greedyCycleRemover(wrappedNodeList){
		/*
		Uses topological sort then reverses backward edges to eliminate cycles
		Returns nodes in topological sort order
		*/

	//		TODO: implement this idea
	//		From: A Technique for Drawing Directed Graphs
	//		Emden R. Gansner, Eleftherios Koutsofios, Stephen C. North, Kiem-Phong Vo
	//		AT&T Bell Laboratories Murray Hill, New Jersey 07974
	//It seems reasonable to try to reverse a smaller or even minimal set of edges.
	//One difficulty is that finding a minimal set (the feedback arc set problem)
	//is NP-complete [EMW] [GJ]. More important, this would probably not improve the
	//drawings. We implemented a heuristic to reverse edges that participate in many
	//cycles. The heuristic takes one non-trivial strongly connected component at a
	//time, in an arbitrary order. Within each component, it counts the number of
	//times each edge forms a cycle in a depth-first traversal. An edge with a
	//maximal count is reversed. This is repeated until there are no more
	//non-trivial strongly connected components.


		var topSort = __getTopologicalSort(wrappedNodeList)

		// Debug
		console.log('Topological sorting')
		wrappedNodeList.forEach(function(wrappedNode){
			console.log('	 ', wrappedNode.getName())
		})

		// Reverse backward arcs to eliminate cycles
		for(var nodeIndex = 0; nodeIndex  < topSort.length; nodeIndex++){
			var wrappedNode = topSort[nodeIndex]
			var wrappedChildrenNodes = wrappedNode.children

			wrappedChildrenNodes.forEach(function(wrappedChildrenNode){
				// If the child has a smaller index than the current node it is left
				// of the current node. That means it forms a cycle!
				if(nodeIndex > topSort.indexOf(wrappedChildrenNode)){

					// Get the link (or maybe more than one link) between parent
					// wrappedNode and child wrappedChildrenNode
					var linkFlagList = wrappedNode.childNodeToLinkFlagListMap[wrappedChildrenNode.id].slice()

					// Remove it
					wrappedNode.children.splice(
						wrappedNode.children.indexOf(wrappedChildrenNode),1);
					delete wrappedNode.childNodeToLinkFlagListMap[wrappedChildrenNode.id]

					wrappedChildrenNode.parents.splice(
						wrappedChildrenNode.parents.indexOf(wrappedNode),1);
					delete wrappedChildrenNode.parentNodeToLinkFlagListMap[wrappedNode.id]

					// Reverse it
					var tempList = []
					linkFlagList.forEach(function(linkFlag){
						tempList.push([linkFlag[0], true]) // Reverse flag set to true
					})
					wrappedChildrenNode.childNodeToLinkFlagListMap[wrappedNode.id]
						= tempList.slice()
					wrappedNode.parentNodeToLinkFlagListMap[wrappedChildrenNode.id]
						= tempList.slice()
				}

				// Self-loop situation
				else if(nodeIndex == topSort.indexOf(wrappedChildrenNode)){
					console.log('SELFLOOP', wrappedChildrenNode.getName())
				}
			})
		}

		return topSort
	}



	function addDummyNodes(levelDictionary, isGoingDown){
		/*
		If an edge crosses more than 1 layer, a dummy node is added so the edge
		can be bent around other nodes (thus avoiding overlap, min crossing)
		*/

		isGoingDown = isGoingDown || true;


		var uniqueID = 0
		// Add dummy nodes if an edge traverses > 1 layer
		for(var currentLevelInt = 0; currentLevelInt  < levelDictionary.length; currentLevelInt++){

			var currentLevelNodeList = levelDictionary[currentLevelInt] || [];

			currentLevelNodeList.forEach(function(node){

				// Go through each node connected to this node
				node.children.forEach(function(targetNode){

					// Is the connected node more than 1 layer distant?
					var targetNodeLayer = targetNode.getLayer()
					if(Math.abs(targetNodeLayer - currentLevelInt) > 1){

						// Insert a dummy node here! One for each layer crossed

						var dummyParent = node
						var linkFlagList = node.childNodeToLinkFlagListMap[targetNode.id].slice()
						delete node.childNodeToLinkFlagListMap[targetNode.id] // Why did I do this? Mmm...
						uniqueID += 1

						var increment, stopLevel;
						if(targetNodeLayer > currentLevelInt){
							console.log('HERE')
							i = currentLevelInt - 1
							increment = 1
							stopLevel = targetNodeLayer
						}
						else{
							i = currentLevelInt - 1
							increment = -1
							stopLevel = targetNodeLayer
						}

						//while(i != stopLevel):
						var dummyNode;
						for(var i = currentLevelInt+1; i < targetNode.getLayer(); i++){
							console.log('I need a dummy on level', i,'to',targetNode.getLayer(), 'for child', targetNode.getName())
							// Create the dummy node, add it to level dict
							dummyNode = new NodeWrapper([uniqueID, linkFlagList], NodeWrapper.MULTI_LAYER_EDGE, i)
							levelDictionary[i].push(dummyNode)

							// I need to be able to trace links back and forth
							// Including the dummy nodes...
							dummyParent.childNodeToLinkFlagListMap[dummyNode.id] = linkFlagList
							dummyNode.parentNodeToLinkFlagListMap[dummyParent.id] = linkFlagList
							dummyParent = dummyNode
							i += increment
						}

						if(dummyNode)
							dummyNode.childNodeToLinkFlagListMap[targetNode.id] = linkFlagList
					}
				})
			})
		}

		return levelDictionary
	}


	//function addDummyNodes(levelDictionary):
	//	/*
	//	If an edge crosses more than 1 layer, a dummy node is added so the edge
	//	can be bent around other nodes (thus avoiding overlap, min crossing)
	//	*/
	//	uniqueID = 0
	//	// Add dummy nodes if an edge traverses > 1 layer
	//	for currentLevelInt in levelDictionary.keys():
	//		for node in levelDictionary[currentLevelInt]:
	//
	//			children = node.children.keys() // Children of this node
	//			for child in children:
	//
	//				// Child should be exactly 1 layer below the parent at current level
	//				if(currentLevelInt < child.getLayer() - 1):
	//					// Insert a dummy node here! One for each layer crossed
	//
	//					dummyParent = node
	//					linkFlagList = node.children[child][:]
	//					del node.children[child]
	//					uniqueID += 1
	//
	//					for i in range(currentLevelInt+1, child.getLayer()):
	//						//console.log('I need a dummy on level', i, 'for child', child.getName())
	//						// Create the dummy node, add it to level dict
	//						dummyNode = NodeWrapper((uniqueID, linkFlagList),
	//																		 NodeWrapper.MULTI_LAYER_EDGE, i)
	//						levelDictionary[i].push(dummyNode)
	//
	//						// I need to be able to trace links back and forth
	//						// Including the dummy nodes...
	//						dummyParent.children[dummyNode] = linkFlagList
	//						dummyNode.parents[dummyParent] = linkFlagList
	//						dummyParent = dummyNode
	//					dummyNode.children[child] = linkFlagList
	//
	//	return levelDictionary



	function __getTopologicalSort(wrappedNodeList){
		/*
		Returns the node list as topologically sorted with forward arcs running
		from left to right (if cycles exist, there will be backward arcs too)
		*/
		function DFSlookup(node, sortedNodeList){
			/* Sub-method for topological sort, does depth first search */
			node.children.forEach(function(childNode){ //node.getChildrenWrappers():
				if(!childNode.isVisited()){
					childNode.setVisited()
					DFSlookup(childNode, sortedNodeList)
				}
			})
			sortedNodeList.push(node)
		}

		sortedNodeList = []
		wrappedNodeList.forEach(function(node){
			if(!node.isVisited()){
				node.setVisited()
				DFSlookup(node, sortedNodeList)
			}
		})
		sortedNodeList.reverse()
		return sortedNodeList
	}


	function __buildLevelDictionary(wrappedNodeList){
		/*
		wrappedNodeList assumed to contain nodes already assigned a layer
		Returns a dictionary indexed by integer level of lists of nodes
		*/

		// Build the level dictionary for easy access to node layers
		var levelDictionary = []
		wrappedNodeList.forEach(function(node){
			var currentLevelInt = node.getLayer()
			if(! levelDictionary[currentLevelInt])
				levelDictionary[currentLevelInt] = [node]
			else
				levelDictionary[currentLevelInt].push(node)
		})

		//debugLevelDict(levelDictionary)

		// Add dummy nodes as neccessary to finish the levelDictionary...
		return levelDictionary
	}



	function MinimumWidthLayering(wrappedNodeList){
		/*
		This heuristic algorithm will attempt to create a layering such that
		width is minimized (at the expense of height of course). This should
		yield far more compact layouts, and speed up the crossing minimization
		phase immensely.
		The implementation is provided for reference in the LNCS article:
			A Heuristic for Minimum-Width Graph Layering with Consideration of Dummy
			odes.
			By: Alexandre Tarassov and Nikola S. Nikolov and Jurgen Branke
		This algorithm is O(n^2) but will be far slower than longestPathLayering
		*/

		var self = this;

		//init
		self.__wrappedNodeList = wrappedNodeList

		self.__unassignedNodeList = wrappedNodeList.slice()
		self.__assignedNodesCurrentLayer = []
		self.__assignedNodesInSubLayers = []

		self.__currentWidthInt = 0
		self.__widthUpInt = 0


		this.execute = function( UBW, cInteger){
			/*
			Usage:
				Execute the heuristic on the wrapped nodes provided in init call

			Parameters:
				//todo: Parameters

			Returns:
				levelDictionary, with all the nodes assigned to a layer in that dictionary

			WARNING:
				If you change the nodes, then you must re-instantiate this class

			Example usage:
					mwl = MinimumWidthLayering(wrappedNodeList)
					levelDictionary = mwl() // Run the algorithm
			*/
			var currentLayerInt = 0
			console.log('-------------------- Layer ', currentLayerInt, ' --------------')
			while(self.__unassignedNodeList.length){

				var theChosenNode = __chooseNode()

				if(theChosenNode){
					// Make the node aware of its layer
					theChosenNode.setLayer(currentLayerInt)

					// Update current width and the estimate of upper layer widths
					var outDegree = theChosenNode.getOutDegree()
					self.__currentWidthInt += 
						- MinimumWidthLayering.EdgeWidth * outDegree 
						+ theChosenNode.getSize(giveExtraSpaceForLinks=false)[0]

					var inDegree = theChosenNode.parents.length
					self.__widthUpInt += MinimumWidthLayering.EdgeWidth * inDegree


					// Prevent the layer from getting too wide...
					if(__conditionGoUp(outDegree, UBW, cInteger))
						theChosenNode = null
				}

				if(theChosenNode == null){
					currentLayerInt += 1
					self.__assignedNodesInSubLayers =
						self.__assignedNodesInSubLayers.concat(self.__assignedNodesCurrentLayer)
					self.__currentWidthInt = self.__widthUpInt
					self.__widthUpInt = 0

					console.log('-------------------- Layer ', 
						currentLayerInt, ' --------------')
				}
			}


			// Build the level dictionary for easy access to node layers
			var maxLayerInt = currentLayerInt
			var levelDictionary = []
			self.__wrappedNodeList.forEach(function(node){
				// Set them up by order of top nodes to bottom nodes
				var currentLevelInt = node.getLayer()
				currentLevelInt = maxLayerInt - node.getLayer()
				node.setLayer(currentLevelInt)
				if(! levelDictionary[currentLevelInt])
					levelDictionary[currentLevelInt] = [node]
				else
					levelDictionary[currentLevelInt].push(node)
			})

			//debugLevelDict(levelDictionary)
			return levelDictionary
		}

		function __chooseNode(){
			/*
			Choose an unassigned node of maximum outdegree who has successors only in
			assigned layers (or no successors)
			*/

			var theChosenNode = null
			var maxOutDegree = -1
			var rejectedNodeList = []

			// Go through all unassigned nodes
			self.__unassignedNodeList.forEach(function(node){

				// Slight optimization: ignore already rejected nodes on current layer
				if(rejectedNodeList.indexOf(node) !== -1)
					return

	//			console.log('Node:', node, '	OutDegree:', node.getOutDegree())

				// Check if this node has a successor that is not already layer assigned
				var isNodeInvalid = false
				for(var i=0; i< node.children.length; i++){
					var child = node.children[i];

					if(self.__assignedNodesInSubLayers.indexOf(child) === -1){
						isNodeInvalid = true
						break;
					}
				}
				// Node has successor in unassigned layer, we can't possibly pick it
				if(isNodeInvalid){
					rejectedNodeList.push(node)
					return
				}

				// Does the node have maximum outdegree of all the candidates?
				if(node.getOutDegree() > maxOutDegree){
					maxOutDegree = node.getOutDegree()
					theChosenNode = node
				}
			})


			// Okay, we pick this node, shuffle it from unassigned to assigned!
			if(theChosenNode){
				self.__unassignedNodeList.splice(self.__unassignedNodeList.indexOf(theChosenNode),1);
				self.__assignedNodesCurrentLayer.push(theChosenNode)
			}

			console.log('The chosen node:', theChosenNode)
			return theChosenNode // Could be null
		}


		function __conditionGoUp( outDegree, UBW, cInteger){
			/*
			Return true if we should skip to the next layer
			*/
			if(self.__currentWidthInt >= UBW && outDegree < 1)
				return true
			else if(self.__widthUpInt >= cInteger * UBW)
				return true
			return false
		}
	}
	MinimumWidthLayering.EdgeWidth = 1

	return {
		greedyCycleRemover : greedyCycleRemover,
		longestPathLayeringTopDown : longestPathLayeringTopDown,
		longestPathLayeringBottomUp : longestPathLayeringBottomUp,
		addDummyNodes : addDummyNodes,
		MinimumWidthLayering : MinimumWidthLayering
	}

});
