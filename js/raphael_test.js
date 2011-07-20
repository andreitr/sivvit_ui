/**
 * @author Andrei Taraschuk
 */
$(function ()
{
	
	/**
	 * Draws timeline histogram.
	 * @param canvas Div histogram container
	 * @param data Data container [12, 22, 30]
	 */
	function drawHistogram(canvas, data)
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
			bar.attr({fill: "#000", "stroke-width":0});
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
	
	drawHistogram($("#canvas")[0], populateData());
});
