/*global module:false*/
/*jslint white:true devel:true devel:true sloppy:true*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        meta : {
            version : '0.1.0',
            banner : '/*! PROJECT_NAME - v<%= meta.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '* http://sivvit.com/\n' + '* Copyright (c) <%= grunt.template.today("yyyy") %> ' + 'Sivvit Inc; Licensed MIT */'
        },
        lint : {
            files : ['grunt.js', 'js/app/*.js', 'js/app/**/*.js']
        },
        concat : {
            // Main event
            event : {
                src : ['js/app/globals.js', 'js/app/controllers/parts/header.js', 'js/app/controllers/event.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/models/m.item.js', 'js/app/models/m.item.group.js', 'js/app/views/v.histogram.js', 'js/app/views/v.map.js'],
                dest : 'js/dist/event.concat.js'
            },
            // Events
            events : {
                src : ['js/app/globals.js', 'js/app/controllers/parts/header.js', 'js/app/controllers/events.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/views/v.histogram.js'],
                dest : 'js/dist/events.concat.js'
            },

            // Event form
            event_form : {
                src : ['js/app/globals.js', 'js/app/controllers/event.form.js', 'js/app/utils/date.js', 'js/app/models/m.event.js'],
                dest : 'js/dist/event.form.concat.js'
            },

            // Login form
            login_form : {
                src : ['js/app/globals.js', 'js/app/controllers/login.form.js'],
                dest : 'js/dist/login.form.concat.js'
            }

        },
        qunit : {
            files : []
        },
        min : {
            event : {
                src : ['js/app/globals.js', 'js/app/controllers/parts/header.js', 'js/app/controllers/event.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/models/m.item.js', 'js/app/models/m.item.group.js', 'js/app/views/v.histogram.js'],
                dest : 'js/dist/event.min.js'
            },
            events : {
                src : ['js/app/globals.js', 'js/app/controllers/parts/header.js', 'js/app/controllers/events.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/views/v.histogram.js'],
                dest : 'js/dist/events.min.js'
            },
            // Event form
            event_form : {
                src : ['js/app/globals.js', 'js/app/controllers/event.form.js', 'js/app/utils/date.js', 'js/app/models/m.event.js'],
                dest : 'js/dist/event.form.min.js'
            },

            // Login form
            login_form : {
                src : ['js/app/globals.js', 'js/app/controllers/login.form.js'],
                dest : 'js/dist/login.form.min.js'
            }

        },

        cssmin : {
            main : {
                src : ['css/global.css'],
                dest : 'css/dist/global.min.css'
            }
        },
        watch : {
            files : ['js/app/*.js', 'js/app/**/*.js', 'js/app/**/**/*.js'],
            tasks : 'concat min'
        },
        jshint : {
            options : {

                white : true,
                devel : true,
                passfail : false,
                sloppy : true,
                plusplus : true

            },
            globals : {
                jQuery : true,
                SIVVIT : true,
                Backbone : false,
                $ : false

            }
        },
        uglify : { }
    });

    // Default task.
    grunt.registerTask('default', 'lint qunit concat min');

};
