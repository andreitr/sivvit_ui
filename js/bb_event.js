$(document).ready(function(jQuery)
{
	var mapModel, mapView, histModel, histView, contentCollection, contentView, jsonModel, controls;
	
	/**
	 * Main container for the loaded JSON data. 
	 */
	JsonModel = Backbone.Model.extend({
		
		defaults:
		{
			id:null,
			title:null,
			author:null,
			description:null,
			keywords:[],
			location:{lon:null, lat:null},
			startDate:new Date(),
			endDate:new Date(),
			status:0,
			stats: { total:0, posts:0, images:0, videos:0 },
			histogram: {global:[], media:[], post:[]},
			content: {media: [], post:[]},  
		}
	})
	
	
	/**
	 * Controls general view. 
	 */
	ControlsView = Backbone.View.extend({
		
		el: "body",
		
		prevButton: null,
		activeButton: "#allBtn",
		
		initialize: function (options)
		{
			this.model = options.model;
			this.model.bind("change", this.render, this);
		},
		
		render: function ()
		{
			//$(this.activeButton).click(this);
		},
		
		events: 
		{
			"click #allBtn": "onButtonClicked",
			"click #postBtn": "onButtonClicked",
			"click #mediaBtn": "onButtonClicked",
			"click #mapBtn": "onButtonClicked"
		},
		
		onButtonClicked: function(event)
		{
			this.prevButton = this.activeButton;
			this.activeButton = "#"+event.target.id;
			
			$(this.activeButton,this).toggleClass('contentButtonSelected',true);
			$(this.prevButton,this).toggleClass('contentButton');
			
			var postTemplate = "<li class='status'><div id='post-avatar'><img src='${avatar}'></div><div id='post'>${content}<div id='post-meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>";
			var mediaTemplate = "<li class='status'><div id='post'><img src='${content}'><div id='post-meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>";
			
			switch(event.target.id)
			{
				case "allBtn":
					histModel.set({histogram:this.model.get("histogram").global});
					this.populateContent(this.model.get("content").post, postTemplate);
					break;
					
				case "postBtn":
					histModel.set({histogram:this.model.get("histogram").post});
					this.populateContent(this.model.get("content").post, postTemplate);
					break;
					
				case "mediaBtn":
					histModel.set({histogram:this.model.get("histogram").media});
					this.populateContent(this.model.get("content").media, mediaTemplate);
					break;
			}
		},
		
		/**
		 * Populates content data
		 */
		populateContent: function (content, template)
		{
			var tmpCollection = [];
			
			// Populate content collection
			for(var i=0; i<content.length; i++)
			{
				tmpCollection.push(new ContentModel(content[i]));
			}
		
			contentCollection.reset(tmpCollection);
		
			contentView.render({collection:contentCollection, template: template});
		}
	});
	
	
	/**
	 * Generic conetnt model.
	 */
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
	
	
	/**
	 * 
	 */
	ContentCollection = Backbone.Collection.extend({
		model:ContentModel,		
	});
	
	
	/**
	 * 
	 */
	ContentView = Backbone.View.extend({
		
		el: '#status-list',	
		
		render: function (options)
		{	
			this.collection = options.collection;
			this.template = options.template;
			
			// Clear out previous content 
			$(this.el).empty();
			
			// Render collection
			this.collection.each(function (itm)
			{
				var html = $.tmpl(this.template, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
				$(this.el).append(html);
			}, this);
		}
	});
	
	
	/**
	 * 
	 */
	HistogramModel = Backbone.Model.extend({
		defaults:
		{
			startDate: new Date(),
			endDate: new Date(),
			histogram:null
		}
	});
	
	
	/**
	 * 
	 */
	HistogramView = Backbone.View.extend({

		el : '#timeline-container',
		
		initialize: function (options)
		{
			this.model = options.model;
			this.model.bind("change:histogram", this.render, this);
		},
		
		render : function()
		{
		 	this.drawHistogram();
		},
		
		
		drawHistogram: function () 
		{
			var histogram, i, len, lenTotal, maxVal, minVal, maxHeight, percentY, percentX, barW, barH, barX, barY, barXPadding, attributes;
			
			attributes = {fill : "#999999","stroke-width" : 0};
				
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
				
				barH = Math.round(percentY * maxHeight / 100);
				barX = barW*Math.round(percentX*(lenTotal-1));
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

	
	/**
	 * 
	 */
	MapModel = Backbone.Model.extend({
		defaults: {
            location: {"lon":0, "lat":0}
        },
	});
	
	
	/**
	 * 
	 */
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
	
	
	
	mapModel = new MapModel();
	mapView = new MapView({model:mapModel});
	
	histModel = new HistogramModel();
	histView = new HistogramView({model:histModel});

	contentCollection = new ContentCollection();
	
	contentView = new ContentView();
	jsonModel = new JsonModel();
	
	controls = new ControlsView({model:jsonModel});
	
	$.getJSON("embed/json/event.json", {}, function(data)
	{
		jsonModel.set(data);
		
		histModel.set({startDate:new Date(jsonModel.get("startDate")), endDate:new Date(jsonModel.get("endDate"))});
		
		mapModel.set({location:jsonModel.get("location")});		
	});
});