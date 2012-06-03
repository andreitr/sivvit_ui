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
                src : ['js/app/globals.js', 'js/header.js', 'js/app/controllers/event.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/models/m.item.js', 'js/app/models/m.item.group.js', 'js/app/views/v.histogram.js', 'js/app/views/v.map.js'],
                dest : 'js/dist/event.concat.js'
            },
            // Events
            events : {
                src : ['js/app/globals.js', 'js/events.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/views/v.histogram.js'],
                dest : 'js/dist/events.concat.js'
            },

            // Event form
            event_form : {
                src : ['js/app/globals.js', 'js/event_form.js', 'js/app/utils/date.js', 'js/app/models/m.event.js'],
                dest : 'js/dist/event.form.concat.js'
            }

        },
        qunit : {
            files : []
        },
        min : {
            event : {
                src : ['js/app/globals.js', 'js/header.js', 'js/event.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/models/m.item.js', 'js/app/models/m.item.group.js', 'js/app/views/v.histogram.js'],
                dest : 'js/dist/event.min.js'
            },
            events : {
                src : ['js/app/globals.js', 'js/events.js', 'js/app/utils/date.js', 'js/app/models/m.event.js', 'js/app/models/m.temporal.js', 'js/app/models/m.temporal.frame.js', 'js/app/views/v.histogram.js'],
                dest : 'js/dist/events.min.js'
            },
            // Event form
            event_form : {
                src : ['js/app/globals.js', 'js/event_form.js', 'js/app/utils/date.js', 'js/app/models/m.event.js'],
                dest : 'js/dist/event.form.min.js'
            }
        },
        watch : {
            files : '<config:lint.files>',
            tasks : 'lint qunit'
        },
        jshint : {
            options : {
                curly : true,
                eqeqeq : true,
                immed : true,
                latedef : true,
                newcap : true,
                noarg : true,
                sub : true,
                undef : true,
                boss : true,
                eqnull : true,
                browser : true
            },
            globals : {
                jQuery : true
            }
        },
        uglify : { }
    });

    // Default task.
    grunt.registerTask('default', 'lint qunit concat min');

};
