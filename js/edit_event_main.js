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
				
				var self = this;
				
				$("input[name='title']").val(this.model.get("title"));
				
				$("input[name='title']").change(function() {
						
					if($("input[name='title']").val() === ''){
						$('#required-title').toggleClass('icon-check-green', false);
						$('#required-title').toggleClass('icon-check-red', true);
					}else{
						$('#required-title').toggleClass('icon-check-green', true);
						$('#required-title').toggleClass('icon-check-red', false);
					}
				});


				
				
				//required-title
				
				
				$("input[name='location']").val(this.model.get("location").name);
				$("input[name='keywords']").val(this.model.get("keywords"));
				
				$("input[name='start-date']").val(this.model.get("startDate"));
				$("input[name='end-date']").val(this.model.get("endDate"));
				
				$('#collection-btn').html( this.model === 0 ? 'Start Collection' : 'Start Collection');
				
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
