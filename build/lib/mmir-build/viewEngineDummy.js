define(['mmirf/util/deferred'], function(Deferred) {

var promise = new Deferred();

var _renderEngine = {
	render: function(ctrlName, viewName, view, ctrl, data) {
		console.error('PresentationManager[dummyViewEngine].render: dummy rendering engine!');
	},
	showDialog: function(ctrlName, dialogId, data) {
		console.error('PresentationManager[dummyViewEngine].showDialog: dummy rendering engine!');
	},
	hideCurrentDialog: function() {
		console.error('PresentationManager[dummyViewEngine].hideCurrentDialog: dummy rendering engine!');
	},
	showWaitDialog: function(text, data) {
		console.error('PresentationManager[dummyViewEngine].showWaitDialog: dummy rendering engine!');
	},
	hideWaitDialog: function() {
		console.error('PresentationManager[dummyViewEngine].hideWaitDialog: dummy rendering engine!');
	}
};

promise.resolve(_renderEngine);

return promise;

});
