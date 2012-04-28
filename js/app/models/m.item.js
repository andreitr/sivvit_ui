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
