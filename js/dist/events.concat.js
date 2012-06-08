// JSLint variable definition and formatting
/*global SIVVIT:true  */
/*jslint white:true */

if ( typeof (SIVVIT) === 'undefined') {
    SIVVIT = {};
}

SIVVIT.Settings = {
    host : 'http://sivvit.com'
};

// JSLint variable definition
/*global SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

(function(jQuery, SIVVIT) {

  SIVVIT.Events = {

    //SIVVIT.EventsCollection
    collection : null,

    //SIVVIT.EventsView
    view : null,

    // Enables content editing when set to true
    edit : true,

    // Initiates the application and loads the main data.
    init : function(json) {

      var self = this;


      this.collection = new SIVVIT.EventsCollection();
      this.view = new SIVVIT.EventsView({
        edit : this.edit
      });



      var MyModel = Backbone.Model.extend({
        url : json
      });
      var tmpModel = new MyModel();

      tmpModel.fetch({
        success : function(result) {

          $('#content-loader').remove();
          $('#event-application').show();

          if (result.attributes) {

            $.each(result.attributes, function(index, value) {

              var actual_model = new SIVVIT.EventModel(value);
              self.collection.add(actual_model);
            });

            self.view.model = self.collection;
            self.view.render();

          }
        }

      });
    }

  };

  // Collection containing event models,
  SIVVIT.EventsCollection = Backbone.Collection.extend({
    model : SIVVIT.EventModel,

    // Sort content by startDate
    comparator : function(itm) {
      return -itm.get('startDate');
    }

  });

  // Core events view. Right now we only have a single implementation.
  SIVVIT.EventsView = Backbone.View.extend({

    template : "<li id='post-list'><div id='content'><div id='histogram'></div><div id='title'><a href='${link}'>${title}</a></div><div id='description'>${description}</div><div id='meta'>${posts} posts, ${images} images, ${videos} videos &nbsp; &nbsp;<span class='icon-location'></span>${location} &nbsp;<span class='icon-user'></span><a href='#'>${author}</a></div></div></div></li>",
    el : '#dynamic-content',

    // Models hash map
    models_hash : {},

    // Enable content editing. Assumes that user is logged in
    edit : false,

    // Set to true when al least of content is displayed
    displayed : false,
    initialize : function(options) {
      this.edit = options.edit;
    },

    render : function() {
      // Clear out previous content
      $(this.el).empty();

      this.displayed = false;

      this.display();
    },

    display : function() {

      $(this.el).append("<ol id='event-list'></ol>");

      // Render collection
      this.model.each(function(itm) {

        itm = this.buildTemplate(itm);

        var mdl = new SIVVIT.TemporalModel({
          startDate : itm.model.get('startDate'),
          endDate : itm.model.get('last_update'),
          startRange : itm.model.get('startDate'),
          endRange : itm.model.get('last_update'),
          resolution : itm.model.get('histogram').resolution
        });

        // Set histogram attribute after all other properties are set
        // for proper histogram adjustment
        mdl.set({
          'histogram' : itm.model.get('histogram').global
        });

        // Render histogram
        var histogram = new SIVVIT.HistogramView({
          el : $(itm.html).find('#histogram'),
          model : mdl
        }).render();

        this.initItem(itm, '#event-list');

        // Populate models hash
        this.models_hash[itm.model.get('id')] = itm;

      }, this);
      this.initLightbox();
    },

    // Builds each item, returns {model, html} object
    buildTemplate : function(itm) {
      var html = $.tmpl(this.template, {
        link : SIVVIT.Settings.host + '/event/' + itm.get('id'),
        title : itm.get('title'),
        description : itm.get('description'),
        posts : itm.get('stats').posts,
        videos : itm.get('stats').videos,
        images : itm.get('stats').images,
        location : itm.get('location').name,
        author : itm.get('author')
      });

      return {
        html : html,
        model : itm
      };
    },

    // Initiates item functionality, displays appropriate
    // dynamic content.
    initItem : function(itm, parent) {

      var self = this;

      if (itm !== null) {

        // Initiate button clicks if a user is logged in and modify
        // content template (add hover buttons and check box)
        if (this.edit) {

          itm.html.find('#content').prepend("<span class=\"item-edit\"><span class='icon-cog' href=\"event_form.html?id=" + itm.model.get('id') + "\" id='event-form'></span><div id=\"pending-flag\"></div></span>");

          itm.html.find('#event-form').hide();

          if (itm.model.get('pending') > 0) {
            itm.html.find('#title').append("<div id='pending'>pending " + itm.model.get("pending") + "</div>");
          }

          itm.html.hover(function(event) {
            itm.html.find('#event-form').show();
          }, function(event) {
            itm.html.find('#event-form').hide();
          });

          itm.html.click(function(event) {

            var checked;

            if (event.target.id !== 'event-form') {

              if (itm.html.find('#itm-check').length > 0) {
                checked = itm.html.find('#itm-check').is(':checked');
                itm.html.find('#itm-check').attr('checked', !checked);
                itm.html.css('background-color', checked ? '#FFFFFF' : '#FFFFCC');
              }
              event.stopPropagation();
            }
          });

          this.toggleLive(itm);
        }
        $(parent).append(itm.html);
      }
    },

    // Initiates event form light box
    initLightbox : function() {

      var self = this;

      // Open light box with event information etc
      $('#event-form').fancybox({
        width : 860,
        height : 430,
        autoScale : true,
        scrolling : false,
        transitionIn : 'fade',
        transitionOut : 'fade',
        type : 'iframe',
        afterClose : function() {

          var cookie = JSON.parse($.cookie('com.sivvit.event'));

          if (cookie) {

            switch(cookie.action) {

              case 'delete':
                if (self.models_hash[cookie.model.id]) {
                  self.deleteItem(self.models_hash[cookie.model.id]);
                }
                break;

              case 'update':
                // Update existing model
                if (self.models_hash[cookie.model.id]) {
                  self.models_hash[cookie.model.id].model.set(cookie.model);
                  self.updateItem(self.models_hash[cookie.model.id]);
                }
                break;

              case 'create':

                //TODO: Create type won't get triggered here since the event listener is assigned
                // to a different id. Options:
                // 1. Global class for handling pop-up
                // 2. Global generic method for handling on close that will get passed around
                // 3. Different cookie-less methodology

                var new_model = new SIVVIT.EventModel(cookie.model);

                new_model.set({
                  last_update : new_model.get('startDate'),
                  histogram : []
                });

                self.model.add(new_model);
                self.render();
                break;
            }
          }
          // Delete cookie after it has been reacted upon
          $.cookie('com.sivvit.event', null);
        }

      });
    },

    // Deletes selected item from the list. At this point event should
    // already be deleted from the server
    deleteItem : function(itm) {
      itm.html.fadeOut();
      this.model.remove(itm.model, {
        silent : true
      });
    },

    // Update currently rendered item
    updateItem : function(itm) {

      itm.html.find('#title').html("<a href='" + SIVVIT.Settings.host + "/event/" + itm.model.get('id') + "'>" + itm.model.get('title') + "</a>");
      itm.html.find('#description').html(itm.model.get('description'));

      this.toggleLive(itm);
    },

    // Toggles display.
    toggleLive : function(itm) {
      var flag = itm.html.find('#pending-flag');

      if (itm.model.get('status') === 1) {

        flag.toggleClass('idle-notice', false);
        flag.toggleClass('live-notice', true);

      } else {
        flag.toggleClass('idle-notice', true);
        flag.toggleClass('live-notice', false);
      }
    }

  });

})($, SIVVIT);

// Formats date
Date.prototype.format = function() {
  return this.getMonth() + 1 + '/' + this.getDate() + '/' + String(this.getFullYear()).substr(2, 2) + ' ' + this.getHours() + ':' + this.getMinutes() + ':' + this.getSeconds();
};

// Date from the server is returned in seconds
Date.secondsToDate = function(seconds) {
  return new Date(seconds * 1000);
};
// Converts date object to seconds
Date.dateToSeconds = function(date) {
  return Math.round(date.getTime() / 1000);
};

Date.plusSecond = function(date) {
  if(date.getSeconds() === 59) {
    return Date.plusMinute(new Date(date.setSeconds(0)));
  } else {
    return new Date(date.setSeconds(date.getSeconds() + 1));
  }
};

Date.plusMinute = function(date) {

  if(date.getMinutes() === 59) {
    return Date.plusHour(new Date(date.setMinutes(0)));
  } else {
    return new Date(date.setMinutes(date.getMinutes() + 1));
  }
};

Date.plusHour = function(date) {

  if(date.getHours() === 23) {
    return Date.plusDay(new Date(date.setHours(0)));
  } else {
    return new Date(date.setHours(date.getHours() + 1));
  }
};

Date.plusDay = function(date) {

  if(date.getDate() === Date.daysInMonth(date.getMonth(), date.getFullYear())) {
    return Date.plusMonth(new Date(date.setDate(1)));
  } else {
    return new Date(date.setDate(date.getDate() + 1));
  }
};

Date.plusMonth = function(date) {
  if(date.getMonth() === 11) {
    return Date.plusYear(new Date(date.setMonth(0)));
  } else {
    return new Date(date.setMonth(date.getMonth() + 1));
  }
};

Date.plusYear = function(date) {
  return new Date(new Date(date.setFullYear(date.getFullYear() + 1)));
};

Date.minusSecond = function(date) {
  if(date.getSeconds() === 0) {
    return Date.minusMinute(new Date(date.setSeconds(59)));
  } else {
    return new Date(date.setSeconds(date.getSeconds() - 1));
  }
};

Date.minusMinute = function(date) {
  if(date.getMinutes() === 0) {
    return Date.minusHour(new Date(date.setMinutes(59)));
  } else {
    return new Date(date.setMinutes(date.getMinutes() - 1));
  }
};

Date.minusHour = function(date) {

  if(date.getHours() === 0) {
    return Date.minusDay(new Date(date.setHours(23)));
  } else {
    return new Date(date.setHours(date.getHours() - 1));
  }
};

Date.minusDay = function(date) {

  if(date.getDate() === 1) {
    return Date.minusMonth(new Date(date.setDate(Date.daysInMonth(date.getMonth(), date.getFullYear()))));
  } else {
    return new Date(date.setDate(date.getDate() - 1));
  }
};

Date.minusMonth = function(date) {

  if(date.getMonth() === 0) {
    return Date.minusYear(new Date(date.setMonth(11)));
  } else {
    return new Date(date.setMonth(date.getMonth() - 1));
  }
};

Date.minusYear = function(date) {
  return new Date(new Date(date.setFullYear(date.getFullYear() - 1)));
};

// Returns the number of days for a given month
Date.daysInMonth = function(m, y) {
  return 32 - new Date(y, m, 32).getDate();
};

// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false */
/*jslint white:true plusplus:true devel:true sloppy:true*/

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

        if ((this.get('status') === 1 || this.get('status') === 0) && this.get('pull') === true) {
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
        if (attributes.hasOwnProperty('status') && attributes.status !== undefined && attributes.status !== null) {
            attributes.status = Number(attributes.status);
        }

        // Make sure the data is properly formatted from the start
        // NOTE: Date.secondsToDate is in app/misc.date.js
        if (attributes.hasOwnProperty('startDate')) {
            attributes.startDate = Date.secondsToDate(attributes.startDate);
        }
        if (attributes.hasOwnProperty('endDate')) {
            attributes.endDate = Date.secondsToDate(attributes.endDate);
        }
        if (attributes.hasOwnProperty('last_update')) {
            attributes.last_update = Date.secondsToDate(attributes.last_update);
        }

        // Append histogram values
        if (attributes.hasOwnProperty('histogram') && attributes.histogram !== undefined && attributes.histogram !== null) {

            // Hash tables for histogram data.
            this.attributes.post_hash = this.attributes.post_hash || {};
            this.attributes.media_hash = this.attributes.media_hash || {};
            this.attributes.global_hash = this.attributes.global_hash || {};

            if (this.get('histogram') !== undefined) {
                attributes.histogram.max = Math.max(attributes.histogram.max, this.get('histogram').max);
                attributes.histogram.min = Math.min(attributes.histogram.min, this.get('histogram').min);
            }

            if (attributes.histogram.post !== undefined && attributes.histogram.post !== null) {
                attributes.histogram.post = this.appendHistogram(this.get('post_hash'), attributes.histogram.post);
            } else {
                attributes.histogram.post = this.get('histogram') ? this.get('histogram').post : null;
            }
            if (attributes.histogram.media !== undefined && attributes.histogram.media !== null) {
                attributes.histogram.media = this.appendHistogram(this.get('media_hash'), attributes.histogram.media);
            } else {
                attributes.histogram.media = this.get('histogram') ? this.get('histogram').media : null;
            }
            if (attributes.histogram.global !== undefined && attributes.histogram.global !== null) {
                attributes.histogram.global = this.appendHistogram(this.get('global_hash'), attributes.histogram.global);
            } else {
                attributes.histogram.global = this.get('histogram') ? this.get('histogram').global : null;
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
            complete : function(jqXHR, textStatus) {

                if (textStatus !== 'error') {

                    $.cookie('com.sivvit.event', JSON.stringify({
                        action : 'create',
                        model : JSON.parse(jqXHR.responseText)
                    }));
                }
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
            complete : function(jqXHR, textStatus) {

                if (textStatus !== 'error') {

                    $.cookie('com.sivvit.event', JSON.stringify({
                        action : 'delete',
                        model : self.formatModel()
                    }));
                }

                init.complete(jqXHR, textStatus);
            },
            error : init.error
        });
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
            complete : function(jqXHR, textStatus) {

                if (textStatus !== 'error') {

                    // Update cookie once event is updated
                    $.cookie('com.sivvit.event', JSON.stringify({
                        action : 'update',
                        model : self.formatModel()
                    }));
                }
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
        var i, len = value.length, result = [];

        for ( i = len; i--; ) {

            if (hash[value[i].timestamp]) {
                hash[value[i].timestamp].count = Number(hash[value[i].timestamp].count) + Number(value[i].count);
            } else {
                hash[value[i].timestamp] = value[i];
            }
        }
        // Format output
        for (var bucket in hash) {
            if (hash[bucket]) {
                result.push(hash[bucket]);
            }
        }
        return result;
    },

    // Updates temporal range of loaded content.
    updateContentRange : function(date) {
        // Set default values
        if (this.attributes.content_bounds.min === null) {
            this.attributes.content_bounds.min = this.get('endDate');
            this.attributes.content_bounds.max = this.get('startDate');
        }
        this.attributes.content_bounds.min = Math.min(date, this.attributes.content_bounds.min);
        this.attributes.content_bounds.max = Math.max(date, this.attributes.content_bounds.max);
    },

    // Sets URL path for since requests, loads new live data.
    setSinceRequestURL : function() {

        var path = this.attributes.json;

        if (this.attributes.meta !== null) {
            path += '&meta=' + this.attributes.meta;
        }
        if (this.attributes.limit !== null) {
            path += '&limit=' + this.attributes.limit;
        }
        if (this.attributes.last_update !== null) {
            path += '&since=' + this.attributes.last_update;
        }
        if (this.attributes.bucket_limit !== null) {
            path += '&bucket_limit=' + this.attributes.bucket_limit;
        }
        if (this.attributes.bucket_page !== null) {
            path += '&bucket_page=' + this.attributes.bucket_page;
        }
        if (this.attributes.type !== null) {
            path += '&type[]=' + this.attributes.type;
        }
        if (this.attributes.histogram.resolution !== null) {
            path += '&resolution=' + this.attributes.histogram.resolution;
        }
        this.url = path;
    },

    // Set's URL path to load the view
    setRequestURL : function() {
        var path = this.attributes.json;

        if (this.attributes.meta !== null) {
            path += '&meta=0';
        }
        if (this.attributes.limit !== null) {
            path += '&limit=' + this.attributes.limit;
        }
        if (this.attributes.bucket_limit !== null) {
            path += '&bucket_limit=' + this.attributes.bucket_limit;
        }
        if (this.attributes.bucket_page !== null) {
            path += '&bucket_page=' + this.attributes.bucket_page;
        }
        if (this.attributes.type !== null) {
            path += '&type[]=' + this.attributes.type;
        }
        if (this.attributes.histogram.resolution !== null) {
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
    resolution : 'minute'
  },

  // Override set method to keep track on
  set : function(attributes, options) {

    // Adjust timestamp
    if(attributes.hasOwnProperty('histogram') && attributes.histogram !== undefined && attributes.histogram !== null) {

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
      // Manually trigger change event with every histogram update
      this.trigger('change:histogram', this, this.get('histogram'), options);
    }

    Backbone.Model.prototype.set.call(this, attributes, options);

    return this;
  },

  // Formats date object to match event resolution.
  // Standard buckets for histogram count aggregation.
  adjustResolution : function(date) {
    switch(this.get('resolution')) {
      case 'day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      case 'hour':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0);
      case 'minute':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
      case 'second':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    }
  },

  // Adjusts the date object to the next available bucket
  adjustToNextBucket : function(date, resolution) {

    resolution = resolution === undefined ? this.get('resolution') : resolution;

    switch(resolution) {
      case 'day':
        return Date.plusDay(this.adjustResolution(date));

      case 'hour':
        return Date.plusHour(this.adjustResolution(date));

      case 'minute':
        return Date.plusMinute(this.adjustResolution(date));

      case 'second':
        return Date.plusSecond(this.adjustResolution(date));
    }
  },

  // Adjusts date's resolution to the previous bucket
  adjustToPrevBucket : function(date, resolution) {

    resolution = resolution === undefined ? this.get('resolution') : resolution;

    switch(resolution) {
      case 'day':
        return Date.minusDay(this.adjustResolution(date));

      case 'hour':
        return Date.minusHour(this.adjustResolution(date));

      case 'minute':
        return Date.minusMinute(this.adjustResolution(date));

      case 'second':
        return Date.minusSecond(this.adjustResolution(date));
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
    return this.adjustToPrevBucket(date, this.get('resolution')) >= this.get('startDate') && date <= this.get('endDate') ? true : false;
  }

});

// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

SIVVIT.TemporalFrameModel = Backbone.Model.extend({
  defaults : {
    count : null,
    timestamp : null
  },

  //  Override set method to ensure correct variable formatting
  set : function(attributes, options) {

    // Make sure attribute comes across as a number
    if(attributes.hasOwnProperty('count') && attributes.count !== undefined && attributes.count !== null) {
      attributes.count = Number(attributes.count);
    }

    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  }

});

// JSLint variable definition
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

        // Clear out previous drawing
        if (this.histogram) {
            this.histogram.clear();
        }

        this.histogram = new Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

        if (this.model.get('histogram') && this.model.get('histogramStartDate')) {

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

            for (var i = len; i--; ) {

                var frame = new SIVVIT.TemporalFrameModel(this.model.get('histogram')[i]);

                var percent_y = (frame.get('count') / max_val) * 100;
                var percent_x = (frame.get('timestamp').getTime() - start_time) / (end_time - start_time);

                var bar_h = Math.round(percent_y * max_height / 100);
                var bar_x = Math.round(percent_x * max_width);
                var bar_y = Math.round(max_height - bar_h);

                var bar = this.histogram.rect(bar_x, bar_y, bar_w, bar_h).attr({
                    fill : '#333333',
                    'stroke-width' : 0
                });
            }
        }
    }

});
