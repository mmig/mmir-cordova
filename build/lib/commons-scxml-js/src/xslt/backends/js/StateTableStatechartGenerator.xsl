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

	<variable name="enumeratedEventDispatchInvocation" select="'STATE_TRANSITION_TABLE[state][e]();'"/>

	<variable name="nullTransitionFunctionName" select="'$nt'"/>

	<template name="genEnumeratedHooks">
		var <value-of select="$nullTransitionFunctionName"/> = function(){};	//null transition

		//state transition table
		<call-template name="genStateTransitionTable"/>
	</template>

	<!-- foreach basicState in set of basic states sorted by stateNum
		find default (eventless) transitions for that state 
		foreach event in set of events sorted by event id
			find transition that originates at that state and has that event -->

	<template name="genStateTransitionTable">
		<text>var STATE_TRANSITION_TABLE = [ </text>

			<for-each select="$basicStates">
				<sort select="@c:stateNum" data-type="number"/>

				<variable name="currentState" select="."/>
			
				<!-- get the default transitions for this state -->

				<text>[</text>

					<for-each select="$enumeratedEventsEnum">
						<sort select="c:id" data-type="number"/>	

						<variable name="currentEvent" select="."/>
					
						<variable name="isDefaultTransition" select="$currentEvent/c:name = '$default'"/>

						<!--get the corresponding transition-->
						<!-- conditionally instantiating this variable to a node-set.
							hacky syntax, see http://dpawson.co.uk/xsl/sect2/N8090.html#d10871e1456 -->
						<variable name="correspondingTransitions" 
							select="$currentState/c:enumeratedEventTransitions/c:enumeratedTransition[$isDefaultTransition][not(@event)] | 
								$currentState/c:enumeratedEventTransitions/c:enumeratedTransition[not($isDefaultTransition)][@event = $currentEvent/c:name]"/>

						<!--
						<message>
							state: <value-of select="$currentState/@id"/>
							stateNum: <value-of select="$currentState/@c:stateNum"/>
							event: <value-of select="$currentEvent/c:name"/>
							eventId: <value-of select="$currentEvent/c:id"/>
							transitions to: <value-of select="$correspondingTransitions/@target"/>
						</message>
						-->

						<choose>
							<when test="$correspondingTransitions">
								<value-of select="$correspondingTransitions[1]/@c:tName"/>
							</when>
							<otherwise>
								<value-of select="$nullTransitionFunctionName"/>
							</otherwise>
						</choose>

						<if test="not(position() = last())">
							<text>,</text>
						</if>
					</for-each>
				<text>]</text>
				<if test="not(position() = last())">
					<text>,&#10;</text>
				</if>
			</for-each>
			<text>]</text>
	</template>

</stylesheet>



