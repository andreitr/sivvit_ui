if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};

}(function(jQuery, SIVVIT) {

	SIVVIT.UserHeader = {

		model : null,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;

			this.model = new SIVVIT.Model();

			this.model.url = json;
			this.model.fetch();

			this.model.bind("change", function() {
				
				console.log("loaded");

				// Move all this jazz into a separate view
				$("#user-avatar").append("<img src='http://a0.twimg.com/profile_images/1169898172/01_normal.jpg' width='48' height='48'>");
				$("#user-title").append("andreitr (Andrei Taraschuk)");

				$("#user-meta").html("<span class='icon-location'></span>Denver, Co");
				$("#user-meta").append("&nbsp<span class='icon-user'></span>membed since January 24, 1981");

			}, this);
		}
	}

	// Main model responsible for loading and mainaining data
	SIVVIT.Model = Backbone.Model.extend({});

})($, SIVVIT);
