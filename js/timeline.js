$( function() {
    
    var canvas, container, width, height, context;
    
    container = $("#timeline-container")[0];
    canvas =    $("#timeline-canvas")[0];

    canvas.width = width = container.clientWidth;
    canvas.height = height = container.clientHeight;
    
    context = canvas.getContext("2d");
       
    function draw()
    {
        var i, len, barW, barH, padding;
        
        barW = 13;
        padding = 2;
        len = Math.floor(width / barW+padding);
        
        console.log(len);
        
        context.clearRect(0, 0, width, height);
        context.fillStyle = "rgb(80,80,80)";
        
        for(i = 0; i < len; i += 1)
        {
            barH = Math.round(Math.random()*((height-20)-i));
            context.fillRect(i*(barW+padding), height-barH, barW, barH);
        }
    }

    draw();
});