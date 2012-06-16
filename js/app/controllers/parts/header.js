// JSLint variable definition
/*global $:false*/
/*jslint white:true sloppy:true*/

( function() {
        // New event or edit existing one.
        $('#event-form').fancybox({
            'width' : 860,
            'height' : 430,
            'autoScale' : true,
            'scrolling' : 'no',
            'transitionIn' : 'fade',
            'transitionOut' : 'fade',
            'type' : 'iframe'
        });

        $('#login-form').fancybox({
            'width' : 470,
            'height' : 110,
            'autoScale' : true,
            'scrolling' : 'no',
            'transitionIn' : 'fade',
            'transitionOut' : 'fade',
            'type' : 'iframe'
        });

    }());
