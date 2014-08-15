/*
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
 */


/**
 * So, the questions we want to ask are as follows:
 *
 * What was the fastest technique on average for all browsers?
 * What was the fastest technique on average for each browser?
 * By how much? 
 * What was the max deviation for each transition?
 * What was the average deviation? 
 * Why might this be? Relate it back to my early decisions.
 * How might this be improved?
 *
 * Takes as input an object of the form:
 *	{
 *		data:[{data : [n x 100],
 *			browser,
 *			scxmlTest,
 *			backend}*],
 *		browsers : enumeration of browsers,
 *		backends : enumeration of backends,
 *		scxmlTests : enumeratino of scxmlTests
 *	}
 *
 */

require.def("src/javascript/scxml/cgf/PerformanceAnalyzer",
		["src/javascript/scxml/cgf/util/file",
			"lib/js/json2.js"],
		function(utilFile){

			function sum(a,b){
				return a + b;
			}

			function getCheaperArray(a,b){
				//c and d are both arrays of scalars
				//sum arrays, and take the smaller number
				a.reduce(sum) < b.reduce(sum) ? a : b;
			}

			function sortDataItems(data,property){
				return data.sort(
					function(resultsDataItem1,resultsDataItem2){
						return resultsDataItem1[property] - 
							resultsDataItem2[property];
					});
			}

			function sortDataItemsFilterByBrowser(data,property,browser){
				return sortDataItems(
							data.filter(function(dataItem){return dataItem.browser == browser}),
							property);
			}

			function formatTime(t){
				return t + "ms";
			}

			function performAnalysis(results){
				var reports = {};

				reports.results = results;	//keep the original results

				//prepare data by tagging each results item
				//with the slowest, fastest, and average
				//execution times
				//FIXME: normalize as well, at the same time?
				//compute some other stuff we need later on
				results.data.forEach(function(resultsDataItem){

					resultsDataItem.discardedbestCaseTime = Math.min.apply(this,resultsDataItem.data);
					resultsDataItem.discardedworstCaseTime = Math.max.apply(this,resultsDataItem.data);

					//remove the data item with the min time or max time
					resultsDataItem.data = resultsDataItem.data.filter(function(arrItem){
						return !(arrItem == resultsDataItem.discardedbestCaseTime || 
									arrItem == resultsDataItem.discardedworstCaseTime);
					});

					//get the min array item
					resultsDataItem.bestCaseTime = Math.min.apply(this,resultsDataItem.data);

					//get the max array item
					resultsDataItem.worstCaseTime = Math.max.apply(this,resultsDataItem.data);

					//compute the average time
					resultsDataItem.avgTime = resultsDataItem.data.reduce(sum)/resultsDataItem.data.length;

				});

					
				//FIXME: we should actually probably get the top ten
				//order them from fastest to slowest
				//best possible times
				//worst possible times
				//average times
				
				//order by fastest running times
				reports.fastestRunningTimesOverall = 
					sortDataItems(results.data.slice(),"bestCaseTime");

				reports.slowestRunningTimesOverall = 
					sortDataItems(results.data.slice(),"worstCaseTime");
				
				reports.fastestAverageTimesOverall = 
					sortDataItems(results.data.slice(),"avgTime");

				//same tests, but group into categories by browser
				reports.fastestRunningTimesPerBrowser = {}; 
				for (var browser in results.browsers){
					reports.fastestRunningTimesPerBrowser[browser] = 
						sortDataItemsFilterByBrowser(results.data.slice(),
														"bestCaseTime",
														browser);
				}

				reports.slowestRunningTimesPerBrowser = {}; 
				for (var browser in results.browsers){
					reports.slowestRunningTimesPerBrowser[browser] = 
						sortDataItemsFilterByBrowser(results.data.slice(),
														"worstCaseTime",
														browser);
				}

				reports.avgRunningTimesPerBrowser = {}; 
				for (var browser in results.browsers){
					reports.avgRunningTimesPerBrowser[browser] = 
						sortDataItemsFilterByBrowser(results.data.slice(),
														"avgTime",
														browser);
				}

				return reports;
			}

			function summarizeResults(reports){
				var summary = "";
					
				summary+='Minimum, maximum and average processing times for all results' + '\n';
				summary+='\n';

				reports.results.data.forEach(function(resultsDataItem){
					summary+=resultsDataItem.browser + ' - ' + resultsDataItem.backend + '...' + '\n';
					summary+='Discarding fastest and slowest times: ' + resultsDataItem.discardedbestCaseTime  + ', ' + resultsDataItem.discardedworstCaseTime + '\n';
					summary+='Difference between fastest and slowest times: ' + resultsDataItem.discardedworstCaseTime - resultsDataItem.discardedbestCaseTime + '\n';
					summary+='New fastest, slowest, and average times: ' + resultsDataItem.bestCaseTime  + ', ' + resultsDataItem.worstCaseTime + ", " + resultsDataItem.avgTime + '\n';
					summary+='\n';
				});


				summary+='\n';
				summary+='---------------SUMMARY------------------' + '\n';
				summary+='Top fastest best-case execution results: ' + '\n';
				reports.fastestRunningTimesOverall.forEach(function(resultItem){
					summary+=resultItem.backend + " - " + resultItem.browser + " - " + resultItem.bestCaseTime + '\n';
				});
				summary+='\n';

				summary+='Top fastest worst-case execution results: ' + '\n';
				reports.slowestRunningTimesOverall.forEach(function(resultItem){
					summary+=resultItem.backend + " - " + resultItem.browser + " - " + resultItem.worstCaseTime + '\n';
				});
				summary+='\n';

				summary+='Top fastest average execution results: ' + '\n';
				reports.fastestAverageTimesOverall.forEach(function(resultItem){
					summary+=resultItem.backend + " - " + resultItem.browser + " - " + resultItem.avgTime + '\n';
				});
				summary+='\n';

				summary+='\n';
				summary+='--------------BROWSER-MIN-------------------' + '\n';

				for (var browser in reports.results.browsers){
					summary+='Top best-case execution results for ' + browser + ':' + '\n';
				
					reports.fastestRunningTimesPerBrowser[browser].forEach(function(resultItem){
						summary+=resultItem.backend + " - " + resultItem.browser + " - " + resultItem.bestCaseTime + '\n';
					});
					summary+='\n';
				}

				summary+='\n';
				summary+='-------------BROWSER-MAX-------------------' + '\n';

				for (var browser in reports.results.browsers){
					summary+='Top worst-case execution results for ' + browser + ':' + '\n';
				
					reports.slowestRunningTimesPerBrowser[browser].forEach(function(resultItem){
						summary+=resultItem.backend + " - " + resultItem.browser + " - " + resultItem.worstCaseTime + '\n';
					});
					summary+='\n';
				}

				summary+='\n';
				summary+='-------------BROWSER-AVG-------------------' + '\n';

				for (var browser in reports.results.browsers){
					summary+='Top average execution results for ' + browser + ':' + '\n';
				
					reports.avgRunningTimesPerBrowser[browser].forEach(function(resultItem){
						summary+=resultItem.backend + " - " + resultItem.browser + " - " + resultItem.avgTime + '\n';
					});
					summary+='\n';
				}


				/*
				summary+='-------------AVG TRANSITION TIMES-------------------' + '\n';
				summary+='Average transition time for each result, sorted from most to least expensive: ' + '\n';
				summary+='\n';

				reports.results.data.forEach(function(resultsDataItem){
					summary+=resultsDataItem.browser + ' - ' + resultsDataItem.backend + ':' + '\n';
					resultsDataItem.sortedAvgTransitionTimes.forEach(function(timeObj){
						summary+=timeObj.transitionNumber + " - " + formatMillisecondsTime(timeObj.avgTime) + '\n';
					});
					summary+='\n';
				});
				*/


				//for best time, worst time, avg time, figure out which technique is the most performant
					//compare that technque to the other techqniques to determine percentage speedup
				
				summary+="----------------COMPARISONS OF RUNNING TIMES for each browser---------------\n";
				
				for(var browser in reports.avgRunningTimesPerBrowser){
					summary+=browser + "\n";
					var avgTimes = reports.avgRunningTimesPerBrowser[browser]; 
					var fastestResultsDataItem = avgTimes[0]; 
					for(var i=1; i < avgTimes.length;i++){
						var resultsDataItem = avgTimes[i];
						var backend = resultsDataItem.backend;

						summary += fastestResultsDataItem.backend + " - " + resultsDataItem.backend + "\n";
						summary += "difference: " + (resultsDataItem.avgTime - fastestResultsDataItem.avgTime)  + "\n";
						summary += "speedup: " +  Math.round(((resultsDataItem.avgTime / fastestResultsDataItem.avgTime) - 1) * 100) + "%" + "\n";
						summary += "\n"
					}
				}

				//produce some latex tables
				for(var browser in reports.avgRunningTimesPerBrowser){
					summary+=browser + "\n";

					summary+="\\begin{tabular}\n"
					summary+="& Time Difference (ms) & Approx. Percent Speed Increase\n"

					var avgTimes = reports.avgRunningTimesPerBrowser[browser]; 
					var fastestResultsDataItem = avgTimes[0]; 



					for(var i=1; i < avgTimes.length;i++){
						var resultsDataItem = avgTimes[i];
						var backend = resultsDataItem.backend;

						summary += resultsDataItem.backend + " & ";
						summary += (resultsDataItem.avgTime - fastestResultsDataItem.avgTime)  + " & ";
						summary +=  Math.round(((resultsDataItem.avgTime / fastestResultsDataItem.avgTime) - 1) * 100) + "%" + " \\\\";
						summary += "\n"
					}

					summary+="\\end{tabular}\n\n"
				}

				
				
				return summary;
			}

			function genDatStr(arrayOfArrays){
				return arrayOfArrays.reduce(function(a,b){
					return a + b.reduce(function(c,d){
						return c + d + "\t";
					},"") + "\n";
				},"");
			}

			function genPlot(reports){
					var i = 1;
					var bestCaseTimeValues = 
						reports.slowestRunningTimesOverall.map(function(item){
							return [i++, 
										item.bestCaseTime];
						});

					var bestCaseTimeValuesStr = genDatStr(bestCaseTimeValues);


					var i = 1;
					var avgTimeValues = 
						reports.slowestRunningTimesOverall.map(function(item){
							return [i++, 
										item.avgTime];
						});
					var avgTimeValuesStr = genDatStr(avgTimeValues);

					var i = 1;
					var worstCaseTimeValues = 
						reports.slowestRunningTimesOverall.map(function(item){
							return [i++, 
										item.worstCaseTime];
						});
					var worstCaseTimeValuesStr = genDatStr(worstCaseTimeValues);

					var labels = reports.slowestRunningTimesOverall.map(function(item){
						return item.browser + "/" + item.backend
					});
		 
					var i = 1;
					print("set xticks (" + labels.reduce(function(a,b){return a + '"' + b + '"' + " " + i++ + ","},"").slice(0,-1) + ")");
					
					print(bestCaseTimeValuesStr);
					print(avgTimeValuesStr);
					print(worstCaseTimeValuesStr);
			}

			return {
				analyze : performAnalysis,
				summarizeResults : summarizeResults,
				generateReport : function(data){
					print('Writing report data to report/report.json...');
					print('Writing report summary to report/report_summary.txt...');

					var reports = this.analyze(data);
					var summary = this.summarizeResults(reports);
					//genPlot(reports);
					utilFile.writeFile("reports = " + JSON.stringify(reports),'report/report.json');
					utilFile.writeFile(summary,'report/report_summary.txt');
				}
			}

		}
);
