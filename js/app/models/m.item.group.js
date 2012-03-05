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
			media : 0,
		}
	},
	// Sets url path with all necessary parameters
	setRequestPath : function(startDate, endDate, limit, resolution) {
		var page = Math.round(this.get("displayed") / limit) + 1;
		this.url = this.get("json") + "&meta=0&fromDate=" + (startDate.getTime()/1000) + "&toDate=" + (endDate.getTime()/1000) + "&limit=" + limit + "&page=" + page+"&resolution="+resolution;
	},
});
