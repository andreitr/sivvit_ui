/**
 * Temporal bucket containing content
 */
SIVVIT.ItemGroupModel = Backbone.Model.extend({
	defaults : {

		id : null,
		timestamp : null,

		// Collection of items - ItemCollection
		items : null,

		stats : {
			total : 0,
			post : 3,
			media : 0
		}
	}
});
