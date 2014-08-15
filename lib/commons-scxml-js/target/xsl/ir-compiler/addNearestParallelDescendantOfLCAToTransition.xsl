<?xml version="1.0" encoding="UTF-8"?><!--
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
--><xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.w3.org/2005/07/scxml" xmlns="http://www.w3.org/2005/07/scxml" xmlns:c="http://commons.apache.org/scxml-js" version="1.0">
	<xsl:output method="xml"/>

	<c:dependencies>
		<c:dependency path="ir-compiler/appendBasicStateInformation.xsl"/>
		<c:dependency path="ir-compiler/computeLCA.xsl"/>
	</c:dependencies>

	<xsl:variable name="states" select="//*[self::s:state or self::s:parallel or self::s:scxml]"/>

	<!-- identity transform -->
	<xsl:template match="@*|node()">
		<xsl:copy>
			<xsl:apply-templates select="@*|node()"/>
		</xsl:copy>
	</xsl:template>


	<xsl:template match="s:transition[@target]">
		<xsl:variable name="lca-id" select="c:lca/text()"/>
		<!-- select the paralellel ancestor of target state with least depth, up to, but not including the lca-->
		<xsl:variable name="lca" select="$states[@id=$lca-id]"/>

		<xsl:variable name="lca-parallel-descendants" select="$lca//s:parallel"/>
		<xsl:variable name="target-parallel-ancestors" select="./ancestor::s:parallel"/>

		<!-- intersection idiom: http://www.dpawson.co.uk/xsl/sect2/N4486.html#d5509e1351 -->
		<xsl:variable name="target-parallel-ancestors-and-lca-descendants" select="$lca-parallel-descendants[count(.|$target-parallel-ancestors) = count($target-parallel-ancestors)]"/>
		<!--
		<xsl:message>
			lca-id: <xsl:value-of select="$lca-id"/>
			lca-descendant-basic-states id: <xsl:value-of select="$lca-descendant-basic-states"/>
		</xsl:message>
		-->

		<xsl:copy>
			<xsl:apply-templates select="@*|node()"/>

			<xsl:if test="$target-parallel-ancestors-and-lca-descendants">
				<xsl:variable name="nearest-parallel-descendent-of-lca" select="$target-parallel-ancestors-and-lca-descendants[1]"/>
				<xsl:variable name="basic-state-descendants-of-nearest-parallel-descendent-of-lca" select="$nearest-parallel-descendent-of-lca//*[@c:isBasic]"/>

				<c:nearestParallelDescendantOfLCA><xsl:value-of select="$nearest-parallel-descendent-of-lca/@id"/></c:nearestParallelDescendantOfLCA>
				<c:basicStateDescendantsOfNearestParallelDescendentOfLCA>
					<xsl:for-each select="$basic-state-descendants-of-nearest-parallel-descendent-of-lca">
						<c:basicStateDescendant><xsl:value-of select="@id"/></c:basicStateDescendant>
					</xsl:for-each>
				</c:basicStateDescendantsOfNearestParallelDescendentOfLCA>
			</xsl:if>
		</xsl:copy>
	</xsl:template>


</xsl:stylesheet>