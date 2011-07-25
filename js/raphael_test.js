/**
 * @author Andrei Taraschuk
 */
$(function ()
{
	
	function drawDistanceChart(canvas, data, attributes)
	{
		var histogram, i, len = data.length, max=86, stepWidth, stepHeight, maxHeight, line, linePath, label, labelLine;
		
		stepWidth = $(canvas).width()/(len-1);
		maxHeight = $(canvas).height() - 50;
		histogram = Raphael(canvas, $(canvas).width(), $(canvas).height());
		
		linePath = "M0 "+$(canvas).height();
		
		for(i=0; i<len; i +=1)
		{
			percent = (data[i] / max) * 100;
			stepHeight = maxHeight * percent / 100;
			linePath += " L"+Math.round(stepWidth*i)+" "+Math.round($(canvas).height() - stepHeight);
			
			if(i > 0 && i < len-1)
			{
				label = histogram.text(Math.round(stepWidth*i), 20, data[i]+" mi");
				label.attr({"font-family":"Helvetica","font-size": 12,"fill":"#585858"});
			
				labelLine = histogram.path("M"+Math.round(stepWidth*i)+" 40 L"+Math.round(stepWidth*i)+" "+$(canvas).height());
				labelLine.attr({"stroke-width":1, stroke:"#CCCCCC"})
			}
		}
		linePath += " L"+Math.round($(canvas).width())+" "+Math.round($(canvas).height())+" L0 "+Math.round($(canvas).height());
	
		
		line = histogram.path(linePath);
		line.attr(attributes);	
	}
	
	drawDistanceChart($("#canvas")[0], [8,11, 32, 44, 86, 45,22, 10, 18, 22, 14], {"stroke-width":0, fill: "#0B405E"});
	
	/**
	 * Draws timeline histogram.
	 * @param canvas Div histogram container
	 * @param data Data container [12, 22, 30]
	 */
	function drawHistogram(canvas, data, attributes)
	{
		var histogram, i, len = data.length, max=25, maxHeight=$(canvas).height(), percent, barW, barH, barX, barY, barPadding=2, bar;
		
		histogram = Raphael(canvas, $(canvas).width(), $(canvas).height());
		
		barW = ($(canvas).width()-(barPadding*len)) / len;
		
		for(i = 0; i < len; i += 1)
		{
			percent = (data[i] / max) * 100;
			barH = Math.round(percent * maxHeight / 100);
			barX = Math.round(i*(barW+barPadding));
			barY = Math.round( $(canvas).height() - barH)
			
			bar = histogram.rect(barX, barY, barW, barH);
			bar.attr(attributes);
		}
	}
	
	
	function populateData()
	{
		var result = [], i, len;
		len = 25;//Math.random()*200;
			
		for(i = 0; i <= len; i += 1)
			result.push(Math.round(Math.random()*(len-i)));
		
		return result;
	}
	
	//drawHistogram($("#canvas")[0], populateData(), {fill:"#999999", "stroke-width":0});
});
