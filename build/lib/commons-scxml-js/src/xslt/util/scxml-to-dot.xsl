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
<!--
This stylesheet takes as input an scxml document, and produces as output
a document in the graphviz dot syntax.
-->
<!-- assume initial states have been normalized -->
<stylesheet 
	xmlns="http://www.w3.org/1999/XSL/Transform" 
	xmlns:c="http://commons.apache.org/scxml-js"
	xmlns:s="http://www.w3.org/2005/07/scxml"
	version="1.0">
	<import href="xml-to-string.xsl"/>

	<output method="text"/>

	<param name="maxDepth" select="9999"/>
	<param name="printScript" select="false()"/>
	<param name="printCondition" select="false()"/>
	<param name="startAtNodeWithId"/>

	<template name="htmlTransitionLabel">
		<param name="transitions"/>
		<param name="heading"/>

		<variable name="colspan">
			<choose>
				<when test="$printScript and $printCondition">
					<text>3</text>
				</when>
				<when test="$printScript or $printCondition">
					<text>2</text>
				</when>
				<otherwise>
					<text>1</text>
				</otherwise>
			</choose>
		</variable>

		<text>label=&lt;&lt;TABLE&gt;</text>
		<if test="$heading">
			<text>&lt;TR&gt;</text>
				<text>&lt;TD colspan="</text><value-of select="$colspan"/><text>"&gt;</text>
				<value-of select="$heading"/>
				<text>&lt;/TD&gt;</text>
			<text>&lt;/TR&gt;</text>
		</if>
		<for-each select="$transitions">
			<text>&lt;TR&gt;</text>
				<text>&lt;TD&gt;</text>
				<value-of select="@event"/>
				<text>&lt;/TD&gt;</text>
				<if test="$printCondition">
					<text>&lt;TD&gt;</text>
					<call-template name="attribute-value">
						<with-param name="text" select="@cond"/>
					</call-template>
					<text>&lt;/TD&gt;</text>
				</if>
				<if test="$printScript">
					<text>&lt;TD&gt;</text>
					<value-of select="s:script/text()"/>
					<text>&lt;/TD&gt;</text>
				</if>
			<text>&lt;/TR&gt;</text>
		</for-each>
		<text>&lt;/TABLE&gt;&gt;</text>
	</template>

	<template match="/">
		<variable name="states" 
			select="//s:state[count(ancestor::*) &lt;= $maxDepth] | 
						//s:parallel[count(ancestor::*) &lt;= $maxDepth] | 
						//s:initial[count(ancestor::*) &lt;= $maxDepth]"/>


		digraph G {

			compound=true; 

			<choose>
				<when test="$startAtNodeWithId">
					<apply-templates select="$states[@id=$startAtNodeWithId]"/>
				</when>
				<otherwise>
					<apply-templates select="*[not(self::s:transition)]"/>
				</otherwise>
			</choose>

			<choose>
				<when test="$startAtNodeWithId">
					<call-template name="genTransitions">
						<with-param name="legalStates" select="$states[ancestor-or-self::*/@id=$startAtNodeWithId]"/>
					</call-template>
				</when>
				<otherwise>
					<call-template name="genTransitions">
						<with-param name="legalStates" select="$states"/>
					</call-template>
				</otherwise>
			</choose>

		}
	</template>

	<template name="genTransitions">
		<param name="legalStates"/>
		
		<for-each select="$legalStates">
			<variable name="fromState" select="."/>

			<for-each select="$legalStates">
				<variable name="toState" select="."/>
				
				<variable name="transitions" select="$fromState/s:transition[@target=$toState/@id]"/>

				<if test="$transitions">
					<call-template name="transition-template">
						<with-param name="transitions" select="$transitions"/>
						<with-param name="sourceState" select="$fromState"/>
						<with-param name="targetState" select="$toState"/>
					</call-template>
				</if>
			</for-each>
		</for-each>
	</template>

	<template match="s:scxml | s:state[.//s:state] | s:parallel">
		<choose>
			<when test="count(ancestor::*) &lt; $maxDepth">
				subgraph cluster_<value-of select="@id"/> {
					<choose>
						<when test="self::s:scxml">
							color="blue";
						</when>
						<otherwise>
							color="black";
						</otherwise>
					</choose>

					
					<text>style="rounded,</text>
					<choose>
						<when test="../self::s:parallel">
							<text>dashed</text>
						</when>
						<otherwise>
							<text>solid</text>
						</otherwise>
					</choose>
					<text>";</text>

					<if test="count(ancestor::*) &lt; $maxDepth">
						<apply-templates select="*[not(self::s:transition)]"/>
					</if>

					label="<value-of select="@id"/>";

					<variable name="static_reactions" select="s:transition[not(@target)]"/>

					<if test="$static_reactions">
						<value-of select="@id"/>
						<text>_static_reactions </text>
						<text>[ </text>
						<call-template name="htmlTransitionLabel">
							<with-param name="transitions" select="$static_reactions"/>
							<with-param name="heading" select="'Static Reactions'"/>
						</call-template>
						<text> shape=none];</text>
					</if>

				}
			</when>
			<otherwise>
				<value-of select="@id"/> 
				<text>[shape=box, style="rounded"];</text>
			</otherwise>
		</choose>
	</template>

	<template match="s:state[not(.//s:state)]">
		<value-of select="@id"/> 
		<text>[shape=box, style="rounded,filled",fillcolor=gray];</text>
	</template>

	<template match="s:initial">
		<value-of select="@id"/> 
		<text>[shape=point,width=.15];</text>
	</template>

	<template name="transition-template">
		<param name="transitions"/>
		<param name="sourceState"/>
		<param name="targetState"/>

		<variable name="sourceId" select="$sourceState/@id"/>
		<variable name="sourceStatesBasicSubstates" select="$sourceState//s:state[not(.//s:state)]"/>

		<variable name="sourceBasicStateId">
			<choose>
				<when test="$sourceStatesBasicSubstates">
					<!-- source is a composite state -->
					<value-of select="$sourceStatesBasicSubstates[1]/@id"/>
				</when>
				<otherwise>
					<!-- use the first basic substate as the target -->
					<value-of select="$sourceId"/>
				</otherwise>
			</choose>
		</variable>


		<variable name="targetId" select="$targetState/@id"/>
		<variable name="targetStatesBasicSubstates" select="$targetState//s:state[not(.//s:state)]"/>

		<variable name="targetBasicStateId">
			<choose>
				<when test="$targetStatesBasicSubstates">
					<!-- target is a composite state -->

					<!-- use the first basic substate as the target -->
					<value-of select="$targetStatesBasicSubstates[1]/@id"/>
				</when>
				<otherwise>
					<!-- target is a basic state -->
					<value-of select="$targetId"/>
				</otherwise>
			</choose>
		</variable>

		<value-of select="$sourceBasicStateId"/> -> <value-of select="$targetBasicStateId"/>
		[
			<if test="$sourceStatesBasicSubstates">
				ltail=cluster_<value-of select="$sourceId"/>,
			</if>
			<if test="$targetStatesBasicSubstates">
				lhead=cluster_<value-of select="$targetId"/>,
			</if>
			<choose>
				<when test="count($transitions) > 1">
					<!-- multiple transitions. use html label -->
					<call-template name="htmlTransitionLabel">
						<with-param name="transitions" select="$transitions"/>
					</call-template>
				</when>
				<otherwise>
					<variable name="firstTransition" select="$transitions[1]"/>

					<if test="$firstTransition/@event | $firstTransition/s:script | $firstTransition/@cond">
						<text>label="</text> 
						<value-of select="$firstTransition/@event"/> 
						<if test="$printCondition and $firstTransition/@cond"> 
							<text>[</text>
							<value-of select="$firstTransition/@cond"/>
							<text>]</text> 
						</if> 
						<if test="$printScript and $firstTransition/s:script"> 
							<text>/</text>
							<call-template name="replace-string"> 
								<with-param name="text" select="$firstTransition/s:script"/> 
								<with-param name="replace" select="'&#10;'"/> 
								<with-param name="with" select="'\n'"/> 
							</call-template> 
						</if>
						<text>"</text>
					</if>
				</otherwise>
			</choose>
		];
	</template>

	<template match="s:script"/>

</stylesheet>
