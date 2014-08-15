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
This stylesheet augments the SCXML document to add extra information to
transitions. Specifically, this will precompute the Least Common Ancestor
(lca), the exit path, and the entry of the transition, and add this information
to the input document as children in the scxml-js namespace.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:s="http://www.w3.org/2005/07/scxml"
	xmlns="http://www.w3.org/2005/07/scxml"
	xmlns:c="http://commons.apache.org/scxml-js"
	version="1.0">
	<xsl:output method="xml"/>

	<xsl:variable name="statesAndSCXML" select="//*[self::s:state or self::s:initial or self::s:final or self::s:parallel or self::s:scxml]"/>

	<!-- identity transform -->
	<xsl:template match="@*|node()">
		<xsl:copy>
			<xsl:apply-templates select="@*|node()"/>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="c:target">
		<xsl:variable name="lcaId" select="../../c:lca"/>
		<xsl:variable name="targetStateId" select="c:targetState"/>
		<xsl:variable name="sourceStateId" select="../../../@id"/>
		<xsl:variable name="lca" select="$statesAndSCXML[@id = $lcaId]"/>
		<xsl:variable name="sourceAncestorOrSelfAndChildOfLCA"
			select="$lca/*[descendant-or-self::*[@id = $sourceStateId]]"/>
		<xsl:variable name="targetAncestorOrSelfAndChildOfLCA"
			select="$lca/*[descendant-or-self::*[@id = $targetStateId]]"/>
		<!--
		<xsl:message>
			lcaId: <xsl:value-of select="$lcaId"/>
			targetStateId : <xsl:value-of select="$targetStateId"/>
			sourceStateId : <xsl:value-of select="$sourceStateId"/>
			lca : <xsl:value-of select="$lca"/>
		</xsl:message>
		-->

		<xsl:copy>
			<xsl:apply-templates select="@*"/>

			<c:sourceAncestorOrSelfAndChildOfLCA>
				<xsl:value-of select="$sourceAncestorOrSelfAndChildOfLCA/@id"/>
			</c:sourceAncestorOrSelfAndChildOfLCA>

			<c:targetAncestorOrSelfAndChildOfLCA>
				<xsl:value-of select="$targetAncestorOrSelfAndChildOfLCA/@id"/>
			</c:targetAncestorOrSelfAndChildOfLCA>

			<xsl:apply-templates select="node()"/>
		</xsl:copy>
	</xsl:template>

</xsl:stylesheet>
