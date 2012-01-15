if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
}

// Formats date
Date.prototype.format = function() {
	return this.getMonth() + 1 + "/" + this.getDay() + "/" + this.getFullYear() + " " + this.getHours() + ":" + this.getMinutes() + ":" + this.getSeconds();
};
(function(jQuery, SIVVIT) {

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
		edit : false,

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
				el : '#timeline-container',
				model : this.temporalModel
			});

			this.postView = new SIVVIT.PostView({
				edit : this.edit,
				eventModel : this.eventModel,
				temporalModel : this.temporalModel
			});

			this.mediaView = new SIVVIT.MediaView({
				edit : this.edit,
				eventModel : this.eventModel,
				temporalModel : this.temporalModel
			});
			this.allView = new SIVVIT.AllView({
				edit : this.edit,
				temporalModel : this.temporalModel,
				eventModel : this.eventModel,
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
				self.headerView.update();
			}, 10000);

			this.eventModel.bind("change", function() {

				// Show main application
				$("#content-loader").remove();
				$("#event-application").show();

				if(self.eventModel.hasChanged("status") || self.eventModel.hasChanged("title") || self.eventModel.hasChanged("description") || self.eventModel.hasChanged("location")) {
					self.headerView.render();
				}

				// Reset updated timer
				if(self.eventModel.hasChanged("since")) {
					self.headerView.reset(new Date(self.eventModel.get("since")));
				}

				if(self.eventModel.hasChanged("stats")) {
					self.appView.renderStats();
				}

				// Update histogram values
				if(self.eventModel.hasChanged("startDate") || self.eventModel.hasChanged("endDate") || self.eventModel.hasChanged("histogram")) {

					self.temporalModel.set({
						startDate : new Date(self.eventModel.get("startDate")),
						endDate : new Date(self.eventModel.get("endDate")),
						min : self.eventModel.get("histogram").min,
						max : self.eventModel.get("histogram").max,
						resolution : self.eventModel.get("histogram").resolution
					});

					// Redraw temporal histogram
					if(self.temporalModel.get("type") !== null) {
						switch(self.temporalModel.get("type")) {
							case "global":

								self.temporalModel.set({
									histogram : self.eventModel.get("histogram").global
								});
								break;

							case "media":
								self.temporalModel.set({
									histogram : self.eventModel.get("histogram").media
								});
								break;

							case "post":
								self.temporalModel.set({
									histogram : self.eventModel.get("histogram").post
								});
								break;
						}
					}
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

	// Collection of item groups
	SIVVIT.ItemGroupCollection = Backbone.Collection.extend({

		model : SIVVIT.ItemGroupModel,

		// Sort item groups by timestamp
		comparator : function(itm) {
			return -itm.get("timestamp");
		}
	});

	// Collection of items
	SIVVIT.ItemCollection = Backbone.Collection.extend({
		model : SIVVIT.ItemModel,

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

		// SIVVIT.ItemGroupCollection
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

			var tmp_group = [];
			var con = this.eventModel.get("content");
			var len = this.collection ? this.collection.length : 0;
			var i, j, itm, tmp_items, new_count, new_groups, group_model, itm_model;

			if(!this.collection) {

				for( i = con.length; i--; ) {
					group_model = new SIVVIT.ItemGroupModel(con[i]);
					tmp_items = [];

					for( j = con[i].items.length; j--; ) {
						itm_model = new SIVVIT.ItemModel(con[i].items[j]);
						itm_model.set({
							timestamp : new Date(con[i].items[j].timestamp)
						});
						tmp_items.push(itm_model);
					}

					group_model.set({
						id : i,
						items : new SIVVIT.ItemCollection(tmp_items),
						items_new : new SIVVIT.ItemCollection(tmp_items),
						stats : con[i].stats,
						timestamp : new Date(con[i].timestamp)
					});

					tmp_group.push(group_model);
				}
				this.collection = new SIVVIT.ItemGroupCollection(tmp_group);
				this.render();

			} else {

				// Add new items to the exisiting group
				new_count = 0;

				for( i = con.length; i--; ) {
					group_model = this.activeView.groups_key[new Date(con[i].timestamp)];

					// Check if a group already exists
					if(group_model) {

						// Update stats
						group_model.set({
							stats : con[i].stats
						}, {
							silent : true
						});

						for( j = con[i].items.length; j--; ) {
							itm_model = new SIVVIT.ItemModel(con[i].items[j]);
							itm_model.set({
								timestamp : new Date(con[i].items[j].timestamp)
							});

							group_model.get("items").add(itm_model);
						}

						this.activeView.buildGroupHeader(group_model);
						this.activeView.buildGroupFooter(group_model);

					} else {
						
						// Create new groups
						new_goups = new SIVVIT.ItemGroupCollection();
						group_model = new SIVVIT.ItemGroupModel(con[i]);
						tmp_items = [];

						for( j = con[i].items.length; j--; ) {
							itm_model = new SIVVIT.ItemModel(con[i].items[j]);
							itm_model.set({
								timestamp : new Date(con[i].items[j].timestamp)
							});

							tmp_items.push(itm_model);
						}

						group_model.set({
							id : i,
							items : new SIVVIT.ItemCollection(tmp_items),
							items_new : new SIVVIT.ItemCollection(tmp_items),
							stats : con[i].stats,
							timestamp : new Date(group_model.get("timestamp"))
						});

						// Update the count of new content
						new_count += this.activeView.getItemCount(group_model);
						new_goups.add(group_model);

						this.collection.add(group_model, {
							silent : true
						});
					}
				}

				if(new_count > 0) {
					this.activeView.update(new_count, new_goups);
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
						histogram : this.eventModel.get("histogram").global,
						type : "global"

					});
					this.activeView = this.allView;
					break;

				case "post-btn":
					this.temporalModel.set({
						histogram : this.eventModel.get("histogram").post,
						type : "post"
					});
					this.activeView = this.postView;
					break;

				case "media-btn":
					this.temporalModel.set({
						histogram : this.eventModel.get("histogram").media,
						type : "media"
					});
					this.activeView = this.mediaView;
					break;
			}

			this.renderStats();

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
		},
		// Displays stats for the currently-selected view
		renderStats : function() {
			switch(this.activeButton) {

				case "#all-btn":
					$("#content-stats").html("Total: " + this.eventModel.get("stats").total);
					break;

				case "#post-btn":
					$("#content-stats").html("Posts: " + this.eventModel.get("stats").posts);
					break;

				case "#media-btn":
					$("#content-stats").html("Media: " + this.eventModel.get("stats").images);
					break;
			}
		}
	});

	/**
	 * Abstract core class for all content views.
	 */
	SIVVIT.AbstractView = Backbone.View.extend({

		el : "#dynamic-content",

		// Rendered elements
		rendered : [],

		// Rendered groups
		groups : [],

		// Dictionary of existing groups
		groups_key : {},

		// Count of new items - displayed when new data is loaded
		new_count : 0,

		// Collection (ItemGroupCollection) of goups that have been loaded but not rendered
		new_groups : null,

		// Instance of TemporalModel
		temporalModel : null,

		// Instance of EventModel
		eventModel : null,

		// Enable content editing. Assumes that user is logged in
		edit : false,

		// Set to true when al least of content is displayed
		displayed : false,

		initialize : function(options) {
			this.edit = options.edit;
			this.temporalModel = options.temporalModel;
			this.eventModel = options.eventModel;
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
		update : function(count, groups) {
			var self = this;
			this.new_groups = groups;

			if($("#load-content-btn").length <= 0) {
				this.new_count = count;

				$(this.el).prepend("<div id=\"padding\"><div id='load-content-btn' class=\"content-loader\">" + this.new_count + " new items&nbsp;&nbsp;<span class='icon-download'></span></div></div>");
				$("#load-content-btn").hide();
				$("#load-content-btn").slideDown("slow");
				$("#load-content-btn").click(function(event) {
					$(event.currentTarget).parent().remove();
					self.display(self.new_groups);
					self.new_count = 0;
				});
			} else {
				$("#load-content-btn").html((this.new_count + count) + " new items&nbsp;&nbsp;<span class='icon-download'></span>");
			}
		},
		render : function() {

			// Clear out previous content
			$(this.el).empty();

			this.displayed = false;

			this.rendered = [];
			this.groups = [];
			this.groups_key = {};

			// Display content header if a user is logged in
			if(this.edit) {
				this.displayEdit();
			}
			this.display();
			this.checkFiltered();
		},
		// Builds out item group and displays its header
		// If prepend is set to true the group is prepended to the list, otherwise appended
		buildGroup : function(group, prepend) {

			var gid = "group-" + group.get("id");

			// Create group element which will contain all items
			var el = "<ol id='" + gid + "'></ol>";

			if(prepend) {
				$(this.el).prepend(el);
			} else {
				$(this.el).append(el);
			}

			group.set({
				div_id : "#" + gid
			}, {
				silent : true
			});

			// Unbind events from previous views
			group.unbind();

			// Triggered when additional data is loaded into the group
			group.bind("change", this.updateGroup, this);

			this.groups.push(group);
			this.groups_key[group.get("timestamp")] = group;

			// Show hide latest group
			this.showHide(group);

			return group;
		},
		// Builds group header
		buildGroupHeader : function(group) {

			var total = this.getItemCount(group);

			// Remove existing heder
			var header = $(group.get("div_id")).find("#group-header");
			if(header.length > 0) {
				header.remove();
			}
			$(group.get("div_id")).prepend("<div id='group-header'>" + total + " items this " + this.temporalModel.get("resolution") + " - " + group.get("timestamp").format());
		},
		buildGroupFooter : function(group) {

			var self = this, total;

			// Remove existing footer
			var footer = $(group.get("div_id")).find("#group-footer");
			if(footer.length > 0) {
				footer.remove();
			}

			// Check whether we need to load more items
			if(group.get("displayed") < group.get("stats").total) {

				$(group.get("div_id")).append("<div id='group-footer'><div id='load-group-btn' class='content-loader'>More from this " + this.temporalModel.get("resolution") + "&nbsp;&nbsp;<span class='icon-download'></span></div></div>");

				$(group.get("div_id")).find("#load-group-btn").click(function(event) {

					// Displayloader graphics
					$(event.currentTarget).html("<span class='loader'>&nbsp;</span>");

					group.url = "items.json";
					//Structure request self.eventModel.get("id")+".json?"+group.get("timestamp");

					// Save already-parsed items in the temporaray old_itms array
					group.set({
						old_items : group.get("items")
					}, {
						silent : true
					});

					group.fetch();
				});
			}
		},
		// Renders group contents.
		// If is_new is true, then only display new content, otherwise everything
		buildGroupItems : function(group, is_new) {

			var dsp = is_new ? group.get("displayed") : 0;

			// Loop through each available item - ItemCollection
			group.get( is_new ? "items_new" : "items").each(function(itm) {
				itm = this.buildTemplate(itm);
				if(itm) {
					this.initItem(itm, group);

					group.set({
						displayed : dsp += 1
					}, {
						silent : true
					});
				}

			}, this);
		},
		// Called once additional group data is loaded
		updateGroup : function(group) {

			var tmp = [], i;
			var len = group.get("items").length;
			var items = group.get("items");

			for( i = len; i--; ) {

				var itm = items[i];
				if(itm) {

					var itm_model = new SIVVIT.ItemModel(itm);

					itm_model.set({
						timestamp : new Date(itm.timestamp)
					});

					tmp.push(itm_model);
					group.get("old_items").add(itm_model);
				}
			}

			// Reassign existing collection and add new one
			group.set({
				// Assing augmented old_items back to the items collection
				items : group.get("old_items"),
				items_new : new SIVVIT.ItemGroupCollection(tmp)
			}, {
				silent : true
			});

			this.buildGroupItems(group, true);
			this.buildGroupFooter(group);
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

			var i, len = this.groups.length;
			for( i = 0; i < len; i++) {
				this.showHide(this.groups[i]);
			}
			this.checkFiltered();
		},
		// Shows / hides content groups
		showHide : function(group) {

			var timestamp = group.get("timestamp").getTime();

			if(timestamp >= this.temporalModel.get("startRange").getTime() && timestamp <= this.temporalModel.get("endRange").getTime()) {
				$(group.get("div_id")).show();
				this.displayed = true;
			} else {
				$(group.get("div_id")).hide();
			}
		},
		// Checks whether there any items are displayed
		checkFiltered : function() {

			if(!this.displayed) {
				if($("#no-content").length <= 0) {
					$(this.el).append("<div id='no-content' class='notification'>No content in selected timespan.</div>");
				}
			} else {
				$("#no-content").remove();
			}
		},
		initItem : function(itm, group) {

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
				this.rendered.push(itm);

				$(group.get("div_id")).append(itm.html);
			}
		},
		deleteItem : function(itm) {
			itm.html.fadeOut();
			this.model.remove(itm.model, {
				silent : true
			});
		},
		approveItem : function(itm, value) {

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
			this.eventModel = options.eventModel;
			this.postView = options.postView;
			this.mediaView = options.mediaView;
		},
		// Renders the entire collection
		display : function(source) {

			var is_update;

			if(source === undefined) {
				source = this.model;
				is_update = false;
			} else {
				is_update = true;
			}

			// Loop through all available groups - ItemGroupCollection
			this.model.each(function(group) {

				// Create group element
				group = this.buildGroup(group, is_update);

				// Display all available items
				this.buildGroupItems(group, false);

				// Call this once items are added
				this.buildGroupHeader(group);

				this.buildGroupFooter(group);

			}, this);
		},
		// Builds each item, returns {timestamp, html} object
		buildTemplate : function(itm) {
			
			var html;
			
			if(itm.get("type") == "media") {
				html = $.tmpl(this.mediaView.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp").format(),
					author : itm.get("author")
				});

				// Initiate light box
				this.mediaView.lightbox(html.find("#media"), itm);

			} else if(itm.get("type") == "post") {
				html = $.tmpl(this.postView.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp").format(),
					author : itm.get("author")
				});
			}
			return {
				timestamp : itm.get("timestamp"),
				html : html,
				model : itm
			};
		},
		// Returns count of items to be displayed in this view
		getItemCount : function(group) {
			return group.get("stats").total;
		}
	});

	/**
	 * Displays posts.
	 */
	SIVVIT.PostView = SIVVIT.AbstractView.extend({

		template : "<li id='post-list'><div id=\"content\"><div id='avatar'><img src='${avatar}'></div>${content}<div id='meta'>Twitter: <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",

		display : function(source) {

			var is_update;

			if(source === undefined) {
				source = this.model;
				is_update = false;
			} else {
				is_update = true;
			}

			// Loop through all available groups - ItemGroupCollection
			source.each(function(group) {

				if(group.get("type") == "post" || group.get("type") == "mixed") {

					// Create group element
					group = this.buildGroup(group, is_update);

					// Display all avialable items
					this.buildGroupItems(group, false);

					// Call this once items are added
					this.buildGroupHeader(group);
					this.buildGroupFooter(group);
				}
			}, this);
		},
		// Builds each item, returns {timestamp, html} object
		buildTemplate : function(itm) {
			if(itm.get("type") == "post") {
				html = $.tmpl(this.template, {
					content : itm.get("content"),
					avatar : itm.get("avatar"),
					timestamp : itm.get("timestamp").format(),
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
		},
		// Returns count of items to be displayed in this view
		getItemCount : function(group) {
			return group.get("stats").post;
		}
	});

	/**
	 * Displays media content.
	 */
	SIVVIT.MediaView = SIVVIT.AbstractView.extend({

		template : "<li id='post-list'><div id='content'><div id=\"media\"><img height='160' src='${content}'></div><div id='meta'>Twitter: <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",

		display : function(source) {

			var is_update;

			if(source === undefined) {
				source = this.model;
				is_update = false;
			} else {
				is_update = true;
			}

			// Loop through all available groups - ItemGroupCollection
			source.each(function(group) {

				if(group.get("type") == "media" || group.get("type") == "mixed") {

					// Create group element
					group = this.buildGroup(group, is_update);

					this.buildGroupItems(group, false);

					// Call this once items are added
					this.buildGroupHeader(group);
				}
			}, this);
		},
		// Displays new content loaded into groups
		buildGroupItems : function(group, is_new) {

			var dsp = is_new ? group.get("displayed") : 0;

			// Loop through each available item - ItemCollection
			group.get( is_new ? "items_new" : "items").each(function(itm) {
				itm = this.buildTemplate(itm);
				if(itm) {
					this.lightbox(itm.html.find("#media"), itm.model);
					this.initItem(itm, group);

					group.set({
						displayed : dsp += 1
					}, {
						silent : true
					});
				}
			}, this);
		},
		// Open light box
		lightbox : function(html, model) {
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
					timestamp : itm.get("timestamp").format(),
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
		},
		// Returns count of items to be displayed in this view
		getItemCount : function(group) {
			return group.get("stats").media;
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

		timestamp : null,

		render : function() {

			$("#event-title").html(this.model.get("title"));
			$("#event-description").html(this.model.get("description"));
			$("#event-user").html("<span class='gray-text'>Created by</span> <span class='icon-user'></span><a href='#'>" + this.model.get("author") + "</a> <span class='gray-text'>on</span> " + new Date(this.model.get("startDate")).toDateString());
			$("#map-label").html("<span class='icon-location'></span>" + this.model.get("location").name);
		},
		// Reset timer
		reset : function(date) {
			this.timestamp = date;
			this.update();
		},
		// Updates timer
		update : function() {

			// Live timeline label
			if(this.model.get("status") === 1) {
				$("#timeline-label").html("<span class='icon-time'></span>LIVE, " + this.formatTime(new Date() - this.timestamp));
			} else {
				$("#timeline-label").empty();
			}
		},
		formatTime : function(milliseconds) {

			var seconds = Math.floor(milliseconds / 1000);
			var minutes = Math.floor(milliseconds / 60000);
			var hours = Math.floor(milliseconds / 3600000);
			var days = Math.floor(milliseconds / 86400000);
	
			if(days > 0) {
				return "updated " + days + "d ago";
			}
			if(hours > 0) {
				return "updated " + hours + "h ago";
			}
			if(minutes > 0) {
				return "updated " + minutes + "m ago";
			}
			if(seconds > 0) {
				return "updated " + seconds + "s ago";
			}

			return "updated just now";

		}
	});
})(jQuery, SIVVIT);
