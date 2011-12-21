if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
	
}(function(jQuery, SIVVIT) {

	SIVVIT.EditEvent = {

		// SIVVIT.Model
		model : null,

		//SIVVIT.EditEventView
		view : null,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;

			this.model = new SIVVIT.Model();
			this.view = new SIVVIT.EditEventView({model:this.model});

			this.model.url = json;
			this.model.fetch();
		}
	};

	// Main edit event view
	SIVVIT.EditEventView = Backbone.View.extend({
		
		el: "document",
		
		required_fields: [{
				field : "input[name='title']",
				icon : '#icon-title',
				type : 'string'
			}, {
				field : "input[name='keywords']",
				icon : '#icon-keywords',
				type: 'string'
			},{
				field : "input[name='start-date']",
				icon : '#icon-start-date',
				type: 'string'
			}],
		
		
		initialize: function(options){
			
			var self = this;
			
			this.model = options.model;
			this.model.bind("change", this.update, this);
			
			$("input").change(function() {
				self.validate();
			});
		},
		
		// Updates view
		update: function(){
			
			var slef = this;
			
			$("input[name='title']").val(this.model.get("title"));
			$("input[name='location']").val(this.model.get("location").name);
			$("input[name='keywords']").val(this.model.get("keywords"));

			// Start date
			$("input[name='start-date']").datepicker({ defaultDate:new Date(this.model.get("startDate"))});
			$("input[name='start-date']").val(new Date(this.model.get("startDate")).toDateString());
			
			// End date
			$("input[name='end-date']").datepicker({defaultDate: new Date(this.model.get("endDate")) });
			$("input[name='end-date']").val(new Date(this.model.get("endDate")).toDateString());

			$('#collection-btn').html(this.model === 0 ? 'Start Collection' : 'Start Collection');
			
			this.validate();
		},
		
		// Validates all required form fields
		validate: function () {
			
			var i, field, valid, icon;
			
			for(i = 0; i < this.required_fields.length; i++) {

				field = $(this.required_fields[i].field);
				
				valid = this.validateValue(field.val(), this.required_fields[i].type)
				icon = $(this.required_fields[i].icon);
				
				field.css('background-color', valid ? "#FFFFCC" : "#FFFFFF");
				icon.toggleClass('icon-check-green', valid ? false : true);
				icon.toggleClass('icon-check-red', valid ? true : false);
			}
		},
		
		// Validates specific value based on the type
		validateValue: function(value, type)
		{
			switch(type){
				case "string":
					return value.match('^$');
			}
		}	
	});

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
