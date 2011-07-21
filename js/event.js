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
	
	/**
	 * Draws twitter status table.
	 */
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
	 * Draws timeline histogram.
	 * @param canvas Div histogram container
	 * @param data Data container {data:[12, 22, 30], min:0, max:100}
	 */
	function drawHistogram(canvas, data, attributes)
	{
		var histogram, i, len, maxVal, minVal, maxHeight, percent, barW, barH, barX, barY, barXPadding;
		
		len = data.values.length;
		maxVal = data.max;
		minVal = data.min;
		maxHeight = $(canvas).height()-20;
		barXPadding = 3;
		
		histogram = Raphael(canvas, $(canvas).width(), $(canvas).height());
		
		barW = ($(canvas).width()-(barXPadding*len)) / len;
		
		for(i = 0; i < len; i += 1)
		{
			percent = (data.values[i] / maxVal) * 100;
			barH = Math.round(percent * maxHeight / 100);
			barX = Math.round(i*(barW+barXPadding));
			barY = Math.round( $(canvas).height() - barH)
			
			var bar = histogram.rect(barX, barY, barW, barH).attr(attributes)
			
			bar.mouseover(function ()
			{
				this.attr({fill:"#007AA2", cursor:"pointer"});
			});
			
			bar.mouseout(function ()
			{
				this.attr(attributes);
			});
		}
	}
	
	/**
	 * Populates data for the bar graph.
	 * @return data object
	 */
	function populateData()
	{
		var points, i, min, max, value, len;
			
		len = 50+Math.random()*100;
		points = [];
		min = 0;
		max = 0;
			
		for(i = 0; i < len; i += 1)
		{
			value = Math.round(Math.random()*(len-i));
			min = Math.min(min, value);
			max = Math.max(max, value);
				
			points.push(value);
		}
		return {values:points, min:min, max:max};
	}

	drawHistogram($("#timeline-container")[0], populateData(), {gradient:"90-#333333-#555555", "stroke-width":0})
	drawStatusTable();
});