(function(){
	$LAB.script("js/libs/graphael/raphael-min.js").wait();
	$LAB.script("js/libs/jquery/jquery-1.6.4.min.js").wait();
	$LAB.script("js/libs/underscore/underscore-min.js").wait();
	$LAB.script("js/libs/backbone/backbone.js").wait();
	$LAB.script("js/libs/jquery/jquery-templates/jquery.tmpl.min.js").wait();
	$LAB.script("js/libs/jquery/jquery-ui-1.8.16.custom.min.js").wait();
	
	$LAB.script("js/event_main.js").wait(function(){
		SIVVIT.Event.init("event.json");
	});
})();
