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

		// We need to record the original values from the histogram.
		histogram : {
			min : null,
			max : null,
			resolution : null,
			global : [],
			media : [],
			post : []
		}
	},

	// Hash tables for histogram data
	post_hash : {},
	media_hash : {},
	global_hash : {},

	// Override set method to keep track of the original
	set : function(attributes, options) {

		// Append histogram values
		if(attributes.hasOwnProperty("histogram") && attributes.histogram !== undefined && attributes.histogram !== null) {

			if(this.get("histogram") !== undefined) {
				attributes.histogram.max = Math.max(attributes.histogram.max, this.get("histogram").max);
				attributes.histogram.min = Math.min(attributes.histogram.min, this.get("histogram").min);
			}
			if(attributes.histogram.post !== undefined) {
				attributes.histogram.post = this.appendHistogram(this.post_hash, attributes.histogram.post);
			}
			if(attributes.histogram.media !== undefined) {
				attributes.histogram.media = this.appendHistogram(this.media_hash, attributes.histogram.media);
			}
			if(attributes.histogram.global !== undefined) {
				attributes.histogram.global = this.appendHistogram(this.global_hash, attributes.histogram.global);
			}
		}

		Backbone.Model.prototype.set.call(this, attributes, options);
		return this;
	},
	// The entire histogram is sent only with the first request, all subsequent
	// requests contain only the updated values. In order to keep the entire histogram
	// up to date we need to append all the changes to the initial values.
	appendHistogram : function(hash, value) {

		var len = value.length;
		var result = [];

		for(var i = len; i--; ) {

			if(hash[value[i].timestamp]) {
				hash[value[i].timestamp].count = Number(hash[value[i].timestamp].count) + Number(value[i].count);
			} else {
				hash[value[i].timestamp] = value[i];
			}
		}
		// Format output
		for(var bucket in hash) {
			result.push(hash[bucket]);
		}
		return result;
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
			path += "&resolution=hour";
			//+this.attributes.histogram.resolution;
		} else {
			path += "&resolution=hour";
		}
		this.url = path;
	}
});
