$(document).ready(function(jQuery)
{
	var mapModel, mapView, histModel, histView, postView, mediaView, allView, jsonModel, controls;
	var renderedContent = [];
	
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
			content: [],  
		}
	})
	
	/**
	 * Generic conetnt model.
	 */
	ContentModel = Backbone.Model.extend({
		
		defaults:
		{
			type:null,
			location:[], 
			content:null,
			source:null,
			timestamp:new Date(),
			rank:0,
			author:null,
			avatar:null
		}
	});
	
	ContentCollection = Backbone.Collection.extend({
		model:ContentModel,
		
		comparator: function(itm) {
  			return itm.get("timestamp");
		},
	});
	
	/**
	 * Controls general view. 
	 */
	ControlsView = Backbone.View.extend({
		
		el: "body",
		
		prevButton: null,
		activeButton: "#allBtn",
		activeView:"",
		
		
		initialize: function (options)
		{
			this.model = options.model;
			this.model.bind("change", this.render, this);
			
		},
		
		render: function ()
		{
			$(this.activeButton).click();
		},
		
		events: 
		{
			"click #allBtn": "onButtonClicked",
			"click #postBtn": "onButtonClicked",
			"click #mediaBtn": "onButtonClicked",
			"click #mapBtn": "onButtonClicked",
		},
		
		onButtonClicked: function(event)
		{
			this.prevButton = this.activeButton;
			this.activeButton = "#"+event.target.id;
			
			$(this.activeButton).toggleClass('tabBtn',false);
			$(this.activeButton).toggleClass('tabBtnSelected',true);
			
			if(this.prevButton != this.activeButton)
			{
				$(this.prevButton).toggleClass('tabBtn', true);
				$(this.prevButton).toggleClass('tabBtnSelected', false);
			}
			
			switch(event.target.id)
			{
				case "allBtn":
					histModel.set({histogram:this.model.get("histogram").global});
					allView.render({collection:this.populateContent(this.model.get("content"))});
					break;
					
				case "postBtn":
					histModel.set({histogram:this.model.get("histogram").post});
					postView.render({collection:this.populateContent(this.model.get("content"))});
					break;
					
				case "mediaBtn":
					histModel.set({histogram:this.model.get("histogram").media});
					mediaView.render({collection:this.populateContent(this.model.get("content"))});
					break;		
			}
			
		},
		
		/**
		 * Populates content data
		 */
		populateContent: function (content)
		{
			var tmpCollection = [];
			
			// Populate content collection
			for(var i=0; i<content.length; i++)
			{
				tmpCollection.push(new ContentModel(content[i]));
			}
			return new ContentCollection(tmpCollection);
		}
	});
	
	
	AllView = Backbone.View.extend({
		
		el:'#dynamic-content',

		render: function (options)
		{	
				this.model = options.collection;
				
				// Clear out previous content 
				$(this.el).empty();
				$(this.el).html("<ol id='nothing'></ol>");
				
				this.el = "#nothing";
				
				var html;
				
				// Render collection
				this.model.each(function (itm)
				{
					if(itm.get("type") == "media")
					{
						 html = $.tmpl(mediaView.templateAll, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
					}else if(itm.get("type") == "post"){
						 html = $.tmpl(postView.template, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
					}
					renderedContent.push({timestamp:itm.get("timestamp"), html:html});
					
					$(this.el).append(html);
				}, this);
			}
		
	})
	
	
	PostView = Backbone.View.extend({
		
		el:'#dynamic-content',
		template: "<li id='post-list'><div id='avatar'><img src='${avatar}'></div><div id='content'>${content}<div id='meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",

		render: function (options)
		{	
			this.model = options.collection;
			
			// Clear out previous content 
			$(this.el).empty();
			$(this.el).html("<ol id='nothing'></ol>");
			
			this.el = "#nothing";
			
			// Render collection
			this.model.each(function (itm)
			{
				if(itm.get("type") == "post")
				{
					var html = $.tmpl(this.template, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
					renderedContent.push({timestamp:itm.get("timestamp"), html:html});
					$(this.el).append(html);
				}
			}, this);
		}
	});
	
	
	MediaView = Backbone.View.extend({
		
		el: '#dynamic-content',	
		
		templateAll: "<li id='post-list'><img height='200' src='${content}'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></li>",

		template: "<li id='media-list'><div id='container'><img width='160' src='${content}'></div><div id='footer'>by ${author}</div></li>",
		
		render: function (options)
		{	
			this.model = options.collection;
			
			// Clear out previous content 
			$(this.el).empty();
			$(this.el).html("<ol id='nothing'></ol>");
			
			this.el = "#nothing";
			
			// Render collection
			this.model.each(function (itm)
			{
				if(itm.get("type") == "media")
				{
					var html = $.tmpl(this.template, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
					renderedContent.push({timestamp:itm.get("timestamp"), html:html});
					$(this.el).append(html);
				}
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
			startRange: new Date(), 
			endRange: new Date(),
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
		
		bars:[],
		
		render : function()
		{
		 	this.drawHistogram();
		 	this.drawSlider();
		 	
		 	
		},
		
		drawSlider: function ()
		{
			self = this;
			
			$("#timeline-slider").slider({
				range: true,
				min: this.model.get("startDate").getTime(),
				max: this.model.get("endDate").getTime(),
				values: [ this.model.get("startRange").getTime(), this.model.get("endRange").getTime() ],
				stop: function (event, ui){ self.onSliderDragged(event, ui)}, 
			});
		},
		

		onSliderDragged: function (event, ui)
		{
			this.model.set({"startRange": new Date(ui.values[0])});
			this.model.set({"endRange": new Date(ui.values[1])});
			
			this.updateHistogram();
			
			if(renderedContent.length > 0)
		 	{
		 		for(var i=0; i<renderedContent.length; i++)
		 		{
		 			var timestamp = new Date(renderedContent[i].timestamp).getTime();

					if(timestamp >= this.model.get("startRange").getTime() && timestamp <= this.model.get("endRange").getTime()) {
						$(renderedContent[i].html).fadeIn();
					} else {
						$(renderedContent[i].html).fadeOut();
					}
		 		}
		 	}
		},

		updateHistogram: function ()
		{
			for(var i=0; i<this.bars.length; i++)
			{
				this.updateHistogramBar(this.bars[i]);
			}
		},
		
		updateHistogramBar: function (bar)
		{
			if(new Date(bar.timestamp).getTime() >= this.model.get("startRange").getTime() && new Date(bar.timestamp).getTime() <= this.model.get("endRange").getTime())
				{
					bar.attr({fill:"#333333"});
				}else{
					bar.attr({fill:"#CCCCCC"});
				}
		},
			
		drawHistogram: function () 
		{
			if(this.model.get("histogram"))
			{
				var barFill, histogram, i, len, lenTotal, maxVal, minVal, maxHeight, percentY, percentX, barW, barH, barX, barY, barXPadding;
					
				// Total count of available slots	
				lenTotal = Math.round((this.model.get("endDate").getTime() - this.model.get("startDate").getTime())/86400000);
				
				// Acutal count of temporal slots
				len = this.model.get("histogram").length;
				
				maxVal = 10;
				minVal = 1;
				maxHeight = $(this.el).height() - 20;
				barXPadding = 0;
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
					
					var bar = histogram.rect(barX, barY, barW, barH).attr({fill:"#333333", "stroke-width" : 0});
					bar.timestamp = frame.timestamp;
					this.updateHistogramBar(bar);
					this.bars.push(bar);
				}
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
	
	allView = new AllView();
	postView = new PostView();
	mediaView = new MediaView();
	
	jsonModel = new JsonModel();
	
	controls = new ControlsView({model:jsonModel});
	
	$.getJSON("embed/json/event.json", {}, function(data)
	{
		histModel.set({startDate:new Date(data.startDate), endDate:new Date(data.endDate), startRange:new Date(data.startDate), endRange:new Date(data.endDate)});
		
		jsonModel.set(data);
		
		mapModel.set({location:jsonModel.get("location")});
	});
});