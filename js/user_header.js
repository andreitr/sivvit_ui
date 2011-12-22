if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};

}(function(jQuery, SIVVIT) {

	SIVVIT.UserHeader = {

		model : null,

		// Initiates the application and loads the main data.
		init : function(json) {

			this.model = new SIVVIT.Model({url:json});

			this.model.url = json;
			this.model.fetch();

			this.model.bind("change", function() {
				
				// Display all necessary data
				$("#user-avatar").append("<img src='" + this.model.get("avatar") + "' width='48' height='48'>");
				$("#user-title").append(this.model.get("user_name") + " (" + this.model.get("real_name") + ")");

				$("#user-meta").html("<span class='icon-location'></span>" + this.model.get("location").name);
				$("#user-meta").append("&nbsp<span class='icon-user'></span>membed since " + new Date(this.model.get("joined")).toDateString());

			}, this);
		}
	};

	// Main model responsible for loading and mainaining data
	SIVVIT.Model = Backbone.Model.extend({

		defaults : {

			id : 0,
			real_name : null,
			user_name : null,
			premium : 0,
			joined : null,
			location : {
				name : "Null Island",
				lon : 0,
				lat : 0
			}
		}
	});

})($, SIVVIT);
