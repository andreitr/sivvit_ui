/**
 * Temporal bucket containing content
 */
SIVVIT.ItemGroupModel = Backbone.Model.extend({
	defaults : {
		count : null,
		content : null, // Collection of items
		timestamp : null,
	}
});
