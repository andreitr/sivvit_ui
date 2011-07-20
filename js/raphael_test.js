/**
 * @author Andrei Taraschuk
 */
$(function ()
{
	var canvas, drawing;
	
	canvas = $("#canvas")[0];
	
	drawing = Raphael(canvas, $(canvas).width(), $(canvas).height());
	
	var i, len = 100, min=0, max=300, percent, barW, barH, barX, barY, barPadding=2, bar;
	barW = $(canvas).width() / len;
	
	for(i = 0; i < len; i += 1)
	{
		percent = (Math.random()*(max-i) / max) * 100;
		barH = Math.round(percent * max / 100);
		barX = Math.round(i*(barW+barPadding));
		barY = Math.round( $(canvas).height() - barH)
		
		bar = drawing.rect(barX, barY, barW, barH);
		bar.attr({fill: "#000", "stroke-width":0});
	}
	
});
