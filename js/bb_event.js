(function(jQuery)
{
	SIVVIT = {};
	
	SIVVIT.init = function (json_path)
	{
	
	var sideMapView, histModel, histView, postView, mediaView, allView, jsonModel, controls;
			
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
				content: []
			}		
		});
		
		/**
		 * Generic conetnt model.
		 */
		ContentModel = Backbone.Model.extend({
			defaults:
			{
				id:null,
				status:null,
				type:null,
				location:[], 
				content:null,
				source:null,
				timestamp:"",
				rank:0,
				author:null,
				avatar:null
			}
		});
		
		/**
		 * 
		 */
		ContentCollection = Backbone.Collection.extend({
			model:ContentModel,
			
			// Sort content by timestamp
			comparator: function(itm) {
	  			return itm.get("timestamp");
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
				startRange: null,
				endRange: null,
				histogram:null
			}
		});
		
		
		/**
		 * Controls general view. 
		 */
		ControlsView = Backbone.View.extend({
			
			el: "#navigation-content",
			
			prevButton: null,
			activeButton: null,
			activeView:null,
			prevView:null,
			
			collection:null,
			
			pendingCount:0,
			
			events: 
			{
				"click #allBtn": 	"render",
				"click #postBtn": 	"render",
				"click #mediaBtn": 	"render",
				"click #mapBtn": 	"render",
				"click #pendingBtn": 	"render"
			},
			
			update: function(){
				
				var tmp = [];
				var con = jsonModel.get("content");
				var len = this.collection ? this.collection.length : 0;
				var i, itm, newCount, model;
				
				if(!this.collection){
					
					// Create new collection	
					for(i = 0; i<con.length; i++){
						model = new ContentModel(con[i]);
						tmp.push(model);
						
						// We have pending content.	
						if(model.get("status") === 0){ this.pendingCount +=1; }
					}
					this.collection = new ContentCollection(tmp);
					this.render();
	
				}else{
					
					// Add new items to the exisiting collection
					newCount = 0;
					
					for(i = 0; i<con.length; i++){
						model = new ContentModel(con[i]);
						this.collection.add(model, {at:len +=1, silent:true});
						
						// Show pending content only for the specific type
						if(this.activeView.buildTemplate(model)){	newCount++;	}
						
						// We have pending content.	
						if(model.get("status") === 0){ this.pendingCount +=1; }
					}
					if(newCount > 0){
						this.activeView.update(newCount);
					} 
				}
				// Display pending content
				if(this.pendingCount > 0){ $("#pendingBtn").html("Pending "+this.pendingCount+" items");}
			},
			
			updatePending: function(value)
			{
				this.pendingCount = value === 0 ? this.pendingCount +1 : this.pendingCount -1;
				if(this.pendingCount >= 0){	$("#pendingBtn").html("Pending "+this.pendingCount+" items");}
			},
			
			render: function (event)
			{
				this.renderView(event ? event : {target:{id:"allBtn"}});
			},
			
			/**
			 * Renders view when a user clicks on one of the buttons.
			 */
			renderView: function(event)
			{
				// Don't do anything if a view is already rendered
				if(this.activeButton == "#"+event.target.id){
					return;	
				}
				
				this.prevButton = this.activeButton;
				this.activeButton = "#"+event.target.id;
				
				$(this.activeButton).toggleClass('tabBtn',false);
				$(this.activeButton).toggleClass('tabBtnSelected',true);
				
				if(this.prevButton != this.activeButton)
				{
					$(this.prevButton).toggleClass('tabBtn', true);
					$(this.prevButton).toggleClass('tabBtnSelected', false);
				}
				
				if(this.activeView)
				{
					this.prevView = this.activeView;
					this.prevView.unbind({temporal:histModel});
				}
				
				switch(event.target.id)
				{
					case "allBtn":
						histModel.set({histogram:jsonModel.get("histogram").global});
						this.activeView = allView;
						break;
						
					case "postBtn":
						histModel.set({histogram:jsonModel.get("histogram").post});
						this.activeView = postView;
						break;
						
					case "mediaBtn":
						histModel.set({histogram:jsonModel.get("histogram").media});
						this.activeView = mediaView;
						break;
					
					case "pendingBtn":
						// Not sure if we need a separate histogram for pending content? 
						// Discuss this with Aaron.
						histModel.set({histogram:jsonModel.get("histogram").global});
						this.activeView = pendingView;
						break;
						
				}
				this.activeView.model = this.collection;
				this.activeView.bind({temporal:histModel});
				this.activeView.render();
			}
		});
		
		
		AbstractView = Backbone.View.extend(
		{
			el:'#dynamic-content',
			
			// Rendered elements
			rendered:[],
			newCount:0,
			
			// Set to true when al least of content is displayed
			displayed:false,
			
			
			bind: function(options){
				options.temporal.bind("change:startRange", this.filter, this);
				options.temporal.bind("change:endRange", this.filter, this);
			},
			
			unbind: function (options){
				options.temporal.unbind("change:startRange", this.filter, this);
				options.temporal.unbind("change:endRange", this.filter, this);
			},
			
			// Adds new items to the pending queue
			update: function (count)
			{
				var self = this;
				
				if($("#new-content").length <= 0)
				{
					this.newCount = count;
					$(this.el).prepend("<div id=\"new-content\">"+this.newCount+" new items</div>");
					$("#new-content").hide();
					$("#new-content").slideDown("slow");
					$("#new-content").click(function (event){
						$("#new-content").remove();
						self.render();
						self.newCount = 0;
					});
				}else{
					$("#new-content").html((this.newCount+count)+" new items");
				}
			},
			
			render: function ()
			{
				// Clear out previous content 
				$(this.el).empty();
				$(this.el).html("<ol id='nothing'></ol>");
				
				this.el = "#nothing";
				this.displayed = false;
				
				this.rendered = [];
				
				this.display();
				this.checkFiltered();
			},		
			
	
			// Filters temporal content
			filter: function ()
			{
				this.displayed = false;
				
				for(var i = 0; i < this.rendered.length; i++) {
					this.showHide(this.rendered[i]);
				}
				this.checkFiltered();
			},
			
			// Shows / hides temporal elements
			showHide: function (item)
			{
				var timestamp = new Date(item.timestamp).getTime();
	
				if(timestamp >= histModel.get("startRange").getTime() && timestamp <= histModel.get("endRange").getTime()) {
					$(item.html).show();
					this.displayed = true;
				} else {
				 	$(item.html).hide();
				}
			}, 
			
			checkFiltered: function ()
			{
				if(!this.displayed){
					if($("#no-content").length <= 0){
						$(this.el).append("<p id=\"no-content\" style=\"text-align:center;\">No content in selected timespan.</p>");
					}
				}else{
					$("#no-content").remove();
				}
			},
			
			initItem: function(itm){
				
				var self = this;
				
				// Add session check. 
				// Don't Call this functionality of a user is not logged in.
				if(itm !== null){
					itm.html.find("#del-itm").hide();
					itm.html.find("#apr-itm").hide();
							
					itm.html.hover(function(event){
							itm.html.find("#del-itm").show();
							itm.html.find("#apr-itm").show();
						}, function(event){
							itm.html.find("#del-itm").hide();
							itm.html.find("#apr-itm").hide();
					});
					
					itm.html.click(function(event){
						
						var checked;
						
						switch(event.target.id)	{
							case "apr-itm":
								self.approveItem(itm);
								break;
							
							case "del-itm":
								self.deleteItem(itm);
								break;
								
							default:
								if(itm.html.find("#itm-check").length > 0){
									checked = itm.html.find("#itm-check").is(':checked');
									itm.html.find("#itm-check").attr('checked', !checked);
									itm.html.css("background-color", checked ? "#FFFFFF" : "#FFFFCC");
								}
						}
						event.stopPropagation();
					});
	
					this.showHidePending(itm);
					
					this.showHide(itm);
					this.rendered.push(itm);
					$(this.el).append(itm.html);
				}
			},
			
			deleteItem: function(itm){
				itm.html.fadeOut();
				this.model.remove(itm.model, {silent : true});
			},
			
			approveItem: function(itm){
				// toggle status
				itm.model.set({status:itm.model.get("status") === 1 ? 0 : 1});
				controls.updatePending(itm.model.get("status"));
				this.showHidePending(itm);
			},
			
			showHidePending: function(itm){
				if(itm.model.get("status") === 1){
					itm.html.find("#pending-notice").hide();
				}else{
					itm.html.find("#pending-notice").show();
				}
				
			},
			
			updateItem: function(itm){
				//update_item.json?id=00002&status=1
				//delete_item.json?id=00002	
			}
		});
		
		
		AllView = AbstractView.extend({
			
			// Renders the entire collection
			display: function ()
			{
				this.rendered = [];
				
				this.model.each( function(itm)
				{
					itm = this.buildTemplate(itm);
					this.initItem(itm);
				}, this);
			},
					
			// Builds each item, returns {timestamp, html} object
			buildTemplate: function (itm)
			{
				if(itm.get("type") == "media")
				{
					 html = $.tmpl(mediaView.tplDefault, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
				}else if(itm.get("type") == "post"){
					 html = $.tmpl(postView.tplDefault, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
				}
				return {timestamp:itm.get("timestamp"), html:html, model:itm};
			}
		});
		
		
		PostView = AbstractView.extend({
			
			tplDefault: "<li id='post-list'><div id=\"content\"><div id='avatar'><img src='${avatar}'></div><span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-check\" id=\"apr-itm\"></span><div id=\"pending-notice\"></div></span>${content}<div id='meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",
			tplEdit:"<li id='post-list'><div id=\"content\"><div id=\"checkbox\"><input type=\"checkbox\" id=\"itm-check\"/></div><div id='avatar'><img src='${avatar}'></div><span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-check\" id=\"apr-itm\"></span><div id=\"pending-notice\"></div></span>${content}<div id='meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",
			
			display: function (){
					
				// Render collection
				this.model.each(function(itm){
					itm = this.buildTemplate(itm);
					this.initItem(itm);
				},this);
			}, 
			
			// Builds each item, returns {timestamp, html} object
			buildTemplate: function (itm)
			{
				if(itm.get("type") == "post"){
					html = $.tmpl(this.tplDefault, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
					return {timestamp:itm.get("timestamp"), html:html, model:itm};
				}else{
					return null;
				}
			}
		});
		
		
		PendingView = AbstractView.extend({
			
			// Renders the entire collection
			display: function ()
			{
				$(this.el).append("<div id=\"deleteAll\"><a href=\"#\">Select all</a></div>");
				
				var self = this;
				var i;
				
				this.rendered = [];
				this.model.each( function(itm){
					itm = this.buildTemplate(itm);
					this.initItem(itm);
				}, this);
				
				$("#deleteAll").click(function(){
					for(i=0; i<self.rendered.length; i+=1){
						self.deleteItem(self.rendered[i]);	
					}
				});
				
			},
					
			// Builds each item, returns {timestamp, html} object
			buildTemplate: function (itm){
				if(itm.get("type") === "media"){
					 html = $.tmpl(mediaView.tplEdit, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
				}else if(itm.get("type") === "post"){
					 html = $.tmpl(postView.tplEdit, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
				}
				return {timestamp:itm.get("timestamp"), html:html, model:itm};
			}
		});
		
		
		MediaView = AbstractView.extend({
		
			tplDefault: "<li id='post-list'><div id='media-content'><span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-check\" id=\"apr-itm\"></span><div id=\"pending-notice\"></div></span><div id=\"media\"><img height='160' src='${content}'></div>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></content></li>",
			tplEdit: "<li id='post-list'><div id='media-content'><div id=\"checkbox\"><input type=\"checkbox\" id=\"itm-check\"/></div><span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-check\" id=\"apr-itm\"></span><div id=\"pending-notice\"></div></span><div id=\"media\"><img height='160' src='${content}'></div>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></content></li>",
			
			display: function ()
			{
				// Render collection
				this.model.each(function (itm)
				{
					itm = this.buildTemplate(itm);
					this.initItem(itm);
				}, this);
			},
			
			// Builds each item, returns {timestamp, html} object
			buildTemplate: function (itm)
			{
				if(itm.get("type") == "media")
				{
					html = $.tmpl(this.tplDefault, {content:itm.get("content"), avatar:itm.get("avatar"), timestamp:itm.get("timestamp"), author: itm.get("author")});
					return {timestamp:itm.get("timestamp"), html:html, model:itm};
				}else{
					return null;
				}
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
					stop: function (event, ui) {
						self.onSliderDragged(event, ui);
					}
				});
				
				this.updateDateDisplay();
			},
			
			onSliderDragged: function (event, ui)
			{
				this.model.set({"startRange": new Date(ui.values[0])});
				this.model.set({"endRange": new Date(ui.values[1])});
				this.updateHistogram();
			},
	
			// Updates histogram bars 
			updateHistogram: function ()
			{
				for(var i=0; i<this.bars.length; i++){
					this.updateHistogramBar(this.bars[i]);
				}
				
				this.updateDateDisplay();
			},
			
			updateDateDisplay: function ()
			{
				function formatDate(date){
					return date.getMonth()+1+"/"+date.getDay()+"/"+date.getFullYear()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
				}
				
				$("#timeline-mintime").html(formatDate(this.model.get("startRange")));
				$("#timeline-maxtime").html(formatDate(this.model.get("endRange")));
			},
		
			
			// Sets histogram bar colors based on the visible range
			updateHistogramBar: function (bar)
			{
				if(new Date(bar.timestamp).getTime() >= this.model.get("startRange").getTime() && new Date(bar.timestamp).getTime() <= this.model.get("endRange").getTime()){
					bar.attr({fill:"#333333"});
				}else{
					bar.attr({fill:"#CCCCCC"});
				}
			},
			
			// Draws histogram
			drawHistogram: function () 
			{
				if(this.model.get("histogram")){
					var barFill, histogram, i, len, lenTotal, maxVal, minVal, maxHeight, percentY, percentX, barW, barH, barX, barY, barXPadding;
						
					// Total count of available slots	
					lenTotal = Math.round((this.model.get("endDate").getTime() - this.model.get("startDate").getTime())/86400000);
					
					// Acutal count of temporal slots
					len = this.model.get("histogram").length;
					
					maxVal = 10;
					minVal = 1;
					maxHeight = $(this.el).height();
					barXPadding = 0;
					histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());
					barW = ($(this.el).width() - (barXPadding * lenTotal)) / lenTotal;
		
					for( i = 0; i < len; i += 1)
					{				
						var frame = this.model.get("histogram")[i];
						
						percentY = (frame.count / maxVal) * 100;
						percentX = (new Date(frame.timestamp).getTime()-this.model.get("startDate").getTime()) / (this.model.get("endDate").getTime()-this.model.get("startDate").getTime());
						
						barH = Math.round(percentY * maxHeight / 100);
						barX = barW*Math.round(percentX*(lenTotal-1));
						barY = Math.round($(this.el).height() - barH);
						
						var bar = histogram.rect(barX, barY, barW, barH).attr({fill:"#333333", "stroke-width" : 0});
						bar.timestamp = frame.timestamp;
						this.updateHistogramBar(bar);
						this.bars.push(bar);
					}
				}
			}
		});
	
		
		/**
		 * Display static map in the sidebar. 
		 * Not sure that we even need this view. 
		 */
		SidebarMapView = Backbone.View.extend({
			
			el: '#mapCanvas',
		
			render: function (lon, lat)
			{
				$(this.el).html("<img src=\"http://maps.googleapis.com/maps/api/staticmap?center="+lon+","+lat+"&zoom=10&size="+$(this.el).width()+"x"+$(this.el).height()+"&sensor=false\">");
				$("#mapLabel").append("Red Rocks, Morrison CO");
			}
		});
		
		
			controls = new ControlsView();
			
			sideMapView = new SidebarMapView();
			
			histModel = new HistogramModel();
			histView = new HistogramView({model:histModel});
			
			allView = new AllView();
			postView = new PostView();
			mediaView = new MediaView();
			pendingView = new PendingView();
					
			jsonModel = new JsonModel();
			jsonModel.url = json_path;
			jsonModel.fetch();
				
			setInterval(function() {
				jsonModel.fetch();
			}, 10000);
		
			
			jsonModel.bind("change", function ()
			{
				// Update histogram
				if(jsonModel.hasChanged("startDate") || jsonModel.hasChanged("endDate"))
				{
					histModel.set({startDate: new Date(jsonModel.get("startDate")), endDate: new Date(jsonModel.get("endDate"))});
					
					// Set range only for the first time. 
					if(!histModel.get("startRange")){
						histModel.set({startRange: new Date(jsonModel.get("startDate"))});
					} 
					if(!histModel.get("endRange")){
						 histModel.set({endRange: new Date(jsonModel.get("endDate"))});
					}
				}
				
				// Update location
				if(jsonModel.hasChanged("location"))
				{
					sideMapView.render(jsonModel.get("location").lon, jsonModel.get("location").lat);
				}
				
				controls.update();
				
			});

	};
})();