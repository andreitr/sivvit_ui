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

				// Move all this jazz into a separate view
				$("#user-avatar").append("<img src='http://a0.twimg.com/profile_images/1169898172/01_normal.jpg' width='48' height='48'>");
				$("#user-title").append(this.model.get("user_name")+" ("+this.model.get("real_name")+")");

				$("#user-meta").html("<span class='icon-location'></span>"+this.model.get("location").name);
				$("#user-meta").append("&nbsp<span class='icon-user'></span>membed since January 24, 1981");

			}, this);
		}
	}

	// Main model responsible for loading and mainaining data
	SIVVIT.Model = Backbone.Model.extend({

		defaults : {

			id : 0,
			real_name : null,
			user_name : null,
			premium : 0,
			location : {
				name : "Null Island",
				lon : 0,
				lat : 0
			}
		}
	});

})($, SIVVIT);
