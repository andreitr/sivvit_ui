// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

// Contains event data
SIVVIT.EventModel = Backbone.Model.extend({

  defaults : {
    // Original JSON url
    json : null,
    // Used in the data request, load meta data if specified
    meta : 1,
    // Used in data request to determine the number of displayed items
    limit : 3,
    // The number of initially loaded buckets
    bucket_limit : 5,
    // Loaded buckets
    bucket_page : 1,

    // Determines whether the model continuously pulls content from the server.
    // By default this parameter is true however, when event data is displayed
    // in the edit window, we don't need to pull the latest content even if the
    // event is live.
    pull : true,

    // Default data type
    type : 'post',

    // Temporal bounds of loaded content
    content_bounds : {
      min : null,
      max : null
    },

    // Properties loaded from the server
    id : null,
    title : null,
    author : null,
    description : null,
    keywords : [],
    content : [],
    location : {
      lon : null,
      lat : null,
      name : null
    },
    startDate : null,
    endDate : null,

    // Status property can have the following states
    //-1 ending
    // 0 not started
    // 1 running
    // 2 finished
    status : 0,
    last_update : null,
    pending : 0,
    stats : {
      total : 0,
      posts : 0,
      images : 0,
      videos : 0
    },

    // We need to record the original values from the histogram.
    histogram : {
      min : null,
      max : null,
      resolution : null,
      global : [],
      media : [],
      post : []
    }

  },

  // Fetch interval id
  fetch_interval : null,

  // Override parse method to keep track when new data is loaded from the server.
  // If a collection hasn't been started and there is no change, then we need to
  // check its status at periodic intervals.
  parse : function(resp, xhr) {

    if(this.get('status') === 1 || this.get('status') === 0 && this.get('pull') === true) {
      this.startLiveData();
    } else {
      this.stopLiveData();
    }
    return resp;
  },

  // Override fetch method to stop live data timer at every request
  fetch : function(options) {
    this.stopLiveData();
    Backbone.Model.prototype.fetch.call(this, options);
  },

  // Override set method to keep track of the original
  set : function(attributes, options) {

    // Make sure that status is always a number
    if(attributes.hasOwnProperty('status') && attributes.status !== undefined && attributes.status !== null) {
      attributes.status = Number(attributes.status);
    }

    // Make sure the data is properly formatted from the start
    // NOTE: Date.secondsToDate is in app/misc.date.js
    if(attributes.hasOwnProperty('startDate')) {
      attributes.startDate = Date.secondsToDate(attributes.startDate);
    }
    if(attributes.hasOwnProperty('endDate')) {
      attributes.endDate = Date.secondsToDate(attributes.endDate);
    }
    if(attributes.hasOwnProperty('last_update')) {
      attributes.last_update = Date.secondsToDate(attributes.last_update);
    }

    // Append histogram values
    if(attributes.hasOwnProperty('histogram') && attributes.histogram !== undefined && attributes.histogram !== null) {

      // Hash tables for histogram data.
      this.attributes.post_hash = this.attributes.post_hash || {};
      this.attributes.media_hash = this.attributes.media_hash || {};
      this.attributes.global_hash = this.attributes.global_hash || {};

      if(this.get('histogram') !== undefined) {

        attributes.histogram.max = Math.max(attributes.histogram.max, this.get('histogram').max);
        attributes.histogram.min = Math.min(attributes.histogram.min, this.get('histogram').min);

        if(attributes.histogram.post !== undefined && attributes.histogram.post !== null) {
          attributes.histogram.post = this.appendHistogram(this.get('post_hash'), attributes.histogram.post);
        } else {
          attributes.histogram.post = this.get('histogram').post;
        }
        if(attributes.histogram.media !== undefined && attributes.histogram.media !== null) {
          attributes.histogram.media = this.appendHistogram(this.get('media_hash'), attributes.histogram.media);
        } else {
          attributes.histogram.media = this.get('histogram').media;
        }
        if(attributes.histogram.global !== undefined && attributes.histogram.global !== null) {
          attributes.histogram.global = this.appendHistogram(this.get('global_hash'), attributes.histogram.global);
        } else {
          attributes.histogram.global = this.get('histogram').global;
        }
      }
    }
    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  },

  // Updates the model and calls provided callbacks when done
  createEvent : function(init) {

    var self = this;

    init = init || {
      success : null,
      error : null
    };

    $.ajax({
      url : SIVVIT.Settings.host + '/e/event/',
      data : self.formatModel(),
      type : 'POST',
      dataType : 'json',
      success : init.success,

      // Add cookie when event is saved
      complete : function(data) {

        $.cookie('com.sivvit.event', JSON.stringify({
          action : 'create',
          model : JSON.parse(data.responseText)
        }));
      },
      error : init.error
    });

  },

  // Deletes existing event
  deleteEvent : function(init) {

    var self = this;

    init = init || {
      success : null,
      complete : null,
      error : null
    };

    $.ajax({
      url : SIVVIT.Settings.host + '/e/event/' + this.get('id'),
      data : self.formatModel(),
      type : 'DELETE',
      dataType : 'json',
      complete : init.complete,
      error : init.error
    });

    $.cookie('com.sivvit.event', JSON.stringify({
      action : 'delete',
      model : self.formatModel()
    }));

  },

  // Updates existing event
  updateEvent : function(init) {

    var self = this;

    init = init || {
      success : null,
      error : null
    };

    $.ajax({
      url : SIVVIT.Settings.host + '/e/event/' + this.get('id'),
      data : self.formatModel(),
      type : 'PUT',
      dataType : 'json',
      success : init.success,
      error : init.error,
      complete : function() {

        // Update cookie once event is updated
        $.cookie('com.sivvit.event', JSON.stringify({
          action : 'update',
          model : self.formatModel()
        }));
      }

    });

  },

  // Formats model to required format for saving
  formatModel : function() {

    var result = {
      startDate : Date.dateToSeconds(this.get('startDate')),
      endDate : Date.dateToSeconds(this.get('endDate')),
      location : this.get('location'),
      title : this.get('title'),
      description : this.get('description'),
      keywords : this.get('keywords'),
      id : this.get('id')
    };

    return result;
  },

  // The entire histogram is sent only with the first request, all subsequent
  // requests contain only the updated values. In order to keep the entire histogram
  // up to date we need to append all the changes to the initial values.
  appendHistogram : function(hash, value) {

    var len = value.length;
    var result = [];

    for(var i = len; i--; ) {

      if(hash[value[i].timestamp]) {
        hash[value[i].timestamp].count = Number(hash[value[i].timestamp].count) + Number(value[i].count);
      } else {
        hash[value[i].timestamp] = value[i];
      }
    }
    // Format output
    for(var bucket in hash) {
      if(hash[bucket]) {
        result.push(hash[bucket]);
      }
    }
    return result;
  },

  // Updates temporal range of loaded content.
  updateContentRange : function(date) {
    // Set default values
    if(this.attributes.content_bounds.min === null) {
      this.attributes.content_bounds.min = this.get('endDate');
      this.attributes.content_bounds.max = this.get('startDate');
    }
    this.attributes.content_bounds.min = Math.min(date, this.attributes.content_bounds.min);
    this.attributes.content_bounds.max = Math.max(date, this.attributes.content_bounds.max);
  },

  // Sets URL path for since requests, loads new live data.
  setSinceRequestURL : function() {

    var path = this.attributes.json;

    if(this.attributes.meta !== null) {
      path += '&meta=' + this.attributes.meta;
    }
    if(this.attributes.limit !== null) {
      path += '&limit=' + this.attributes.limit;
    }
    if(this.attributes.last_update !== null) {
      path += '&since=' + this.attributes.last_update;
    }
    if(this.attributes.bucket_limit !== null) {
      path += '&bucket_limit=' + this.attributes.bucket_limit;
    }
    if(this.attributes.bucket_page !== null) {
      path += '&bucket_page=' + this.attributes.bucket_page;
    }
    if(this.attributes.type !== null) {
      path += '&type[]=' + this.attributes.type;
    }
    if(this.attributes.histogram.resolution !== null) {
      path += '&resolution=' + this.attributes.histogram.resolution;
    }
    this.url = path;
  },

  // Set's URL path to load the view
  setRequestURL : function() {
    var path = this.attributes.json;

    if(this.attributes.meta !== null) {
      path += '&meta=0';
    }
    if(this.attributes.limit !== null) {
      path += '&limit=' + this.attributes.limit;
    }
    if(this.attributes.bucket_limit !== null) {
      path += '&bucket_limit=' + this.attributes.bucket_limit;
    }
    if(this.attributes.bucket_page !== null) {
      path += '&bucket_page=' + this.attributes.bucket_page;
    }
    if(this.attributes.type !== null) {
      path += '&type[]=' + this.attributes.type;
    }
    if(this.attributes.histogram.resolution !== null) {
      path += '&resolution=' + this.attributes.histogram.resolution;
    }
    this.url = path;
  },

  // Updates type for URL data requests
  setRequestType : function(type) {
    switch(type) {
      case 'all':
        this.attributes.type = 'photo&type[]=media&type[]=post';
        break;
      case 'media':
        this.attributes.type = 'media&type[]=photo';
        break;
      case 'photo':
        this.attributes.type = 'photo';
        break;
      case 'post':
        this.attributes.type = 'post';
        break;
    }
  },

  // Increments the page count and loads more content buckets
  loadMoreContent : function() {
    this.attributes.bucket_page = this.get('bucket_page') + 1;
    this.setRequestURL();
    this.fetch();
  },

  // Resets currently existing contnet
  resetContent : function() {
    this.set({
      bucket_page : 1,
      content : null
    }, {
      silent : true
    });
  },

  // Start continues data loading
  startLiveData : function() {
    var self = this;

    this.stopLiveData();

    // Initiate continues content loading
    this.fetch_interval = setInterval(function() {
      self.fetch();
    }, 10000);

  },

  // Stop continues data requests
  stopLiveData : function() {
    clearInterval(this.fetch_interval);
  }

});
