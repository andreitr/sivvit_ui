/*global SIVVIT:true, Raphael:false, $:false, Backbone:false  */
/*jslint white:true devel:true passfail:false sloppy:true*/

SIVVIT.HistogramView = Backbone.View.extend({

    bars : [],

    histogram : null,

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

        var i, adjusted_end_date, len_total, len, max_val, max_height, max_width, bar, bar_w, bar_h, bar_x, bar_y, start_time, end_time, frame, percent_y, percent_x;

        // Clear out previous drawing
        if (this.histogram) {
            this.histogram.clear();
        }

        console.log($(this.el));

        this.histogram = new Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

        if (this.model.get('histogram') && this.model.get('histogramStartDate')) {

            adjusted_end_date = this.model.adjustToNextBucket(new Date(this.model.get('histogramEndDate'))).getTime();

            // Total count of available slots
            len_total = Math.ceil((adjusted_end_date - this.model.get('histogramStartDate')) / this.model.getResolution());

            // Actual count of temporal slots
            len = this.model.get('histogram').length;

            max_val = this.model.get('max');

            max_height = $(this.el).height();
            max_width = $(this.el).width();

            bar_w = $(this.el).width() / len_total;

            // Anything less than 0.5 displays as a very thin bar
            bar_w = bar_w < 0.5 ? 0.5 : bar_w;

            start_time = this.model.get('histogramStartDate');
            end_time = adjusted_end_date;

            for ( i = len; i--; ) {

                frame = new SIVVIT.TemporalFrameModel(this.model.get('histogram')[i]);

                percent_y = (frame.get('count') / max_val) * 100;
                percent_x = (frame.get('timestamp').getTime() - start_time) / (end_time - start_time);

                bar_h = Math.round(percent_y * max_height / 100);
                bar_x = Math.round(percent_x * max_width);
                bar_y = Math.round(max_height - bar_h);

                bar = this.histogram.rect(bar_x, bar_y, bar_w, bar_h).attr({
                    fill : '#333333',
                    'stroke-width' : 0
                });
            }
        }
    }

});
