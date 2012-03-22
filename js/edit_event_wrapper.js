if( typeof (SIVVIT) == 'undefined') {
	SIVVIT = {};
}

SIVVIT.Wrapper = {

	init : function(id) {

		$LAB.script("js/libs/jquery/jquery-1.6.4.min.js").wait();
		$LAB.script("js/libs/underscore/underscore-min.js").wait();
		$LAB.script("js/libs/backbone/backbone.js").wait();
		$LAB.script("js/libs/jquery/jquery-templates/jquery.tmpl.min.js").wait();
		$LAB.script("js/libs/jquery/jquery-ui-1.8.16.custom.min.js").wait();

		$LAB.script("js/event_form.js").wait(function() {
			SIVVIT.EditEvent.init(id);
		});
	}
}