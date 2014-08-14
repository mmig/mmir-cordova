require.def("src/javascript/scxml/cgf/layout/hierarchical/NodeWrapper",
["src/javascript/scxml/cgf/util/svg"],
function(commonSVG){

	function NodeWrapper(node, nodeType, layer){
		/*
		The Hierarchical layout algorithm works exclusively on objects instantiated
		from self class. For the most part, self is a wrapper around the real entity
		nodes in the original diagram. However, special edges are also treated as
		nodes to improve the final layout.
		*/
		layer = layer || 0;

		var self=this;

		// These need to be reset for each new run of HierarchicalLayout
																	// edge to target NodeWrapper
		//init
		self.id = ++NodeWrapper.idCounter;
		
		self.childNodeToLinkFlagListMap = {};
		self.parentNodeToLinkFlagListMap = {};

		self.__visitedFlag = false // Used for DFS
		self.__layer = layer			 // Layer node belongs to
		self.__order = -1					// Node order on the layer
		self.__gridPosition = -1	 // Actual node pos on grid (cannot violate order)
		self.__priority = 0				// Priority to push other nodes for new grid pos
		self.__barycenterValue = 0 // Barycenter used for crossing minimization

		// Dict format: self.children[childNodeId] = [[linkNode, isReversed],...]
		self.children = [];
		self.parents = [];

		self.__outDegree = 0

		self.__edgePosition = [0, 0]	// Edge control point position (Dummy edges)
		self.__nodeType = nodeType		// Regular node or some type of edge node?
		self.__node = node						// AToM3 node, subclass of ASGnode

		NodeWrapper.Source2TargetListMap[self.id] = []

		// Regular node tracker
		if(nodeType == NodeWrapper.REGULAR_NODE){
			// node is an AToM3 entity, subclass of ASGNode
			NodeWrapper.Node2WrapperDict[node.id] = self
		}

		// Self loop tracker (Special kind of dummy edge)
		else if(nodeType == NodeWrapper.SELF_LOOP_EDGE){
			NodeWrapper.SelfLoopList.push(self)
	//			NodeWrapper.Source2TargetListMap[self] = [self]
		}

		// Multi-layer edge node tracker (Dummy edge)
		else{
			//FIXME: Jake: self code here does not make any sense to me at all
			self.__node = []				// self.__node = [linkNode,...]
			linkFlagList = node[1]
			for(var i = 0; i < linkFlagList.length; i++){
				self.__node.push(linkFlagList[i][0]) // The link node object/s
			}
			node = node[0]				// A unique ID number for the dummy tracker

			// Add/push self to the tracker with key "node" which is an ID here
			if(NodeWrapper.ID2LayerEdgeDict[node.id])
				NodeWrapper.ID2LayerEdgeDict[node].push(self)
			else
				NodeWrapper.ID2LayerEdgeDict[node] = [self]
		}



		self.buildConnectivityMaps = function(){
			//uses semantic nodes

			/*
			Creates dictionaries that provide rapid access to the wrapped children
			and parent nodes that are connected with self node.
			Also provides access to the actual link entity between the nodes
			A flag is provided to indicate if the algorithm needed to reverse the link
			Self-links are discarded (Hiearchical layout don't care none about those)
			*/
			// Children map
			self.__node.outConnections.forEach(function(linkNode){
				var linkTraversesHierLevel = linkNode.lca !== self.__node.parent ||
					linkNode.outConnections.every(function(targetNode){return linkNode.lca !== targetNode.parent})
				var childNodes =  linkTraversesHierLevel  ?
							linkNode.targetAncestorOrSelfAndChildOfLCA :
							linkNode.outConnections;

				var sourceNodes = linkTraversesHierLevel  ?
							linkNode.sourceAncestorOrSelfAndChildOfLCA :
							[self.__node];

				sourceNodes.forEach(function(sourceNode){
					var wrappedSourceNode = NodeWrapper.Node2WrapperDict[sourceNode.id];

					childNodes.forEach(function(childNode){
							var wrappedChildNode = NodeWrapper.Node2WrapperDict[childNode.id]
							NodeWrapper.Source2TargetListMap[wrappedSourceNode.id].push(wrappedChildNode)

							//hierarchical layout ignores this kind of link
							if(linkTraversesHierLevel && wrappedSourceNode == wrappedChildNode){
								return;
							}

							// Is the child ourselves in an evil self-loop situation?
							// If so, then create a "dummy" node for the loop itself
							if(wrappedSourceNode == wrappedChildNode ){
								var newNode = new NodeWrapper(linkNode, NodeWrapper.SELF_LOOP_EDGE)
								wrappedSourceNode.children.push(newNode);
								wrappedSourceNode.parents.push(newNode);
								wrappedSourceNode.childNodeToLinkFlagListMap[newNode.id] = [[linkNode, false]]
								wrappedSourceNode.parentNodeToLinkFlagListMap[newNode.id] = [[linkNode, false]]

								newNode.children.push(wrappedSourceNode);
								newNode.parents.push(wrappedSourceNode);
								newNode.childNodeToLinkFlagListMap[wrappedSourceNode.id] = [[linkNode, false]]
								newNode.parentNodeToLinkFlagListMap[wrappedSourceNode.id] = [[linkNode, false]]
							}else{

								// Could be more than one link between source and target
								if(wrappedSourceNode.children.indexOf(wrappedChildNode) == -1){
									wrappedSourceNode.children.push(wrappedChildNode);
									wrappedSourceNode.childNodeToLinkFlagListMap[wrappedChildNode.id] = [[linkNode, false]]
								}else{
									wrappedSourceNode.childNodeToLinkFlagListMap[wrappedChildNode.id].push([linkNode, false])
								}
							}
						})

				})


			});

			// Out degree
			self.__outDegree = self.children.length

			// Parent map
			self.__node.inConnections.forEach(function(linkNode){

				linkNode.sourceAncestorOrSelfAndChildOfLCA.forEach(function(parentNode){
					var wrappedParentNode = NodeWrapper.Node2WrapperDict[parentNode.id]

					// Is the parent ourselves in an evil self-loop situation?
					// If so skip self, we handled self case already in the child map
					if(self == wrappedParentNode) return

					// Could be more than one link between source and target
					if(self.parents.indexOf(wrappedParentNode) == -1){
						self.parents.push(wrappedParentNode)
						self.parentNodeToLinkFlagListMap[wrappedParentNode.id] = [[linkNode, false]]
					}
					else{
						self.parentNodeToLinkFlagListMap[wrappedParentNode.id].push([linkNode, false]);
					}
				});
			});
		}


		self.getOutDegree = function(){
			/* Number of children */
			return self.__outDegree
		}


		self.setVisited = function(){
			// Depth first search has visited here
			self.__visitedFlag = true
		}

		self.isVisited = function(){
			// Return the visited flag
			return self.__visitedFlag
		}

	//	def getChildrenWrappers(self):
	//		children = []
	//		for link in self.__node.outConnections:
	//			for childNode in link.outConnections:
	//				children.push(NodeWrapper.Node2WrapperDict[childNode])
	//		return children

		self.toString = function(){
			return self.getName()
		}

		self.getName = function(){
			if(self.__nodeType == NodeWrapper.MULTI_LAYER_EDGE){
				var linkNode = self.__node[0]
				var inConn = linkNode.inConnections[0]
				var outConn = linkNode.outConnections[0]
				var inWrappedNode = NodeWrapper.Node2WrapperDict[inConn.id]
				var outWrappedNode = NodeWrapper.Node2WrapperDict[outConn.id]
				return 'E_' + inWrappedNode.getName() + '_to_' + outWrappedNode.getName()
			}
			if(self.__node){
				return self.__node.id
			}
			else{
				return 'NO-NAME'
			}
		}

		self.moveTo = function(x, y, longEdgeOffset){
			if(self.__nodeType == NodeWrapper.REGULAR_NODE){
				self.__node.visualObject.moveTo(x, y);
			}
			else if(self.__nodeType == NodeWrapper.SELF_LOOP_EDGE){
				var bbox = self.__node.visualObject.getBBox();
				self.__edgePosition = [x + bbox.width  / 2, y]
			}
			else{
				self.__edgePosition = [x + longEdgeOffset[0], y + longEdgeOffset[1]]
			}
		}

		self.getEdgePosition = function(){
			return self.__edgePosition
		}

		self.setLayer = function(layer){
			self.__layer = layer
		}

		self.getLayer = function(){
			return self.__layer
		}

		self.setOrder = function(order){
			self.__order = order
		}

		self.getOrder = function(){
			return self.__order
		}

		self.computeBarycenter = function(isGoingDown){
			/*
			Implements the barycenter heuristic. Basic idea: if a node in layer A is
			connected to node1, node2, and node3 in layer B, then the node in layer
			A should be placed at the average of the positions (order integers) of the
			three nodes in layer B. This must be done from layer A to layer B and then
			from layer B to layer A many times to converge on a global solution.
			The isGoingDown parameter determines if we are moving from root layer to
			leaf layer (true), or from leaf layer to root layer (false)

			Implementation according to:
				http://etd.lib.fsu.edu/theses/available/etd-05062004-232310/unrestricted/Pitch_Patarasuk_Thesis.pdf
				CROSSING REDUCTION FOR LAYERED HIERARCHICAL GRAPH DRAWING
				By PITCH PATARASUK
			*/
			var nodeList;
			if(isGoingDown)
				nodeList = self.children
			else
				nodeList = self.parents

			numberOfNodes = nodeList.length;

			// No nodes in next layer? Just use the arbitrary original order value
			if(numberOfNodes == 0){
				self.__barycenterValue = self.__order
				return
			}

			// Calculate the barycenter
			var orderSum = 0
			nodeList.forEach(function(node){
				orderSum += node.__order
			});
			self.__barycenterValue = orderSum / numberOfNodes
		}

		self.getBarycenter = function(){
			// Retrieve the barycenter computed by computeBarycenter()
			return self.__barycenterValue
		}


		self.calculatePriority = function(){
			// Priority = Fan in + Fan out, and max level priority for dummies
			if(self.__nodeType == NodeWrapper.MULTI_LAYER_EDGE || self.__nodeType == NodeWrapper.SELF_LOOP_EDGE){
				self.__priority = 1000000 //sys.maxint
				return self.__priority
			}
			else{
				self.__priority = self.children.length + self.parents.length
				return self.__priority
			}
		}

		self.setPriority = function(priority){
			self.__priority = priority
		}

		self.getPriority = function(){
			return self.__priority
		}

		self.getASGNode = function(){
			return self.__node
		}

		self.setGridPosition = function(pos){
			self.__gridPosition = pos
		}

		self.getGridPosition = function(){
			return self.__gridPosition
		}

		self.getGridBarycenter = function(isGoingDown){
			var nodeList;
			if(isGoingDown)
				nodeList = self.children
			else
				nodeList = self.parents

			numberOfNodes = nodeList.length

			if(numberOfNodes == 0)
				return self.__gridPosition

			var orderSum = 0
			nodeList.forEach(function(node){
				orderSum += node.__gridPosition
			});
			return orderSum / numberOfNodes
		}

		//FIXME: need to add application logic here
		self.getSize = function(giveExtraSpaceForLinks){
			giveExtraSpaceForLinks = giveExtraSpaceForLinks || true;

			var toReturn;

			// Long edge traversing multiple layers
			var bbox;
			if(self.__nodeType == NodeWrapper.MULTI_LAYER_EDGE){
				var bboxes = self.__node.map(function(n){return n.visualObject.getBBox()});
				var maxSize = [Math.max.apply(this,bboxes.map(function(bbox){return bbox.width})),
						Math.max.apply(this,bboxes.map(function(bbox){return bbox.height}))]
				toReturn = maxSize;
			}

			// Check if single layer links have drawings that require additional space
			else if(giveExtraSpaceForLinks){
				var maxSingleLayerLinkHeight = 0

				function getMaxLinkHeight(linkFlagList, maxSingleLayerLinkHeight){
					return Math.max.apply(this,
						linkFlagList.map(function(l){
							return l[0].visualObject.getBBox().height
						}).concat(maxSingleLayerLinkHeight));
				}


				// Children
				self.children.forEach(function(wrappedChildNode){
					if(wrappedChildNode.__layer == self.__layer + 1)
						maxSingleLayerLinkHeight = getMaxLinkHeight( self.childNodeToLinkFlagListMap[wrappedChildNode.id], maxSingleLayerLinkHeight)
				});

				// Parents (for links going in reverse direction)
				self.parents.forEach(function(wrappedParentNode){
					if(wrappedParentNode.__layer == self.__layer - 1)
						maxSingleLayerLinkHeight = getMaxLinkHeight( self.parentNodeToLinkFlagListMap[wrappedParentNode.id], maxSingleLayerLinkHeight)
				});

				bbox = self.__node.visualObject.getBBox();
				toReturn = [bbox.width , bbox.height + maxSingleLayerLinkHeight]
			}else{
				bbox = self.__node.visualObject.getBBox();
				toReturn = [bbox.width, bbox.height]
			}
			return toReturn;
		}
	}
	NodeWrapper.REGULAR_NODE = 0
	NodeWrapper.MULTI_LAYER_EDGE = 1
	NodeWrapper.SELF_LOOP_EDGE = 2

	NodeWrapper.initilizeNodeWrapper = function(){
		//Utility method to reset the class attributes of NodeWrapper

		NodeWrapper.SelfLoopList = []
		NodeWrapper.Node2WrapperDict = {}
		NodeWrapper.ID2LayerEdgeDict = {}
		NodeWrapper.Source2TargetListMap = []
		NodeWrapper.idCounter = 0;
	}

	NodeWrapper.initilizeNodeWrapper();

	return NodeWrapper;

})
