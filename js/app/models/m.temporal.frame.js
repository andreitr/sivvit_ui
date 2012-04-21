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
