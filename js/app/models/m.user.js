// Main model responsible for loading and mainaining data
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
