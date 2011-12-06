if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
}(function(jQuery) {

	SIVVIT.Event = {

		// Enables content editing when set to true
		edit : true,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;
			
			$("#user-avatar").append("<img src='http://a0.twimg.com/profile_images/1169898172/01_normal.jpg' width='48' height='48'>");
			$("#user-title").append("andreitr (Andrei Taraschuk)");
		
			$("#user-meta").html("<span class='icon-location'></span>Denver, Co");
			$("#user-meta").append("&nbsp<span class='icon-user'></span>membed since January 24, 1981");
			
			$("#event-application").show();
		}
	};
})();

