<?xml version="1.0"?>
<!--
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
-->
<stylesheet xmlns="http://www.w3.org/1999/XSL/Transform" 
	xmlns:s="http://www.w3.org/2005/07/scxml"
	xmlns:c="http://commons.apache.org/scxml-js"
	version="1.0">

	<import href="AbstractEnumeratedStatechartGenerator.xsl"/>

	<c:enabledConditionalDependencyProperties>
		<c:enabledConditionalDependencyProperty name="flatten-transitions"/>
	</c:enabledConditionalDependencyProperties>

	<c:dependencies>
		<c:dependency path="ir-compiler/addDefaultTransitionToHistoryStates.xsl"/>
		<c:dependency path="ir-compiler/splitTransitionTargets.xsl"/>
		<c:dependency path="ir-compiler/addNearestParallelDescendantOfLCAToTransition.xsl"/>
		<c:dependency path="ir-compiler/addEventRegularExpressions.xsl"/>
		<c:dependency path="ir-compiler/appendBasicStateInformation.xsl"/>
		<c:dependency path="ir-compiler/appendStateInformation.xsl"/>
		<c:dependency path="ir-compiler/appendTransitionInformation.xsl"/>
		<c:dependency path="ir-compiler/changeTransitionsPointingToCompoundStatesToPointToInitialStates.xsl"/>
		<c:dependency path="ir-compiler/computeLCA.xsl"/>
		<c:dependency path="ir-compiler/copyEnumeratedEventTransitions.xsl"/>
		<c:dependency path="ir-compiler/enumerateEvents.xsl"/>
		<c:dependency path="ir-compiler/expandStarEvent.xsl"/>
		<c:dependency path="ir-compiler/flattenTransitions.xsl"/>
		<c:dependency path="ir-compiler/generateUniqueInitialStateIds.xsl"/>
		<c:dependency path="ir-compiler/generateUniqueStateIds.xsl"/>
		<c:dependency path="ir-compiler/nameTransitions.xsl"/>
		<c:dependency path="ir-compiler/normalizeInitialStates.xsl"/>
		<c:dependency path="ir-compiler/numberStatesAndTransitions.xsl"/>
		<c:dependency path="ir-compiler/splitTransitionTargets.xsl"/>
		<c:dependency path="ir-compiler/transformIf.xsl"/>
		<c:dependency path="layout/addTransitionTargetIds.xsl"/>
	</c:dependencies>

	<variable name="enumeratedEventDispatchInvocation" select="'dispatch(state,e)'"/>

	<template name="genEnumeratedHooks">
			//state transition table
			<call-template name="genSwitchyard">
				<with-param name="basicStates" select="$basicStates"/>
			</call-template>
	</template>

	<template name="genSwitchyard">
		<param name="basicStates"/>
	
		function dispatch(state,e){
			switch(state) {
				<for-each select="$basicStates">
					<call-template name="genStateCase">
						<with-param name="s" select="."/>
					</call-template>
				</for-each>
			}
		}
		
	</template>

	<template name="genStateCase">
		<param name="s"/>

		case <value-of select="$s/@c:enumId"/>:
			switch(e) {
				<for-each select="$s/c:enumeratedEventTransitions/c:enumeratedTransition">
					<call-template name="genEventCase">
						<with-param name="t" select="."/>
					</call-template>
				</for-each>
			}
			break;
	</template>

	<template name="genEventCase">
		<param name="t"/>

		<variable name="eventName">
			<choose>
				<when test="$t/@event">
					<value-of select="$t/@event"/>
				</when>
				<otherwise>
					<value-of select="'$default'"/>
				</otherwise>
			</choose>
		</variable>

		case <value-of select="$eventName"/>:
			return <value-of select="$t/@c:tName"/>();
	</template>

</stylesheet>




