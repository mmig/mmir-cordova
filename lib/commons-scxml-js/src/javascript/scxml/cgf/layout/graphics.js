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
require.def("src/javascript/scxml/cgf/layout/graphics",
["src/javascript/scxml/cgf/util/svg",
	"src/javascript/scxml/cgf/util/geometry",
	"src/javascript/scxml/cgf/util/xpath" ],
function(commonSVG,geometry,xpath){

	//constructor functions
	function VisualObject(rootNode){
		//a visual object. wraps a raw SVG node. also, exposes connection points

		this._rawNode = rootNode; //rawNode
		this._connectionPoints = _getConnectionPointsFromSVGNode(rootNode) //connection points

		function _getConnectionPointsFromSVGNode(node){
			return xpath.query("svg:*[@class='connectionPoint']",node);
		}

		this.getBBox = function(){
			return this._rawNode.getBBox();
		}

		this.getBBoxInCanvasSpace = function(){
			return commonSVG.getBBoxInCanvasSpace(this._rawNode);
		}

		this.getBBoxInEntitySpace = function(e){
			return commonSVG.getBBoxInElementSpace(this._rawNode,e._rawNode);
		}

		this.moveTo = function(x,y){
			var bbox = this._rawNode.getBBox();
			var curX = bbox.x, curY = bbox.y;
			var dx = x - curX;
			var dy = y - curY; 
			return this.move(dx,dy);
		}

		this.getClosestConnectorToPoint = function(fx, fy, contextVisualObj){
			/*
			 Returns the connector (cx, cy) of visualObject which makes minimum 
			 the distance to (fx, fy)
			*/									
			return this._connectionPoints.reduce(function(o,c){
				//compute distance from given point to connector
				var bbox = commonSVG.getBBoxInElementSpace(c,contextVisualObj._rawNode);
				var newDistance = geometry.distance(bbox.x,bbox.y,fx,fy);

				return o.distance < newDistance ?  o : {distance:newDistance,connector:bbox};
			},{distance:Number.MAX_VALUE,connector:{x:0,y:0}});
		}

		this.getClosestConnectorToGraphicalObject = function(graphicalObject,contextVisualObj){
			/*
				for each connection point A on this object
					find the closest connection point B on a given graphicalObject
			*/
			return this._connectionPoints.reduce(function(o,c){
				//compute distance from given point to connector
				var bbox = commonSVG.getBBoxInElementSpace(c,contextVisualObj._rawNode);
				var connPtInfo = graphicalObject.getClosestConnectorToPoint(bbox.x,bbox.y,contextVisualObj);

				return o.distance < connPtInfo.distance ?  
					o : 
					{distance:connPtInfo.distance,fromConnector:bbox,toConnector:connPtInfo.connector};
			},{distance:Number.MAX_VALUE,fromConnector:{x:0,y:0},toConnector:{x:0,y:0}});
		}

		this.setCanvasViewBox = function(r){
			var svg = this._rawNode.ownerSVGElement;
			svg.viewBox.baseVal.x = r.x;
			svg.viewBox.baseVal.y = r.y;
			svg.viewBox.baseVal.width = r.width;
			svg.viewBox.baseVal.height = r.height;
		}
	}

	function GraphEntity(rootNode){
		//wraps a graph node

		VisualObject.apply(this,arguments);

		//Move method
		this.move = function(dx,dy){
			return commonSVG.translate(this._rawNode,dx,dy);
		}
	}

	function BoxedGraphEntity(rootNode){
		GraphEntity.apply(this,arguments);

		this._boundingBoxRectElement = _getBBoxRectElement(rootNode);
		this._boundingBoxLabelElement = _getBBoxLabelElement(rootNode);

		function _getBBoxRectElement(node){
			return xpath.query("svg:*[@class='groupBoundingRect']",node)[0];
		}

		function _getBBoxLabelElement(node){
			return xpath.query("svg:text[@class='label']",node)[0];
		}

		this.resizeBBoxElement = function(newBBox){
			//update connection points
			var dx = newBBox.x - this._boundingBoxRectElement.x.baseVal.value,
				dy = newBBox.y - this._boundingBoxRectElement.y.baseVal.value,
				sx = newBBox.width / this._boundingBoxRectElement.width.baseVal.value,
				sy = newBBox.height / this._boundingBoxRectElement.height.baseVal.value;

			this._connectionPoints.forEach(function(pt){
				pt.cx.baseVal.value *= sx;
				pt.cy.baseVal.value *= sy;
				pt.cx.baseVal.value += dx;
				pt.cy.baseVal.value += dy;
			})

			//resize bbox
			this._boundingBoxRectElement.width.baseVal.value = newBBox.width;
			this._boundingBoxRectElement.height.baseVal.value = newBBox.height;
			this._boundingBoxRectElement.x.baseVal.value = newBBox.x;
			this._boundingBoxRectElement.y.baseVal.value = newBBox.y;

			return newBBox;
		}

		this.moveLabelElementTo = function(x,y){
			//update label
			if(this._boundingBoxLabelElement){
				this._boundingBoxLabelElement.x.baseVal.getItem(0).value = x;
				this._boundingBoxLabelElement.y.baseVal.getItem(0).value = y;
			}
		}

		this.resizeBBoxElementAndUpdateLabel = function(bbox,options){
			options = options || {
				labelPadding : 3
			}

			this.resizeBBoxElement(bbox);
			this.moveLabelElementTo(bbox.x,bbox.y - options.labelPadding);
		}
	}

	function GraphLink(rootNode){
		//wraps a quadratic bezier curve, which has a (possibly empty) label

		VisualObject.apply(this,arguments);

		//label node
		this._labelNode = _getLabelNodeFromSVGNode(rootNode);
		this._pathNode = _getPathNodeFromSVGNode(rootNode);
		this._startPoint = this._pathNode.pathSegList.getItem(0);
		this._controlPoint = this._pathNode.pathSegList.getItem(1);

		function _getLabelNodeFromSVGNode(node){
			return xpath.query("svg:text[@class='label']",node)[0];
		}

		function _getPathNodeFromSVGNode(node){
			return xpath.query("svg:path[@class='edge']",node)[0];
		}

		//Move method
		this.move = function(dx,dy){
			//move the control point?
			this._controlPoint.x1 += dx
			this._controlPoint.y1 += dy

			//move the label
			return commonSVG.translate(this._labelNode,dx,dy);
		}


		this.moveLabelTo = function(x,y){
			var bbox = this._labelNode.getBBox();
			var curX = bbox.x, curY = bbox.y;
			var dx = x - curX;
			var dy = y - curY;
			return commonSVG.translate(this._labelNode,dx,dy);
		}

		//methods to adjust start, end and control point
		this.setStartPoint = function(pt){
			this._startPoint.x = pt.x
			this._startPoint.y = pt.y
		}

		this.setControlPoint = function(pt){
			this._controlPoint.x1 = pt.x
			this._controlPoint.y1 = pt.y
		}

		this.setEndpoint = function(pt){
			this._controlPoint.x = pt.x
			this._controlPoint.y = pt.y
		}

		this.setCoords = function(coordsObj){
			this.setStartPoint(coordsObj.startPoint);
			if(coordsObj.controlPoint) this.setControlPoint(coordsObj.controlPoint);
			this.setEndpoint(coordsObj.endPoint);
		}

		this.getCenterCoord = function(){
			return this._labelNode.getBBox() || {x:0,y:0}; //batik will return null if the element has no size
		}
	}

	return {
		GraphLink : GraphLink,
		GraphEntity : GraphEntity,
		BoxedGraphEntity : BoxedGraphEntity
	}

});
