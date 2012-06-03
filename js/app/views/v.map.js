// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false */
/*jslint white:true devel:true passfail:false sloppy:true*/

// Displays a static map based on the provided parameters
SIVVIT.MapView = Backbone.View.extend({

    render : function(name, lat, lon) {
        $(this.el).html("<img src=\"http://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lon + "&zoom=10&size=280x130&sensor=false\">");
    }

});