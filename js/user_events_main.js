if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};

}(function(jQuery, SIVVIT) {

	SIVVIT.UserEvents = {

		// SIVVIT.Model
		model : null,

		//SIVVIT.EventsCollection
		collection : null,

		//SIVVIT.EventsView
		view : null,

		// Enables content editing when set to true
		edit : false,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;

			this.model = new SIVVIT.Model();
			this.collection = new SIVVIT.EventsCollection();
			this.view = new SIVVIT.EventsView({
				edit : this.edit
			});

			this.model.url = json;
			this.model.fetch();

			this.model.bind("change", function() {

				// Show main application
				$("#content-loader").remove();

				// Move all this jazz into a separate view
				$("#event-application").show();

				if(this.model.hasChanged("events")) {

					var i, con, len, model;
					con = this.model.get("events");
					len = con.length;

					for( i = len; i--; ) {
						model = new SIVVIT.EventModel(con[i]);
						// Add timestamp as date for collection sorting
						model.set({
							timestamp : new Date(con[i])
						});
						this.collection.add(model);
					}

					this.view.model = this.collection;
					this.view.render();
				}
			}, this);
		}
	};

	// Main model responsible for loading and mainaining data
	SIVVIT.Model = Backbone.Model.extend({});

	// Collection containing event models,
	SIVVIT.EventsCollection = Backbone.Collection.extend({
		model : SIVVIT.EventModel,

		// Sort content by startDate
		comparator : function(itm) {
			return itm.get("startDate");
		}
	});

	// Core events view. Right now we only have a single implementation.
	SIVVIT.AbstractView = Backbone.View.extend({
		el : '#dynamic-content',

		// Rendered elements
		rendered : [],

		// Enable content editing. Assumes that user is logged in
		edit : false,

		// Set to true when al least of content is displayed
		displayed : false,

		initialize : function(options) {
			this.edit = options.edit;
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
		},
		// Displays content editing options - enabled in the admin view.
		displayEdit : function() {
			$(this.el).append("<div id=\"controls-container\"><div id=\"checkbox\"><input type=\"checkbox\" id=\"group-select\"></div><a id=\"del-all\" class=\"link\"><span class=\"icon-delete\"></span>Delete</a><a id=\"pause-all\" class=\"link\"><span class=\"icon-pause\"></span>Pause</a></div>");

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
			// Stop running collections
			$("#pause-all").click(function() {

				var i = self.rendered.length;
				while(i--) {
					var itm = self.rendered[i];
					var cb = itm.html.find("#itm-check");
					if(cb.is(':checked')) {
						self.toggleCollection(itm, false);
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
		// Initiates item functionality, displays appropriate
		// dynamic content.
		initItem : function(itm) {

			var self = this;

			if(itm !== null) {

				// Initiate button clicks if a user is logged in and modify
				// content template (add hover buttons and check box)
				if(this.edit) {
					itm.html.find("#content").prepend("<span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-play\" id=\"toggle-itm\"></span><span class=\"icon-cog\" id=\"edit-itm\"></span><div id=\"pending-flag\"></div></span>");
					itm.html.find("#content").prepend("<div id=\"checkbox\"><input type=\"checkbox\" id=\"itm-check\"/></div>");

					itm.html.find("#del-itm").hide();
					itm.html.find("#toggle-itm").hide();
					itm.html.find("#edit-itm").hide();

					if(itm.model.get("pending") > 0) {
						itm.html.find("#title").append("<div id='pending'>pending " + itm.model.get("pending") + "</div>");
					}

					itm.html.hover(function(event) {
						itm.html.find("#del-itm").show();
						itm.html.find("#toggle-itm").show();
						itm.html.find("#edit-itm").show();
					}, function(event) {
						itm.html.find("#del-itm").hide();
						itm.html.find("#toggle-itm").hide();
						itm.html.find("#edit-itm").hide();
					});

					itm.html.click(function(event) {

						var checked;

						switch(event.target.id) {
							case "toggle-itm":
								self.toggleCollection(itm);
								break;

							case "del-itm":
								self.deleteItem(itm);
								break;

							case "edit-itm":
								//Edit item
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
					this.toggleLive(itm);
				}

				this.rendered.push(itm);
				$(this.el).append(itm.html);
			}
		},
		// Deletes selected item.
		// To-do: implement server call
		deleteItem : function(itm) {
			itm.html.fadeOut();
			this.model.remove(itm.model, {
				silent : true
			});
		},
		// Starts / stops collection.
		// To-do: implement server call
		toggleCollection : function(itm, value) {

			if(value === undefined) {
				value = itm.model.get("status") === 1 ? 0 : 1;
			} else {
				value = value === true ? 1 : 0;
			}

			// toggle status
			itm.model.set({
				status : value
			});
			this.toggleLive(itm);
		},
		// Toggles display.
		toggleLive : function(itm) {
			var icon = itm.html.find("#toggle-itm");
			var flag = itm.html.find("#pending-flag");

			if(itm.model.get("status") === 1) {

				icon.toggleClass("icon-play", false);
				icon.toggleClass("icon-pause", true);
				flag.toggleClass("idle-notice", false);
				flag.toggleClass("live-notice", true);

			} else {
				icon.toggleClass("icon-play", true);
				icon.toggleClass("icon-pause", false);
				flag.toggleClass("idle-notice", true);
				flag.toggleClass("live-notice", false);
			}
		}
	});

	// Main view. Renders items, displays histogram.
	SIVVIT.EventsView = SIVVIT.AbstractView.extend({

		template : "<li id='post-list'><div id='content'><div id='histogram'></div><div id='title'>${title}</div>${description}<div id='meta'>${posts} posts, ${images} images, ${videos} videos &nbsp; &nbsp;<span class='icon-location'></span>${location} &nbsp;<span class='icon-user'></span><a href='#'>${author}</a></div></div></div></li>",

		display : function() {

			// Render collection
			this.model.each(function(itm) {
				itm = this.buildTemplate(itm);

				// Render histogram
				var histogram = new SIVVIT.HistogramView({

					el : $(itm.html).find("#histogram"),
					slider : false,
					model : new SIVVIT.TemporalModel({
						startDate : new Date(itm.model.get("startDate")),
						endDate : new Date(itm.model.get("endDate")),
						min : itm.model.get("histogram").min,
						max : itm.model.get("histogram").max,
						resolution : itm.model.get("histogram").resolution,
						histogram : itm.model.get("histogram").global
					})
				}).render();

				this.initItem(itm);
			}, this);
		},
		// Builds each item, returns {model, html} object
		buildTemplate : function(itm) {
			html = $.tmpl(this.template, {
				title : itm.get("title"),
				description: itm.get("description"),
				posts : itm.get("stats").posts,
				videos : itm.get("stats").videos,
				images : itm.get("stats").images,
				location : itm.get("location").name,
				author : itm.get("author")
			});
			return {
				html : html,
				model : itm
			};
		}
	});
})($, SIVVIT);
