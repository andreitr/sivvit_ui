// Contains values for the histogram
SIVVIT.TemporalModel = Backbone.Model.extend({

	defaults : {

		startDate : new Date(),
		endDate : new Date(),

		startRange : null,
		endRange : null,

		// Maximum number of elements in bucket
		min : null,
		// Minimum number of elements in a bucket
		max : null,

		// Array
		histogram : null,

		// Minute, second, hour, day
		resolution : null,
		// Type of the displayed content - global, media, post
		type : null,
	},

	// Override set method to keep track on
	set : function(attributes, options) {

		// Create histogram hash table
		if(attributes.hasOwnProperty("histogram") && attributes.histogram !== null) {

			this.histogram_hash = {}
			var len = attributes.histogram.length;
			for(var i = len; i--; ) {
				attributes.histogram[i].timestamp = this.adjustResolution(new Date(attributes.histogram[i].timestamp));
			}
		}

		Backbone.Model.prototype.set.call(this, attributes, options);
		return this;
	},
	// Appends new values to the existing histogram
	updateHistogram : function(value) {

		if(value && value.length > 0) {
			var len = value.length;

			for(var i = len; i--; ) {

				var date = this.adjustResolution(new Date(value[i].timestamp));

				if(this.histogram_hash.hasOwnProperty(value[i].timestamp)) {
					this.histogram_hash[value[i].timestamp].count += value[i].count;
				} else {
					this.histogram_hash[value[i].timestamp] = value[i];
				}
			}
		}
	},
	// Formats date object to match event resolution.
	// Standardised buckets for histogram count aggregation.
	adjustResolution : function(date) {

		switch(this.get("resolution")) {
			case "day":
				return new Date(date.getFullYear(), date.getMonth(), date.getDate());
			case "hour":
				return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
			case "minute":
				return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
			case "second":
				return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
		}
	}
});
