/**
 * Temporal bucket containing content
 */
SIVVIT.ItemGroupModel = Backbone.Model.extend({
	defaults : {
		
		type:null,
		id : null,
		timestamp : null,

		// Collection of items - ItemCollection
		items : null,
		
		// Collection of newly loaded items - instance of ItemCollection
		items_new: null,
		
		// HTML container for this group
		div_id: null,
		
		// Count of the displayed items
		displayed: 0,
		
		stats : {
			total : 0,
			post : 0,
			media : 0,
		}
	}
});
