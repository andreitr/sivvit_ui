if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};

}(function(jQuery, SIVVIT) {

	SIVVIT.UserHeader = {
		
		model : null,
		view : null,

		// Initiates the application and loads the main data.
		init : function(json) {

			this.model = new SIVVIT.UserModel({
				url : json
			});

			this.view = new SIVVIT.UserHeaderView({
				model : this.model
			});

			this.model.fetch();
		}
	};
})($, SIVVIT);
