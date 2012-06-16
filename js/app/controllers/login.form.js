// JSLint variable definition
/*global jQuery:false, SIVVIT:true, $:false, Backbone:false, confirm:false */
/*jslint white:true devel:true passfail:false sloppy:true*/

( function(jQuery) {

        SIVVIT.Login = {

            // Initiates the application and loads the main data.
            init : function() {

                var self = this;

                $('#js-app-form').submit(function() {

                    $('#js-app-form').validate();
                    if ($('#js-app-form').valid()) {
                        $('.btn').toggleClass('disabled', true);
                        $('.btn').html("Processing <span class='loader'></span>");
                    }
                    return false;
                });

                // Initiate form validation
                $('#js-app-form').validate({

                    // Don't place default label
                    success : function(label) {
                    },

                    // Don't place default error message
                    errorPlacement : function(error, element) {
                    },

                    highlight : function(element, errorClass) {
                        $(element).parent().toggleClass('error', true);
                    },

                    unhighlight : function(element, errorClass) {
                        $(element).parent().toggleClass('error', false);
                    },

                    rules : {
                        email : {
                            required : true,
                            email : true
                        },
                        password : {
                            required : true,
                            minlength : 5
                        }
                    }
                });
            }
        };
    }());
