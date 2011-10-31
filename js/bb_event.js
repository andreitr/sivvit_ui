$(document).ready(function(jQuery)
{
	
	ContentModel = Backbone.Model.extend({
		
		defaults:
		{
			content:"",
			source:"",
			timestamp:new Date(),
			rank:0,
			author:"",
			avatar:""
		}
	});
	
	ContentCollection = Backbone.Collection.extend({
		model:ContentModel,		
	});
	
	
	ContentView = Backbone.View.extend({
		
		el: '#status-list',	
		template: $.template("contentTemplate",	"<li class='status'><div id='post-avatar'><img src='${avatar}'></div><div id='post'>${content}<div id='post-meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>"),
		
		initialize: function (options)
		{
			this.model = options.model;
			this.model.bind("add", this.onContentAdded, this);
		},
		
		onContentAdded: function (itm)
		{
			var html = $.tmpl(this.template, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
			$(this.el).append(html);
		}
	});
	
	HistogramModel = Backbone.Model.extend({
		defaults:
		{
			startDate: new Date(),
			endDate: new Date(),
			histogram: []
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
		
		
		drawHistogram: function () {
			var histogram, i, len, lenTotal, maxVal, minVal, maxHeight, percentY, percentX, barW, barH, barX, barY, barXPadding, attributes;
			
			attributes = {gradient : "90-#333333-#555555","stroke-width" : 0};
				
			// Total count of available slots	
			lenTotal = Math.round((this.model.get("endDate").getTime() - this.model.get("startDate").getTime())/86400000);
			// Acutal count of temporal slots
			len = this.model.get("histogram").length;
			
			maxVal = 10;
			minVal = 1;
			maxHeight = $(this.el).height() - 20;
			barXPadding = 1;
			histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());
			barW = ($(this.el).width() - (barXPadding * lenTotal)) / lenTotal;

			for( i = 0; i < len; i += 1)
			{
				var frame = this.model.get("histogram")[i];
				percentY = (frame.count / maxVal) * 100;
				percentX = (new Date(frame.timestamp).getTime()-this.model.get("startDate").getTime()) / (this.model.get("endDate").getTime()-this.model.get("startDate").getTime());
				
				barW*Math.round(percentX*(lenTotal-1));
				//console.log(barW*Math.round(percentX*(len-1)))
				
				barH = Math.round(percentY * maxHeight / 100);
				barX = barW*Math.round(percentX*(lenTotal-1));//Math.round(i * (barW + barXPadding));
				barY = Math.round($(this.el).height() - barH)

				var bar = histogram.rect(barX, barY, barW, barH).attr(attributes);

				bar.mouseover(function() {
					this.attr({
						fill : "#007AA2",
						cursor : "pointer"
					});
				});

				bar.mouseout(function() {
					this.attr(attributes);
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
				zoom : 13,
				center : latlng,
				mapTypeId : google.maps.MapTypeId.ROADMAP,
				disableDefaultUI : true
			};
	
			var map = new google.maps.Map( container = $(this.el)[0], myOptions);
			
			$("#mapLabel").append("Red Rocks, Morrison CO");
		}
	});
	
	var mapModel = new MapModel();
	var mapView = new MapView({model:mapModel});
	
	var histModel = new HistogramModel();
	var histView = new HistogramView({model:histModel});

	var contentCollection = new ContentCollection();
	var contentView = new ContentView({model:contentCollection});
	
	$.getJSON("embed/json/event.json", {}, function(data)
	{
		mapModel.set({location:data.location});
		histModel.set({startDate:new Date(data.startDate), endDate:new Date(data.endDate), histogram:data.histogram.post});
		
		// Populate content collection
		for(var i=0; i<data.content.post.length; i++)
		{
			contentCollection.add(new ContentModel(data.content.post[i]));
		}
	});
});
