$(document).ready(function(jQuery)
{
	
	HistogramModel = Backbone.Model.extend({
		defaults:
		{
			startDate:"",
			endDate:"",
			histogram:[]
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
			this.drawHistogram();
		},
		
		
		drawHistogram: function ()
		{
			var histogram, i, len, maxVal, minVal, maxHeight, percent, barW, barH, barX, barY, barXPadding;
			len = this.model.get("histogram").length;
		
			maxVal = 6;
			minVal = 2;
			maxHeight = $(this.el).height() - 20;
			barXPadding = 1;
			histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());
			barW = ($(this.el).width() - (barXPadding * len)) / len;

			for( i = 0; i < len; i += 1) {
				percent = (this.model.get("histogram")[i].count / maxVal) * 100;
				barH = Math.round(percent * maxHeight / 100);
				barX = Math.round(i * (barW + barXPadding));
				barY = Math.round($(this.el).height() - barH)

				var bar = histogram.rect(barX, barY, barW, barH).attr( {gradient:"90-#333333-#555555", "stroke-width":0})
				
			
				bar.mouseover(function() {
					this.attr({
						fill : "#007AA2",
						cursor : "pointer"
					});
				});

				bar.mouseout(function() {
					this.attr( {gradient:"90-#333333-#555555", "stroke-width":0});
				});


			}

		
		}
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
		histModel.set({startDate:data.startDate, endDate:data.endDate, histogram:data.histogram.global});		
	});
});
