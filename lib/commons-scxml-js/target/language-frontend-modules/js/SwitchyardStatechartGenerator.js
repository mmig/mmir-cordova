

		require.def(

			"target/language-frontend-modules/js/SwitchyardStatechartGenerator",
			[
				
					"text!target/xsl/ir-compiler/normalizeInitialStates.xsl",
				
					"text!target/xsl/ir-compiler/generateUniqueInitialStateIds.xsl",
				
					"text!target/xsl/ir-compiler/generateUniqueStateIds.xsl",
				
					"text!target/xsl/ir-compiler/positionTransitionsAfterSubstates.xsl",
				
					"text!target/xsl/ir-compiler/transformIf.xsl",
				
					"text!target/xsl/ir-compiler/addDefaultTransitionToHistoryStates.xsl",
				
					"text!target/xsl/ir-compiler/appendBasicStateInformation.xsl",
				
					"text!target/xsl/ir-compiler/appendStateInformation.xsl",
				
					"text!target/xsl/ir-compiler/splitTransitionTargets.xsl",
				
					"text!target/xsl/ir-compiler/changeTransitionsPointingToCompoundStatesToPointToInitialStates.xsl",
				
					"text!target/xsl/ir-compiler/computeLCA.xsl",
				
					"text!target/xsl/layout/addTransitionTargetIds.xsl",
				
					"text!target/xsl/ir-compiler/addNearestParallelDescendantOfLCAToTransition.xsl",
				
					"text!target/xsl/ir-compiler/flattenTransitions.xsl",
				
					"text!target/xsl/ir-compiler/nameTransitions.xsl",
				
					"text!target/xsl/ir-compiler/appendTransitionInformation.xsl",
				
					"text!target/xsl/ir-compiler/copyEnumeratedEventTransitions.xsl",
				
					"text!target/xsl/ir-compiler/enumerateEvents.xsl",
				
					"text!target/xsl/ir-compiler/numberStatesAndTransitions.xsl",
				
					"text!target/xsl/ir-compiler/addEventRegularExpressions.xsl",
				
					"text!target/xsl/ir-compiler/expandStarEvent.xsl",
				
				"text!target/xsl/backends/js/SwitchyardStatechartGenerator.xsl"
			],

			function(
				
				js_var_1,
				js_var_2,
				js_var_3,
				js_var_4,
				js_var_5,
				js_var_6,
				js_var_7,
				js_var_8,
				js_var_9,
				js_var_10,
				js_var_11,
				js_var_12,
				js_var_13,
				js_var_14,
				js_var_15,
				js_var_16,
				js_var_17,
				js_var_18,
				js_var_19,
				js_var_20,
				js_var_21,
				js_var_22
			){

				return {
					"transformations" : [
						js_var_1, 
						js_var_2, 
						js_var_3, 
						js_var_4, 
						js_var_5, 
						js_var_6, 
						js_var_7, 
						js_var_8, 
						js_var_9, 
						js_var_10, 
						js_var_11, 
						js_var_12, 
						js_var_13, 
						js_var_14, 
						js_var_15, 
						js_var_16, 
						js_var_17, 
						js_var_18, 
						js_var_19, 
						js_var_20, 
						js_var_21
					],
					"code" : js_var_22
 
				};


			}
		);
	