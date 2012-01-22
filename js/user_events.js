(function() {

	$LAB.script("js/libs/graphael/raphael-min.js").wait();
	$LAB.script("js/libs/jquery/jquery-1.6.4.min.js").wait();
	$LAB.script("js/libs/underscore/underscore-min.js").wait();
	$LAB.script("js/libs/backbone/backbone.js").wait();
	$LAB.script("js/libs/jquery/jquery-templates/jquery.tmpl.min.js").wait();
	$LAB.script("js/libs/jquery/jquery-ui-1.8.16.custom.min.js").wait();
	$LAB.script("js/libs/require/require.js").wait();

	$LAB.script("js/libs/fancybox/jquery.fancybox.js").wait();
	$LAB.script("js/libs/fancybox/jquery.fancybox.js").wait();

	$LAB.script("js/header.js").wait();


	$LAB.script("js/user_events_main.js").wait(function() {

		require(["js/app/models/model.event", "js/app/models/m.user", "js/app/models/model.temporal", "js/app/views/v.histogram", "js/app/views/v.user.header"], function() {

			SIVVIT.UserEvents.init("events.json");

			//Initiate user header
			SIVVIT.UserHeader = new SIVVIT.UserHeaderView({
				model : new SIVVIT.UserModel()
			});
			SIVVIT.UserHeader.model.url = "user.json";
			SIVVIT.UserHeader.model.fetch();
		});
	});
})();
