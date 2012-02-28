// Contains event data
SIVVIT.EventModel = Backbone.Model.extend({

	defaults : {

		// Original JSON url
		json : null,
		
		// Used in the data request, load meta data if specified
		meta : 1,

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
		last_update : null,
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
	},

	// Updates url path of the model. Used primarily to update the since attribute
	// when loading additional data.
	updateUrlPath : function() {

		var path = this.attributes.json;

		if(this.attributes.meta !== null) {
			path += "&meta=" + this.attributes.meta;
		}
		if(this.attributes.last_update !== null) {
			path += "&since=" + this.attributes.last_update;
		}
		if(this.attributes.histogram.resolution !== null) {
			path += "&resolution=hour";// + this.attributes.histogram.resolution;
		}
		this.url = path;
	}
});
