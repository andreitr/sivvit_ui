// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

// Model for the temporal bucket
SIVVIT.ItemGroupModel = Backbone.Model.extend({
  defaults : {

    // Data url
    json : null,

    type : null,

    id : null,

    timestamp : null,

    // Collection of items - ItemCollection
    items : null,

    // Collection of newly loaded items - instance of ItemCollection
    items_new : null,

    // HTML container for this group
    div_id : null,

    // Count of the displayed items
    displayed : 0,

    stats : {
      total : 0,
      post : 0,
      media : 0
    }
  },

  // When loading additional items the JSON response has a global stats object
  // that looks exactly like the one in this model.

  // By default global stats REPLACE the one here. In order to solve this issue
  // we update local stats only when lock_stats var is set to false.
  lock_stats : false,

  // Override set method to regulate updating of the stats object
  set : function(attributes, options) {

    // Date.secondsToDate is in date.js
    if(attributes.hasOwnProperty('timestamp') && attributes.timestamp !== undefined && attributes.timestamp !== null) {
      attributes.timestamp = Date.secondsToDate(attributes.timestamp);
    }

    // Update stats only for the fist time
    if(attributes.hasOwnProperty('stats')) {
      if(!this.lock_stats) {
        this.lock_stats = true;
      } else {
        delete attributes.stats;
      }
    }
    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  },
  // Sets url path with all necessary parameters
  setRequestPath : function(startDate, endDate, limit, resolution, type) {

    console.log('NEW REQUEST PATH SET');

    var page = Math.round(this.get('displayed') / limit) + 1;
    this.url = this.get('json') + '&meta=0&fromDate=' + Date.dateToSeconds(startDate) + '&toDate=' + Date.dateToSeconds(endDate) + '&limit=' + limit + '&page=' + page + '&resolution=' + resolution + '&type[]=' + type;
  }

});