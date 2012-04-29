// JSLint variable definition
/*global SIVVIT:true, $:false, Backbone:false, confirm:false, console:false google:false */

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

        self.setLocation();

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
        this.setDefaultLocation();
      } else {
        this.model.setRequestURL();
        this.model.fetch();
      }
    },

    // Sets HTML5 location if it is available, if not
    // sets the default one
    setLocation : function() {
      var self = this;
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          self.model.set({
            'location' : {
              'lon' : position.coords.latitude,
              'lat' : position.coords.longitude
            }
          });
        });

      } else {
        this.setDefaultLocation();
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
      });
      this.view.update();
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

      var self = this;

      this.model = options.model;
      this.model.bind('change', this.update, this);
      this.model.bind('change:location', this.initMap, this);
    },

    // Deletes current event
    deleteEvent : function() {

    },

    saveEvent : function() {

      if(this.model.get('id')) {
        // Update event
        this.model.updateEvent();
      } else {
        this.model.createEvent();
      }
    },

    // Updates view
    update : function() {

      var slef = this;

      $('#form-container').show();
      $('#content-loader').hide();

      // Hide delete button event hasn't been created
      if(!this.model.get('id')) {
        $(this.el).find('#delete-event-btn').hide();
        $(this.el).find('#save-event-btn').text('Create New Event');
      }

      $("input[name='title']").val(this.model.get('title'));
      $("input[name='title']").change(function() {
        slef.model.set({
          'title' : $(this).val()
        }, {
          silent : true
        });
      });

      $("input[name='location']").val(this.model.get('location').name);

      $("input[name='keywords']").val(this.model.get('keywords'));
      $("input[name='keywords']").change(function() {
        slef.model.set({
          'keywords' : $(this).val().split(',')
        }, {
          silent : true
        });
      });

      $("input[name='description']").val(this.model.get('description'));
      $("input[name='description']").change(function() {
        slef.model.set({
          'description' : $(this).val()
        }, {
          silent : true
        });
      });

      // Start date
      $("input[name='start-date']").datetimepicker({
        dateFormat: 'mm/dd/yy',
        defaultDate : this.model.get('startDate'),
        hour : this.model.get('startDate').getHours(),
        minute : this.model.get('startDate').getMinutes(),
        second : this.model.get('startDate').getSeconds(),

        onSelect : function(date) {

          slef.model.set({
            'startDate' : Date.dateToSeconds(new Date(date))
          }, {
            silent : true
          });
        }

      });

      // End date
      $("input[name='end-date']").datetimepicker({
        dateFormat: 'mm/dd/yy',
        defaultDate : this.model.get('endDate'),
        hour : this.model.get('endDate').getHours(),
        minute : this.model.get('endDate').getMinutes(),
        second : this.model.get('endDate').getSeconds(),
        onSelect : function(date) {

          slef.model.set({
            'endDate' : Date.dateToSeconds(new Date(date))
          }, {
            silent : true
          });
        }

      });

      this.validate();
    },

    // Validates all required form fields
    validate : function() {

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
          check.addClass('icon-check-red');
          check.removeClass('icon-check-green');

          $(element).css('background-color', '#FFFFCC');
        },

        unhighlight : function(element, errorClass) {

          var check = $(self.el).find('#' + $(element).attr('name') + '-check');
          check.removeClass('icon-check-red');
          check.addClass('icon-check-green');

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
          },
          location : {
            required : true,
            minlength : 3
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
