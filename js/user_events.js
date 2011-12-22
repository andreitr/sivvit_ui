(function(){
	$LAB.script("js/libs/graphael/raphael-min.js").wait();
	$LAB.script("js/libs/jquery/jquery-1.6.4.min.js").wait();
	$LAB.script("js/libs/underscore/underscore-min.js").wait();
	$LAB.script("js/libs/backbone/backbone.js").wait();
	$LAB.script("js/libs/jquery/jquery-templates/jquery.tmpl.min.js").wait();
	$LAB.script("js/libs/jquery/jquery-ui-1.8.16.custom.min.js").wait();
	$LAB.script("js/libs/require/require.js").wait();
	
	$LAB.script("js/user_header.js").wait();
	
	$LAB.script("js/user_events_main.js").wait(function(){
		
		// Load backbone dependencies
		require(["js/app/models/model.event", "js/app/models/model.temporal"], function(){
		
			SIVVIT.UserEvents.init("events.json");
			SIVVIT.UserHeader.init("user.json");
		});
	});
})();
