(function() {

	$LAB.script("js/libs/graphael/raphael-min.js").wait();
	$LAB.script("js/libs/jquery/jquery-1.6.4.min.js").wait();
	$LAB.script("js/libs/underscore/underscore-min.js").wait();
	$LAB.script("js/libs/backbone/backbone.js").wait();
	$LAB.script("js/libs/jquery/jquery-templates/jquery.tmpl.min.js").wait();
	$LAB.script("js/libs/jquery/jquery-ui-1.8.16.custom.min.js").wait();
	$LAB.script("js/libs/require/require.js").wait();

	$LAB.script("js/libs/fancybox/jquery.fancybox-1.3.4.js").wait();
	$LAB.script("js/libs/fancybox/jquery.fancybox-1.3.4.pack.js").wait();

	$LAB.script("js/header.js").wait();

	$LAB.script("js/event_main.js").wait(function() {

		// Load backbone dependencies
		require(["js/app/models/model.event", "js/app/models/model.temporal", "js/app/models/m.item", "js/app/models/m.item.group", "js/app/views/v.histogram"], function() {
			SIVVIT.Event.init("event.json");
		});
	});
})();
