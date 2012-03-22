SIVVIT.ItemModel = Backbone.Model.extend({
	defaults : {
		id : null,
		status : null,
		type : null,
		location : [],
		content : null,
		source : null,
		timestamp : "",
		rank : 0,
		author : null,
		avatar : null
	},
	// Initialized
	initialize : function() {
		this.url = "http://sivvit.com/e/post/" + this.get("id") + ".json";
	},
	save : function() {


		var self = this;
		
		self.fetch();

		$.ajax({
			url : self.url,
			type : "PUT",
			contentType : 'application/json',
			processData : false,
			data : self.toJSON(),
			success: function(){
				console.log("success");
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log(jqXHR);
			}
		});
	}
});
