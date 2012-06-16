/*global jQuery:false, SIVVIT:true, $:false, Backbone:false */
/*jslint white:true devel:true passfail:false sloppy:true*/

// Main model responsible for loading and managing data
SIVVIT.UserModel = Backbone.Model.extend({

    defaults : {

        id : 0,
        real_name : null,
        user_name : null,
        premium : 0,
        joined : null,
        location : {
            name : "Null Island",
            lon : 0,
            lat : 0
        }
    }
});
