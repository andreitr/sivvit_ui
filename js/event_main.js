if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
}(function(jQuery) {

	SIVVIT.Event = {

		// SIVVIT.EventModel app/models/model.event.js
		eventModel : null,

		// SIVVIT.TemporalModel /app/models/model.temporal.js
		temporalModel : null,

		// SIVVIT.AppView
		// Main applicaition view. Controls switching of all other views.
		appView : null,

		// SIVVINT.PostView
		postView : null,

		// SIVVIT.Mediaiew
		mediaView : null,

		// SIVVIT.AllView
		allView : null,

		// SIVVIT.HeaderView
		headerView : null,

		// SIVVIT.SideMapView
		mapView : null,

		// SIVVIT.HistogramView
		sideHistView : null,

		// Enables content editing when set to true
		edit : true,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;

			this.temporalModel = new SIVVIT.TemporalModel();

			this.eventModel = new SIVVIT.EventModel();

			this.headerView = new SIVVIT.HeaderView({
				model : this.eventModel
			});

			this.mapView = new SIVVIT.MapView();

			this.sideHistView = new SIVVIT.HistogramView({
				model : this.temporalModel
			});

			this.postView = new SIVVIT.PostView({
				edit : this.edit,
				temporalModel : this.temporalModel
			});

			this.mediaView = new SIVVIT.MediaView({
				edit : this.edit,
				temporalModel : this.temporalModel
			});
			this.allView = new SIVVIT.AllView({
				edit : this.edit,
				temporalModel : this.temporalModel,
				mediaView : this.mediaView,
				postView : this.postView
			});

			this.appView = new SIVVIT.AppView({
				eventModel : this.eventModel,
				temporalModel : this.temporalModel,
				postView : this.postView,
				mediaView : this.mediaView,
				allView : this.allView
			});

			// Load content for the first time
			this.eventModel.url = json;
			this.eventModel.fetch();

			// Initiate continous content loading
			setInterval(function() {
				self.eventModel.fetch();
			}, 10000);

			this.eventModel.bind("change", function() {

				// Show main application
				$("#event-application").show();

				if(self.eventModel.hasChanged("status") || self.eventModel.hasChanged("title") || self.eventModel.hasChanged("author") || self.eventModel.hasChanged("location")) {
					self.headerView.render();
				}

				// Update histogram
				if(self.eventModel.hasChanged("startDate") || self.eventModel.hasChanged("endDate")) {
					self.temporalModel.set({
						startDate : new Date(self.eventModel.get("startDate")),
						endDate : new Date(self.eventModel.get("endDate")),
						min : self.eventModel.get("histogram").min,
						max : self.eventModel.get("histogram").max,
						resolution : self.eventModel.get("histogram").resolution
					});
				}

				// Set histogram range for the first time.
				if(!self.temporalModel.get("startRange")) {
					self.temporalModel.set({
						startRange : new Date(self.eventModel.get("startDate"))
					});
				}
				if(!self.temporalModel.get("endRange")) {
					self.temporalModel.set({
						endRange : new Date(self.eventModel.get("endDate"))
					});
				}

				// Update location
				if(self.eventModel.hasChanged("location")) {
					self.mapView.render(self.eventModel.get("location").name, self.eventModel.get("location").lon, self.eventModel.get("location").lat);
				}

				self.appView.update();
			});
		}
	};

	/**
	 * Content collection used to display data
	 */
	SIVVIT.ContentCollection = Backbone.Collection.extend({
		model : SIVVIT.ContentModel,

		// Sort content by timestamp
		comparator : function(itm) {
			return -itm.get("timestamp");
		}
	});

	/**
	 * Main application view. Acts like a controller of sorts.
	 */
	SIVVIT.AppView = Backbone.View.extend({

		el : "#navigation-content",

		prevButton : null,
		activeButton : null,

		// Instance of SIVVIT.AbstractView
		activeView : null,

		// Instance of SIVVIT.AbstractView
		prevView : null,

		// SIVVIT.EventModel
		eventModel : null,

		// SIVVIT.TemporalModel
		temporalModel : null,

		// SIVVIT.AllView
		allView : null,

		// SIVVIT.PostView
		postView : null,

		// SIVVIT.MediaView
		mediaView : null,

		// SIVVIT.ContentCollection
		collection : null,

		// Bind button events
		events : {
			"click #all-btn" : "render",
			"click #post-btn" : "render",
			"click #media-btn" : "render"
		},

		initialize : function(options) {
			this.eventModel = options.eventModel;
			this.temporalModel = options.temporalModel;
			this.allView = options.allView;
			this.postView = options.postView;
			this.mediaView = options.mediaView;
		},
		update : function() {

			var tmp = [];
			var con = this.eventModel.get("content");
			var len = this.collection ? this.collection.length : 0;
			var i, itm, newCount, model;

			if(!this.collection) {

				// Create new collection
				for( i = 0; i < con.length; i++) {
					model = new SIVVIT.ContentModel(con[i]);
					// Add timestamp as Date object for sorting purposes
					model.set({
						timestamp : new Date(con[i].timestamp)
					});
					tmp.push(model);
				}
				this.collection = new SIVVIT.ContentCollection(tmp);
				this.render();

			} else {

				// Add new items to the exisiting collection
				newCount = 0;

				for( i = 0; i < con.length; i++) {
					model = new SIVVIT.ContentModel(con[i]);
					// Add timestamp as Date object for sorting purposes
					model.set({
						timestamp : new Date(con[i].timestamp)
					});
					this.collection.add(model, {
						silent : true
					});

					// Show pending content only for the specific type
					if(this.activeView.buildTemplate(model)) {
						newCount++;
					}
				}

				if(newCount > 0) {
					this.activeView.update(newCount);
				}
			}
		},
		render : function(event) {
			this.renderView( event ? event : {
				target : {
					id : "all-btn"
				}
			});
		},
		// Renders view when a user clicks on one of the buttons.
		renderView : function(event) {
			// Don't do anything if a view is already rendered
			if(this.activeButton == "#" + event.target.id) {
				return;
			}

			this.prevButton = this.activeButton;
			this.activeButton = "#" + event.target.id;

			$(this.activeButton).toggleClass('text-btn', false);
			$(this.activeButton).toggleClass('text-btn-selected', true);

			if(this.prevButton != this.activeButton) {
				$(this.prevButton).toggleClass('text-btn', true);
				$(this.prevButton).toggleClass('text-btn-selected', false);
			}

			if(this.activeView) {
				this.prevView = this.activeView;
				this.prevView.unbind({
					temporal : this.temporalModel
				});
			}

			switch(event.target.id) {
				case "all-btn":
					this.temporalModel.set({
						histogram : this.eventModel.get("histogram").global
					});
					$("#content-stats").html("Total: "+this.eventModel.get("stats").total);
					this.activeView = this.allView;
					break;

				case "post-btn":
					this.temporalModel.set({
						histogram : this.eventModel.get("histogram").post
					});
					$("#content-stats").html("Posts: "+this.eventModel.get("stats").posts);
					this.activeView = this.postView;
					break;

				case "media-btn":
					this.temporalModel.set({
						histogram : this.eventModel.get("histogram").media
					});
					$("#content-stats").html("Media: "+this.eventModel.get("stats").images);
					this.activeView = this.mediaView;
					break;
			}

			this.temporalModel.set({
				min : this.eventModel.get("histogram").min,
				max : this.eventModel.get("histogram").max,
				resolution : this.eventModel.get("histogram").resolution
			});

			this.activeView.model = this.collection;
			this.activeView.bind({
				temporal : this.temporalModel
			});
			this.activeView.render();
		}
	});

	/**
	 * Abstract core class for all content views.
	 */
	SIVVIT.AbstractView = Backbone.View.extend({
		el : '#dynamic-content',

		// Rendered elements
		rendered : [],
		newCount : 0,

		temporalModel : null, // Instance of TemporalModel

		// Enable content editing. Assumes that user is logged in
		edit : false,

		// Set to true when al least of content is displayed
		displayed : false,

		initialize : function(options) {
			this.edit = options.edit;
			this.temporalModel = options.temporalModel;

		},
		bind : function(options) {
			options.temporal.bind("change:startRange", this.filter, this);
			options.temporal.bind("change:endRange", this.filter, this);
		},
		unbind : function(options) {
			options.temporal.unbind("change:startRange", this.filter, this);
			options.temporal.unbind("change:endRange", this.filter, this);
		},
		// Adds new items to the pending queue
		update : function(count) {
			var self = this;

			if($("#new-content").length <= 0) {
				this.newCount = count;
				$(this.el).prepend("<div id=\"padding\"><div id=\"new-content\">" + this.newCount + " new items</div></div>");
				$("#new-content").hide();
				$("#new-content").slideDown("slow");
				$("#new-content").click(function(event) {
					$("#new-content").remove();
					self.render();
					self.newCount = 0;
				});
			} else {
				$("#new-content").html((this.newCount + count) + " new items");
			}
		},
		render : function() {
			// Clear out previous content
			$(this.el).empty();
			$(this.el).html("<ol id='nothing'></ol>");

			this.el = "#nothing";
			this.displayed = false;

			this.rendered = [];

			// Display content header if a user is logged in
			if(this.edit) {
				this.displayEdit();
			}
			this.display();
			this.checkFiltered();
		},
		displayEdit : function() {
			
			$(this.el).append("<div id=\"controls-container\"><div id=\"checkbox\"><input type=\"checkbox\" id=\"group-select\"></div><a id=\"del-all\" class=\"link\"><span class=\"icon-delete\"></span>Delete</a><a id=\"apr-all\" class=\"link\"><span class=\"icon-check\"></span>Approve</a></div>");

			var self = this;

			// Delete all approved items
			$("#del-all").click(function() {

				var i = self.rendered.length;
				while(i--) {
					var itm = self.rendered[i];
					if(itm.html.find("#itm-check").is(':checked')) {
						self.deleteItem(itm);
					}
				}
			});
			// Approve all selected items
			$("#apr-all").click(function() {

				var i = self.rendered.length;
				while(i--) {
					var itm = self.rendered[i];
					var cb = itm.html.find("#itm-check");
					if(cb.is(':checked')) {
						self.approveItem(itm, true);
					}
					cb.attr('checked', false);
					itm.html.css("background-color", "#FFFFFF");
				}
				$("#group-select").attr('checked', false);
			});
			// Select all items
			$("#group-select").click(function() {

				var i = self.rendered.length;
				var checked = $("#group-select").is(":checked");

				while(i--) {
					var itm = self.rendered[i];
					itm.html.find("#itm-check").attr('checked', checked);
					itm.html.css("background-color", !checked ? "#FFFFFF" : "#FFFFCC");
				}
			});
		},
		// Filters temporal content
		filter : function() {
			this.displayed = false;

			for(var i = 0; i < this.rendered.length; i++) {
				this.showHide(this.rendered[i]);
			}
			this.checkFiltered();
		},
		// Shows / hides temporal elements
		showHide : function(item) {
			var timestamp = new Date(item.timestamp).getTime();

			if(timestamp >= this.temporalModel.get("startRange").getTime() && timestamp <= this.temporalModel.get("endRange").getTime()) {
				$(item.html).show();
				this.displayed = true;
			} else {
				$(item.html).hide();
			}
		},
		checkFiltered : function() {
			if(!this.displayed) {
				if($("#no-content").length <= 0) {
					$(this.el).append("<div id=\"padding\"><p id=\"no-content\" style=\"text-align:center;\">No content in selected timespan.</p></div>");
				}
			} else {
				$("#no-content").remove();
			}
		},
		initItem : function(itm) {

			var self = this;

			if(itm !== null) {

				// Initiate button clicks if a user is logged in and modify
				// content template (add hover buttons and check box)
				if(this.edit) {
					itm.html.find("#content").prepend("<span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-check\" id=\"apr-itm\"></span><div id=\"pending-flag\"></div></span>");
					itm.html.find("#content").prepend("<div id=\"checkbox\"><input type=\"checkbox\" id=\"itm-check\"/></div>");

					itm.html.find("#del-itm").hide();
					itm.html.find("#apr-itm").hide();

					itm.html.hover(function(event) {
						itm.html.find("#del-itm").show();
						itm.html.find("#apr-itm").show();
					}, function(event) {
						itm.html.find("#del-itm").hide();
						itm.html.find("#apr-itm").hide();
					});

					itm.html.click(function(event) {

						var checked;

						switch(event.target.id) {
							case "apr-itm":
								self.approveItem(itm);
								break;

							case "del-itm":
								self.deleteItem(itm);
								break;

							default:
								if(itm.html.find("#itm-check").length > 0) {
									checked = itm.html.find("#itm-check").is(':checked');
									itm.html.find("#itm-check").attr('checked', !checked);
									itm.html.css("background-color", checked ? "#FFFFFF" : "#FFFFCC");
								}
						}
						event.stopPropagation();
					});

					this.showHidePending(itm);
				}

				this.showHide(itm);
				this.rendered.push(itm);
				$(this.el).append(itm.html);
			}
		},
		deleteItem : function(itm) {
			itm.html.fadeOut();
			this.model.remove(itm.model, {
				silent : true
			});
		},
		approveItem : function(itm, value) {

			console.log(value);
			console.log(value === null);
			
			if(value === undefined) {
				value = itm.model.get("status") === 1 ? 0 : 1;
			} else {
				value = value === true ? 1 : 0;
			}

			// toggle status
			itm.model.set({
				status : value
			});
			this.showHidePending(itm);
		},
		showHidePending : function(itm) {
			if(itm.model.get("status") === 1) {
				itm.html.find("#pending-flag").toggleClass("pending-notice", false);
				itm.html.find("#pending-flag").toggleClass("active-notice", true);
			} else {
				itm.html.find("#pending-flag").toggleClass("pending-notice", true);
				itm.html.find("#pending-flag").toggleClass("active-notice", false);
			}
		},
		updateItem : function(itm) {
			//update_item.json?id=00002&status=1
			//delete_item.json?id=00002
		}
	});

	/**
	 * Displays general content stream
	 */
	SIVVIT.AllView = SIVVIT.AbstractView.extend({

		postView : null, // Instance of PostView
		mediaView : null, // Instance of MediaView

		initialize : function(options) {
			this.edit = options.edit;
			this.temporalModel = options.temporalModel;
			this.postView = options.postView;
			this.mediaView = options.mediaView;
		},
		// Renders the entire collection
		display : function() {
			this.model.each(function(itm) {
				itm = this.buildTemplate(itm);
				this.initItem(itm);
			}, this);
		},
		// Builds each item, returns {timestamp, html} object
		buildTemplate : function(itm) {
			if(itm.get("type") == "media") {
				
				html = $.tmpl(this.mediaView.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp"),
					author : itm.get("author")
				});
				
				// Initiate light box
				this.mediaView.lightbox(html.find("#media"), itm);
				
			} else if(itm.get("type") == "post") {
				html = $.tmpl(this.postView.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp"),
					author : itm.get("author")
				});
			}
			return {
				timestamp : itm.get("timestamp"),
				html : html,
				model : itm
			};
		}
	});

	/**
	 * Displays posts.
	 */
	SIVVIT.PostView = SIVVIT.AbstractView.extend({

		template : "<li id='post-list'><div id=\"content\"><div id='avatar'><img src='${avatar}'></div>${content}<div id='meta'>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",

		display : function() {

			// Render collection
			this.model.each(function(itm) {
				itm = this.buildTemplate(itm);
				this.initItem(itm);
			}, this);
		},
		// Builds each item, returns {timestamp, html} object
		buildTemplate : function(itm) {
			if(itm.get("type") == "post") {
				html = $.tmpl(this.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp"),
					author : itm.get("author")
				});
				return {
					timestamp : itm.get("timestamp"),
					html : html,
					model : itm
				};
			} else {
				return null;
			}
		}
	});

	/**
	 * Displays media content.
	 */
	SIVVIT.MediaView = SIVVIT.AbstractView.extend({

		template : "<li id='post-list'><div id='content'><div id=\"media\"><img height='160' src='${content}'></div>Twitter: <span class='icon-time'></span>${timestamp}<span class='icon-user'></span><a href='#'>${author}</a></content></li>",

		display : function() {
			// Render collection
			this.model.each(function(itm) {
				itm = this.buildTemplate(itm);
				if(itm){
					this.lightbox(itm.html.find("#media"), itm.model);
					this.initItem(itm);
				}
			}, this);
		},
		
		// Open light box
		lightbox: function(html, model) {
			$(html).fancybox({
				'transitionIn' : 'fade',
				'transitionOut' : 'fade',
				'type' : 'image',
				'href' : model.get("content")
			});
		},
		
		// Builds each item, returns {timestamp, html} object
		buildTemplate : function(itm) {
			if(itm.get("type") == "media") {
				html = $.tmpl(this.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp"),
					author : itm.get("author")
				});
				return {
					timestamp : itm.get("timestamp"),
					html : html,
					model : itm
				};
			} else {
				return null;
			}
		}
	});

	/**
	 * Display histogram control.
	 */
	SIVVIT.HistogramView = Backbone.View.extend({

		el : '#timeline-container',
		bars : [],

		initialize : function(options) {
			this.model = options.model;
			this.model.bind("change:histogram", this.render, this);
		},
		render : function() {
			this.drawHistogram();
			this.drawSlider();
		},
		drawSlider : function() {
			self = this;

			$("#timeline-slider").slider({
				range : true,
				min : this.model.get("startDate").getTime(),
				max : this.model.get("endDate").getTime(),
				values : [this.model.get("startRange").getTime(), this.model.get("endRange").getTime()],
				stop : function(event, ui) {
					self.onSliderDragged(event, ui);
				}
			});

			this.updateDateDisplay();
		},
		onSliderDragged : function(event, ui) {
			this.model.set({
				"startRange" : new Date(ui.values[0])
			});
			this.model.set({
				"endRange" : new Date(ui.values[1])
			});
			this.updateHistogram();
		},
		// Updates histogram bars
		updateHistogram : function() {
			for(var i = this.bars.length; i--; ) {
				this.updateHistogramBar(this.bars[i]);
			}

			this.updateDateDisplay();
		},
		updateDateDisplay : function() {
			
			function formatDate(date) {
				return date.getMonth() + 1 + "/" + date.getDay() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
			}


			$("#timeline-mintime").html(formatDate(this.model.get("startRange")));
			$("#timeline-maxtime").html(formatDate(this.model.get("endRange")));
		},
		// Sets histogram bar colors based on the visible range
		updateHistogramBar : function(bar) {
			if(new Date(bar.timestamp).getTime() >= this.model.get("startRange").getTime() && new Date(bar.timestamp).getTime() <= this.model.get("endRange").getTime()) {
				bar.attr({
					fill : "#333333"
				});
			} else {
				bar.attr({
					fill : "#CCCCCC"
				});
			}
		},
		// Returns appropriate resolution.
		getResolution : function() {
			switch(this.model.get("resolution")) {
				case "day":
					return 86400000;
				case "hour":
					return 3600000;
				case "minute":
					return 60000;
				case "second":
					return 1000;
			}
		},
		// Draws histogram.
		drawHistogram : function() {
			if(this.model.get("histogram")) {

				// Total count of available slots
				var lenTotal = Math.ceil((this.model.get("endDate").getTime() - this.model.get("startDate").getTime()) / this.getResolution());

				// Acutal count of temporal slots
				var len = this.model.get("histogram").length;

				var maxVal = this.model.get("max");
				var minVal = this.model.get("min");

				var maxHeight = $(this.el).height();

				var barW = $(this.el).width() / lenTotal;
				barW = barW < 0 ? Math.abs(barW) : Math.round(barW);

				var startTime = this.model.get("startDate").getTime();
				var endTime = this.model.get("endDate").getTime();

				var histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

				for(var i = len; i--; ) {
					var frame = this.model.get("histogram")[i];

					var percentY = (frame.count / maxVal) * 100;
					var percentX = (new Date(frame.timestamp).getTime() - startTime) / (endTime - startTime);

					var barH = Math.round(percentY * maxHeight / 100);
					var barX = Math.round(barW * Math.round(percentX * (lenTotal - 1)));
					var barY = Math.round(maxHeight - barH);

					var bar = histogram.rect(barX, barY, barW, barH).attr({
						fill : "#333333",
						"stroke-width" : 0
					});

					bar.timestamp = frame.timestamp;
					this.updateHistogramBar(bar);
					this.bars.push(bar);
				}
			}
		}
	});

	/**
	 * Display static map in the sidebar.
	 */
	SIVVIT.MapView = Backbone.View.extend({

		el : '#map-container',

		render : function(name, lon, lat) {
			$(this.el).html("<img src=\"http://maps.googleapis.com/maps/api/staticmap?center=" + lon + "," + lat + "&zoom=10&size=280x130&sensor=false\">");
		}
	});

	/**
	 * Updates event header.
	 */
	SIVVIT.HeaderView = Backbone.View.extend({

		render : function() {

			$("#event-title").html(this.model.get("title"));
			$("#event-description").html(this.model.get("description"));
			$("#event-user").html("Created by <span class='icon-user'></span>"+this.model.get("author")+" on "+new Date(this.model.get("startDate")).toDateString());
			
			// Live timeline label
			if(this.model.get("status") === 1) {
				$("#timeline-label").html("<span class='icon-time'></span>This event is live!");
			}else{
				$("#timeline-label").html("<span class='icon-time'></span>Archived event.");
			}
			
			$("#map-label").html("<span class='icon-location'></span>" + this.model.get("location").name);
			
			
			/*
			$("#event-meta").append("&nbsp<span class=\"icon-user\"></span>by&nbsp;" + this.model.get("author"));
			*/
		}
	});
})();
