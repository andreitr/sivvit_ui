// Contains valus for the histogram

SIVVIT.TemporalModel = Backbone.Model.extend({
	defaults : {
		startDate : new Date(),
		endDate : new Date(),
		startRange : null,
		endRange : null,
		min : null,
		max : null,
		resolution : null,
		histogram : null
	}
});