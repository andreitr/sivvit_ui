/**
 * Generic conetnt model.
 */
SIVVIT.ItemModel = Backbone.Model.extend({
	defaults : {
		id : null,
		status : null,
		type : null,
		location : [],
		content : null,
		source : null,
		timestamp : "",
		rank : 0,
		author : null,
		avatar : null
	}
});
