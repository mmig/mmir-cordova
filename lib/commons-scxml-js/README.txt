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
$Id: README.txt 1082578 2011-03-17 16:22:26Z jbeard $

        Commons Sandbox - Google Summer of Code 2010 Project

                    -- TITLE --

SCXML Code Generation Framework, JavaScript Edition (SCXML/cgf/js): An
SCXML-to-JavaScript Compiler Optimized for User Interface Development on the
World Wide Web

                  -- ABSTRACT --

This project has two goals. The first is to develop an SCXML-to-JavaScript
compiler optimized for User Interface development on the World Wide Web.
This would allow developers to elegantly describe and implement Web-based
UIs with complex behavioural requirements. The second goal is to generate
graphical depictions of statecharts, which may then be animated in response
to live UI events. This would allow developers to better comprehend the
dynamic behaviour described by their statecharts.

GSoC participant: jbeard
GSoC mentor:      rahul


==Requirements==

Maven, Ant and Java


==Installation==

To use SCXMLcgf/js, you must first download the dependencies and preprocess the
XSLT stylesheets. Run:

mvn generate-sources


==Running the Compiler==

./run.sh [options] file1 file2 ...

A summary of available options are as follows:

- backend	Statechart implementation technique. Currently one of {switch | table | state}
- noForEach	Assume that the target environment does not have an Array.forEach method
- noIndexOf	Assume that the target environment does not have an Array.indexOf method
- noMap		Assume that the target environment does not have an Array.map method
- ie		The equivalent of -noForEach -noIndexOf -noMap
- beautify	Will run generated code through a beautifier.
- log		Will enable logging in generated code.
- verbose	Will enable verbose logging in the compiler.


For example, you might run the following:

./run.sh --backend state --beautify --ie test/kitchen_sink/KitchenSink.xml > KitchenSinkIE.js


==Running Unit Tests==

To run unit tests from the command-line under Mozilla Rhino, run:

mvn test

Or:

ant run-unit-tests-with-rhino


By default, the JavaScript-based compiler frontend will be used to compile the
test cases. On Unix systems, however, you can also use the bash-and-xsltproc
compiler frontend to compile the SCXML test cases instead. This decreases the
overall time to build and run unit tests by a factor of 15 on jbeard's netbook,
cutting build time from 30 minutes to 2 minutes. To execute this, use the
generate-javascript-with-bash property with ant:

ant -Dgenerate-javascript-with-bash property=true run-unit-tests-with-rhino

In the future, the Python-and-lxml2 compiler frontend will also be usable from
the Ant build script, which should provide a fast and portable solution for
building the SCXML test cases.


You can also run unit tests on Microsoft Windows under Mozilla Firefox and
Internet Explorer. To do so, you must, you must have a web server serving files
on port 8080 in the SCXMLcgf/js root directory. Then run:

ant run-unit-tests-with-selenium

Or, to run unit tests with both Selenium and Rhino, run:

ant run-all-unit-tests
