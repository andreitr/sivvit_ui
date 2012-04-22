// JSLint variable definition
/*global SIVVIT:true, Raphael:false, $:false, Backbone:false, confirm:false, console:false  */

SIVVIT.HistogramView = Backbone.View.extend({

  bars : [],
  slider : false,

  initialize : function(options) {
    this.model = options.model;
    this.model.bind('change:histogram', this.render, this);
  },

  render : function() {

    this.drawHistogram();
    this.updateTime();
  },

  // Updates min and max time displays
  updateTime : function() {
    $('#timeline-mintime').html(this.model.get('startRange').format());
    $('#timeline-maxtime').html(this.model.get('endRange').format());
  },

  // Sets histogram bar colors based on the visible range
  updateBarColor : function(bar) {
    if(new Date(bar.timestamp).getTime() >= this.model.get('startRange').getTime() && new Date(bar.timestamp).getTime() <= this.model.get('endRange').getTime()) {
      bar.attr({
        fill : '#333333'
      });
    } else {
      bar.attr({
        fill : '#CCCCCC'
      });
    }
  },

  // Draws histogram.
  drawHistogram : function() {

    if(this.model.get('histogram')) {

      var adjusted_end_date = this.model.adjustToNextBucket(new Date(this.model.get('histogramEndDate'))).getTime();

      // Total count of available slots
      var lenTotal = Math.ceil((adjusted_end_date - this.model.get('histogramStartDate')) / this.model.getResolution());

      // Actual count of temporal slots
      var len = this.model.get('histogram').length;

      var maxVal = this.model.get('max');
      var minVal = this.model.get('min');

      var maxHeight = $(this.el).height();
      var maxWidth = $(this.el).width();

      var barW = $(this.el).width() / lenTotal;

      // Anything less than 0.5 displays as a very thin bar
      barW = barW < 0.5 ? 0.5 : barW;

      var startTime = this.model.get('histogramStartDate');
      var endTime = adjusted_end_date;

      var histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

      for(var i = len; i--; ) {

        var frame = new SIVVIT.TemporalFrameModel(this.model.get('histogram')[i]);

        var percentY = (frame.get('count') / maxVal) * 100;
        var percentX = (frame.get('timestamp').getTime() - startTime) / (endTime - startTime);

        var barH = Math.round(percentY * maxHeight / 100);
        var barX = Math.round(percentX * maxWidth);
        var barY = Math.round(maxHeight - barH);

        var bar = histogram.rect(barX, barY, barW, barH).attr({
          fill : '#333333',
          'stroke-width' : 0
        });
      }
    }
  }

});
