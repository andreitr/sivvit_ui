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
	
	bucket_hash:null,
	
	// Override set method to keep track on
	set : function(attributes, options) {
		
		// Adjust timestamp
		if(attributes.hasOwnProperty("histogram") && attributes.histogram !== undefined && attributes.histogram !== null) {
			
			this.bucket_hash = {};
			var len = attributes.histogram.length;
			for(var i = len; i--; ) {
				attributes.histogram[i].timestamp = this.adjustResolution(new Date(attributes.histogram[i].timestamp));
				this.bucket_hash[attributes.histogram[i].timestamp] = attributes.histogram[i]; 
			}
		}

		Backbone.Model.prototype.set.call(this, attributes, options);
		return this;
	},
	
	appendBuckets: function(value){
		
		var len = value.length, bucket;
		var result =  [];
		
		for(var i = len; i--; ){
			
			value[i].timestamp = this.adjustResolution(new Date(value[i].timestamp));
			
			if(this.bucket_hash[value[i].timestamp]){
				this.bucket_hash[value[i].timestamp].count = Number(this.bucket_hash[value[i].timestamp].count) + Number(value[i].count);
			}else{
				this.bucket_hash[value[i].timestamp] = value[i]; 
			}
		}
		
		for(var bucket in this.bucket_hash){
			result.push(this.bucket_hash[bucket]);	
		}
		
		this.set({histogram : result});
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
