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

    // Sets HTML5 location if it is available, if not
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
        sucess : function() {
          self.showHideSavingState();
          // Force close light box
          window.parent.$.fancybox.close([true]);
        },
        complete : function() {
          self.showHideSavingState();
         // Force close light box
          window.parent.$.fancybox.close([true]);
        },
        error : function() {
          self.showHideSavingState('Error deleting event..., please try again.');
          setTimeout(self.showHideSavingState(), 3000);
        }

      };

      this.model.deleteEvent(closure);

      // Update event display on the parent page
      $.cookie('com.sivvit.event', JSON.stringify({
        action : 'delete',
        model : this.model.formatModel()
      }));
    },

    saveEvent : function() {

      if($('#form-main').valid()) {

        var self = this;

        var closure = {
          sucess : function() {
            self.showHideSavingState();
          },
          complete : function() {
            self.showHideSavingState();
          },
          error : function() {
            self.showHideSavingState('Error saving event..., please try again.');
            setTimeout(self.showHideSavingState(), 3000);
          }

        };

        this.showHideSavingState('Hold it cowboy, working on it...');

        if(this.model.get('id')) {
          // Update event
          this.model.updateEvent(closure);
        } else {
          this.model.createEvent(closure);
        }

        // Update event display on the parent page
        $.cookie('com.sivvit.event', JSON.stringify({
          action : 'update',
          model : this.model.formatModel()
        }));
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
