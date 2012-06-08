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
/*global SIVVIT:true, $:false, window:false, Backbone:false, confirm:false, console:false google:false */

(function(jQuery, SIVVIT) {

  SIVVIT.EditEvent = {

    // SIVVIT.EventModel
    model : null,

    //SIVVIT.EditEventView
    view : null,

    // Initiates the application and loads the main data.
    init : function(id) {

      var self = this;

      if(id === null || id === undefined) {
        // New event is being created

        this.model = new SIVVIT.EventModel({
          startDate : Date.dateToSeconds(new Date()),
          // Add 24 hours to the existing date
          endDate : Date.dateToSeconds(new Date(new Date().getTime() + 86400000)),
          pull : false,
          meta : 0,
          type : null
        });


      } else {

        // Load data for existing event
        this.model = new SIVVIT.EventModel({
          json : SIVVIT.Settings.host + '/event/' + id + '.json?callback=?',
          pull : false,
          meta : 0,
          type : null
        });
      }

      this.view = new SIVVIT.EditEventView({
        model : this.model
      });

      // If the event is new render event right away
      if(id === null || id === undefined) {
        this.view.update();
        this.setLocation();
        this.view.initMap();

      } else {
        this.model.setRequestURL();
        this.model.fetch();
      }
    },

    // sets the default one
    setLocation : function() {

      this.setDefaultLocation();

      var self = this;
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          self.model.set({
            'location' : {
              'lon' : position.coords.latitude,
              'lat' : position.coords.longitude
            }
          }, {
            silent : true
          });
        });
      }
    },

    // Default location
    setDefaultLocation : function() {

      this.model.set({
        'location' : {
          'name' : 'Denver, CO',
          'lat' : 39.739167,
          'lon' : -104.984722
        }
      }, {
        silent : true
      });
    }

  };

  // Main edit event view
  SIVVIT.EditEventView = Backbone.View.extend({

    el : '#form-container',

    // Google map instance
    map : null,
    // Auto complete
    map_complete : null,

    events : {
      'click #save-event-btn' : 'saveEvent',
      'click #delete-event-btn' : 'deleteEvent'
    },

    initialize : function(options) {

      this.model = options.model;
      this.model.bind('change', this.update, this);

      // Display a map when a new location is loaded
      this.model.bind('change:location', this.initMap, this);

      this.setValidationRules();
    },

    // Deletes current event
    deleteEvent : function() {

      var self = this;

      var closure = {
        complete : function(jqXHR, textStatus) {

          if(textStatus === 'error') {
            this.error();
          } else {
            self.showHideSavingState();
            window.parent.$.fancybox.close([true]);
          }
        },

        error : function() {
          self.showHideSavingState('Error deleting event..., please try again.');
          setTimeout(function() {
            self.showHideSavingState();
          }, 3000);
        }
      };

      this.showHideSavingState('Hold it cowboy, working on it...');
      this.model.deleteEvent(closure);
    },

    // Creates a new event or updates an existing one
    saveEvent : function() {

      if($('#form-main').valid()) {

        var self = this;

        var closure = {
          success : function() {
            self.showHideSavingState();
          },
          error : function() {
            self.showHideSavingState('Error saving event..., please try again.');
            setTimeout(function() {
              self.showHideSavingState();
            }, 3000);
          }

        };

        this.showHideSavingState('Hold it cowboy, working on it...');

        if(this.model.get('id')) {
          // Update event
          this.model.updateEvent(closure);
        } else {
          this.model.createEvent(closure);
        }
      }
    },

    // Displays a message while date is being sent to the server
    showHideSavingState : function(msg) {

      var element = $(this.el).find('#save-msg');

      if(element.length > 0) {
        element.remove();
      }

      if(msg) {

        $(this.el).find('#save-event-btn').hide();
        $(this.el).find('#delete-event-btn').hide();

        $(this.el).find('#button-container').append("<span id='save-msg'>" + msg + "<span class='loader'></span></span>");
      } else {
        $(this.el).find('#save-event-btn').show();
        $(this.el).find('#delete-event-btn').show();
      }
    },

    // Updates view
    update : function() {

      var self = this;

      $('#form-container').show();
      $('#content-loader').hide();

      // Hide delete button event hasn't been created
      if(!this.model.get('id')) {
        $(this.el).find('#delete-event-btn').hide();
        $(this.el).find('#save-event-btn').text('Create New Event');
      }

      $("input[name='title']").val(this.model.get('title'));
      $("input[name='title']").change(function() {
        self.model.set({
          'title' : $(this).val()
        }, {
          silent : true
        });
      });

      $("input[name='location']").val(this.model.get('location').name);

      $("input[name='keywords']").val(this.model.get('keywords'));
      $("input[name='keywords']").change(function() {
        self.model.set({
          'keywords' : $(this).val().split(',')
        }, {
          silent : true
        });
      });

      $("input[name='description']").val(this.model.get('description'));
      $("input[name='description']").change(function() {
        self.model.set({
          'description' : $(this).val()
        }, {
          silent : true
        });
      });

      // Start date
      $("input[name='start-date']").val(this.model.get('startDate').format());
      $("input[name='start-date']").datetimepicker({

        dateFormat : 'mm/dd/yy',
        defaultDate : this.model.get('startDate'),
        hour : this.model.get('startDate').getHours(),
        minute : this.model.get('startDate').getMinutes(),
        second : this.model.get('startDate').getSeconds(),
        onSelect : function(date) {

          self.model.set({
            'startDate' : Date.dateToSeconds(new Date(date))
          }, {
            silent : true
          });
        }

      });

      // End date
      $("input[name='end-date']").val(this.model.get('endDate').format());
      $("input[name='end-date']").datetimepicker({

        dateFormat : 'mm/dd/yy',
        defaultDate : this.model.get('endDate'),
        hour : this.model.get('endDate').getHours(),
        minute : this.model.get('endDate').getMinutes(),
        second : this.model.get('endDate').getSeconds(),
        onSelect : function(date) {

          self.model.set({
            'endDate' : Date.dateToSeconds(new Date(date))
          }, {
            silent : true
          });
        }

      });

      // First time around validate all fields separately
      $('#form-main').validate().element("input[name='title']");
      $('#form-main').validate().element("input[name='keywords']");
      $('#form-main').validate().element("input[name='start-date']");
      $('#form-main').validate().element("input[name='end-date']");
    },

    // Sets validation rules for the entire form.
    setValidationRules : function() {

      var self = this;

      $('#form-main').validate({

        // Don't place default label
        success : function(label) {
        },

        // Don't place default error message
        errorPlacement : function(error, element) {
        },

        highlight : function(element, errorClass) {

          var check = $(self.el).find('#' + $(element).attr('name') + '-check');
          check.toggleClass('icon-check-red', true);
          check.toggleClass('icon-check-green', false);

          $(element).css('background-color', '#FFFFCC');
        },

        unhighlight : function(element, errorClass) {

          var check = $(self.el).find('#' + $(element).attr('name') + '-check');
          check.toggleClass('icon-check-red', false);
          check.toggleClass('icon-check-green', true);

          $(element).css('background-color', '#FFFFFF');
        },

        rules : {
          title : {
            required : true,
            minlength : 3
          },
          keywords : {
            required : true,
            minlength : 3
          },
          'start-date' : {
            required : true,
            date : true
          },
          'end-date' : {
            required : true,
            date : true
          }
        }
      });

    },

    // Initializes map display and auto-complete location field
    initMap : function() {

      var self = this;

      if(!this.map) {

        this.map = new google.maps.Map($('#form-map')[0], {

          
          center : new google.maps.LatLng(self.model.get('location').lat, self.model.get('location').lon),
          zoom : 8,
          disableDefaultUI : true,
          mapTypeId : google.maps.MapTypeId.ROADMAP
        });

        // Auto complete field
        this.map_complete = new google.maps.places.Autocomplete($("input[name='location']")[0]);
        google.maps.event.addListener(this.map_complete, 'place_changed', function() {
          var place = self.map_complete.getPlace();
          self.map.setCenter(place.geometry.location);

          self.model.set({
            'location' : {
              'lat' : place.geometry.location.lat(),
              'lon' : place.geometry.location.lng(),
              'name' : place.name
            }
          }, {
            silent : true
          });
        });

      } else {
        this.map.setCenter(new google.maps.LatLng(self.model.get('location').lon, self.model.get('location').lat));
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
