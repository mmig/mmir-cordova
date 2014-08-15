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
Based on CrossingModule.py by Denis Dube as part of his Master's thesis work for the McGill University Modelling, Simulation, and Design Lab
*/

/*

Collection of algorithms responsible for phase II of Sugiyama-style hierarchical
layout... crossing reduction.

*/

require.def("src/javascript/scxml/cgf/layout/hierarchical/CrossingModule",
["src/javascript/scxml/cgf/layout/hierarchical/NodeWrapper"],
function(NodeWrapper){

	function barycentricOrdering(levelDictionary, phaseOneMax, phaseTwoMax){
		/*
		Given a dictionary mapping of integer levels to nodes
		Re-orders the nodes on each level to have fewer edge crossings
		Implementation draws from:
			CROSSING REDUCTION FOR LAYERED HIERARCHICAL GRAPH DRAWING
			By PITCH PATARASUK
		However, I don't perform same barycenter order reversals; for some reason
		this yielded MORE crossings rather than less. I DO use random order 
		restarts however, which has given me good to optimal results in tests.
		*/

			
		// Init variables
		var totalLevelsInt = levelDictionary.length
		var bestGlobalCrossings = Number.MAX_VALUE	 // Minimum # of crossings found so far
		var bestLevelDictionary = null				 // Copy of the level dict with min cross
		var phaseOneIterations = 0
		var phaseTwoIterations = 0
		
		// Initilize layer orderings 
		levelDictionary.forEach(function(level){
			__updateOrder(level)
		})
		
		// Main crossing reduction loop
		while(phaseTwoIterations < phaseTwoMax){
			
			// Iterate over all the levels in the level dictionary
			// If totalLevelsInt = 3, then this range yields [0, 1]
			for(var j = 0; j < totalLevelsInt - 1; j++){
				
				//// Down-Barycenter (Parent to child)
				levelDictionary[j].forEach(function(node){
					node.computeBarycenter(true)
				});

				// Sort the list in place according to barycenter values
				levelDictionary[j].sort(function(a,b){ return a.getBarycenter() < b.getBarycenter()})

				// Save the node's sorted position in it's internal parameter
				__updateOrder(levelDictionary[j])
					
				//// Up-Barycenter (Child to parent)
				levelDictionary[j + 1].forEach(function(node){
					node.computeBarycenter(false)
				});

				// Sort the list in place according to barycenter values
				levelDictionary[j + 1].sort(function(a, b){ return a.getBarycenter() < b.getBarycenter() })

				// Save the node's sorted position in it's internal parameter
				__updateOrder(levelDictionary[j + 1])
			}
				

			// Count crossings
			var globalCrossings = 0
			for(var j = 0; j < totalLevelsInt - 1; j++){
				globalCrossings += countCrossings(levelDictionary[j], 
									 levelDictionary[j + 1])
			}
				
			// Did the last iteration of the algorithm reduce crossings?
			if(globalCrossings < bestGlobalCrossings){
				// Crossings reduced, reset counter since more reductions are possible
				phaseOneIterations = 0				
				// Store a copy of levelDictionary, best ordering yet
				bestLevelDictionary = __copyDict(levelDictionary)						
				bestGlobalCrossings = globalCrossings		
			}
			else{
				// Crossings not reduced, keep trying, might reduce later
				phaseOneIterations += 1
				if(phaseOneIterations > phaseOneMax){
					// Reductions have ceased, try a random restart...
					phaseOneIterations = 0
					phaseTwoIterations += 1
					
					// Randomize layer orderings
					//get a list of indexes
					//shuffle them
					//set the order property of each node at that level, according to the random index
					levelDictionary.forEach(function(currentLevel){
						var indexList = range(0, currentLevel.length)
						var shuffledList = indexList.slice()
						fisherYates(shuffledList)
	
						shuffledList.forEach(function(k){
							currentLevel[indexList.pop()].setOrder(k)
						});
					});
				}
			}
		}

		// Return the levelDictionary with the least crossings
		return bestLevelDictionary
	}

	function range(from,to,increment){
		increment = increment || 1;
		var toReturn = [];
		for(var i = from; i < to; i+= increment){
			toReturn.push(i);
		}
		return toReturn;
	}
		 
	//JavaScript array shuffle implementation taken from http://sedition.com/perl/javascript-fy.html
	function fisherYates ( myArray ) {
		var i = myArray.length;
		if ( i == 0 ) return false;
		while ( --i ) {
			var j = Math.floor( Math.random() * ( i + 1 ) );
			var tempi = myArray[i];
			var tempj = myArray[j];
			myArray[i] = tempj;
			myArray[j] = tempi;
		}
	}
		 
	function countCrossings(layerA, layerB){
		/*
		Inputs: layerA and layerB are lists of NodeWrapper objects
		Output: // of crossings between two node layers in O(|E| log |Vsmall|)
		
		NOTE: Most other algorithms for this are O(|E| + Number of crossings)
		Implementation of:
			Simple and Efficient Bilayer Cross Counting
			Wilhelm Barth, Michael Junger, and Petra Mutzel
			GD 2002, LNCS 2528, pp. 130-141, 2002
		*/
		// Assumed that layerA is above layerB, so children of A are in B
		// Now figure out which layer is smaller to improve running time a bit

		var smallLayer, largeLayer, isParent2Child;

		if(layerA.length < layerB.length){
			smallLayer = layerA
			largeLayer = layerB
			isParent2Child = false
		}
		else{
			smallLayer = layerB
			largeLayer = layerA
			isParent2Child = true
		}
		
	 
		// Sort the edges and come up with a sequence of edges (integer indices)
		var edgeSequence = []
		largeLayer.forEach(function(node){
			var tempList = []
			// Get all possible nodes connected to this node
			var targetNodeList = NodeWrapper.Source2TargetListMap[node.id]
			targetNodeList.forEach(function(targetNode){
				// Restrict ourselves to just those nodes that are in smallLayer
				if(targetNode in smallLayer) tempList.append(targetNode.getOrder())
			});
			tempList.sort()
			edgeSequence = edgeSequence.concat(tempList)
		});
			
		// Build the accumulator tree
		var firstindex = 1		
		while(firstindex < smallLayer.length)
			firstindex *= 2

		var treesize = (2 * firstindex) - 1
		firstindex -= 1
		var tree = {}

		for(var i = 0; i < treesize; i++){
			tree[i] = 0
		}
		
		// Count the crossings
		var crosscount = 0
		for(var k = 0; k < edgeSequence.length; k++){
			var index = edgeSequence[k] + firstindex
			tree[index] += 1
			while(index > 0){

				if(index % 2)
					crosscount += tree[index + 1]

				index = (index - 1) / 2
				tree[index] += 1
			}
		}

		return crosscount
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
			
	function __copyDict(levelDictionary){
		/* Handy method to make a real copy of the levelDictionary */
		return levelDictionary.map(function(nodeList){
			return nodeList.slice();
		});
	}

	return {
		barycentricOrdering : barycentricOrdering
	}
})
