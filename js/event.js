$( function() {
	
	var statsExpanded, statsDivHeight;
	
	statsDivHeight = $("#stats").height();
	
	$("#timeline-expand").click(function()
	{
		statsExpanded = !statsExpanded ? true : false;
		
		if(statsExpanded)
		{
			$("#stats").animate({height:"200px"}, 500, onStatsShowHide);
			$("#timeline-expand").text("Less Stats");
		}else{
			$("#stats").animate({height:statsDivHeight}, 300, onStatsShowHide);
			$("#timeline-expand").text("More Stats");
		}
	});
	
	/*
	 * Shows hides charts when
	 */
	function onStatsShowHide()
	{
		if(statsExpanded)
		{
			$("#extracharts").fadeIn();
		}else{
			$("#extracharts").hide();
		}
		
	}
	

	
	//	Draws main timeline 
	function drawTimeline()
	{
		var r, container, width, height, data;
		container = $("#timeline-container")[0];

		width = $(container).width();
		height = $(container).height();

		data = populateData();

		r = Raphael(container);
		r.g.barchart(0, 20, width, height, [data], {colors:["#555555"], gutter:"10%"}).hover(fadeIn, fadeOut);

		function fadeIn ()
		{
			this.flag = r.g.popup(this.bar.x, this.bar.y, (this.bar.value || "0") + " records").insertBefore(this);
		}

		function fadeOut ()
		{
			this.flag.animate({opacity: 0}, 100, function () {this.remove();});
		}


		function populateData()
		{
			var result = [];
			var len = 50+Math.random()*100;
			for(i = 0; i < len; i += 1)
			{
				result.push(Math.round(Math.random()*(len-i)));
			}
			return result;
		}
	}
	
	drawTimeline();
});