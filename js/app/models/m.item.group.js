/**
 * Temporal bucket containing content
 */
SIVVIT.ItemGroupModel = Backbone.Model.extend({
	defaults : {

		id : null,
		timestamp : null,

		// Collection of items - ItemCollection
		items : null,
		// Items already displayed
		displayed : 0,

		stats : {
			total : 0,
			post : 0,
			media : 0,
		}
	}
});
