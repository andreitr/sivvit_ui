if(typeof SIVVIT=="undefined")SIVVIT={};
(function(jQuery,SIVVIT){SIVVIT.EditEvent={model:null,view:null,init:function(id){var self=this;if(id===null||id===undefined)this.model=new SIVVIT.EventModel({location:{name:"Denver, CO",lat:-104.984722,lon:39.739167},startDate:new Date,endDate:new Date((new Date).getTime()+864E5)});else this.model=new SIVVIT.EventModel({json:"http://sivvit.com/event/"+id+".json?callback=?",meta:0,limit:0,bucket_limit:0});this.view=new SIVVIT.EditEventView({model:this.model});if(id===null||id===undefined){this.view.update();
this.view.initMap()}else{this.model.setRequestURL();this.model.fetch()}}};SIVVIT.EditEventView=Backbone.View.extend({el:"document",map:null,map_complete:null,required_fields:[{field:"input[name='title']",icon:"#icon-title",type:"string"},{field:"input[name='keywords']",icon:"#icon-keywords",type:"string"},{field:"input[name='start-date']",icon:"#icon-start-date",type:"string"}],initialize:function(options){var self=this;this.model=options.model;this.model.bind("change",this.update,this);this.model.bind("change:location",
this.initMap,this);$("input").change(function(){self.validate()})},update:function(){var slef=this;$("#form-container").show();$("#content-loader").hide();$("input[name='title']").val(this.model.get("title"));$("input[name='location']").val(this.model.get("location").name);$("input[name='keywords']").val(this.model.get("keywords"));$("input[name='description']").val(this.model.get("description"));$("input[name='start-date']").datepicker({defaultDate:new Date(this.model.get("startDate"))});$("input[name='start-date']").val((new Date(this.model.get("startDate"))).toDateString());
$("input[name='end-date']").datepicker({defaultDate:new Date(this.model.get("endDate"))});$("input[name='end-date']").val((new Date(this.model.get("endDate"))).toDateString());$("input[name='end-time']").val((new Date(this.model.get("endDate"))).toTimeString().substring(0,8));$("input[name='start-time']").val((new Date(this.model.get("startDate"))).toTimeString().substring(0,8));$("#collection-btn").html(this.model===0?"Start Collection":"Start Collection");this.validate()},validate:function(){var i,
field,valid,icon;for(i=0;i<this.required_fields.length;i++){field=$(this.required_fields[i].field);valid=this.validateValue(field.val(),this.required_fields[i].type);icon=$(this.required_fields[i].icon);field.css("background-color",valid?"#FFFFCC":"#FFFFFF");icon.toggleClass("icon-check-green",valid?false:true);icon.toggleClass("icon-check-red",valid?true:false)}field=$("input[name='start-time']");valid=this.validateTime(field.val());field.css("background-color",valid?"#FFFFFF":"#FFFFCC");$("#icon-start-time").toggleClass("icon-check-red",
valid?false:true);field=$("input[name='end-time']");valid=this.validateTime(field.val());field.css("background-color",valid?"#FFFFFF":"#FFFFCC");$("#icon-end-time").toggleClass("icon-check-red",valid?false:true)},validateValue:function(value,type){if(type==="string")return value.match("^$")},validateTime:function(value){return value.match(/^(?:(?:(\d+):)?(\d+):)?(\d+)$/)},initMap:function(){var self=this;this.map=new google.maps.Map($("#form-map")[0],{center:new google.maps.LatLng(self.model.get("location").lon,
self.model.get("location").lat),zoom:8,disableDefaultUI:true,mapTypeId:google.maps.MapTypeId.ROADMAP});this.map_complete=new google.maps.places.Autocomplete($("input[name='location']")[0]);google.maps.event.addListener(this.map_complete,"place_changed",function(){var place=self.map_complete.getPlace();self.map.setCenter(place.geometry.location);self.model.set({"location":{"lat":place.geometry.location.lat(),"lon":place.geometry.location.lng(),"name":place.name}},{silent:true})})}})})($,SIVVIT);SIVVIT.EventModel=Backbone.Model.extend({defaults:{json:null,meta:1,limit:3,bucket_limit:5,bucket_page:1,type:"post",content_bounds:{min:null,max:null},id:null,title:null,author:null,description:null,keywords:[],content:[],location:{lon:null,lat:null,name:null},startDate:new Date,endDate:new Date,status:0,last_update:null,pending:0,stats:{total:0,posts:0,images:0,videos:0},histogram:{min:null,max:null,resolution:null,global:[],media:[],post:[]}},post_hash:{},media_hash:{},global_hash:{},fetch_interval:null,
initialize:function(){this.bind("change",function(){if(this.get("status")<1)this.stopLiveData();else this.startLiveData()},this)},fetch:function(options){this.stopLiveData();Backbone.Model.prototype.fetch.call(this,options)},set:function(attributes,options){if(attributes.hasOwnProperty("histogram")&&attributes.histogram!==undefined&&attributes.histogram!==null){if(this.get("histogram")!==undefined){attributes.histogram.max=Math.max(attributes.histogram.max,this.get("histogram").max);attributes.histogram.min=
Math.min(attributes.histogram.min,this.get("histogram").min)}if(attributes.histogram.post!==undefined)attributes.histogram.post=this.appendHistogram(this.post_hash,attributes.histogram.post);if(attributes.histogram.media!==undefined)attributes.histogram.media=this.appendHistogram(this.media_hash,attributes.histogram.media);if(attributes.histogram.global!==undefined)attributes.histogram.global=this.appendHistogram(this.global_hash,attributes.histogram.global)}Backbone.Model.prototype.set.call(this,
attributes,options);return this},appendHistogram:function(hash,value){var len=value.length;var result=[];for(var i=len;i--;)if(hash[value[i].timestamp])hash[value[i].timestamp].count=Number(hash[value[i].timestamp].count)+Number(value[i].count);else hash[value[i].timestamp]=value[i];for(var bucket in hash)result.push(hash[bucket]);return result},updateContentRange:function(date){if(this.attributes.content_bounds.min===null){this.attributes.content_bounds.min=new Date(this.get("endDate"));this.attributes.content_bounds.max=
new Date(this.get("startDate"))}this.attributes.content_bounds.min=Math.min(date,this.attributes.content_bounds.min);this.attributes.content_bounds.max=Math.max(date,this.attributes.content_bounds.max)},hasMoreContent:function(){if(this.get("content_bounds").min>new Date(this.get("startDate")))return true;else return false},setSinceRequestURL:function(){var path=this.attributes.json;if(this.attributes.meta!==null)path+="&meta="+this.attributes.meta;if(this.attributes.limit!==null)path+="&limit="+
this.attributes.limit;if(this.attributes.last_update!==null)path+="&since="+this.attributes.last_update;if(this.attributes.bucket_limit!==null)path+="&bucket_limit="+this.attributes.bucket_limit;if(this.attributes.bucket_page!==null)path+="&bucket_page="+this.attributes.bucket_page;if(this.attributes.type!==null)path+="&type[]="+this.attributes.type;if(this.attributes.histogram.resolution!==null)path+="&resolution="+this.attributes.histogram.resolution;else path+="&resolution=hour";this.url=path},
setRequestURL:function(){var path=this.attributes.json;if(this.attributes.meta!==null)path+="&meta=0";if(this.attributes.limit!==null)path+="&limit="+this.attributes.limit;if(this.attributes.bucket_limit!==null)path+="&bucket_limit="+this.attributes.bucket_limit;if(this.attributes.bucket_page!==null)path+="&bucket_page="+this.attributes.bucket_page;if(this.attributes.type!==null)path+="&type[]="+this.attributes.type;if(this.attributes.histogram.resolution!==null)path+="&resolution="+this.attributes.histogram.resolution;
this.url=path},setRequestType:function(type){switch(type){case "all":this.attributes.type="photo&type[]=media&type[]=post";break;case "media":this.attributes.type="media&type[]=photo";break;case "photo":this.attributes.type="photo";break;case "post":this.attributes.type="post";break}},loadMoreContent:function(){this.attributes.bucket_page=this.get("bucket_page")+1;this.setRequestURL();this.fetch()},startLiveData:function(){var self=this;this.stopLiveData();this.fetch_interval=setInterval(function(){self.fetch()},
1E4)},stopLiveData:function(){clearInterval(this.fetch_interval)}});