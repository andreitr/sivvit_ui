$( function() {
	
	var statsExpanded, statsDivHeight, isStatsDivDrawn = false;
	
	statsDivHeight = $("#stats").height();
	
	$("#timeline-expand").click(function()
	{
		statsExpanded = !statsExpanded ? true : false;
		
		if(statsExpanded)
		{
			$("#stats").animate({height:"200px"}, 300, onStatsShowHide);
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
			
			if(!isStatsDivDrawn)
			{
				drawPieChart({id:"#chart-left", radius:55, labels:["%% - status", "%% - media", "%% - check-ins"], data:[Math.random()*100, Math.random()*100, Math.random()*100]});
				drawPieChart({id:"#chart-middle", radius:55, labels:["%% - exact location", "%% - account location", "%% - no location"], data:[Math.random()*100, Math.random()*100, Math.random()*100]});
				
				drawLineChart({id:"#chart-right"});
				// Make sure pie charts are drawn only once. 
				// Drawing g.raphel chart in an invisible div screws it up.
				isStatsDivDrawn = true;
			}

		}else{
			$("#extracharts").hide();
		}
	}
	
	/*
	 * Draws g.raphael pie chart using passed parameters.
	 * @param Initialization object containing all required parameters {id:"#div", radius:20, labels:[], data:[]} 
	 */
	function drawPieChart(initObj)
	{
		var container = $(initObj.id)[0], raphael;
		
		raphael = Raphael(container);
		raphael.g.txtattr.font = "12px Helvetica, Arial, sans-serif";
		raphael.g.piechart(initObj.radius, initObj.radius, initObj.radius, initObj.data, {legend: initObj.labels, legendcolor:"#585858" ,legendpos: "east", colors:["#0B405E","#007AA2", "#FFFFFF"]});
	}
	
	/**
	 * Draws g.graphel bar chart using passed parameters.
	 * #@param Initialization object contains {div:"#div"}
	 */
	function drawLineChart(initObj)
	{
		var container = $(initObj.id)[0], raphael, line;
		
		raphael = Raphael(container);
		raphael.g.txtattr.font = "12px Helvetica, Arial, sans-serif";
		line = raphael.g.linechart(0, 0,  $(container).width(), $(container).height(), [10,20,30,40,50], [[20,22,18,7,3]], {nostroke: true, shade: true, colors:["#0B405E","#007AA2", "#FFFFFF"]});
	}
	
	function drawStatusTable()
	{
		var i, len=5, output="";
		for(i=0; i < len; i += 1)
		{
			output += "<li class=\"status\"><div id=\"post-avatar\"><img src=\"http://a2.twimg.com/profile_images/1220150566/7b040b04c98b3b2a2accaeb313f3730b_normal.jpeg\"></div>";
			output += "<div id=\"post\">Something to think about for sure: HTML5 could pose bigger security threat http://ow.ly/5IFIw #webappsec</a>";
			output += "<div id=\"post-meta\">Twitter:<span class=\"icon-location\"></span>Denver, CO<span class=\"icon-time\"></span>9 hours ago<span class=\"icon-user\"></span>by&nbsp;<a href=\"#\">aaronott</a>";
			output += "</div></div></li>";
		}
		
		$("#status-list").html(output);

	}
	/**
	 * Draws the main event timemeline histogram.
	 */
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


		/**
		 * Populates data for the bar graph.
		 * @return data object
		 */
		function populateData()
		{
			var result = [], i;
			var len = 50+Math.random()*100;
			for(i = 0; i < len; i += 1)
			{
				result.push(Math.round(Math.random()*(len-i)));
			}
			return result;
		}
	}
	
	drawTimeline();
	drawStatusTable();
});