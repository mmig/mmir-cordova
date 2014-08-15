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
require.def("src/javascript/scxml/cgf/layout/shrinkwrapLayout",
function(){
	function shrinkwrapBoundingBoxGraphEntity(boundingBoxGraphEntity,options){

		options = options || {
			bboxPadding : 10,
			labelPadding : 3
		}

		//get the aggregate of the bounding boxes of his children, or if he has no hier children, get his own bbox
		var newBBox;
		if(boundingBoxGraphEntity.children.length){
			var bboxes = boundingBoxGraphEntity.children.map(function(e){
				return e.visualObject.getBBoxInEntitySpace(boundingBoxGraphEntity.visualObject);
			});

			var newBBoxX0 = Math.min.apply(this,bboxes.map(function(bbox){ return bbox.x }))
			var newBBoxY0 = Math.min.apply(this,bboxes.map(function(bbox){ return bbox.y }))
			var newBBoxX1 = Math.max.apply(this,bboxes.map(function(bbox){return bbox.x+bbox.width}))
			var newBBoxY1 = Math.max.apply(this,bboxes.map(function(bbox){ return bbox.y+bbox.height}))

			//apply padding option
			newBBoxX0 -= options.bboxPadding;
			newBBoxY0 -= options.bboxPadding;
			newBBoxX1 += options.bboxPadding;
			newBBoxY1 += options.bboxPadding;

			var newBBoxWidth = newBBoxX1 - newBBoxX0
			var newBBoxHeight = newBBoxY1 - newBBoxY0

			newBBox = {
				x : newBBoxX0,
				y : newBBoxY0,
				width : newBBoxWidth,
				height : newBBoxHeight
			};

			boundingBoxGraphEntity.visualObject.resizeBBoxElementAndUpdateLabel(newBBox);
		}else{
			newBBox = boundingBoxGraphEntity.visualObject.getBBox();
			boundingBoxGraphEntity.visualObject.resizeBBoxElement(newBBox,options);
		}

	}

	function recursivelyApplyShrinkwrapLayout(boundingBoxGraphEntity,options){
		boundingBoxGraphEntity.children.filter(function(c){return c.visualObject.resizeBBoxElement})
			.forEach(function(c){recursivelyApplyShrinkwrapLayout(c,options)});
		shrinkwrapBoundingBoxGraphEntity(boundingBoxGraphEntity,options);
	}

	return {
		recursivelyApplyShrinkwrapLayout : recursivelyApplyShrinkwrapLayout
	}
})
