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

	<variable name="defaultEventLiteral" select="'$default'"/>
	<variable name="inPredicateFunctionStateReference" select="'state.id'"/>
	<variable name="inPredicateFunctionStateIdReference" select="'STATE_INT_ID_TO_OBJECT_MAP[s]'"/>

	
	<variable name="genHistoryTriggerDispatcherInnerForEachStateReference"
		select="'STATE_INT_ID_TO_OBJECT_MAP[state]'"/>

	<variable name="eventToNameMap" select="'TRIGGER_ID_TO_NAME_MAP[e]'"/>
	<variable name="prefixEventDispatchInvocation" select="'$dispatchPrefixEvent(state,e)'"/>


	<variable name="currentConfigurationExpression">
		<call-template name="genMap">
			<with-param name="returnArrayVarName" select="'currentConfigurationExpression'"/>
			<with-param name="var" select="'s'"/>
			<with-param name="in" select="'currentConfiguration'"/>
			<with-param name="expr" select="'STATE_INT_ID_TO_OBJECT_MAP[s]'"/>
		</call-template>
	</variable>

	<variable name="genHistoryTriggerDispatcherCurrentConfigurationAssignmentRHS">
		<call-template name="genMap">
			<with-param name="returnArrayVarName" select="'historyTriggerDispatcherCurrentConfigurationAssignmentRHS'"/>
			<with-param name="var" select="'sObj'"/>
			<with-param name="in" select="'newConfiguration'"/>
			<with-param name="expr" select="'sObj.id'"/>
		</call-template>
	</variable>

	<variable name="genNonBasicTriggerDispatcherExitBlockIteratorExpression">
		<call-template name="genMap">
			<with-param name="returnArrayVarName" select="'nonBasicTriggerDispatcherExitBlockIteratorExpression'"/>
			<with-param name="var" select="'state'"/>
			<with-param name="in" select="'currentConfiguration'"/>
			<with-param name="expr" select="'STATE_INT_ID_TO_OBJECT_MAP[state]'"/>
		</call-template>
	</variable>


	<template name="genContextHooks">
		//enumeration of states int id's
		<for-each select="$basicStates">
			var <value-of select="@c:enumId"/> = <value-of select="@c:stateNum - 1"/>;
		</for-each>

		//map from states int id's to objects
		var STATE_INT_ID_TO_OBJECT_MAP = [
		<for-each select="$basicStates">
			<value-of select="@id"/> <if test="not(position() = last())"> , </if>
		</for-each> ];

		//tag each state object with an int id to map from object to id
		//only needed for history
		<for-each select="$basicStates">
			<value-of select="@id"/>.id = <value-of select="@c:stateNum - 1"/>;
		</for-each>

		//enumeration of triggers
		<for-each select="$enumeratedEventsEnum">
			var <value-of select="c:name"/> = <value-of select="c:id"/>;
		</for-each>

		//expose them as a convenient interface as part of the API
		<call-template name="genTriggerExternalObject"/>

		//needed for debugging
		<call-template name="genTriggerIdToNameMap"/>

		//transition functions
		<call-template name="genTriggerHandlerFunctions"/>

		<call-template name="genPrefixDispatchHandlerFunction"/>

		<call-template name="genEnumeratedHooks"/>

	</template>

	<template name="genPrefixDispatchHandlerFunction">
		<!-- this is quite similar in form and function to 
			the work done in SwitchyardStatechartGenerator.xsl -->
			<call-template name="genPrefixDispatchHandlerSwitchyard">
				<with-param name="basicStates" select="$basicStates"/>
			</call-template>
	</template>


	<template name="genPrefixDispatchHandlerSwitchyard">
		<param name="basicStates"/>
	
		function $dispatchPrefixEvent(state,e){
			switch(state) {
				<for-each select="$basicStates[s:transition[@event]]">
					<call-template name="genPrefixDispatchHandlerStateCase">
						<with-param name="s" select="."/>
					</call-template>
				</for-each>
			}
		}
		
	</template>

	<template name="genPrefixDispatchHandlerStateCase">
		<param name="s"/>

		case <value-of select="$s/@c:enumId"/>:

			<for-each select="$s/s:transition[@event]">
				<!-- look up regexp name -->
				<variable name="eventName" select="@event"/>
				<variable name="regexpName" select="$allEventsEnum[c:name/text() = $eventName]/c:regexp/c:name"/>
				
				if(e.match(<value-of select="$regexpName"/>)
					<if test="@cond">
						&amp;&amp; (<value-of select="@cond"/>)
					</if>){

					return <value-of select="@c:tName"/>();
				}
			</for-each>
			break;
	</template>

	<template name="genTriggerExternalObject"> 
			this.TRIGGERS = { 
				<for-each select="$enumeratedEventsEnum">
					<value-of select="c:name"/> : <value-of select="c:name"/>
					<if test="not(position() = last())"> , </if>
				</for-each>
			};
	</template>


	<template name="genTriggerIdToNameMap">
		var TRIGGER_ID_TO_NAME_MAP = [
			<for-each select="$enumeratedEventsEnum">
				'<value-of select="c:name"/>' 
				<if test="not(position() = last())"> , </if>
			</for-each>
		];
	</template>

	<template name="genTriggerHandlerFunctions">

		<for-each select="$basicStates">

			<variable name="state" select="."/>

			<for-each select="$allEventsEnum/c:name">
				<variable name="eventName">
					<value-of select="."/>
				</variable>

				<variable name="transitionsForEvent" select="$state/s:transition[@event = $eventName]"/>

				<if test="$transitionsForEvent">
					<call-template name="genTriggerDispatcherContext">
						<with-param name="s" select="$state"/>
						<with-param name="transitions" select="$transitionsForEvent"/>
						<with-param name="eventName" select="$eventName"/>
					</call-template>
				</if>
			</for-each>

			<!-- now do default transitions -->
			<variable name="defaultTransitionsForState" select="$state/s:transition[not(@event)]"/>
			<if test="$defaultTransitionsForState">
				<call-template name="genTriggerDispatcherContext">
					<with-param name="s" select="$state"/>
					<with-param name="transitions" select="$defaultTransitionsForState"/>
					<with-param name="eventName" select="'$default'"/>
				</call-template>
			</if>

		</for-each>
	</template>

	<template name="genTriggerDispatcherContext">
		<param name="s"/>
		<param name="transitions"/>
		<param name="eventName"/>

		var <value-of select="$transitions[1]/@c:tName"/> = function(){
			<call-template name="genTriggerDispatcherContents">
				<with-param name="s" select="$s"/>
				<with-param name="transitions" select="$transitions"/>
				<with-param name="eventName" select="$eventName"/>
			</call-template>
		}
	</template>

	<template name="genNonParallelSubstateConfigurationSetString">
		<param name="t"/>

		currentConfiguration = [
			<for-each select="$t/c:targets/c:target/c:targetState">
				<variable name="targetStateId" select="."/>
				<value-of select="$allStates[@id = $targetStateId]/@c:enumId"/>

				<if test="not(position() = last())"> , </if>
			</for-each>
		]; 
	</template>

	<template name="genParallelSubstateAndCompositeConfigurationSetString">
		<param name="s"/>
		<param name="t"/>

		currentConfiguration.splice(
			<call-template name="genIndexOf">
				<with-param name="in" select="'currentConfiguration'"/>
				<with-param name="var" select="'statesExited[0].id'"/>
			</call-template>
			,1,
			<for-each select="$t/c:targets/c:target/c:targetState">
				<variable name="targetStateId" select="."/>
				<value-of select="$allStates[@id = $targetStateId]/@c:enumId"/>

				<if test="not(position() = last())"> , </if>
			</for-each>);
		
	</template>


	<template name="genParallelSubstateConfigurationSetString">
		<param name="s"/>
		<param name="t"/>

		currentConfiguration.splice(
			<call-template name="genIndexOf">
				<with-param name="in" select="'currentConfiguration'"/>
				<with-param name="var" select="$s/@c:enumId"/>
			</call-template>
			,1,
			<for-each select="$t/c:targets/c:target/c:targetState">
				<variable name="targetStateId" select="."/>
				<value-of select="$allStates[@id = $targetStateId]/@c:enumId"/>

				<if test="not(position() = last())"> , </if>
			</for-each>);
	</template>

	<template name="genInitialization">
		<!-- we just need to know what the initial state is -->
		<variable name="initialStateName" 
			select="$allStates[@id = /s:scxml/s:initial/s:transition/c:targets/c:target/c:targetState]/@c:enumId"/>

		this.initialize = function(){
			currentConfiguration = [<value-of select="$initialStateName"/>];
			runToCompletion();
			mainLoop();
		}
	</template>

	<!-- FIXME: this can now be taken out/consolidated, as it no longer needds to be parameterized -->
	<template name="genHistoryTriggerDispatcherHistoryStateReference">
		<param name="s"/>

		<value-of select="$s/@id"/>
	</template>

	<template name="genExternalTriggerDispatcherRunToCompletionEventValue">
		<param name="eventName"/>

		<!-- enumerated events correspond to a local variable, 
			and so don't need to be surrounded by quotes, whereas enumerated
			events will be pattern-matched later on, and so do need to be surrounded
			by quotes --> 
		<choose>
			<when test="$enumeratedEventsEnum[c:name/text() = $eventName]">
				<value-of select="$eventName"/>
			</when>
			<otherwise>
				"<value-of select="$eventName"/>"
			</otherwise>
		</choose>
	</template>

	<template name="genStateRefIdentifier">
		<param name="s"/>
		<value-of select="$s/@c:stateNum - 1"/>
	</template>

	<template name="genStateHooks"/>
	<template name="genEnumeratedHooks"/>
	<template name="genTriggerIntEnum"/>

</stylesheet>


