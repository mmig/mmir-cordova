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

	<import href="AbstractStatechartGenerator.xsl"/>

	<c:dependencies>
		<c:dependency path="ir-compiler/addDefaultTransitionToHistoryStates.xsl"/>
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
		<c:dependency path="ir-compiler/generateUniqueInitialStateIds.xsl"/>
		<c:dependency path="ir-compiler/generateUniqueStateIds.xsl"/>
		<c:dependency path="ir-compiler/normalizeInitialStates.xsl"/>
		<c:dependency path="ir-compiler/splitTransitionTargets.xsl"/>
		<c:dependency path="ir-compiler/transformIf.xsl"/>
		<c:dependency path="layout/addTransitionTargetIds.xsl"/>
	</c:dependencies>

	<!-- TODO: refactor name of enumeratedEventDispatchInvocation variable. it is no longer an invocation -->
	<variable name="enumeratedEventDispatchInvocation" select="'state[e]();'"/>
	<variable name="prefixEventDispatchInvocation" select="'state.$dispatchPrefixEvent(e)'"/>
	<variable name="defaultEventLiteral" select="'&quot;$default&quot;'"/>
	<variable name="currentConfigurationExpression" select="'var currentConfigurationExpression = currentConfiguration.slice();'"/>
	<variable name="inPredicateFunctionStateReference" select="'state'"/>
	<variable name="inPredicateFunctionStateIdReference" select="'s'"/>

	<variable name="genHistoryTriggerDispatcherCurrentConfigurationAssignmentRHS" select="'var historyTriggerDispatcherCurrentConfigurationAssignmentRHS = newConfiguration;'"/>
	<variable name="genHistoryTriggerDispatcherInnerForEachStateReference" select="'state'"/>
	<variable name="genNonBasicTriggerDispatcherExitBlockIteratorExpression" select="'var nonBasicTriggerDispatcherExitBlockIteratorExpression = currentConfiguration;'"/>

	<variable name="eventToNameMap" select="'e'"/>

	<template name="genStateHooks">
		<param name="state"/>

		<!-- iterate through groups of transitions, grouped by event -->
		<!--FIXME: this is likely to be a bit slow, as we're iterating through all events -->
		<for-each select="$enumeratedEventsEnum/c:name">
			<variable name="eventName">
				<value-of select="."/>
			</variable>

			<variable name="transitionsForEvent" select="$state/c:enumeratedEventTransitions/c:enumeratedTransition[@event = $eventName]"/>
			<if test="$transitionsForEvent">
				<call-template name="genTriggerDispatcherContext">
					<with-param name="s" select="$state"/>
					<with-param name="transitions" select="$transitionsForEvent"/>
					<with-param name="eventName" select="$eventName"/>
				</call-template>
			</if>
		</for-each>

		<!-- now do default transitions -->
		<variable name="defaultTransitionsForState" select="$state/c:enumeratedEventTransitions/c:enumeratedTransition[not(@event)]"/>
		<if test="$defaultTransitionsForState">
			<call-template name="genTriggerDispatcherContext">
				<with-param name="s" select="$state"/>
				<with-param name="transitions" select="$defaultTransitionsForState"/>
				<with-param name="eventName" select="'$default'"/>
			</call-template>
		</if>

		<!-- now do prefix event handler -->
		<!-- TODO: consolidate all of these references to dispatchPrefixEvent into a global variable -->
		this.$dispatchPrefixEvent = function(e){
			<!-- we skip default events, as these will always be enumerated, hence will never end up in this region -->
			<for-each select="$state/s:transition[@event]">
				<!-- look up regexp name -->
				<variable name="eventName" select="@event"/>
				<variable name="regexpName" select="$allEventsEnum[c:name/text() = $eventName]/c:regexp/c:name"/>
				
				if(e.match(<value-of select="$regexpName"/>)){
					<call-template name="genTriggerDispatcherContents">
						<with-param name="s" select="$state"/>
						<with-param name="transitions" select="."/>
						<with-param name="eventName" select="$eventName"/>
					</call-template>
				}
			</for-each>

			<variable name="parentName">
				<call-template name="getParentNameFromState">
					<with-param name="s" select="$state"/>
				</call-template>
			</variable>	

			return <value-of select="$parentName"/>.$dispatchPrefixEvent(e);
		}
		
	</template>

	<template name="genParallelSubstateAndCompositeConfigurationSetString">
		<param name="s"/>
		<param name="t"/>

		currentConfiguration.splice(
			<call-template name="genIndexOf">
				<with-param name="in" select="'currentConfiguration'"/>
				<with-param name="var" select="'statesExited[0]'"/>
			</call-template>
			,1,
			<for-each select="$t/c:targets/c:target/c:targetState">
				<value-of select="."/>
				<if test="not(position() = last())">,</if>
			</for-each> 
		); 
	</template>

	<template name="genParallelSubstateConfigurationSetString">
		<param name="s"/>
		<param name="t"/>

		currentConfiguration.splice(
			<call-template name="genIndexOf">
				<with-param name="in" select="'currentConfiguration'"/>
				<with-param name="var" select="$s/@id"/>
			</call-template>
			,1,
			<for-each select="$t/c:targets/c:target/c:targetState">
				<value-of select="."/>
				<if test="not(position() = last())">,</if>
			</for-each> 
		); 
	</template>

	<template name="genNonParallelSubstateConfigurationSetString">
		<param name="t"/>
		<param name="s"/>

		currentConfiguration = [
			<for-each select="$t/c:targets/c:target/c:targetState">
				<value-of select="."/>
				<if test="not(position() = last())">,</if>
			</for-each>
		]; 
	</template>

	<template name="genInitialization">

		<variable name="initialStateName">
			<value-of select="/s:scxml/s:initial/s:transition/c:targets/c:target/c:targetState"/>
		</variable>
 
		this.initialize = function(){
			currentConfiguration = [<value-of select="$initialStateName"/>];
			runToCompletion();
			mainLoop();
		}

	</template>

	<template name="genTriggerDispatcherContext">
		<param name="s"/>
		<param name="transitions"/>
		<param name="eventName"/>

		this.<value-of select="$eventName"/> = function(){

			<call-template name="genTriggerDispatcherContents">
				<with-param name="s" select="$s"/>
				<with-param name="transitions" select="$transitions"/>
				<with-param name="eventName" select="$eventName"/>
			</call-template>

			<!-- if by this point he hasn't returned, then none of the transitions passed, 
				and we need to pass the transition up the hierarchy chain -->
			<variable name="parentName">
				<call-template name="getParentNameFromState">
					<with-param name="s" select="$s"/>
				</call-template>
			</variable>	

			return <value-of select="$parentName"/>['<value-of select="$eventName"/>']();
		}
	</template>

	<!-- FIXME: this can now be taken out/consolidated, as it no longer needds to be parameterized -->
	<template name="genHistoryTriggerDispatcherHistoryStateReference">
		<param name="s"/>

		<value-of select="$s/@id"/>
	</template> 

	<template name="genExternalTriggerDispatcherRunToCompletionEventValue">
		<param name="eventName"/>

		"<value-of select="$eventName"/>"
	</template>

	<template name="genStateRefIdentifier">
		<param name="s"/>
		<value-of select="$s/@id"/>
	</template>

</stylesheet>
