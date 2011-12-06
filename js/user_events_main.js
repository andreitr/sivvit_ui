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
		edit : true,

		// Initiates the application and loads the main data.
		init : function(json) {
			var self = this;

			this.model = new SIVVIT.Model();
			this.collection = new SIVVIT.EventsCollection();
			this.view = new SIVVIT.EventsView({edit:this.edit});

			this.model.url = json;
			this.model.fetch();

			this.model.bind("change", function() {

				$("#user-avatar").append("<img src='http://a0.twimg.com/profile_images/1169898172/01_normal.jpg' width='48' height='48'>");
				$("#user-title").append("andreitr (Andrei Taraschuk)");

				$("#user-meta").html("<span class='icon-location'></span>Denver, Co");
				$("#user-meta").append("&nbsp<span class='icon-user'></span>membed since January 24, 1981");

				$("#event-application").show();

				if(this.model.hasChanged("events")) {

					var i, con, len, model;
					con = this.model.get("events");
					len = con.length;

					for( i = len; i--; ) {
						model = new SIVVIT.EventModel(con[i]);
						this.collection.add(model);
					}

					this.view.render({
						model : this.collection
					});
				}
			}, this);
		}
	};

	// Main model responsible for loading and mainaining data
	SIVVIT.Model = Backbone.Model.extend({});

	// Collection containing event models
	SIVVIT.EventsCollection = Backbone.Collection.extend({
		model : SIVVIT.EventModel,

		// Sort content by startDate
		comparator : function(itm) {
			return itm.get("startDate");
		}
	})

	// Contains all
	SIVVIT.EventModel = Backbone.Model.extend({

		defaults : {
			id : null,
			title : null,
			author : null,
			description : null,
			keywords : [],
			location : {
				lon : null,
				lat : null,
				name : null
			},
			startDate : new Date(),
			endDate : new Date(),
			status : 0,
			stats : {
				total : 0,
				posts : 0,
				images : 0,
				videos : 0
			},
			histogram : {
				min : null,
				max : null,
				resolution : null,
				global : []
			}
		}
	});

	// Core view
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
		
		initItem : function(itm) {

			var self = this;

			if(itm !== null) {

				// Initiate button clicks if a user is logged in and modify
				// content template (add hover buttons and check box)
				if(this.edit) {
					itm.html.find("#content").prepend("<span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class=\"icon-check\" id=\"apr-itm\"></span><div id=\"pending-notice\"></div></span>");
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

			if(!value) {
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
				itm.html.find("#pending-notice").hide();
			} else {
				itm.html.find("#pending-notice").show();
			}

		},
		updateItem : function(itm) {
			//update_item.json?id=00002&status=1
			//delete_item.json?id=00002
		}
	});

	// Main view
	SIVVIT.EventsView = SIVVIT.AbstractView.extend({

		render : function(options) {

			this.model = options.model;
		}
	});

})($, SIVVIT);
