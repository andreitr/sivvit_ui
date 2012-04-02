// JSLint variable definition
/*global SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

if( typeof (SIVVIT) == 'undefined') {
  SIVVIT = {};
}(function(jQuery, SIVVIT) {

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
            timestamp : new Date(data[i])
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

    template : "<li id='post-list'><div id='content'><div id='histogram'></div><div id='title'>${title}</div>${description}<div id='meta'>${posts} posts, ${images} images, ${videos} videos &nbsp; &nbsp;<span class='icon-location'></span>${location} &nbsp;<span class='icon-user'></span><a href='#'>${author}</a></div></div></div></li>",
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

        // Render histogram
        var histogram = new SIVVIT.HistogramView({

          el : $(itm.html).find('#histogram'),
          slider : false,
          model : new SIVVIT.TemporalModel({
            startDate : new Date(itm.model.get('startDate')),
            endDate : new Date(itm.model.get('last_update')),
            min : itm.model.get('histogram').min,
            max : itm.model.get('histogram').max,
            resolution : itm.model.get('histogram').resolution,
            histogram : itm.model.get('histogram').global
          })
        }).render();

        this.initItem(itm, '#event-list');
      }, this);


      this.initLightbox();
    },

    // Builds each item, returns {model, html} object
    buildTemplate : function(itm) {
      var html = $.tmpl(this.template, {
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
          itm.html.find('#content').prepend("<span class=\"item-edit\"><span class=\"icon-delete\" id=\"del-itm\"></span><span class='icon-cog' href=\"event_form.html?id=" + itm.model.get('id') + "\" id='edit-itm'></span><div id=\"pending-flag\"></div></span>");
          itm.html.find('#content').prepend("<div id=\"checkbox\"><input type=\"checkbox\" id=\"itm-check\"/></div>");

          itm.html.find('#del-itm').hide();
          itm.html.find('#edit-itm').hide();

          if(itm.model.get('pending') > 0) {
            itm.html.find('#title').append("<div id='pending'>pending " + itm.model.get("pending") + "</div>");
          }

          itm.html.hover(function(event) {
            itm.html.find('#del-itm').show();
            itm.html.find('#edit-itm').show();
          }, function(event) {
            itm.html.find('#del-itm').hide();
            itm.html.find('#edit-itm').hide();
          });


          itm.html.click(function(event) {

            var checked;

            switch(event.target.id) {

              case 'del-itm':
                if(confirm('Delete this event?') === true) {
                  self.deleteItem(itm);
                  event.stopPropagation();
                }
                break;

              case 'edit-itm':
                break;

              default:
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
      // Open light box with event information etc
      $('#edit-itm').fancybox({
        'width' : 860,
        'height' : 430,
        'autoScale' : true,
        'scrolling' : false,
        'transitionIn' : 'fade',
        'transitionOut' : 'fade',
        'type' : 'iframe'
      });
    },

    // Deletes selected item.
    // To-do: implement server call
    deleteItem : function(itm) {
      itm.html.fadeOut();
      this.model.remove(itm.model, {
        silent : true
      });
    },

    deleteItems : function(itms) {
      for(var i = itms.length; i--; ) {
        this.deleteItem(itms[i]);
      }
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
