// JSLint variable definition
/*global SIVVIT:true, Raphael:false, $:false, Backbone:false, confirm:false, console:false  */

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
    resolution : null
  },

  // Override set method to keep track on
  set : function(attributes, options) {

    // Adjust timestamp
    if(attributes.hasOwnProperty('histogram') && attributes.histogram !== undefined && attributes.histogram !== null) {

      this.bucket_hash = {};

      this.set({
        histogramStartDate : null
      });
      this.set({
        histogramEndDate : null
      });

      var len = attributes.histogram.length;

      if(len > 0) {

        var tmp_min = 0, tmp_max = 0;

        for(var i = len; i--; ) {

          // If the histogram is displayed more than once the date object is already present
          if(attributes.histogram[i].timestamp instanceof Date === false) {

            // Date.secondsToDate is located in date.js
            attributes.histogram[i].timestamp = Date.secondsToDate(attributes.histogram[i].timestamp);
          }

          // Remove histogram bucket if timestamp it falls outside the range bounds
          if(this.checkDateBounds(attributes.histogram[i].timestamp) === true) {

            tmp_min = Math.min(tmp_min, attributes.histogram[i].count);
            tmp_max = Math.max(tmp_max, attributes.histogram[i].count);

            this.bucket_hash[attributes.histogram[i].timestamp] = attributes.histogram[i];

            if(!this.get('histogramStartDate') || !this.get('histogramEndDate')) {
              this.set({
                histogramStartDate : attributes.histogram[i].timestamp
              });
              this.set({
                histogramEndDate : attributes.histogram[i].timestamp
              });
            } else {
              this.set({
                histogramStartDate : Math.min(attributes.histogram[i].timestamp, this.get('histogramStartDate'))
              });
              this.set({
                histogramEndDate : Math.max(attributes.histogram[i].timestamp, this.get('histogramEndDate'))
              });
            }
          } else {
            attributes.histogram.splice(i, 1);
          }
        }

        attributes.min = tmp_min;
        attributes.max = tmp_max;
      }
    }

    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  },

  // Formats date object to match event resolution.
  // Standard buckets for histogram count aggregation.
  adjustResolution : function(date) {
    switch(this.get('resolution')) {
      case 'day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      case 'hour':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
      case 'minute':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
      case 'second':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    }
  },

  // Adjusts the date object to the next available bucket
  // TODO: This function is not adjusted for leap year nor for upper limit of the date obj
  adjustToNextBucket : function(date, resolution) {
    var new_date;
    resolution = resolution === undefined ? this.get('resolution') : resolution;

    switch(resolution) {
      case 'day':
        new_date = this.adjustResolution(date);
        new_date.setDate(new_date.getDate() + 1);
        return new_date;

      case 'hour':
        new_date = this.adjustResolution(date);
        new_date.setHours(new_date.getHours() + 1);
        return new_date;

      case 'minute':
        new_date = this.adjustResolution(date);
        new_date.setMinutes(new_date.getMinutes() + 1);
        return new_date;

      case 'second':
        new_date = this.adjustResolution(date);
        new_date.setSeconds(new_date.getSeconds() + 1);
        return new_date;
    }
  },

  // Returns milliseconds for the appropriate resolution
  getResolution : function() {
    switch(this.get('resolution')) {
      case 'day':
        return 86400000;
      case 'hour':
        return 3600000;
      case 'minute':
        return 60000;
      case 'second':
        return 1000;
    }
  },

  // Checks the bounds of the date to see if it should be displayed
  // Adjusting the date to the next bucket for more accuracy
  checkDateBounds : function(date) {
    return this.adjustToNextBucket(date, this.get('resolution')) >= this.get('startDate') && date <= this.get('endDate') ? true : false;
  }

});
