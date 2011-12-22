// Contains event data
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
		pending : 0,
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