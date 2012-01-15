if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};

}(function(jQuery, SIVVIT) {

	SIVVIT.UserHeader = {

		model : null,

		// Initiates the application and loads the main data.
		init : function(json) {

			this.model = new SIVVIT.UserModel({url:json});

			this.model.url = json;
			this.model.fetch();

			this.model.bind("change", function() {
				
				// Display all necessary data
				$("#user-avatar").append("<img src='" + this.model.get("avatar") + "' width='36' height='36'>");
				$("#user-title").append(this.model.get("user_name") + " (" + this.model.get("real_name") + ")");

				$("#user-meta").html("<span class='icon-location'></span>" + this.model.get("location").name);
				$("#user-meta").append("&nbsp<span class='icon-user'></span>membed since " + new Date(this.model.get("joined")).toDateString());

			}, this);
		}
	};


})($, SIVVIT);
