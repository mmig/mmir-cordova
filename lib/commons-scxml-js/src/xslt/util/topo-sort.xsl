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
This stylesheet takes as input an XSL stylesheet with its depdencies
defined in the scxml-js namespace. It then topolgically sorts all
dependencies, and returns an XML file with the paths to the stylesheets
in topologically-sorted order. 
-->
<xsl:stylesheet 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
	xmlns:c="http://commons.apache.org/scxml-js"
	xmlns:exsl="http://exslt.org/common"
	version="1.0">
	<xsl:output method="xml" indent="yes"/>

	<!-- this should be overridden by the user -->
	<xsl:param name="source-path" select="'root'"/>
	<xsl:param name="dependency-base-dir" select="'../'"/>

	<!-- conditional properties declared in the source allow a bit more filtering/parameterization -->
	<xsl:variable name="enabledConditionalDependencyProperties" select="/xsl:stylesheet/c:enabledConditionalDependencyProperties/c:enabledConditionalDependencyProperty/@name"/>

	<xsl:template match="/">

		<!--
		<xsl:message>
			enabledConditionalDependencyProperties : <xsl:value-of select="$enabledConditionalDependencyProperties"/>
		</xsl:message>
		-->

		<xsl:variable name="dependency-graph-fragment">
			<xsl:call-template name="load-dependency-graph">
				<xsl:with-param name="paths-already-visited" select="/.."/>
				<xsl:with-param name="this-path" select="$source-path"/>
				<xsl:with-param name="current-node" select="."/>
				<xsl:with-param name="is-first-call" select="true()"/>
			</xsl:call-template>
		</xsl:variable>

		<xsl:variable name="dependency-graph-node-set" select="exsl:node-set($dependency-graph-fragment)"/>
		
		<xsl:variable name="unique-dependency-graph-node-set" 
			select="$dependency-graph-node-set/c:stylesheet[not(@path = preceding-sibling::c:stylesheet/@path)]"/>

		<xsl:variable name="starting-nodes-without-dependencies" 
			select="$unique-dependency-graph-node-set[not(c:dependency)]"/>

		<!--
		<xsl:copy-of select="$starting-nodes-without-dependencies"/>
		<xsl:copy-of select="$dependency-graph-node-set"/>
		<xsl:value-of select="count($unique-dependency-graph-node-set)"/>
		-->

		<c:topologicallySortedDependencyList source-path="{$source-path}">
			<xsl:call-template name="topo-sort">
				<xsl:with-param name="nodes-without-dependencies" select="$starting-nodes-without-dependencies"/>
				<xsl:with-param name="processed-nodes" select="/.."/>	
				<xsl:with-param name="dependency-graph-node-set" select="$unique-dependency-graph-node-set"/>
			</xsl:call-template>
		</c:topologicallySortedDependencyList>
	</xsl:template>

	<xsl:template name="topo-sort">
		<xsl:param name="nodes-without-dependencies"/>
		<xsl:param name="processed-nodes"/>	
		<xsl:param name="dependency-graph-node-set"/>

		<xsl:variable name="next-processed-nodes" select="$processed-nodes | $nodes-without-dependencies"/>

		<!-- shallow copy -->
		<xsl:for-each select="$nodes-without-dependencies">
			<xsl:copy>
				<xsl:attribute name="path"><xsl:value-of select="@path"/></xsl:attribute>
			</xsl:copy>
		</xsl:for-each>

		<!--
		<xsl:text>nodes-without-dependencies : &#10;</xsl:text>
		<xsl:text>count : </xsl:text><xsl:value-of select="count($nodes-without-dependencies)"/><xsl:text>&#10;</xsl:text>
		<xsl:for-each select="$nodes-without-dependencies">
			<xsl:text>path : </xsl:text><xsl:value-of select="@path"/><xsl:text>&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>+++++++++++++++++++++++++++++++++++++++++&#10;</xsl:text>
	

		<xsl:text>next-processed-nodes : &#10;</xsl:text>
		<xsl:text>count : </xsl:text><xsl:value-of select="count($next-processed-nodes)"/><xsl:text>&#10;</xsl:text>
		<xsl:for-each select="$next-processed-nodes">
			<xsl:text>path : </xsl:text><xsl:value-of select="@path"/><xsl:text>&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>/////////////////////////////////////////&#10;</xsl:text>


		<xsl:variable name="unprocessed-nodes" select="$dependency-graph-node-set[not($next-processed-nodes/@path = @path)]"/>

		<xsl:text>unprocessed-nodes : &#10;</xsl:text>
		<xsl:text>count : </xsl:text><xsl:value-of select="count($unprocessed-nodes)"/><xsl:text>&#10;</xsl:text>
		<xsl:for-each select="$unprocessed-nodes">
			<xsl:text>path : </xsl:text><xsl:value-of select="@path"/><xsl:text>&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\&#10;</xsl:text>

		<xsl:variable name="nodes-whose-deps-have-all-been-processed" 	
			select="$dependency-graph-node-set[count(c:dependency) != count(c:dependency[$next-processed-nodes/@path = @path])]"/>

		<xsl:text>nodes-whose-deps-have-all-been-processed : &#10;</xsl:text>
		<xsl:text>count : </xsl:text><xsl:value-of select="count($nodes-whose-deps-have-all-been-processed)"/><xsl:text>&#10;</xsl:text>
		<xsl:for-each select="$nodes-whose-deps-have-all-been-processed">
			<xsl:text>path : </xsl:text><xsl:value-of select="@path"/><xsl:text>&#10;</xsl:text>

			<xsl:text>    count-dep : </xsl:text><xsl:value-of select="count(c:dependency)"/><xsl:text>&#10;</xsl:text>
			<xsl:for-each select="c:dependency">
				<xsl:text>    dep-path : </xsl:text><xsl:value-of select="@path"/><xsl:text>&#10;</xsl:text>
			</xsl:for-each>

			<xsl:text>    .......unprocessed dependencies:&#10;</xsl:text>
			<xsl:for-each select="c:dependency[not($next-processed-nodes/@path = @path)]">
				<xsl:text>    unprocessed-dep-path : </xsl:text><xsl:value-of select="@path"/><xsl:text>&#10;</xsl:text>
			</xsl:for-each>
		</xsl:for-each>
		<xsl:text>=========================================&#10;</xsl:text>
		-->

		<!-- base case: no nodes left in the graph -->
		<xsl:if test="count($next-processed-nodes) &lt; count($dependency-graph-node-set)">

			<!-- select the next nodes such that those nodes have not been processed, and they have no dependencies that have not been processed -->
			<xsl:variable name="next-nodes-without-dependencies" 
				select="$dependency-graph-node-set[
						not($next-processed-nodes/@path = @path) 
						and count(c:dependency) 
						= count(c:dependency[$next-processed-nodes/@path = @path])]"/>

			<xsl:if test="$next-nodes-without-dependencies">
				<xsl:call-template name="topo-sort">
					<xsl:with-param name="nodes-without-dependencies" select="$next-nodes-without-dependencies"/>
					<xsl:with-param name="processed-nodes" select="$next-processed-nodes"/>
					<xsl:with-param name="dependency-graph-node-set" select="$dependency-graph-node-set"/>
				</xsl:call-template>
			</xsl:if>
		</xsl:if>

	</xsl:template>

	<xsl:template name="load-dependency-graph">
		<xsl:param name="paths-already-visited"/>
		<xsl:param name="this-path"/>
		<xsl:param name="current-node"/>
		<xsl:param name="is-first-call"/>

		<xsl:variable name="dep-paths" select="$current-node/xsl:stylesheet/c:dependencies/c:dependency[not(@when-property-is-enabled) or (@when-property-is-enabled = $enabledConditionalDependencyProperties)]"/>

		<!--
		<xsl:message>
			%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
			<xsl:value-of select="$this-path"/>
			<xsl:for-each select="$dep-paths">
				path : <xsl:value-of select="@path"/>
				whenPropertyIsEnabled : <xsl:value-of select="@when-property-is-enabled"/>
			</xsl:for-each>
			enabledConditionalDependencyProperties : <xsl:value-of select="$enabledConditionalDependencyProperties"/>
			============================================================
		</xsl:message>
		-->

		<!--
		<xsl:message>
			this-path: <xsl:value-of select="$this-path"/>
			dep-paths: <xsl:value-of select="count($dep-paths)"/>
		</xsl:message>
		-->

		<!-- write out his dependencies -->
		<xsl:if test="not($is-first-call)">
			<c:stylesheet path="{$this-path}">
				<xsl:copy-of select="$dep-paths"/>
			</c:stylesheet>
		</xsl:if>

		<!-- visit all other depdencies -->
		<xsl:for-each select="$dep-paths">
			<xsl:variable name="dep-path" select="@path"/>
			<!--
			<xsl:message>
				dep-path : <xsl:value-of select="$dep-path"/>
			</xsl:message>
			-->

			<xsl:if test="not($paths-already-visited[.=$dep-path])">

				<!-- read the doc -->
				<xsl:variable name="dep-doc" select="document(concat($dependency-base-dir,$dep-path))"/>

				<xsl:call-template name="load-dependency-graph">
					<xsl:with-param name="this-path" select="$dep-path"/>
					<xsl:with-param name="current-node" select="$dep-doc"/>
					<xsl:with-param name="paths-already-visited" select="$paths-already-visited | $dep-path"/>
					<xsl:with-param name="is-first-call" select="false()"/>
				</xsl:call-template>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>


</xsl:stylesheet>


