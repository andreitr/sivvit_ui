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

  // Draws histogram.
  drawHistogram : function() {

    // Clear out previous drawing
    var histogram = Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

    if(this.model.get('histogram')) {

      var adjusted_end_date = this.model.adjustToNextBucket(new Date(this.model.get('histogramEndDate'))).getTime();

      // Total count of available slots
      var len_total = Math.ceil((adjusted_end_date - this.model.get('histogramStartDate')) / this.model.getResolution());

      // Actual count of temporal slots
      var len = this.model.get('histogram').length;

      var max_val = this.model.get('max');

      var max_height = $(this.el).height();
      var max_width = $(this.el).width();

      var bar_w = $(this.el).width() / len_total;

      // Anything less than 0.5 displays as a very thin bar
      bar_w = bar_w < 0.5 ? 0.5 : bar_w;

      var start_time = this.model.get('histogramStartDate');
      var end_time = adjusted_end_date;

      for(var i = len; i--; ) {

        var frame = new SIVVIT.TemporalFrameModel(this.model.get('histogram')[i]);

        var percent_y = (frame.get('count') / max_val) * 100;
        var percent_x = (frame.get('timestamp').getTime() - start_time) / (end_time - start_time);

        var bar_h = Math.round(percent_y * max_height / 100);
        var bar_x = Math.round(percent_x * max_width);
        var bar_y = Math.round(max_height - bar_h);

        var bar = histogram.rect(bar_x, bar_y, bar_w, bar_h).attr({
          fill : '#333333',
          'stroke-width' : 0
        });
      }
    }
  }

});
