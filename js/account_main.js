if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
}(function(jQuery) {

	SIVVIT.Event = {

		// Enables content editing when set to true
		edit : true,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;
			
			$("#event-application").show();
		}
	};
})();

