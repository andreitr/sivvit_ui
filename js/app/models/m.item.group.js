// Model for the temporal bucket
SIVVIT.ItemGroupModel = Backbone.Model.extend({
	defaults : {

		// Data url
		json : null,

		type : null,

		id : null,

		timestamp : null,

		// Collection of items - ItemCollection
		items : null,

		// Collection of newly loaded items - instance of ItemCollection
		items_new : null,

		// HTML container for this group
		div_id : null,

		// Count of the displayed items
		displayed : 0,

		stats : {
			total : 0,
			post : 0,
			media : 0
		}
	},

	// When loading additional items the JSON response has a global stats object
	// that looks exactly like the one in this model.

	// By default global stats REPLACE the one here. In order to solve this issue
	// we update local stats only when lock_stats var is set to false.
	lock_stats : false,

	// Override set method to regulate updating of the stats object
	set : function(attributes, options) {

		// Update stats only for the fist time
		if(attributes.hasOwnProperty("stats")) {
			if(!this.lock_stats) {
				this.lock_stats = true;
			} else {
				delete attributes.stats;
			}
		}
		Backbone.Model.prototype.set.call(this, attributes, options);
		return this;
	},
	// Sets url path with all necessary parameters
	setRequestPath : function(startDate, endDate, limit, resolution, type) {
		var page = Math.round(this.get("displayed") / limit) + 1;
		this.url = this.get("json") + "&meta=0&fromDate=" + (startDate.getTime() / 1000) + "&toDate=" + (endDate.getTime() / 1000) + "&limit=" + limit + "&page=" + page + "&resolution=" + resolution + "&type[]=" + type;
	}
});