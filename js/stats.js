$( function() {
	
	var content = ["#sentiment", "#geocontent", "#miles", "#blogs"];
	
	len = content.length;
	
	for (i = 0; i < len; i++)
		drawChart(content[i])
	
	
	function drawChart(divid)
	{
		var r, container, width, height, data;
		container = $(divid)[0];

		width = $(container).width();
		height = $(container).height();
		
		r = Raphael(container);
		r.g.piechart(width/2, width/2, 85, [Math.random()*100, Math.random()*100], {colors:["#CCCCCC","#007AA2"]});
	}
	
});