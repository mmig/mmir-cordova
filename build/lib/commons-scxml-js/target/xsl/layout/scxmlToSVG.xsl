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
--><xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.w3.org/2005/07/scxml" xmlns:c="http://commons.apache.org/scxml-js" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" version="1.0">
	<xsl:output method="xml"/>

	<xsl:template match="/s:scxml">
		<svg>
			<!-- TODO: add styling -->
			<style type="text/css">
				svg {
					width:100%;
					height:100%;
				}

				.basic {
					fill : grey;
					stroke : black;
				}

				.composite {
					fill : white;
					stroke : black;
				}
				
				.groupBoundingRect {
					fill : white;
					stroke : black;
				}

				g.parallel &gt; g &gt; rect.groupBoundingRect {
					stroke-dasharray : 5,5;
				}

				.statesGroup {
					fill : white;
					stroke : blue;
				}

				.history {
					fill : blue;
					stroke : black;
				}

				path { 
					/* These cause Batik to throw NPE, so we include them as inline style properties. */
					/*marker-start: url(#circle);*/
					/*marker-end: url(#triangle);*/
					stroke: blue; 
					fill: none;
				}

				.triangle {
					fill:blue;
				}

				.connectionPoint {
					fill:none;
					/*stroke:black;*/
					stroke:none;
				}

				text.label {
					fill:black;
					stroke:none;
				}

				.history &gt; text {
					dominant-baseline: central;
					text-anchor: middle;
				}

				g.highlighted.basic &gt; rect.groupBoundingRect {
					fill : #FF00FF; /*fuschia*/
				}

				g.highlighted.composite &gt; rect.groupBoundingRect, 
				g.highlighted.parallel &gt; rect.groupBoundingRect {
					stroke : #FF00FF; /*fuschia*/
					stroke-width : 2;
				}

				g.highlighted.transition &gt; path.edge {
					stroke : #FF00FF; /*fuschia*/
				}

			</style>
			<defs>
				<marker id="circle" markerWidth="10" markerHeight="10" refX="5" refY="5">
					<circle cx="5" cy="5" r="5"/>
				</marker>
				<marker id="triangle" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="10" markerHeight="10" orient="auto">
					<path d="M 0 0 L 10 5 L 0 10 z" class="triangle"/>
				</marker>
			</defs>
			<g class="scxml">
				<xsl:apply-templates select="@*"/>

				<rect x="0" y="0" width="0" height="0" rx="10" ry="10" class="groupBoundingRect"/>
				<xsl:if test="@name">
					<text x="0" y="0" class="label"><xsl:value-of select="@name"/></text>
				</xsl:if>

				<g class="statesGroup">
					<xsl:apply-templates select="node()"/>
				</g>
				<g class="transitionGroup">
					<xsl:for-each select=".//s:transition/c:targets/c:target">

						<!-- transitions graphically represented as quadratic bezier curve inside of a group -->
						<!-- inside of a group, because theoretically, we may have connection points inside the group as well,
							if we want to support graphical hyperedges for forks and joins! Also, we want labels as well.-->
						<g class="transition" id="{@c:id}" c:source="{../../../@id}" c:target="{c:targetState}">
							<path class="edge" d="M0,0 Q1,1 2,2" marker-end="url(#triangle)"/>
							<text class="label" x="0" y="0">
								<xsl:value-of select="../../@event"/>
								<xsl:if test="../../@cond">
									<xsl:text>[</xsl:text>
										<xsl:value-of select="../../@cond"/>
									<xsl:text>]</xsl:text>
								</xsl:if>
							</text>
						</g>
					</xsl:for-each>
				</g>
			</g>
		</svg>
	</xsl:template>

	<xsl:template name="genState">
		<xsl:param name="cssClass"/>

		<g class="{$cssClass}" c:graphEntity="true">

			<xsl:apply-templates select="@*"/>

			<rect x="0" y="0" width="30" height="20" rx="10" ry="10" class="groupBoundingRect"/>
			<text x="0" y="0" class="label"><xsl:value-of select="@id"/></text>
			<circle class="connectionPoint" r="1" cx="10" cy="0"/>
			<circle class="connectionPoint" r="1" cx="15" cy="0"/>
			<circle class="connectionPoint" r="1" cx="20" cy="0"/>
			<circle class="connectionPoint" r="1" cx="10" cy="20"/>
			<circle class="connectionPoint" r="1" cx="15" cy="20"/>
			<circle class="connectionPoint" r="1" cx="20" cy="20"/>
			<circle class="connectionPoint" r="1" cx="0" cy="10"/>
			<circle class="connectionPoint" r="1" cx="30" cy="10"/>

			<xsl:apply-templates select="node()"/>
		</g>
	</xsl:template>
	
	<!-- basic states -->
	<xsl:template match="s:state[not(.//*[(self::s:state or self::s:parallel or self::s:final or self::s:initial or self::s:scxml or self::s:history)])]">
		<xsl:call-template name="genState">
			<xsl:with-param name="cssClass" select="'basic'"/>
		</xsl:call-template>
	</xsl:template>


	<!-- composite states -->
	<xsl:template match="s:state[.//*[self::s:state or self::s:parallel or self::s:final or self::s:initial or self::s:scxml or self::s:history]]">
		<xsl:call-template name="genState">
			<xsl:with-param name="cssClass" select="'composite'"/>
		</xsl:call-template>
	</xsl:template>


	<!-- parallel (and parallel regions?) -->
	<xsl:template match="s:parallel">
		<xsl:call-template name="genState">
			<xsl:with-param name="cssClass" select="'parallel'"/>
		</xsl:call-template>
	</xsl:template>

	<!-- history -->
	<xsl:template match="s:history">
		<g class="history" c:graphEntity="true">
			<xsl:apply-templates select="@*"/>

			<circle cx="0" cy="0" r="10"/>
			<xsl:choose>
				<xsl:when test="@type = 'deep'">
					<text x="0" y="0">H*</text>
				</xsl:when>
				<xsl:otherwise>
					<text x="0" y="0">H</text>
				</xsl:otherwise>
			</xsl:choose>

			<circle class="connectionPoint" r="1" cx="-5" cy="0"/>
			<circle class="connectionPoint" r="1" cx="5" cy="0"/>
			<circle class="connectionPoint" r="1" cx="0" cy="5"/>
			<circle class="connectionPoint" r="1" cx="0" cy="-5"/>
		</g>
	</xsl:template>

	<!-- initial -->
	<xsl:template match="s:initial">
		<g class="initial" c:graphEntity="true">
			<xsl:apply-templates select="@*"/>

			<circle cx="0" cy="0" r="6" fill="black"/>

			<circle class="connectionPoint" r="1" cx="-3" cy="0"/>
			<circle class="connectionPoint" r="1" cx="3" cy="0"/>
			<circle class="connectionPoint" r="1" cx="0" cy="3"/>
			<circle class="connectionPoint" r="1" cx="0" cy="-3"/>
		</g>
	</xsl:template>

	<xsl:template match="s:final">
		<g class="final" c:graphEntity="true">
			<xsl:apply-templates select="@*"/>

			<circle cx="0" cy="0" r="6" fill="white" stroke="black"/>
			<circle cx="0" cy="0" r="3" fill="black"/>

			<circle class="connectionPoint" r="1" cx="-3" cy="0"/>
			<circle class="connectionPoint" r="1" cx="3" cy="0"/>
			<circle class="connectionPoint" r="1" cx="0" cy="3"/>
			<circle class="connectionPoint" r="1" cx="0" cy="-3"/>
		</g>
	</xsl:template>

	<xsl:template match="@*">
	   <xsl:copy/>
	</xsl:template>


</xsl:stylesheet>