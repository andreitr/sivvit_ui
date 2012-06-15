// JSLint variable definition
/*global SIVVIT:true, $:false, Backbone:false, confirm:false */
/*jslint white:true devel:true passfail:false sloppy:true*/

( function(jQuery, SIVVIT) {

        SIVVIT.Events = {

            //SIVVIT.EventsCollection
            collection : null,

            //SIVVIT.EventsView
            view : null,

            // Enables content editing when set to true
            edit : true,

            // Initiates the application and loads the main data.
            init : function(json) {

                var self = this, TmpModel = Backbone.Model.extend({
                    url : json
                });

                this.collection = new SIVVIT.EventsCollection();
                this.view = new SIVVIT.EventsView({
                    edit : this.edit
                });

                new TmpModel().fetch({
                    success : function(result) {

                        $('#js-app-loader').remove();
                        $('#js-app').show();

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

            template : $('#tpl_content-list').html(),
            el : '#js-app-content',

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

                $('#js-e-stats').html('Displaying ' + this.model.length + ' Events');

                this.display();
            },

            display : function() {

                $(this.el).append("<ol id='event-list'></ol>");

                // Render collection
                this.model.each(function(itm) {

                    var mdl, histogram;

                    itm = this.buildTemplate(itm);

                    mdl = new SIVVIT.TemporalModel({
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
                    histogram = new SIVVIT.HistogramView({
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
                    description : 'Tracking ' + itm.get('keywords').toString() + ' near ' + itm.get("location").name,
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

                        itm.html.find('#content').prepend("<span class=\"item-edit\"><span class='icon-cog' href=\"event.form.html?id=" + itm.model.get('id') + "\" id='event-form'></span><div id=\"pending-flag\"></div></span>");

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

                var self = this, new_model;

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

                                    new_model = new SIVVIT.EventModel(cookie.model);

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
                itm.html.find('#description').html('Tracking <strong><i>' + itm.model.get('keywords').toString() + '</i></strong> near ' + itm.model.get("location").name);

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

    }($, SIVVIT));
