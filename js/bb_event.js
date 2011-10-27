$(document).ready(function(jQuery) {
	
	HistogramModel = Backbone.Model.extend({
	
	});
	
	MapModel = Backbone.Model.extend({
		
	})
	
	HistogramView = Backbone.View.extend({

		el : '#timeline-container',

		events : {
			'click #sayhello' : 'onButtonClicked'
		},

		onButtonClicked : function() {
			console.log("buttonclicked");
		},
		render : function(model) {
			$("#start-date").html(model.startDate);
			$("#end-date").html(model.endDate);
		},
	});
	
	MapView = Backbone.View.extend({
		
		el: '#mapCanvas',
		
		render: function (model)
		{
		
			var latlng = new google.maps.LatLng(model.get("location").lon,model.get("location").lat);
	
			var myOptions = {
				zoom : 9,
				center : latlng,
				mapTypeId : google.maps.MapTypeId.ROADMAP,
				disableDefaultUI : true
			};
	
			var map = new google.maps.Map( container = $('#mapCanvas')[0], myOptions);


		}
		
	})

	$.getJSON("embed/json/event.json", {}, function(data) {

		var histModel = new HistogramModel({startDate:data.startDate, endDate:data.endDate});
		
		var mapModel = new MapModel({location:data.location});
		var mapView = new MapView();
		mapView.render(mapModel);
	})
});
