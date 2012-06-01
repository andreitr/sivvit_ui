// JSLint variable definition
/*global SIVVIT:true, $:false, Backbone:false, confirm:false, console:false  */

SIVVIT.UserHeaderView = Backbone.View.extend({

  initialize : function() {

    this.model.bind("change", function() {

      $("#account-btn").html("Welcome, " + this.model.get("real_name"));

      // Display all necessary data
      $("#user-avatar").append("<img src='" + this.model.get("avatar") + "' width='38' height='38'>");
      $("#user-title").append(this.model.get("user_name") + " (" + this.model.get("real_name") + ")");

      $("#user-meta").html("<span class='icon-location'></span>" + this.model.get("location").name);
      $("#user-meta").append("&nbsp<span class='icon-user'></span>member since " + new Date(this.model.get("joined")).toDateString());

    }, this);
  }

});
