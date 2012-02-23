// Contains values for the histogram
SIVVIT.TemporalModel = Backbone.Model.extend({

	defaults : {

		// Min, max date
		startDate : new Date(),
		endDate : new Date(),

		// Viewable range
		startRange : null,
		endRange : null,

		// Min, max bucket elements
		min : null,
		max : null,

		// Array of histogram elements
		histogram : null,

		// Actual histogram range
		histogramStartDate : null,
		histogramEndDate : null,

		// Minute, second, hour, day
		resolution : null,
		// Type of the displayed content - global, media, post
		type : null,
	},

	bucket_hash : null,

	// Override set method to keep track on
	set : function(attributes, options) {

		// Adjust timestamp
		if(attributes.hasOwnProperty("histogram") && attributes.histogram !== undefined && attributes.histogram !== null) {

			this.bucket_hash = {};
			this.set({
				histogramStartDate : null
			});
			this.set({
				histogramEndDate : null
			});

			var len = attributes.histogram.length;
			for(var i = len; i--; ) {
				attributes.histogram[i].timestamp = this.adjustResolution(new Date(attributes.histogram[i].timestamp));

				// Remove timestamp if it falls outside the range bounds
				if(this.checkDateBounds(attributes.histogram[i].timestamp) === true) {
					this.bucket_hash[attributes.histogram[i].timestamp] = attributes.histogram[i];

					if(!this.get("histogramStartDate") || !this.get("histogramEndDate")) {
						this.set({
							histogramStartDate : attributes.histogram[i].timestamp
						});
						this.set({
							histogramEndDate : attributes.histogram[i].timestamp
						});
					} else {
						this.set({
							histogramStartDate : Math.min(attributes.histogram[i].timestamp, this.get("histogramStartDate"))
						});
						this.set({
							histogramEndDate : Math.max(attributes.histogram[i].timestamp, this.get("histogramEndDate"))
						});
					}
				} else {
					attributes.histogram.splice(i, 1);
				}
			}
		}

		Backbone.Model.prototype.set.call(this, attributes, options);
		return this;
	},
	// Append new buckets to an existing histogram
	appendBuckets : function(value) {

		var len = value.length, bucket;
		var result = [];

		for(var i = len; i--; ) {

			value[i].timestamp = this.adjustResolution(new Date(value[i].timestamp));

			if(this.bucket_hash[value[i].timestamp]) {
				this.bucket_hash[value[i].timestamp].count = Number(this.bucket_hash[value[i].timestamp].count) + Number(value[i].count);
			} else {
				this.bucket_hash[value[i].timestamp] = value[i];
			}
		}

		for(var bucket in this.bucket_hash) {
			result.push(this.bucket_hash[bucket]);
		}

		this.set({
			histogram : result
		});
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
	},
	// Checks the bounds of
	checkDateBounds : function(date) {
		return date >= this.get("startDate") && date <= this.get("endDate") ? true : false;
	}
});
