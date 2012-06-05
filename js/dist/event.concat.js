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
/*global $:false*/

(function() {
    // New event or edit existing one.
    $('#event-form').fancybox({
        'width' : 860,
        'height' : 430,
        'autoScale' : true,
        'scrolling' : false,
        'transitionIn' : 'fade',
        'transitionOut' : 'fade',
        'type' : 'iframe'
    });
})();

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
                    el : '#map-container'
                });

                this.sideHistView = new SIVVIT.HistogramView({
                    el : '#timeline-container',
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
                    $('.loader').remove();
                    $('#event-app').show();

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
                }).find('#content-stats').waypoint(function(event, direction) {

                    $('#mover').toggleClass('sticky', direction === 'down');
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
                'click #all-btn' : 'updateView',
                'click #post-btn' : 'updateView',
                'click #media-btn' : 'updateView'
            },

            initialize : function(options) {
                this.eventModel = options.eventModel;
                this.temporalModel = options.temporalModel;

                this.view = options.view;

                this.activeButton = '#all-btn';
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

                    // Reset existing cotent
                    this.eventModel.resetContent();

                    // Update type in data request
                    switch(event.target.id) {
                        case 'all-btn':
                            this.eventModel.setRequestType('all');
                            break;
                        case 'post-btn':
                            this.eventModel.setRequestType('post');
                            break;
                        case 'media-btn':
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
                this.off('change', this.resetEvents, this);
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
                switch(this.activeButton) {

                    case '#all-btn':
                        $('#content-stats').html('Total: ' + this.eventModel.get('stats').total);
                        break;

                    case '#post-btn':
                        $('#content-stats').html('Posts: ' + this.eventModel.get('stats').posts);
                        break;

                    case '#media-btn':
                        $('#content-stats').html('Media: ' + (this.eventModel.get('stats').images + this.eventModel.get('stats').videos));
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

                    case '#all-btn':
                        this.temporalModel.set({
                            histogram : this.eventModel.get('histogram').global
                        });
                        break;

                    case '#post-btn':
                        this.temporalModel.set({
                            histogram : this.eventModel.get('histogram').post
                        });
                        break;

                    case '#media-btn':
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

            el : '#dynamic-content',

            post_template : "<li id='post-list'><div id=\"content\"><div id='avatar'><img src='${avatar}' width='48' height='48'></div>${content}<div id='meta'>${source} <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='http://twitter.com/#!/${author}'>${author}</a></div></div></li>",
            photo_template : "<li id='post-list'><div id='content'><div id=\"media\"><img height='160' src='${thumbnail}' id='photo-box' href='${media}'/></div><div id='meta'>${source} <span class='icon-time'></span>${timestamp} <span class='icon-user'></span>${author}</div></div></li>",
            media_template : "<li id='post-list'><div id='content'><div id=\"media\"><img height='160' src='${thumbnail}' id='photo-box' class='fancybox.iframe' href='${media}'/></div><div id='meta'>${source} <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",

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
                this.eventModel.bind('change', this.onModelContentUpdate, this);
            },

            // Updates view when model is changed
            onModelContentUpdate : function(event) {

                if (this.eventModel.hasChanged('content')) {

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

                            console.log(this.new_count);
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

                    $(this.el).prepend("<div id='load-content-btn' class='content-loader loader-margin loader-header'>Found more content&nbsp;&nbsp;<span class='icon-download'></span></div>");

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
                $(this.el).html("<div id='content-loader'></div>");
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

                var self = this, i;

                if (this.edit) {

                    $(this.el).append("<div id='controls-container'><div id='checkbox'><input type='checkbox' id='group-select'></div><a id='del-all' class='link'><span class='icon-delete'></span>Delete</a><a id='apr-all' class='link'><span class='icon-check'></span>Approve</a></div>");

                    // Delete all approved items
                    $('#del-all').click(function() {

                        i = self.rendered.length;
                        while (i > 0) {
                            var itm = self.rendered[i];
                            if (itm.html.find('#itm-check').is(':checked')) {
                                self.deleteItem(itm);
                            }
                            i -= 1;
                        }
                    });

                    // Approve all selected items
                    $('#apr-all').click(function() {
                        var i, itm, cb;
                        i = self.rendered.length;
                        while (i > 0) {
                            itm = self.rendered[i];
                            cb = itm.html.find('#itm-check');
                            if (cb.is(':checked')) {
                                self.approveItem(itm, true);
                            }
                            cb.attr('checked', false);
                            itm.html.css('background-color', '#FFFFFF');

                            i = -1;
                        }
                        $('#group-select').attr('checked', false);
                    });

                    // Select all items
                    $('#group-select').click(function() {

                        var i, checked, itm;
                        i = self.rendered.length;
                        checked = $('#group-select').is(':checked');

                        while (i > 0) {
                            itm = self.rendered[i];
                            itm.html.find('#itm-check').attr('checked', checked);
                            itm.html.css('background-color', !checked ? '#FFFFFF' : '#FFFFCC');
                            i = -1;
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
                        itm.html.find('#content').prepend("<span class='item-edit'><span id='load-itm' class='loader'></span><span class='icon-delete' id='del-itm'></span><span class='icon-check' id='apr-itm'></span><div id='pending-flag'></div></span>");
                        itm.html.find('#content').prepend("<div id='checkbox'><input type='checkbox' id='itm-check'/></div>");

                        itm.html.find('#del-itm').hide();
                        itm.html.find('#apr-itm').hide();
                        itm.html.find('#load-itm').hide();

                        this.enableItem(itm);
                        this.showHidePending(itm);
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

                $('#event-title').html(this.model.get('title'));
                // $('#event-description').html(this.model.get('description'));
                // I don't think we even need event description
                $('#event-description').html('Tracking <strong><i>' + this.model.get('keywords').toString() + '</i></strong> near ' + this.model.get("location").name);
                $('#event-user').html("<span class='gray-text'>Created by</span> <span class='icon-user'></span><a href='#'>" + this.model.get("author") + "</a> <span class='gray-text'>on</span> " + this.model.get("startDate").toDateString());
                $('#map-label').html("<span class='icon-location'></span>" + this.model.get("location").name);

                this.update();
            },

            // Reset timer
            reset : function(date) {

                this.timestamp = date;
                this.update();
            },

            // Updates timer
            update : function() {

                switch(this.model.get('status')) {

                    case 1:
                        $('#timeline-label').html("<span class='icon-time'></span>Live, " + this.formatTime(new Date() - this.timestamp));
                        break;

                    case 2:
                        $('#timeline-label').html("<span class='icon-time'></span>Collection Archived");
                        break;

                    case -1:
                        $('#timeline-label').html("<span class='icon-time'></span>Stopping Collection");
                        break;

                    case 0:
                        $('#timeline-label').html("<span class='icon-time'></span>Starting Collection");
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
/*jslint white:true plusplus:true devel:true*/

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
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

SIVVIT.ItemModel = Backbone.Model.extend({
  defaults : {
    id : null,
    status : null,
    type : null,
    location : [],
    content : null,
    source : null,
    timestamp : null,
    rank : 0,
    author : null,
    avatar : null
  },
  // Initialized
  initialize : function() {
    this.url = SIVVIT.Settings.host+'/e/post/' + this.get('id');
  },

  //  Override set method to ensure correct variable formatting
  set : function(attributes, options) {

    if(attributes.hasOwnProperty('timestamp')) {
      attributes.timestamp = Date.secondsToDate(attributes.timestamp);
    }

    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  },

  // Updates the model and calls provided callbacks when done
  save : function(init) {

    var self = this;

    $.ajax({
      url : self.url,
      data : {
        status : self.get('status'),
        id : self.get('id')
      },
      type : init.type,
      dataType : 'application/json',
      success : init.success,
      complete : init.complete,
      error : init.error
    });
  }

});

// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

// Model for the temporal bucket
SIVVIT.ItemGroupModel = Backbone.Model.extend({
  defaults : {

    // Data url
    json : null,

    type : null,

    id : null,

    timestamp : null,

    // Collection of items - ItemCollection
    items : null,

    // Collection of newly loaded items - instance of ItemCollection
    items_new : null,

    // HTML container for this group
    div_id : null,

    // Count of the displayed items
    displayed : 0,

    stats : {
      total : 0,
      post : 0,
      media : 0
    }
  },

  // When loading additional items the JSON response has a global stats object
  // that looks exactly like the one in this model.

  // By default global stats REPLACE the one here. In order to solve this issue
  // we update local stats only when lock_stats var is set to false.
  lock_stats : false,

  // Override set method to regulate updating of the stats object
  set : function(attributes, options) {

    // Date.secondsToDate is in date.js
    if(attributes.hasOwnProperty('timestamp') && attributes.timestamp !== undefined && attributes.timestamp !== null) {
      attributes.timestamp = Date.secondsToDate(attributes.timestamp);
    }

    // Update stats only for the fist time
    if(attributes.hasOwnProperty('stats')) {
      if(!this.lock_stats) {
        this.lock_stats = true;
      } else {
        delete attributes.stats;
      }
    }
    Backbone.Model.prototype.set.call(this, attributes, options);
    return this;
  },
  // Sets url path with all necessary parameters
  setRequestPath : function(startDate, endDate, limit, resolution, type) {

    var page = Math.round(this.get('displayed') / limit) + 1;
    this.url = this.get('json') + '&meta=0&fromDate=' + Date.dateToSeconds(startDate) + '&toDate=' + Date.dateToSeconds(endDate) + '&limit=' + limit + '&page=' + page + '&resolution=' + resolution + '&type[]=' + type;
  }

});
// JSLint variable definition
/*global SIVVIT:true, Raphael:false, $:false, Backbone:false, confirm:false, console:false  */

SIVVIT.HistogramView = Backbone.View.extend({

  bars : [],
  slider : false,

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
    var histogram = new Raphael($(this.el)[0], $(this.el).width(), $(this.el).height());

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

        var bar = histogram.rect(bar_x, bar_y, bar_w, bar_h).attr({
          fill : '#333333',
          'stroke-width' : 0
        });
      }
    }
  }

});

// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false */
/*jslint white:true devel:true passfail:false sloppy:true*/

// Displays a static map based on the provided parameters
SIVVIT.MapView = Backbone.View.extend({

    render : function(name, lat, lon) {
        $(this.el).html("<img src=\"http://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lon + "&zoom=10&size=280x130&sensor=false\">");
    }

});