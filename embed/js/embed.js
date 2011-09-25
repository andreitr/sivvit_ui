$(function() 
{
	var flashvars;

	// Add embed .swf
	flashvars = {source:"json/event.json"};

	swfobject.embedSWF("swf/Application.swf","flash", "100%", "600", "10.0.0","swf/playerProductInstall.swf", flashvars, {wmode:"opaque"}, {id:"sivvitEmbed", name:"sivvitEmbed"});
	
	
});