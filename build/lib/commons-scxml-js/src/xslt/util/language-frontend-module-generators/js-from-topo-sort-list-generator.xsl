<?xml version="1.0"?>
<!-- generate javascript backend in the format of requirejs module -->
<stylesheet xmlns="http://www.w3.org/1999/XSL/Transform" 
	xmlns:s="http://www.w3.org/2005/07/scxml"
	xmlns:c="http://commons.apache.org/scxml-js"
	version="1.0">
	<output method="text"/>

	<param name="module-path"/>
	<param name="xsl-base-dir" select="'target/xsl/'"/>


	<template match="/c:topologicallySortedDependencyList">

		require.def(

			"<value-of select="$module-path"/>",
			[
				<for-each select="c:stylesheet">
					"text!<value-of select="$xsl-base-dir"/><value-of select="@path"/>",
				</for-each>
				"text!<value-of select="$xsl-base-dir"/><value-of select="@source-path"/>"
			],

			function(
				<!-- FIXME: these variable names will be unique, but not very meaningful, or easy to debug :( -->
				<for-each select="c:stylesheet">
					<value-of select="concat('js_var_',position())"/>,
				</for-each>
				<value-of select="concat('js_var_',count(c:stylesheet)+1)"/>
			){

				return {
					"transformations" : [
						<for-each select="c:stylesheet">
							<value-of select="concat('js_var_',position())"/><if test="not(position() = last())">, 
						</if>
						</for-each>
					],
					"code" : <value-of select="concat('js_var_',count(c:stylesheet)+1)"/>
 
				};


			}
		);
	</template>
</stylesheet>

