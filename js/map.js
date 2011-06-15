$( function()
{
	var latlng = new google.maps.LatLng(-34.397, 150.644);
	
    var myOptions = {
      zoom: 9,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    };
    
    var map = new google.maps.Map(container = $("#mapCanvas")[0], myOptions);
});
