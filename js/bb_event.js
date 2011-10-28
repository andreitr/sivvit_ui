$(document).ready(function(jQuery)
{
	
	HistogramModel = Backbone.Model.extend({
		defaults:
		{
			startDate:"",
			endDate:""
		}
	});
	
	
	HistogramView = Backbone.View.extend({

		el : '#timeline-container',
		
		initialize: function (options)
		{
			this.model = options.model;
			this.model.bind("change", this.render, this);
		},
		
		render : function() {
			$(this.el).html(this.model.get("startDate"));
			$(this.el).append(this.model.get("endDate"));
			
			console.log(this.model.startDate);			
		},
	});
	
	
	MapModel = Backbone.Model.extend({
		defaults: {
            location: {"lon":0, "lat":0}
        },
	});
	
	
	MapView = Backbone.View.extend({
		
		el: '#mapCanvas',
	
		initialize: function (options)
		{
			this.model = options.model;
			this.model.bind("change", this.render, this);
		},
		
		render: function ()
		{
			var latlng = new google.maps.LatLng(this.model.get("location").lon, this.model.get("location").lat);
	
			var myOptions = {
				zoom : 9,
				center : latlng,
				mapTypeId : google.maps.MapTypeId.ROADMAP,
				disableDefaultUI : true
			};
	
			var map = new google.maps.Map( container = $(this.el)[0], myOptions);
		}
	});
	
	var mapModel = new MapModel();
	var mapView = new MapView({model:mapModel});
	
	var histModel = new HistogramModel();
	var histView = new HistogramView({model:histModel});

	
	$.getJSON("embed/json/event.json", {}, function(data) {

		mapModel.set({location:data.location});
		histModel.set({startDate:data.startDate, endDate:data.endDate});		

	})
});
