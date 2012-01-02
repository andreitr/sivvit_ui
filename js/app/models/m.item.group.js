/**
 * Temporal bucket containing content
 */
SIVVIT.ItemGroupModel = Backbone.Model.extend({
	defaults : {
		count : 30,
		timestamp : null,
		items : null // Collection of items - ItemCollection
	}
});
