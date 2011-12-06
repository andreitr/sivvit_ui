if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
	
}(function(jQuery, SIVVIT) {

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
	

	SIVVIT.Account = Backbone.Model.extend({

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
				global : [],
				media : [],
				post : []
			},
			content : []
		}
	});


	
})(SIVIT);



