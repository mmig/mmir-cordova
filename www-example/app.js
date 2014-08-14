var IS_DEBUG_ENABLED = false;	

mmir.ready(function () {
	
	test_isNetworkAvailable();
	
	
	//prepare app-module object for public export of functions etc.
	mmir.app = {};
	
    //initialize BACK-BUTTON handling:
	initHistoryBackHandler();
	//set default behavior for buttons:
    mmir.DialogManager.setOnPageRenderedHandler(executeAfterEachPageIsLoaded);
    //start app by triggering INIT event on dialog-engine:
    mmir.DialogManager.raise('init');

    
    //setup handler for BACK button (and for swipe-left gesture)
    function initHistoryBackHandler() {
    	
    	var isCordovaEnv = ! mmir.Constants.isBrowserEnv();
    	
    	//generic BACK handler:
    	var backButtonHandler = function (event){
        	
        	if(isCordovaEnv || ( ! isCordovaEnv && event.state)){
        		
        		//FIX for browser-env.: to popstate-event is triggered not only when back-button is pressed in browser (however, in this case it seems, that the event.state is empty...)
        		if( ! isCordovaEnv && ! event.state){
        			event.preventDefault();
        			return false; /////////////////////////// EARLY EXIT ///////////////////////////////////
        		}
        		triggerClickFeedback({haptic : false});//vibration is already triggered by system for this back-button...
        		mmir.DialogManager.raise('back', {
    			    nativeBackButton : 'true'
    			});
        	}
        	else if(event){
        		event.preventDefault();
        		return false;
        	}
        };
        
        //register BACK-handler for environments and gesture:
        
        if(isCordovaEnv){
	    	//overwrite BACK-event for Android/cordova environment:
	        document.addEventListener("backbutton", backButtonHandler, true);
        }
        else {
    	    //overwrite BACK-event in Browser environment:
    		window.addEventListener("popstate", backButtonHandler, true);
        }
        
        
        //also trigger BACK on swipe-right gesture:
        var $ = require('jquery');
        $(document).on('swiperight', backButtonHandler);
        
    }
    
    //function that will be registered with the DialogManager to be executed
    // each time after a view was rendered
    function executeAfterEachPageIsLoaded() {
		
    	//add a generic click-handler for BUTTONs
    	//  generates a click-input for the InputEngine based on the button's name-attribute
    	$("button").each(function(index, el) {
		    var tis = $(this);
		    var eventName;
		    tis.bind('vclick', function(event) {
		    	
		    	event.preventDefault();
		    	
				eventName = "click_on_" + tis.attr("name");
				
				triggerClickFeedback();
				
				mmir.InputEngine.raise("touch_input_event");
				mmir.InputEngine.raise(eventName);
				
				return false;
		    });
		});
    	
    };
    
    //set up the handler for the microphone button:
    // we register this handler on the document, so this needs to be done only once
    $(document).on('vclick', '#mic_button', function(event){
    	
		event.preventDefault();
		
		triggerClickFeedback();
		
		microClicked();
	});
    
    
    /////////////////////////////////////////////////// SPEECH INPUT / OUTPUT EXAMPLE //////////////////////////////
    
    var IS_WITH_END_OF_SPEECH_DETECTION = true;
    
    //TODO deal with view-change:
    //
    //		* EITTHER cancel before/on view change
    //		* OR set active-state of microphone button in new view
    //
    /*
     * This is an example function for speech interaction:
     * 
     *  * starts (and stops) the speech input
     *  * processes the result via the SemanticInterpreter (grammar-based)
     *  * "mirrors" the recognized text via text-to-speech
     * 
     * Also the microphone button's state is update to active/inactive state on
     * start/stop of speech input.
     * 
     * There are two modes
     *   * with silence detection (i.e. end-of-speech-detection)
     *   * without silence detection
     *   
     * If mode is with-silence-detection, then the recognizer will
     * try to detect automatically the end of speech end terminates
     * itself.
     * 
     * If started in mode without-silence-detection the user must
     * press the microphone button a 2nd time in order to complete the
     * speech input.
     * 
     * 
     */
    function microClicked(){
    	
    	var notification = mmir.NotificationManager;
    	notification.vibrate(500);
    	
    	var isUseEndOfSpeechDetection = IS_WITH_END_OF_SPEECH_DETECTION;
    	
    	var successFunc = function recognizeSuccess (res){
    		
    		console.log("[AudioInput] finished recoginition: "  + JSON.stringify(res));

    		var asr_result = res;
    		if(res['result']){
    			asr_result = res['result'];
    		}
    		
    		mmir.MediaManager.textToSpeech(asr_result, function(){}, function(){});

    		var result = mmir.SemanticInterpreter.getASRSemantic(asr_result);
    		var semantic;

    		$('#mic_button').removeClass('footer_button_clicked');
    				
    		if (result.semantic != null) {
    			semantic = JSON.parse(result.semantic);
    			semantic.phrase = res;
    			console.log("semantic : " + result.semantic);
    		}
    		else {
    			semantic = JSON.parse('{ "NoMatch": { "phrase": "'+asr_result+'" }}');
    		}
    		mmir.InputEngine.raise("speech_input_event",  semantic);
    		
    	};
    	
    	var errorFunc = function recognizeError (err){
    		$('#mic_button').removeClass('footer_button_clicked');
    		console.error('[AudioInput] Error while finishing recoginition: '+JSON.stringify(err));
    		

       		var msg = JSON.stringify(err);//mobileDS.LanguageManager.getInstance().getText('did_not_understand_msg');
    		mmir.MediaManager.textToSpeech(msg, null, null);
    	};
    	
    	if(isUseEndOfSpeechDetection === false){

    		
    		//WITHOUT end-of-speech-detection (i.e. manual stop by user interaction):	
    		if ($('#mic_button').hasClass('footer_button_clicked')){

    			console.log("[AudioInput] stop recoginition without automtic END OF SPEECH detection");
    			
    			mmir.MediaManager.stopRecord(successFunc, errorFunc);
    	
    		}
    		else {
    			
    			console.log("[AudioInput] start recoginition without automtic END OF SPEECH detection");
    			
    			$('#mic_button').addClass('footer_button_clicked');
    			mmir.MediaManager.startRecord(
//    				function printResult(res){
//    					console.log("[AudioInput] start recoginition: "  + res);
//    				}
    					successFunc//FIXME should have different call for start/start-and-receive-intermediate-results ...
    				, function(err){
    					$('#mic_button').removeClass('footer_button_clicked');
    					setTimeout(function(){errorFunc(err);}, 0);
    					alert('tts failed: '+err);
    				}
    			);
    		}
    		
    	}
    	else {
    		//WITH end-of-speech-detection (i.e. automatic stop by silence detection):

    		console.log("[AudioInput] start recoginition with automatic END OF SPEECH detection");
    		
    		if ($('#mic_button').hasClass('footer_button_clicked')){

    			console.log("[AudioInput] speech recoginition with automtic END OF SPEECH detection: already in progress, stopping now...");
    			
    			
    			mmir.MediaManager.stopRecord(
    				function printResult(res){
    					console.log("[AudioInput] MANUALLY stopped recoginition: "  + JSON.stringify(res));
    					successFunc(res);
    				}, function(err){
    					console.log("[AudioInput] failed to MANUALLY stop recoginition: "  + err);
    					setTimeout(function(){errorFunc(err);}, 0);
    					alert('tts failed: '+err);
    				}
    			);
    			
    		}
    		else {
    			
    			console.log("[AudioInput] starting recoginition with automatic END OF SPEECH detection now...");
    			
    			$('#mic_button').addClass('footer_button_clicked');
    			setTimeout(function(){
    				mmir.MediaManager.recognize(successFunc, errorFunc);
    			}, 1000);
    		}
    	}
    }
    
    
    ///////////////////////////////////////// CLICK FEEDBACK EXAMPLE ////////////////////////////////////////
    
    var IS_SOUND_FEEDBACK  = true;
    var IS_HAPTIC_FEEDBACK = true;
    //default time-duration for click-feedback vibration
    var CLICK_VIBRATE_DURATION = 50;//ms
    
    function isSoundFeedbackEnabled() {
    	var isSound = mmir.ConfigurationManager.get('soundFeedbackEnabled');
    	if(typeof isSound === 'undefined'){
    		isSound = IS_SOUND_FEEDBACK;
    	}
    	return isSound;
    }
    
    function isHapticFeedbackEnabled() {
    	var isHaptic = mmir.ConfigurationManager.get('hapticFeedbackEnabled');
    	if(typeof isHaptic === 'undefined'){
    		isHaptic = IS_HAPTIC_FEEDBACK;
    	}
    	return isHaptic;
    }
    /**
     * 
     * @param config (optional) cofiguration object with fields
     * 			config.audio BOOLEAN set if sound should be included in this feedback
     * 			config.haptic BOOLEAN set if vibration should be included in this feedback
     */
    function triggerClickFeedback(config){
    	
    	var isSound  = config && typeof config.sound  !== 'undefined'? config.sound  : true;
    	var isHaptic = config && typeof config.haptic !== 'undefined'? config.haptic : true;
    	
    	
    	//TODO haptic and sound feedback should be run in parallel, not sequential (... use 'threads'?)
    	if(isHaptic && isHapticFeedbackEnabled()){
    		triggerHapticFeedback();
    	}
    	
    	if(isSound && isSoundFeedbackEnabled()){
    		triggerSoundFeedback();
    	}
    }

    function triggerHapticFeedback(){
		setTimeout(function(){
	    	mmir.NotificationManager.vibrate(CLICK_VIBRATE_DURATION);
		},0);
    }

    function triggerSoundFeedback(){
    	//do not block function, return immediatly using setTimeout
    	setTimeout(function(){
        	mmir.NotificationManager.beep(1);
    	},0);
    }

    function triggerErrorFeedback(){
    	triggerMulitpleVibrationFeedback(3);
    }

    function triggerMulitpleVibrationFeedback(number){
    	
    	var doTriggerErrorVibrateFeedback = function(){
    		setTimeout(function(){ 
    			triggerClickFeedback();
    			++count;
    			if(count < number){
    				doTriggerErrorVibrateFeedback();
    			}
    		}, 4*CLICK_VIBRATE_DURATION);
    	};
    	
    	triggerClickFeedback();
    	var count = 1;
    	if(count < number){
    		doTriggerErrorVibrateFeedback();
    	}
    }
    
    //export feedback-function:
    mmir.app.triggerClickFeedback = triggerClickFeedback;
    
    ///////////////////////////////////////// TEST and DEBUG functions ////////////////////////////////////////
        
    function test_isNetworkAvailable(){
    	
    	// Check if a network connection is established.
    	if (mmir.CommonUtils.checkNetworkConnection() == false){
    		alert("No network connection enabled.\nPlease enable network access.");
    	} else {
    		if(IS_DEBUG_ENABLED) console.log("Network access is available.");
    	}
    	
    };
    
    
});




