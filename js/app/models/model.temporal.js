// Contains valus for the histogram

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
		resolution : null,
		histogram : null,
		// Type of the displayed content - global, media, post
		type : null,
	}
});
