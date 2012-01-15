SIVVIT.ShareView = Backbone.View.extend({

	initialize : function() {
		if(this.el) {
			//$(this.el).hide();
		}
	},
	render : function() {
		
		$(this.el).toggle();
		
	},
	
});



