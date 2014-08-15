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
This module provides a convenient front-end to one or more layout algorithms.
*/
require.def("src/javascript/scxml/cgf/layout",
[
	"xml!src/xslt/ir-compiler/generateUniqueStateIds.xsl",
	"xml!src/xslt/ir-compiler/generateUniqueInitialStateIds.xsl",
	"xml!src/xslt/ir-compiler/normalizeInitialStates.xsl",
	"xml!src/xslt/ir-compiler/nameTransitions.xsl",
	"xml!src/xslt/ir-compiler/splitTransitionTargets.xsl",
	"xml!src/xslt/ir-compiler/computeLCA.xsl",
	"xml!src/xslt/layout/computeAncestorOrSelfAndChildOfLCA.xsl",
	"xml!src/xslt/layout/addTransitionTargetIds.xsl",
	"xml!src/xslt/layout/scxmlToSVG.xsl",
	"src/javascript/scxml/cgf/layout/PrepLayout",
	"src/javascript/scxml/cgf/layout/hierarchical/NodeWrapper",
	"src/javascript/scxml/cgf/layout/hierarchical/HierarchicalLayout",
	"src/javascript/scxml/cgf/layout/shrinkwrapLayout",
	"src/javascript/scxml/cgf/layout/LinkOptimizer"],

function(
		nameTransitions,generateUniqueStateIds,generateUniqueInitialStateIds,normalizeInitialStates,
			splitTransitionTargets,computeLCA,computeAncestorOrSelfAndChildOfLCA,addTransitionTargetIds,
		scxmlToSvgXsl,
		PrepLayout,NodeWrapper,HierarchicalLayout,shrinkwrapLayout,
		LinkOptimizer){

	return {
		applyHierarchicalLayout : function(transformer,scxmlDoc,options,domAttachPoint){
			var ir = transformer(scxmlDoc,
				[generateUniqueStateIds,normalizeInitialStates,generateUniqueInitialStateIds,
					nameTransitions,splitTransitionTargets,computeLCA,
					computeAncestorOrSelfAndChildOfLCA,addTransitionTargetIds
				],
				null,"xml");  //transform to IR

			var svgDoc = transformer(ir,[scxmlToSvgXsl],null,"xml");	//transform scxml to non-laid out, svg graphical representation

			//console.dirxml(ir);
			svgDoc = PrepLayout.bootSVGDOM(svgDoc,domAttachPoint);

			var lists = PrepLayout.scxmlToEntityNodeListAndLinkList(ir,svgDoc);
			var rootEntity = lists.rootEntity, 
				entityNodeList = lists.entityList,
				linkNodeList = lists.linkNodeList;

			//perform a preorder traversal
			//lay out all composites
			//for each composite node, do hierarchical layout, followed by shrinkwrap layout of all children
			//FIXME: we really need to know root nodes for this to be effective...
			//TODO: try applying force-based layout as well...
			//HierarchicalLayout.hierarchicalLayout(entityNodeList,linkNodeList);

			// Initilize the node wrapper class attributes
			//TODO: move this into hier layout
			NodeWrapper.initilizeNodeWrapper()
			HierarchicalLayout.recursivelyApplyHierarchicalLayout(rootEntity,
				{heuristic : (options && options.heuristic) || HierarchicalLayout.HEURISTICS_ENUM.LONGEST_PATH_LAYERING_BOTTOM_UP })

			//shrinkwrap layout
			console.log("Recursively applying shrinkwrap layout")
			shrinkwrapLayout.recursivelyApplyShrinkwrapLayout(rootEntity)

			//optimize links again
			//linkNodeList.forEach(LinkOptimizer.optimizeConnectionPorts)
			LinkOptimizer.optimizeLinks(linkNodeList);

			//recentering push
			console.log("Recentering")
			rootEntity.visualObject.moveTo(0,0);

			//adjust canvas viewbox
			rootEntity.visualObject.setCanvasViewBox(rootEntity.visualObject.getBBoxInCanvasSpace());

			return {
				svgDoc:svgDoc, 
				linkNodeList:linkNodeList, 
				entityNodeList:entityNodeList
			};
		}
	}
});
