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

      $.getJSON(json, function(data) {

        $('#content-loader').remove();
        $('#event-application').show();

        var len = data.length, i;

        for( i = len; i--; ) {
          var model = new SIVVIT.EventModel(data[i]);
          // Add timestamp as date for collection sorting
          model.set({
            timestamp : Date.secondsToDate(data[i])
          });
          self.collection.add(model);
        }
        self.view.model = self.collection;
        self.view.render();
      });

    }

  };

  // Collection containing event models,
  SIVVIT.EventsCollection = Backbone.Collection.extend({
    model : SIVVIT.EventModel,

    // Sort content by startDate
    comparator : function(itm) {
      return itm.get('startDate');
    }

  });

  // Core events view. Right now we only have a single implementation.
  SIVVIT.EventsView = Backbone.View.extend({

    template : "<li id='post-list'><div id='content'><div id='histogram'></div><div id='title'><a href='${link}'>${title}</a></div>${description}<div id='meta'>${posts} posts, ${images} images, ${videos} videos &nbsp; &nbsp;<span class='icon-location'></span>${location} &nbsp;<span class='icon-user'></span><a href='#'>${author}</a></div></div></div></li>",
    el : '#dynamic-content',

    // Rendered elements
    rendered : [],

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

      this.rendered = [];

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

      if(itm !== null) {

        // Initiate button clicks if a user is logged in and modify
        // content template (add hover buttons and check box)
        if(this.edit) {
          itm.html.find('#content').prepend("<span class=\"item-edit\"><span class='icon-cog' href=\"event_form.html?id=" + itm.model.get('id') + "\" id='edit-itm'></span><div id=\"pending-flag\"></div></span>");

          itm.html.find('#edit-itm').hide();

          if(itm.model.get('pending') > 0) {
            itm.html.find('#title').append("<div id='pending'>pending " + itm.model.get("pending") + "</div>");
          }

          itm.html.hover(function(event) {
            itm.html.find('#edit-itm').show();
          }, function(event) {
            itm.html.find('#edit-itm').hide();
          });

          itm.html.click(function(event) {

            var checked;

            if(event.target.id !== 'edit-itm') {

              if(itm.html.find('#itm-check').length > 0) {
                checked = itm.html.find('#itm-check').is(':checked');
                itm.html.find('#itm-check').attr('checked', !checked);
                itm.html.css('background-color', checked ? '#FFFFFF' : '#FFFFCC');
              }
              event.stopPropagation();
            }
          });

          this.toggleLive(itm);
        }
        this.rendered.push(itm);
        $(parent).append(itm.html);
      }
    },

    // Initiates event form light box
    initLightbox : function() {

      var self = this;

      // Open light box with event information etc
      $('#edit-itm').fancybox({
        width : 860,
        height : 430,
        autoScale : true,
        scrolling : false,
        transitionIn : 'fade',
        transitionOut : 'fade',
        type : 'iframe',
        afterClose : function() {


          // Create a hash map of itms
          console.log($.cookie("com.sivvit.event"));

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

    // Toggles display.
    toggleLive : function(itm) {
      var flag = itm.html.find('#pending-flag');

      if(itm.model.get('status') === 1) {

        flag.toggleClass('idle-notice', false);
        flag.toggleClass('live-notice', true);

      } else {
        flag.toggleClass('idle-notice', true);
        flag.toggleClass('live-notice', false);
      }
    }

  });

})($, SIVVIT);
