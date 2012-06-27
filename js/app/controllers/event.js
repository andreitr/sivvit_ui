// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false */
/*jslint white:true devel:true passfail:false sloppy:true*/

( function(jQuery, SIVVIT) {

        SIVVIT.Event = {
            // SIVVIT.EventModel app/models/m.event.js
            eventModel : null,

            // SIVVIT.TemporalModel /app/models/m.temporal.js
            temporalModel : null,

            // SIVVIT.ContentController
            // Controls switching of all other views
            contentController : null,

            // SIVVIT.ContentView
            contentView : null,

            // SIVVIT.HeaderView
            headerView : null,

            // SIVVIT.SideMapVie
            mapView : null,

            // SIVVIT.HistogramView
            sideHistView : null,

            // Enables content editing when set to true
            edit : true,

            // Initiates the application and loads the main data.
            init : function(id) {

                var self = this;

                SIVVIT.Lightbox.init();

                this.temporalModel = new SIVVIT.TemporalModel();
                this.eventModel = new SIVVIT.EventModel();
                this.headerView = new SIVVIT.HeaderView({
                    model : this.eventModel
                });

                this.mapView = new SIVVIT.MapView({
                    el : '#js-e-map'
                });

                this.sideHistView = new SIVVIT.HistogramView({
                    el : '#js-e-timeline',
                    model : this.temporalModel
                });

                this.contentView = new SIVVIT.ContentView({
                    edit : this.edit,
                    temporalModel : this.temporalModel,
                    eventModel : this.eventModel
                });

                this.contentController = new SIVVIT.ContentController({
                    eventModel : this.eventModel,
                    temporalModel : this.temporalModel,
                    view : this.contentView
                });

                // Load content for the first time.
                this.eventModel.set({
                    json : SIVVIT.Settings.host + '/event/' + id + '.json?callback=?'
                });
                this.eventModel.setSinceRequestURL();
                this.eventModel.fetch();

                this.eventModel.bind('change', function() {

                    // Show main application
                    $('#js-app-loader').remove();
                    $('#js-app').show();

                    if (self.eventModel.hasChanged('title') || self.eventModel.hasChanged('description') || self.eventModel.hasChanged('location')) {
                        self.headerView.render();
                    }

                    // Reset updated timer
                    if (self.eventModel.hasChanged('last_update')) {
                        self.headerView.reset(self.eventModel.get('last_update'));

                        // Update url path to load the latest data
                        self.eventModel.setSinceRequestURL();
                    }

                    // Update histogram values
                    // NOTE: startDate, endDate come across as seconds
                    if (self.eventModel.hasChanged('last_update') || self.eventModel.hasChanged('histogram')) {

                        self.temporalModel.set({
                            startDate : self.eventModel.get('startDate'),
                            endDate : self.eventModel.get('last_update'),
                            startRange : self.eventModel.get('startDate'),
                            endRange : self.eventModel.get('last_update'),
                            min : Math.min(self.temporalModel.get('min'), self.eventModel.get('histogram').min),
                            max : Math.max(self.temporalModel.get('max'), self.eventModel.get('histogram').max),
                            resolution : self.eventModel.get('histogram').resolution
                        }, {
                            silent : true
                        });

                        // Updates general statistics and histogram
                        self.contentController.update();
                    }

                    // Update location
                    if (self.eventModel.hasChanged('location')) {
                        self.mapView.render(self.eventModel.get('location').name, self.eventModel.get('location').lat, self.eventModel.get('location').lon);
                    }
                });

            }

        };

        // Collection of item groups
        SIVVIT.ItemGroupCollection = Backbone.Collection.extend({

            model : SIVVIT.ItemGroupModel,

            // Sort item groups by timestamp
            comparator : function(itm) {
                return -itm.get('timestamp');
            }

        });

        // Collection of items
        SIVVIT.ItemCollection = Backbone.Collection.extend({
            model : SIVVIT.ItemModel,

            // Sort content by timestamp
            comparator : function(itm) {
                return -itm.get('timestamp');
            }

        });

        // Collection of newly-loaded buckets
        SIVVIT.NewItemCollection = Backbone.Collection.extend({
            model : SIVVIT.ItemModel,

            // Sort content by timestamp
            comparator : function(itm) {
                return itm.get('timestamp');
            }

        });

        SIVVIT.Lightbox = {

            // Initiates global lightbox methods.
            init : function() {
                $('#photo-box').fancybox({
                    maxWidth : 800,
                    maxHeight : 600,
                    fitToView : true,
                    autoSize : true,
                    width : '70%',
                    height : '70%',
                    closeClick : false,
                    transitionIn : 'fade',
                    transitionOut : 'fade'
                });

                $.waypoints.settings.scrollThrottle = 30;
                // Make sure that waypoint is not triggered when page is resized with new content
                $('#wrapper').waypoint.defaults.onlyOnScroll = true;
                $('#wrapper').waypoint({
                    offset : '-100%'
                }).find('#js-mover-trigger').waypoint(function(event, direction) {

                    $('#js-mover').toggleClass('sticky', direction === 'down');
                    event.stopPropagation();
                });

            }

        };

        SIVVIT.Parser = {

            parse : function(model) {

                var content = model.get('content'), i, j, tmp_group = [], tmp_items, group_model, itm_model, len = content.length;

                for ( i = 0; i < len; i += 1) {
                    group_model = new SIVVIT.ItemGroupModel(content[i]);
                    group_model.set({
                        json : model.get('json')
                    });
                    tmp_items = [];

                    for ( j = 0; j < content[i].items.length; j += 1) {
                        itm_model = new SIVVIT.ItemModel(content[i].items[j]);

                        itm_model.set({
                            timestamp : content[i].items[j].timestamp
                        });
                        tmp_items.push(itm_model);
                    }
                    group_model.set({
                        id : new Date().getTime() + '-' + i,
                        items : new SIVVIT.ItemCollection(tmp_items),
                        items_new : new SIVVIT.ItemCollection(tmp_items),
                        stats : content[i].stats,
                        timestamp : content[i].timestamp
                    });

                    model.updateContentRange(group_model.get('timestamp'));
                    tmp_group.push(group_model);
                }
                return new SIVVIT.ItemGroupCollection(tmp_group);
            }

        };

        // Main application controller and a view at the same time
        SIVVIT.ContentController = Backbone.View.extend({

            el : '#navigation-content',

            prevButton : null,
            activeButton : null,

            // Instance of SIVVIT.ContentView
            view : null,

            // SIVVIT.EventModel
            eventModel : null,

            // SIVVIT.TemporalModel
            temporalModel : null,

            events : {
                'click #js-all-btn' : 'updateView',
                'click #js-post-btn' : 'updateView',
                'click #js-media-btn' : 'updateView'
            },

            initialize : function(options) {
                this.eventModel = options.eventModel;
                this.temporalModel = options.temporalModel;

                this.view = options.view;

                this.activeButton = '#js-all-btn';
                $(this.activeButton).toggleClass('text-btn', false);
                $(this.activeButton).toggleClass('text-btn-selected', true);
            },

            // Triggered every time eventModel is updated
            // updates main UI elements
            update : function() {
                this.renderStats();
                this.renderHistogram();
            },

            // Loads data for a newly selected view
            updateView : function(event) {

                if (this.renderButtons(event.target.id)) {

                    this.enableNavigation(false);

                    this.update();
                    this.view.reset();

                    // Reset existing content
                    this.eventModel.resetContent();

                    // Update type in data request
                    switch(event.target.id) {

                        case 'js-all-btn':
                            this.eventModel.setRequestType('all');
                            break;

                        case 'js-post-btn':
                            this.eventModel.setRequestType('post');
                            break;

                        case 'js-media-btn':
                            this.eventModel.setRequestType('media');
                            break;
                    }

                    this.eventModel.on('change', this.resetEvents, this);

                    this.eventModel.setRequestURL();
                    this.eventModel.fetch();
                }
            },

            // Handles event model update and resets navigation events
            resetEvents : function() {
                this.enableNavigation(true);
                this.eventModel.off('change', this.resetEvents, this);
            },

            // Disables / enables tab buttons
            enableNavigation : function(bln) {

                if (bln) {
                    this.delegateEvents(this.events);
                } else {
                    this.undelegateEvents();
                }
            },

            // Displays stats for the currently-selected view
            renderStats : function() {

                var element = $('#js-e-stats');

                switch(this.activeButton) {

                    case '#js-all-btn':
                        element.html('Total: ' + this.eventModel.get('stats').total);
                        break;

                    case '#js-post-btn':
                        element.html('Posts: ' + this.eventModel.get('stats').posts);
                        break;

                    case '#js-media-btn':
                        element.html('Media: ' + (this.eventModel.get('stats').images + this.eventModel.get('stats').videos));
                        break;
                }
            },

            // Updates navigation buttons. Returns false if the view is already
            // rendered.
            renderButtons : function(button) {

                if (this.activeButton === '#' + button) {
                    return false;
                }

                this.prevButton = this.activeButton;
                this.activeButton = '#' + button;

                $(this.activeButton).toggleClass('text-btn', false);
                $(this.activeButton).toggleClass('text-btn-selected', true);

                if (this.prevButton !== this.activeButton) {
                    $(this.prevButton).toggleClass('text-btn', true);
                    $(this.prevButton).toggleClass('text-btn-selected', false);
                }
                return true;
            },

            // Update temporal model and set the correct histogram
            renderHistogram : function() {

                switch(this.activeButton) {

                    case '#js-all-btn':
                        this.temporalModel.set({
                            histogram : this.eventModel.get('histogram').global
                        });
                        break;

                    case '#js-post-btn':
                        this.temporalModel.set({
                            histogram : this.eventModel.get('histogram').post
                        });
                        break;

                    case '#js-media-btn':
                        this.temporalModel.set({
                            histogram : this.eventModel.get('histogram').media
                        });
                        break;
                }
            }

        });

        // Main content view.
        // Displays content buckets etc.
        SIVVIT.ContentView = Backbone.View.extend({

            el : '#js-app-content',

            post_template : $('#tpl_content-post').html(),
            photo_template : $('#tpl_content-photo').html(),
            media_template : $('#tpl_content-media').html(),

            // Rendered elements
            rendered : [],

            // Rendered groups
            groups : [],

            // Dictionary of existing groups
            groups_key : {},

            // Count of new items - displayed when new data is loaded
            new_count : 0,

            // Collection (ItemGroupCollection) of groups that have been loaded but not rendered
            new_groups : new SIVVIT.NewItemCollection(),

            // Instance of TemporalModel
            temporalModel : null,

            // Instance of EventModel
            eventModel : null,

            // Enable content editing. Assumes that user is logged in
            edit : false,

            // Set to true when at least one content bucket is displayed
            displayed : false,

            // Set to true when more old content is loaded that has to be
            // appended to the bottom of the scroll
            display_buckets : false,

            initialize : function(options) {

                this.edit = options.edit;
                this.temporalModel = options.temporalModel;
                this.eventModel = options.eventModel;

                // Bind to general change event to make sure the entire model is updated
                this.eventModel.on('change', this.onModelContentUpdate, this);
            },

            // Updates view when model is changed
            onModelContentUpdate : function(event) {

                // If content for posts and everything tabs is exactly the same
                // or if the content has changed, then re-render everything
                if (this.eventModel.hasChanged('content') || this.rendered.length === 0) {

                    var collection = SIVVIT.Parser.parse(this.eventModel);

                    // Render view for the first time
                    if (this.rendered.length <= 0) {
                        this.model = collection;
                        this.render();
                        return;
                    }

                    // Render loaded data at the bottom of the list
                    if (this.display_buckets) {
                        this.display_buckets = false;
                        this.display(collection, false);
                        this.footer();
                        return;
                    }

                    // Loop through all available groups - ItemGroupCollection
                    collection.each(function(group) {

                        var old_group = this.groups_key[group.get('timestamp')], stats;

                        if (old_group) {
                            // Update stats for the existing model
                            stats = old_group.get('stats');

                            // Please note that model stats are updated bypassing the setter method.
                            // Group model does not allow secondary stats updates
                            stats.total = Number(stats.total) + Number(group.get('stats').total);
                            stats.media = Number(stats.media) + Number(group.get('stats').media);
                            stats.post = Number(stats.post) + Number(group.get('stats').post);

                            this.buildGroupHeader(old_group);
                            this.buildGroupFooter(old_group);

                        } else {
                            // Add pending group to the groups key
                            this.groups_key[group.get('timestamp')] = group;
                            this.new_count += 1;
                            this.new_groups.add(group);
                        }

                    }, this);

                    if (this.new_count > 0) {
                        this.update();
                    }
                }
            },

            // Adds new items to the pending queue
            update : function() {
                var self = this;

                if ($('#load-content-btn').length <= 0) {

                    $(this.el).prepend($('#tpl_more-content').html());

                    $('#load-content-btn').hide();
                    $('#load-content-btn').slideDown('slow');
                    $('#load-content-btn').click(function(event) {
                        $(event.currentTarget).remove();

                        self.display(self.new_groups, true);
                        self.new_count = 0;
                        // Reset the entire collection
                        self.new_groups.reset();

                        self.updateEdit();

                    });
                }
            },

            // Resets all properties of the group.
            reset : function() {
                this.groups_key = {};
                this.groups = [];
                this.rendered = [];

                this.showLoader();
            },

            // Renders the entire collection
            display : function(source, prepend) {

                var is_update;

                if (source === undefined) {
                    source = this.model;
                }

                // Loop through all available groups - ItemGroupCollection
                source.each(function(group) {

                    // Create group element
                    group = this.buildGroup(group, prepend);

                    // Display all available items
                    this.buildGroupItems(group, false);

                    // Call this once items are added
                    this.buildGroupHeader(group);
                    this.buildGroupFooter(group);

                    this.displayed = true;

                }, this);

            },

            render : function() {

                // Clear out previous content
                $(this.el).empty();

                this.displayed = false;

                this.rendered = [];
                this.groups = [];
                this.groups_key = {};

                // Display edit controls if a user is logged in
                this.displayEdit();

                this.display();
                this.footer();
                this.checkDisplayed();
            },

            // Displays footer if there are more buckets to be loaded.
            footer : function() {

                var self = this, btn, min_content_bounds;

                // Remove existing loader button
                btn = $(this.el).find('#load-groups-btn');
                if (btn.length > 0) {
                    btn.remove();
                }

                min_content_bounds = this.temporalModel.adjustToNextBucket(new Date(this.eventModel.get('content_bounds').min));

                if (this.eventModel.get('content').length > 0 && min_content_bounds > this.temporalModel.adjustToNextBucket(this.eventModel.get('startDate'))) {
                    if ($('#load-groups-btn').length <= 0) {

                        $(this.el).append("<div id='load-groups-btn' class='content-loader loader-margin'>More " + this.eventModel.get('histogram').resolution + "s<span class='icon-download'></span></div>");
                        btn = $(this.el).find('#load-groups-btn');

                        // Add manual click for when automatic scroll wasn't triggered
                        btn.click(function() {

                            btn.waypoint('remove');

                            btn.html("<span class='loader'>&nbsp;</span>");
                            self.display_buckets = true;
                            self.eventModel.loadMoreContent();
                        });

                        // Add way point to track infinite scroll
                        btn.waypoint(function(event, direction) {

                            event.stopPropagation();

                            btn.waypoint('remove');
                            btn.html("<span class='loader'>&nbsp;</span>");
                            self.display_buckets = true;
                            self.eventModel.loadMoreContent();

                        }, {
                            offset : '100%',
                            onlyOnScroll : true
                        });

                    }
                }
            },

            // Displays content loader
            showLoader : function(show) {
                $(this.el).empty();
                $(this.el).html("<span class='loader'></span>");
            },

            // Builds each item, returns {timestamp, html} object
            buildTemplate : function(itm) {

                var html;

                switch(itm.get('type')) {

                    case 'photo':
                        html = $.tmpl(this.photo_template, {
                            thumbnail : itm.get('thumbnail'),
                            media : itm.get('media'),
                            avatar : itm.get('avatar'),
                            timestamp : Date.secondsToDate(itm.get('timestamp')).format(),
                            author : itm.get('author'),
                            source : itm.get('source')
                        });
                        break;

                    case 'media':

                        html = $.tmpl(this.media_template, {
                            thumbnail : itm.get('thumbnail'),
                            media : itm.get('media'),
                            avatar : itm.get('avatar'),
                            timestamp : Date.secondsToDate(itm.get('timestamp')).format(),
                            author : itm.get('author'),
                            source : itm.get('source')
                        });

                        break;

                    case 'post':
                        html = $.tmpl(this.post_template, {
                            content : itm.get('content'),
                            avatar : itm.get('avatar'),
                            timestamp : Date.secondsToDate(itm.get('timestamp')).format(),
                            author : itm.get('author'),
                            source : itm.get('source')
                        });
                        break;
                }

                return {
                    timestamp : itm.get('timestamp'),
                    html : html,
                    model : itm
                };
            },

            // Builds out item group and displays its header
            // If prepend is set to true the group is prepended to the list, otherwise appended
            buildGroup : function(group, prepend) {

                var gid, el;

                gid = 'group-' + group.get('id');

                // Create group element which will contain all items
                el = "<ol id='" + gid + "'></ol>";

                if (prepend) {
                    $(this.el).prepend(el);
                } else {
                    $(this.el).append(el);
                }

                group.set({
                    div_id : '#' + gid
                }, {
                    silent : true
                });

                // Triggered when additional data is loaded into the group
                group.bind('change', this.updateGroup, this);

                this.groups.push(group);
                this.groups_key[group.get('timestamp')] = group;

                return group;
            },

            // Builds group header
            buildGroupHeader : function(group) {

                var total, header;

                total = this.getItemCount(group);

                // Remove existing heder
                header = $(group.get('div_id')).find('#group-header');
                if (header.length > 0) {
                    header.remove();
                }

                $(group.get('div_id')).prepend("<div id='group-header'>" + total + " items this " + this.eventModel.get('histogram').resolution + " - " + group.get("timestamp").format());
            },

            buildGroupFooter : function(group) {

                var self = this, total, footer;

                // Remove existing footer
                footer = $(group.get('div_id')).find('#group-footer');
                if (footer.length > 0) {
                    footer.remove();
                }

                // Check whether we need to load more items
                if (group.get('displayed') < group.get('stats').total) {

                    $(group.get('div_id')).append("<div id='group-footer'><div id='load-group-btn' class='content-loader'>More from this " + this.eventModel.get("histogram").resolution + "&nbsp;&nbsp;<span class='icon-download'></span></div></div>");

                    $(group.get('div_id')).find('#load-group-btn').click(function(event) {

                        // Display loader graphics
                        $(event.currentTarget).html("<span class='loader'>&nbsp;</span>");

                        group.setRequestPath(group.get('timestamp'), self.temporalModel.adjustToNextBucket(group.get('timestamp')), self.eventModel.get('limit'), self.eventModel.get('histogram').resolution, self.eventModel.get('type'));

                        // Save already-parsed items in the temporal old_itms array
                        group.set({
                            old_items : group.get('items')
                        }, {
                            silent : true
                        });
                        group.fetch();
                    });

                }
            },

            // Renders group contents.
            // If is_new is true, then only display new content, otherwise everything
            buildGroupItems : function(group, is_new) {

                var dsp = is_new ? group.get('displayed') : 0;

                // Loop through each available item - ItemCollection
                group.get( is_new ? 'items_new' : 'items').each(function(itm) {
                    itm = this.buildTemplate(itm);
                    if (itm) {

                        this.initItem(itm, group);

                        group.set({
                            displayed : dsp += 1
                        }, {
                            silent : true
                        });
                    }

                }, this);

            },

            // Called once additional group data is loaded.
            updateGroup : function(group) {

                var tmp = [], i, len, items, content, itm, itm_model;
                content = group.get('content');
                len = content.length;

                // It is possible to have more than one bucket, loop through all of them to
                // find the appropriate one
                for ( i = 0; i < len; i += 1) {
                    if (Date.secondsToDate(content[i].timestamp).getTime() === group.get('timestamp').getTime()) {
                        items = content[i].items;
                    }
                }

                if (items.length > 0) {
                    len = group.get('items').length;

                    for ( i = 0; i < len; i += 1) {

                        itm = items[i];
                        if (itm) {
                            itm_model = new SIVVIT.ItemModel(itm);

                            itm_model.set({
                                timestamp : itm.timestamp
                            });

                            tmp.push(itm_model);
                            group.get('old_items').add(itm_model);
                        }
                    }

                    // Reassign existing collection and add new one
                    group.set({
                        // Assign augmented old_items back to the items collection
                        items : group.get('old_items'),
                        items_new : new SIVVIT.ItemGroupCollection(tmp)
                    }, {
                        silent : true
                    });

                    this.buildGroupItems(group, true);
                    this.buildGroupFooter(group);
                }
            },

            // Updates the position of the edit bar, moves it to the top
            updateEdit : function() {

                var edit_bar = $(this.el).find('#controls-container').remove();
                if (edit_bar) {
                    $(this.el).prepend(edit_bar);
                }

            },

            // Display edit bar at the top of the list.
            displayEdit : function() {

                var self = this;

                if (this.edit) {

                    $(this.el).append($('#tpl_edit-controls').html());

                    // Delete all approved items
                    $('#del-all').click(function() {

                        var i, itm;

                        i = self.rendered.length - 1;

                        while (i >= 0) {

                            itm = self.rendered[i];

                            if (itm.html.find('#itm-check').is(':checked')) {
                                self.deleteItem(itm);
                            }
                            i -= 1;
                        }
                    });

                    // Approve all selected items
                    $('#apr-all').click(function() {

                        var i, itm, cb;
                        i = self.rendered.length - 1;
                        while (i >= 0) {

                            itm = self.rendered[i];
                            cb = itm.html.find('#itm-check');
                            if (cb.is(':checked')) {
                                self.approveItem(itm, true);
                            }
                            cb.attr('checked', false);
                            itm.html.css('background-color', '#FFFFFF');
                            i -= 1;
                        }
                        $('#group-select').attr('checked', false);
                    });

                    // Select all items
                    $('#group-select').click(function() {

                        var i, checked, itm;

                        i = self.rendered.length - 1;
                        checked = $('#group-select').is(':checked');

                        while (i >= 0) {

                            itm = self.rendered[i];

                            itm.html.find('#itm-check').attr('checked', checked);
                            itm.html.css('background-color', !checked ? '#FFFFFF' : '#FFFFCC');
                            i -= 1;
                        }
                    });
                }

            },

            // Checks whether there any items are displayed and shows appropriate message if not.
            checkDisplayed : function() {

                if (!this.displayed) {
                    if ($('#no-content').length <= 0) {

                        var msg;

                        switch(this.eventModel.get('status')) {

                            case 1:
                                msg = 'No content yet but we are working on it...';
                                break;

                            case 2:
                                msg = 'No content found. This collection is archived.';
                                break;

                            case -1:
                                msg = 'No content found. This collection is archived.';
                                break;

                            case 0:
                                msg = 'No content yet, the collection will start shortly.';
                                break;
                        }

                        $(this.el).append("<div id='no-content' class='notification'>" + msg + "</div>");
                    }
                } else {
                    $('#no-content').remove();
                }
            },

            initItem : function(itm, group) {

                if (itm !== null) {

                    // Initiate button clicks if a user is logged in and modify
                    // content template (add hover buttons and check box)
                    if (this.edit) {

                        console.log(itm.html);

                        // itm.html.find('#content').prepend($('#tpl_edit-item').html());
                        //
                        // itm.html.find('#del-itm').hide();
                        // itm.html.find('#apr-itm').hide();
                        // itm.html.find('#load-itm').hide();
                        //
                        // this.enableItem(itm);
                        // this.showHidePending(itm);
                    }
                    this.rendered.push(itm);

                    $(group.get('div_id')).append(itm.html);
                }
            },

            // Enables item button events
            enableItem : function(itm) {

                var self = this;

                itm.html.find('#load-itm').fadeOut();

                itm.html.hover(function(event) {
                    itm.html.find('#del-itm').show();
                    itm.html.find('#apr-itm').show();
                }, function(event) {
                    itm.html.find('#del-itm').hide();
                    itm.html.find('#apr-itm').hide();
                });

                itm.html.click(function(event) {

                    var checked;

                    switch(event.target.id) {
                        case 'apr-itm':
                            self.approveItem(itm);
                            break;

                        case 'del-itm':
                            self.deleteItem(itm);
                            break;

                        case 'itm-check':
                            checked = itm.html.find('#itm-check').is(':checked');
                            itm.html.css('background-color', !checked ? '#FFFFFF' : '#FFFFCC');
                            break;

                        default:
                            if (itm.html.find('#itm-check').length > 0) {
                                checked = itm.html.find('#itm-check').is(':checked');
                                itm.html.find('#itm-check').attr('checked', !checked);
                                itm.html.css('background-color', checked ? '#FFFFFF' : '#FFFFCC');
                            }
                    }
                });

            },

            // Disables button clicks for this item
            disableItem : function(itm) {
                itm.html.unbind();
                itm.html.find('#del-itm').hide();
                itm.html.find('#apr-itm').hide();
                itm.html.find('#load-itm').show();
            },

            // Sets item status to -1 and initiates PUT request
            // If request is successful item is removed
            deleteItem : function(itm) {

                this.disableItem(itm);
                var self = this;

                itm.model.set({
                    status : -1
                });

                itm.model.save({

                    type : 'DELETE',

                    // Remove item if save is successful
                    complete : function(response) {

                        if (response.status === 200) {
                            itm.html.fadeOut();
                            self.model.remove(itm.model, {
                                silent : true
                            });
                        } else {
                            self.enableItem(itm);
                            self.showHidePending(itm);
                        }
                    }

                });

            },

            // Toggles item status and sends serve request
            approveItem : function(itm, value) {

                this.disableItem(itm);
                var self = this;

                if (value === undefined) {
                    value = Number(itm.model.get('status')) === 1 ? 0 : 1;

                } else {
                    value = value === true ? 1 : 0;
                }
                itm.model.set({
                    status : value
                });

                itm.model.save({

                    type : 'PUT',

                    success : function() {
                        self.enableItem(itm);
                        self.showHidePending(itm);
                    },

                    error : function() {
                        self.enableItem(itm);
                        self.showHidePending(itm);
                    }

                });
            },

            showHidePending : function(itm) {

                if (Number(itm.model.get('status')) === 1) {
                    itm.html.find('#pending-flag').toggleClass('pending-notice', false);
                    itm.html.find('#pending-flag').toggleClass('active-notice', true);
                } else {
                    itm.html.find('#pending-flag').toggleClass('pending-notice', true);
                    itm.html.find('#pending-flag').toggleClass('active-notice', false);
                }
            },

            // Returns count of items to be displayed in this view
            getItemCount : function(group) {
                return group.get('stats').total;
            }

        });

        /**
         * Updates event header.
         */
        SIVVIT.HeaderView = Backbone.View.extend({

            timestamp : null,

            render : function() {

                $('#js-e-title').html(this.model.get('title'));
                // $('#event-description').html(this.model.get('description'));
                // I don't think we even need event description
                $('#js-e-descr').html('Tracking <strong><i>' + this.model.get('keywords').toString() + '</i></strong> near ' + this.model.get("location").name);
                $('#js-e-user').html("<span class='gray-text'>Created by</span> <span class='icon-user'></span><a href='#'>" + this.model.get("author") + "</a> <span class='gray-text'>on</span> " + this.model.get("startDate").toDateString());

                $('#js-e-map-lbl').html("<span class='icon-location'></span>" + this.model.get("location").name);

                this.update();
            },

            // Reset timer
            reset : function(date) {

                this.timestamp = date;
                this.update();
            },

            // Updates timer
            update : function() {

                var element = $('#js-e-timeline-lbl');

                switch(this.model.get('status')) {

                    case 1:
                        element.html("<span class='icon-time'></span>Live, " + this.formatTime(new Date() - this.timestamp));
                        break;

                    case 2:
                        element.html("<span class='icon-time'></span>Collection Archived");
                        break;

                    case -1:
                        element.html("<span class='icon-time'></span>Stopping Collection");
                        break;

                    case 0:
                        element.html("<span class='icon-time'></span>Starting Collection");
                        break;
                }
            },

            formatTime : function(milliseconds) {

                var seconds, minutes, hours, days;

                seconds = Math.floor(milliseconds / 1000);
                minutes = Math.floor(milliseconds / 60000);
                hours = Math.floor(milliseconds / 3600000);
                days = Math.floor(milliseconds / 86400000);

                if (days > 0) {
                    return 'updated ' + days + ' days ago';
                }
                if (hours > 0) {
                    return 'updated ' + hours + ' hrs ago';
                }
                if (minutes > 0) {
                    return 'updated ' + minutes + ' min ago';
                }
                if (seconds > 0) {
                    return 'updated ' + seconds + ' sec ago';
                }
                return 'updated just now';
            }

        });
    }(jQuery, SIVVIT));
