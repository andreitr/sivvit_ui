(function(jQuery, SIVVIT) {

	SIVVIT.EditEvent = {

		// SIVVIT.EventModel
		model : null,

		//SIVVIT.EditEventView
		view : null,

		// Initiates the application and loads the main data.
		init : function(id) {
			var self = this;

			// Make sure that the histogram is not requested with the data
			this.model = new SIVVIT.EventModel({
				json : 'http://sivvit.com/event/' + id + '.json?callback=?',
				meta : 0,
				limit : 0,
				bucket_limit : 0
			});
			this.view = new SIVVIT.EditEventView({
				model : this.model
			});
			this.model.setRequestURL();
			this.model.fetch();
		}
	};

	// Main edit event view
	SIVVIT.EditEventView = Backbone.View.extend({

		el : "document",

		// Google map instance
		map : null,
		// Auto complete
		map_complete : null,

		required_fields : [{
			field : "input[name='title']",
			icon : '#icon-title',
			type : 'string'
		}, {
			field : "input[name='keywords']",
			icon : '#icon-keywords',
			type : 'string'
		}, {
			field : "input[name='start-date']",
			icon : '#icon-start-date',
			type : 'string'
		}],

		initialize : function(options) {

			var self = this;

			this.model = options.model;
			this.model.bind("change", this.update, this);
			this.model.bind("change:location", this.initMap, this);

			$("input").change(function() {
				self.validate();
			});
		},
		// Updates view
		update : function() {

			var slef = this;

			$('#form-container').show();
			$('#content-loader').hide();

			$("input[name='title']").val(this.model.get("title"));
			$("input[name='location']").val(this.model.get("location").name);
			$("input[name='keywords']").val(this.model.get("keywords"));

			// Start date
			$("input[name='start-date']").datepicker({
				defaultDate : new Date(this.model.get("startDate"))
			});
			$("input[name='start-date']").val(new Date(this.model.get("startDate")).toDateString());

			// End date
			$("input[name='end-date']").datepicker({
				defaultDate : new Date(this.model.get("endDate"))
			});
			$("input[name='end-date']").val(new Date(this.model.get("endDate")).toDateString());

			$('#collection-btn').html(this.model === 0 ? 'Start Collection' : 'Start Collection');

			this.validate();
		},
		// Validates all required form fields
		validate : function() {

			var i, field, valid, icon;

			for( i = 0; i < this.required_fields.length; i++) {
				field = $(this.required_fields[i].field);
				valid = this.validateValue(field.val(), this.required_fields[i].type);
				icon = $(this.required_fields[i].icon);

				field.css('background-color', valid ? "#FFFFCC" : "#FFFFFF");
				icon.toggleClass('icon-check-green', valid ? false : true);
				icon.toggleClass('icon-check-red', valid ? true : false);
			}
		},
		// Validates specific value based on the type
		validateValue : function(value, type) {
			if(type === "string") {
				return value.match('^$');
			}
		},
		// Initializes map display and auto-complete location field
		initMap : function() {

			var self = this;
			this.map = new google.maps.Map($("#form-map")[0], {
				center : new google.maps.LatLng(45, 39),
				zoom : 8,
				disableDefaultUI : true,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			});

			this.map_complete = new google.maps.places.Autocomplete($("input[name='location']")[0]);
			google.maps.event.addListener(this.map_complete, 'place_changed', function() {
				var place = self.map_complete.getPlace();
				self.map.setCenter(place.geometry.location);

				self.model.set({
					'location' : {
						'lat' : place.geometry.location.lat(),
						'lon' : place.geometry.location.lng(),
						'name' : place.name
					}
				}, {
					silent : true
				});
			});
		}
	});
})($, SIVVIT);
