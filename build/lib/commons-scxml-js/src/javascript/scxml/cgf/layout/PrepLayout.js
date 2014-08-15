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

require.def("src/javascript/scxml/cgf/layout/PrepLayout",
[
	"src/javascript/scxml/cgf/util/svg",
	"src/javascript/scxml/cgf/layout/graphics",
	"src/javascript/scxml/cgf/util/xpath" ],

function(commonSVG,graphics,xpath){


	//FIXME: this method is something that will need to be moved out as well, as we may use batik when running under Rhino
	var bootSVGDOM = require.isBrowser? 
				function(svgDoc,attachPointNode){
					attachPointNode = attachPointNode || document.body;

					if(attachPointNode instanceof Window){	
						attachPointNode.document.replaceChild(attachPointNode.document.importNode(svgDoc.documentElement,true), 
							attachPointNode.document.documentElement);
						return attachPointNode.document;
					} else{
						//assume Node

						//in order to use this SVG document, it needs to be rendered, so we append the contents to the current document,
						//which works well in the html context in Firefox
						var newDocumentElement = svgDoc.documentElement.cloneNode(true)
						attachPointNode.appendChild(newDocumentElement)
						return newDocumentElement.ownerDocument;
					}

					//console.log(newDocumentElement.getBBox)
					//console.log(newDocumentElement.getBBox())

				} :
				function(svgDoc){
					//FIXME: somewhat evil, assumes batik

					//copy svgDoc into SVGDOMImplementation
					var impl = org.apache.batik.dom.svg.SVGDOMImplementation.getDOMImplementation();
					var svgNS = org.apache.batik.dom.svg.SVGDOMImplementation.SVG_NAMESPACE_URI;
					var svgDoc2 = impl.createDocument(svgNS, "svg", null);
					svgDoc2.replaceChild(svgDoc2.importNode(svgDoc.documentElement,true), svgDoc2.documentElement);
					

					//boot SVG and CSS DOM: http://wiki.apache.org/xmlgraphics-batik/BootSvgAndCssDom
					var userAgent = new org.apache.batik.bridge.UserAgentAdapter();
					var loader    = new org.apache.batik.bridge.DocumentLoader(userAgent);
					var ctx       = new org.apache.batik.bridge.BridgeContext(userAgent, loader);
					ctx.setDynamicState(org.apache.batik.bridge.BridgeContext.DYNAMIC);
					var builder   = new org.apache.batik.bridge.GVTBuilder();
					var rootGN    = builder.build(ctx, svgDoc2);

					return svgDoc2;
				};


	var statesPredicate = "[self::s:state or self::s:parallel or self::s:final or self::s:initial or self::s:history]";

	function scxmlToEntityNodeListAndLinkList(scxmlDoc,svgDoc){
		//TODO: refactor all of this to be OO and use constructor functions and stuff
		var root = scxmlDoc.documentElement;
		var rootEntity = (function(scxmlNode){
			var stateId = scxmlNode.getAttributeNS(null,"id");
			var childrenIds = xpath.query("*" + statesPredicate + "/@id",scxmlNode).map(function(n){return n.nodeValue});

			return {
				id : stateId,
				outConnections : [],
				inConnections : [],
				parent : null,
				children : childrenIds,
				visualObject : new graphics.BoxedGraphEntity(svgDoc.getElementById(stateId))
			}
		})(root);

		function createStateEntity(s,graphicalClass){
			var stateId = s.getAttributeNS(null,"id");
			var outTransitionIds = xpath.query("s:transition/c:targets/c:target/@c:id",s).map(function(n){return n.nodeValue});;
			var inTransitionIds = xpath.query("//s:transition/c:targets/c:target[c:targetState/text()='" + stateId + "']/@c:id",
				scxmlDoc.documentElement).map(function(n){return n.nodeValue});
			var parentId = s.parentNode.getAttributeNS(null,"id");
			var childrenIds = xpath.query("*" + statesPredicate + "/@id",s).map(function(n){return n.nodeValue});

			return {
				id : stateId,
				outConnections : outTransitionIds,
				inConnections : inTransitionIds,
				parent : parentId,
				children : childrenIds,
				visualObject : new graphicalClass(svgDoc.getElementById(stateId))
			}
		}
		var states = xpath.query("//s:*[self::s:state or self::s:parallel]",scxmlDoc.documentElement);
		var stateEntityList = states.map(function(s){return createStateEntity(s,graphics.BoxedGraphEntity)})

		var initialFinalAndHistoryStateEntityList = xpath.query("//s:*[self::s:final or self::s:initial or self::s:history]",scxmlDoc.documentElement);
		var initialStateEntityList = initialFinalAndHistoryStateEntityList.map(function(s){return createStateEntity(s,graphics.GraphEntity)})

		var entityList = stateEntityList.concat(initialStateEntityList)


		var transitionTargets = xpath.query("//s:transition/c:targets/c:target",scxmlDoc.documentElement)
		var linkNodeList = transitionTargets.map(function(t){
			var transitionId = t.getAttributeNS(commonSVG.SCXML_JS_NS,"id");
			var originId = xpath.query("../../../@id",t)[0].nodeValue;
			var targetId = xpath.query("c:targetState",t)[0].textContent;

			//these attributes needed for hierarchical layout
			var sourceAncestorOrSelfAndChildOfLCAId = xpath.query("c:sourceAncestorOrSelfAndChildOfLCA",t)[0].textContent;
			var targetAncestorOrSelfAndChildOfLCAId = xpath.query("c:targetAncestorOrSelfAndChildOfLCA",t)[0].textContent;
			var lcaId = xpath.query("../../c:lca",t)[0].textContent;

			return {
				id : transitionId,
				outConnections : [targetId],
				inConnections : [originId],
				sourceAncestorOrSelfAndChildOfLCA : [sourceAncestorOrSelfAndChildOfLCAId],
				lca : lcaId,
				targetAncestorOrSelfAndChildOfLCA : [targetAncestorOrSelfAndChildOfLCAId],
				getClosestStartAndEndConnectionPoints : function(){
					//right now, only snap to first element of in and outConnections (no intelligent handling of hyperedges)
					var inGraphObject = this.inConnections[0].visualObject;
					var outGraphObject = this.outConnections[0].visualObject;

					return inGraphObject.getClosestConnectorToGraphicalObject(outGraphObject,this.visualObject);
				},
				visualObject : new graphics.GraphLink(svgDoc.getElementById(transitionId))
			}
		})

		var entityAndLinkList = entityList.concat(linkNodeList).concat(rootEntity);

		var getNodeFromId = function(cIdOrNode){
			return entityAndLinkList.filter(function(e){return cIdOrNode == e.id})[0] || cIdOrNode;

		}

		//now that all objects have been created, hook up references to other objects via in and out connections
		//it's OK to use a new list to do this, because we're operating on objects, which is like C pointer semantics
		entityAndLinkList.forEach(function(s){
			s.outConnections = s.outConnections.map(getNodeFromId);

			s.inConnections = s.inConnections.map(getNodeFromId);

			s.parent = s.parent && getNodeFromId(s.parent);

			s.children = s.children && s.children.map(getNodeFromId);

			if(s.sourceAncestorOrSelfAndChildOfLCA)
				s.sourceAncestorOrSelfAndChildOfLCA = s.sourceAncestorOrSelfAndChildOfLCA.map(getNodeFromId);

			if(s.targetAncestorOrSelfAndChildOfLCA)
				s.targetAncestorOrSelfAndChildOfLCA = s.targetAncestorOrSelfAndChildOfLCA.map(getNodeFromId);

			if(s.lca)
				s.lca = getNodeFromId(s.lca)

		});

		return {rootEntity : rootEntity, entityList : entityList, linkNodeList : linkNodeList};
	}


/*
	function addGraphicalNodeReference(graphNodeList,svgDoc,graphicalClass){
		//mapped based on id
		graphNodeList.forEach(function(e){
			e.visualObject = new graphicalClass(svgDoc.getElementById(e.id));
		});
	}
	*/


	return {
		scxmlToEntityNodeListAndLinkList : scxmlToEntityNodeListAndLinkList,
		bootSVGDOM : bootSVGDOM
	}
})
