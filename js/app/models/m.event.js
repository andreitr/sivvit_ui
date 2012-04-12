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
    // Data type
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
    startDate : new Date(),
    endDate : new Date(),
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

  // Hash tables for histogram data
  post_hash : {},
  media_hash : {},
  global_hash : {},

  // Fetch interval id
  fetch_interval : null,

  // Add change event listener to restart live pulling with each data update
  initialize : function() {
    this.bind("change", function() {
      if(this.get('status') < 1) {
        this.stopLiveData();
      } else {
        this.startLiveData();
      }
    }, this);

  },

  // Override fetch method to stop live data timer at every request
  fetch : function(options) {
    this.stopLiveData();
    Backbone.Model.prototype.fetch.call(this, options);
  },

  // Override set method to keep track of the original
  set : function(attributes, options) {

    // Append histogram values
    if(attributes.hasOwnProperty('histogram') && attributes.histogram !== undefined && attributes.histogram !== null) {

      if(this.get('histogram') !== undefined) {
        attributes.histogram.max = Math.max(attributes.histogram.max, this.get('histogram').max);
        attributes.histogram.min = Math.min(attributes.histogram.min, this.get('histogram').min);
      }
      if(attributes.histogram.post !== undefined) {
        attributes.histogram.post = this.appendHistogram(this.post_hash, attributes.histogram.post);
      }
      if(attributes.histogram.media !== undefined) {
        attributes.histogram.media = this.appendHistogram(this.media_hash, attributes.histogram.media);
      }
      if(attributes.histogram.global !== undefined) {
        attributes.histogram.global = this.appendHistogram(this.global_hash, attributes.histogram.global);
      }
    }
    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  },

  // Updates the model and calls provided callbacks when done
  createEvent : function(init) {

    var self = this;

    $.ajax({
      url : 'http://sivvit.com/e/event/',
      data : self.toJSON(),
      type : 'POST',
      dataType : 'json',
      success : init.success,
      complete : init.complete,
      error : init.error
    });
  },

  // Updates existing event
  updateEvent : function() {

    var self = this;
    
    // For existing events we don't need to send the
    // entire model object - send only the required data
    var copy = $.extend(true, {}, this.attributes);
    delete copy.author;
    delete copy.content;
    delete copy.last_update;
    delete copy.pending;
    delete copy.stats;
    delete copy.histogram;
    delete copy.meta;
    delete copy.bucket_limit;
    delete copy.bucket_page;
    delete copy.userid;
    delete copy.content_bounds;
    
    $.ajax({
      url : 'http://sivvit.com/e/event/' + this.get('id'),
      data : copy,
      type : 'PUT',
      dataType : 'json'
      // success : init.success,
      // complete : init.complete,
      // error : init.error
    });
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
      this.attributes.content_bounds.min = new Date(this.get('endDate'));
      this.attributes.content_bounds.max = new Date(this.get('startDate'));
    }
    this.attributes.content_bounds.min = Math.min(date, this.attributes.content_bounds.min);
    this.attributes.content_bounds.max = Math.max(date, this.attributes.content_bounds.max);
  },

  // Returns true when earlier buckets can be loaded.
  hasMoreContent : function() {

    if(this.get('content_bounds').min > new Date(this.get('startDate'))) {
      return true;
    } else {
      return false;
    }
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
    } else {
      path += '&resolution=hour';
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
