<?xml version="1.0"?>
<!-- generate javascript backend in the format of requirejs module -->
<stylesheet xmlns="http://www.w3.org/1999/XSL/Transform" 
	xmlns:s="http://www.w3.org/2005/07/scxml"
	xmlns:c="http://commons.apache.org/scxml-js"
	version="1.0">
	<output method="text"/>

	<param name="module-path"/>
	<param name="xsl-base-dir" select="'xslt/'"/>


	<template match="/c:topologicallySortedDependencyList">
	<text>
config =  {
	"transformations": [ 
	</text>
		<for-each select="c:stylesheet">
			<text>"</text><value-of select="$xsl-base-dir"/><value-of select="@path"/><text>"</text><if test="not(position() = last())"><text>, </text></if>
		</for-each> 
	<text>
	 ],
	"code" : "</text><value-of select="$xsl-base-dir"/><value-of select="@source-path"/><text>"
}
	</text>
	</template>
</stylesheet>


