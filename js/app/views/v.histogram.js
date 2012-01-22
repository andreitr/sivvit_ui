SIVVIT.HistogramView = Backbone.View.extend({

	bars : [],
	slider : false,

	initialize : function(options) {
		this.slider = options.slider;
		this.model = options.model;
		this.model.bind("change:histogram", this.render, this);
	},
	render : function() {
		this.drawHistogram();
		if(this.slider) {
			this.drawSlider();
		}
	},
	drawSlider : function() {
		self = this;

		$("#timeline-slider").slider({
			range : true,
			min : this.model.get("startDate").getTime(),
			max : this.model.get("endDate").getTime(),
			values : [this.model.get("startRange").getTime(), this.model.get("endRange").getTime()],
			stop : function(event, ui) {
				self.onSliderDragged(event, ui);
			}
		});

		this.updateTime();
	},
	onSliderDragged : function(event, ui) {
		this.model.set({
			"startRange" : new Date(ui.values[0])
		});
		this.model.set({
			"endRange" : new Date(ui.values[1])
		});
		this.updateBars();
	},
	// Updates histogram bar colors
	updateBars : function() {
		for(var i = this.bars.length; i--; ) {
			this.updateBarColor(this.bars[i]);
		}
		this.updateTime();
	},
	// Updates min and max time displays
	updateTime : function() {
		$("#timeline-mintime").html(this.model.get("startRange").format());
		$("#timeline-maxtime").html(this.model.get("endRange").format());
		
		console.log(this.model.get("startRange"));
		console.log(this.model.get("endRange"));
	},
	// Sets histogram bar colors based on the visible range
	updateBarColor : function(bar) {
		if(new Date(bar.timestamp).getTime() >= this.model.get("startRange").getTime() && new Date(bar.timestamp).getTime() <= this.model.get("endRange").getTime()) {
			bar.attr({
				fill : "#333333"
			});
		} else {
			bar.attr({
				fill : "#CCCCCC"
			});
		}
	},
	// Returns appropriate resolution.
	getResolution : function() {
		switch(this.model.get("resolution")) {
			case "day":
				return 86400000;
			case "hour":
				return 3600000;
			case "minute":
				return 60000;
			case "second":
				return 1000;
		}
	},
	
	// Draws histogram.
	drawHistogram : function() {
		if(this.model.get("histogram")) {

			// Total count of available slots
			var lenTotal = Math.ceil((this.model.get("endDate").getTime() - this.model.get("startDate").getTime()) / this.getResolution());

			// Acutal count of temporal slots
			var len = this.model.get("histogram").length;

			var maxVal = this.model.get("max");
			var minVal = this.model.get("min");

			var maxHeight = $(this.el).height();
			var maxWidth = $(this.el).width();

			var barW = $(this.el).width() / lenTotal;
			// Anything less than 0.5 displays as a very thin bar
			barW = barW < 0.5 ? 0.5 : barW;

			var startTime = this.model.get("startDate").getTime();
			var endTime = this.model.get("endDate").getTime();

			var histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

			for(var i = len; i--; ) {
				var frame = this.model.get("histogram")[i];

				var percentY = (frame.count / maxVal) * 100;
				var percentX = (new Date(frame.timestamp).getTime() - startTime) / (endTime - startTime);

				var barH = Math.round(percentY * maxHeight / 100);
				var barX = Math.round(percentX * maxWidth);
				var barY = Math.round(maxHeight - barH);

				var bar = histogram.rect(barX, barY, barW, barH).attr({
					fill : "#333333",
					"stroke-width" : 0
				});

				if(this.slider) {
					bar.timestamp = frame.timestamp;
					this.updateBarColor(bar);
					this.bars.push(bar);
				}
			}
		}
	}
});
