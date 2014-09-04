var IS_DEBUG_ENABLED = false;	

mmir.ready(function () {
	
	test_isNetworkAvailable();
	
	//prepare app-module object for public export of functions etc.
	mmir.app = {};
	
    //initialize BACK-BUTTON handling:
	initHistoryBackHandler();
	
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
        		
        		//let state-machine handle BACK event
        		// -> see config/statedef/dialogDescriptionSCXML.xml transition for back-event
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
        
    }
    
    ///////////////////////////////////////// TEST and DEBUG functions ////////////////////////////////////////
        
    function test_isNetworkAvailable(){
    	
    	// Check if a network connection is established.
    	if (mmir.CommonUtils.checkNetworkConnection() == false){
    		alert("No network connection enabled.\nPlease enable network access.");
    	} else {
    		console.log("Network access is available.");
    	}
    	
    };
    
    
});




