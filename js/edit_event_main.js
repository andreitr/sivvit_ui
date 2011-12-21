if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
	
}(function(jQuery, SIVVIT) {

	SIVVIT.EditEvent = {

		// SIVVIT.Model
		model : null,

		//SIVVIT.EventsView
		view : null,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;

			this.model = new SIVVIT.Model();

			this.model.url = json;
			this.model.fetch();

			this.model.bind("change", function() {
				
				$("input[name='title']").val(this.model.get("title"));
				$("input[name='location']").val(this.model.get("location").name);
				$("input[name='keywords']").val(this.model.get("keywords"));
				$("input[name='start-date']").val(this.model.get("startDate"));
				$("input[name='end-date']").val(this.model.get("endDate"));
				
			}, this);
		}
	};

	// Contains event data
	SIVVIT.Model = Backbone.Model.extend({

		defaults : {
			id : null,
			title : null,
			author : null,
			description : null,
			keywords : [],
			location : {
				lon : null,
				lat : null,
				name : null
			},
			startDate : new Date(),
			endDate : new Date(),
			status : 0,
			pending : 0,
			stats : {
				total : 0,
				posts : 0,
				images : 0,
				videos : 0
			},
			histogram : {
				min : null,
				max : null,
				resolution : null,
				global : []
			}
		}
	});

})($, SIVVIT);
