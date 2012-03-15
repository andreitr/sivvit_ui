(function(){$("#new-event").fancybox({"width":860,"height":430,"autoScale":true,"scrolling":false,"transitionIn":"fade","transitionOut":"fade","type":"iframe"})})();Date.prototype.format=function(){return this.getMonth()+1+"/"+this.getDate()+"/"+this.getFullYear()+" "+this.getHours()+":"+this.getMinutes()+":"+this.getSeconds()};
(function(jQuery,SIVVIT){SIVVIT.Event={eventModel:null,temporalModel:null,contentController:null,contentView:null,headerView:null,mapView:null,sideHistView:null,edit:true,init:function(id){var self=this;SIVVIT.Lightbox.init();this.temporalModel=new SIVVIT.TemporalModel;this.eventModel=new SIVVIT.EventModel;this.headerView=new SIVVIT.HeaderView({model:this.eventModel});this.mapView=new SIVVIT.MapView;this.sideHistView=new SIVVIT.HistogramView({el:"#timeline-container",model:this.temporalModel,slider:true});
this.contentView=new SIVVIT.ContentView({edit:this.edit,temporalModel:this.temporalModel,eventModel:this.eventModel});this.contentController=new SIVVIT.ContentController({eventModel:this.eventModel,temporalModel:this.temporalModel,view:this.contentView});this.eventModel.set({json:"http://sivvit.com/event/"+id+".json?callback=?"});this.eventModel.setSinceRequestURL();this.eventModel.fetch();this.eventModel.bind("change",function(){$("#content-loader").remove();$("#event-application").show();if(self.eventModel.hasChanged("title")||
self.eventModel.hasChanged("description")||self.eventModel.hasChanged("location"))self.headerView.render();if(self.eventModel.hasChanged("last_update")){self.headerView.reset(new Date(self.eventModel.get("last_update")));self.eventModel.setSinceRequestURL()}if(self.eventModel.hasChanged("last_update")||self.eventModel.hasChanged("histogram")){self.temporalModel.set({startDate:new Date(self.eventModel.get("startDate")),endDate:new Date(self.eventModel.get("last_update")),startRange:new Date(self.eventModel.get("startDate")),
endRange:new Date(self.eventModel.get("last_update")),min:Math.min(self.temporalModel.get("min"),self.eventModel.get("histogram").min),max:Math.max(self.temporalModel.get("max"),self.eventModel.get("histogram").max),resolution:self.eventModel.get("histogram").resolution});self.contentController.update()}if(self.eventModel.hasChanged("location"))self.mapView.render(self.eventModel.get("location").name,self.eventModel.get("location").lon,self.eventModel.get("location").lat)})}};SIVVIT.ItemGroupCollection=
Backbone.Collection.extend({model:SIVVIT.ItemGroupModel,comparator:function(itm){return-itm.get("timestamp")}});SIVVIT.ItemCollection=Backbone.Collection.extend({model:SIVVIT.ItemModel,comparator:function(itm){return-itm.get("timestamp")}});SIVVIT.Lightbox={init:function(){$("#photo-box").fancybox({maxWidth:800,maxHeight:600,fitToView:true,autoSize:true,width:"70%",height:"70%",closeClick:false,transitionIn:"fade",transitionOut:"fade"})}};SIVVIT.Parser={parse:function(model){var tmp_group=[];var content=
model.get("content"),i,j,tmp_items,group_model,itm_model;var len=content.length;for(i=len;i--;){group_model=new SIVVIT.ItemGroupModel(content[i]);group_model.set({json:model.get("json")});tmp_items=[];for(j=content[i].items.length;j--;){itm_model=new SIVVIT.ItemModel(content[i].items[j]);itm_model.set({timestamp:new Date(content[i].items[j].timestamp)});tmp_items.push(itm_model)}group_model.set({id:(new Date).getTime()+"-"+i,items:new SIVVIT.ItemCollection(tmp_items),items_new:new SIVVIT.ItemCollection(tmp_items),
stats:content[i].stats,timestamp:new Date(content[i].timestamp)});model.updateContentRange(group_model.get("timestamp"));tmp_group.push(group_model)}return new SIVVIT.ItemGroupCollection(tmp_group)}};SIVVIT.ContentController=Backbone.View.extend({el:"#navigation-content",prevButton:null,activeButton:null,view:null,eventModel:null,temporalModel:null,events:{"click #all-btn":"updateView","click #post-btn":"updateView","click #media-btn":"updateView"},initialize:function(options){this.eventModel=options.eventModel;
this.temporalModel=options.temporalModel;this.view=options.view;this.activeButton="#all-btn";$(this.activeButton).toggleClass("text-btn",false);$(this.activeButton).toggleClass("text-btn-selected",true)},update:function(){this.renderStats();this.renderHistogram()},updateView:function(event){if(this.renderButtons(event.target.id)){this.update();this.view.reset();this.eventModel.unset(["content"],{silent:true});switch(event.target.id){case "all-btn":this.eventModel.setRequestType("all");break;case "post-btn":this.eventModel.setRequestType("post");
break;case "media-btn":this.eventModel.setRequestType("media");break}this.eventModel.setRequestURL();this.eventModel.fetch()}},renderStats:function(){switch(this.activeButton){case "#all-btn":$("#content-stats").html("Total: "+this.eventModel.get("stats").total);break;case "#post-btn":$("#content-stats").html("Posts: "+this.eventModel.get("stats").posts);break;case "#media-btn":$("#content-stats").html("Media: "+(this.eventModel.get("stats").images+this.eventModel.get("stats").videos));break}},renderButtons:function(button){if(this.activeButton==
"#"+button)return false;this.prevButton=this.activeButton;this.activeButton="#"+button;$(this.activeButton).toggleClass("text-btn",false);$(this.activeButton).toggleClass("text-btn-selected",true);if(this.prevButton!=this.activeButton){$(this.prevButton).toggleClass("text-btn",true);$(this.prevButton).toggleClass("text-btn-selected",false)}return true},renderHistogram:function(){switch(this.activeButton){case "#all-btn":this.temporalModel.set({histogram:this.eventModel.get("histogram").global,type:"global"});
break;case "#post-btn":this.temporalModel.set({histogram:this.eventModel.get("histogram").post,type:"post"});break;case "#media-btn":this.temporalModel.set({histogram:this.eventModel.get("histogram").media,type:"media"});break}}});SIVVIT.ContentView=Backbone.View.extend({el:"#dynamic-content",post_template:"<li id='post-list'><div id=\"content\"><div id='avatar'><img src='${avatar}' width='48' height='48'></div>${content}<div id='meta'>${source} <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",
photo_template:"<li id='post-list'><div id='content'><div id=\"media\"><img height='160' src='${thumbnail}' id='photo-box' href='${media}'/></div><div id='meta'>${source} <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",media_template:"<li id='post-list'><div id='content'><div id=\"media\"><img height='160' src='${thumbnail}' id='photo-box' class='fancybox.iframe' href='${media}'/></div><div id='meta'>${source} <span class='icon-time'></span>${timestamp} <span class='icon-user'></span><a href='#'>${author}</a></div></div></li>",
rendered:[],groups:[],groups_key:{},new_count:0,new_groups:new SIVVIT.ItemCollection,temporalModel:null,eventModel:null,edit:false,displayed:false,display_buckets:false,initialize:function(options){this.edit=options.edit;this.temporalModel=options.temporalModel;this.eventModel=options.eventModel;this.eventModel.bind("change",this.onModelContentUpdate,this)},onModelContentUpdate:function(event){if(this.eventModel.hasChanged("content")){var collection=SIVVIT.Parser.parse(this.eventModel);if(this.rendered.length<=
0){this.model=collection;this.render();return}if(this.display_buckets){this.display_buckets=false;this.display(collection,false);this.footer();return}collection.each(function(group){var old_group=this.groups_key[group.get("timestamp")];if(old_group){var stats=old_group.get("stats");stats.total=Number(stats.total)+Number(group.get("stats").total);stats.media=Number(stats.media)+Number(group.get("stats").media);stats.post=Number(stats.post)+Number(group.get("stats").post);this.buildGroupHeader(old_group);
this.buildGroupFooter(old_group)}else{this.groups_key[group.get("timestamp")]=group;this.new_count+=1;this.new_groups.add(group)}},this);if(this.new_count>0)this.update()}},update:function(){var self=this;if($("#load-content-btn").length<=0){$(this.el).prepend("<div id='load-content-btn' class=\"content-loader\">"+this.new_count+" new items&nbsp;&nbsp;<span class='icon-download'></span></div>");$("#load-content-btn").hide();$("#load-content-btn").slideDown("slow");$("#load-content-btn").click(function(event){$(event.currentTarget).remove();
self.display(self.new_groups,true);self.new_count=0;self.new_groups.reset()})}else $("#load-content-btn").html(this.new_count+" new items&nbsp;&nbsp;<span class='icon-download'></span>")},reset:function(){this.groups_key={};this.groups=[];this.rendered=[];this.showLoader()},display:function(source,prepend){var is_update;if(source===undefined)source=this.model;source.each(function(group){group=this.buildGroup(group,prepend);this.buildGroupItems(group,false);this.buildGroupHeader(group);this.buildGroupFooter(group);
this.displayed=true},this)},render:function(){$(this.el).empty();this.displayed=false;this.rendered=[];this.groups=[];this.groups_key={};if(this.edit)this.displayEdit();this.display();this.footer();this.checkFiltered()},footer:function(){var self=this;var btn=$(this.el).find("#load-groups-btn");if(btn.length>0)btn.remove();if(this.eventModel.hasMoreContent())if($("#load-groups-btn").length<=0){$(this.el).append("<div id='load-groups-btn' class=\"content-loader\">More "+this.eventModel.get("histogram").resolution+
"s<span class='icon-download'></span></div>");$("#load-groups-btn").click(function(event){$(event.currentTarget).html("<span class='loader'>&nbsp;</span>");self.display_buckets=true;self.eventModel.loadMoreContent()})}},showLoader:function(show){$(this.el).empty();$(this.el).html("<div id='content-loader'></div>")},buildTemplate:function(itm){var html;switch(itm.get("type")){case "photo":html=$.tmpl(this.photo_template,{thumbnail:itm.get("thumbnail"),media:itm.get("media"),avatar:itm.get("avatar"),
timestamp:itm.get("timestamp").format(),author:itm.get("author"),source:itm.get("source")});break;case "media":html=$.tmpl(this.media_template,{thumbnail:itm.get("thumbnail"),media:itm.get("media"),avatar:itm.get("avatar"),timestamp:itm.get("timestamp").format(),author:itm.get("author"),source:itm.get("source")});break;case "post":html=$.tmpl(this.post_template,{content:itm.get("content"),avatar:itm.get("avatar"),timestamp:itm.get("timestamp").format(),author:itm.get("author"),source:itm.get("source")});
break}return{timestamp:itm.get("timestamp"),html:html,model:itm}},buildGroup:function(group,prepend){var gid="group-"+group.get("id");var el="<ol id='"+gid+"'></ol>";if(prepend)$(this.el).prepend(el);else $(this.el).append(el);group.set({div_id:"#"+gid},{silent:true});group.bind("change",this.updateGroup,this);this.groups.push(group);this.groups_key[group.get("timestamp")]=group;return group},buildGroupHeader:function(group){var total=this.getItemCount(group);var header=$(group.get("div_id")).find("#group-header");
if(header.length>0)header.remove();$(group.get("div_id")).prepend("<div id='group-header'>"+total+" items this "+this.eventModel.get("histogram").resolution+" - "+group.get("timestamp").format())},buildGroupFooter:function(group){var self=this,total;var footer=$(group.get("div_id")).find("#group-footer");if(footer.length>0)footer.remove();if(group.get("displayed")<group.get("stats").total){$(group.get("div_id")).append("<div id='group-footer'><div id='load-group-btn' class='content-loader'>More from this "+
this.eventModel.get("histogram").resolution+"&nbsp;&nbsp;<span class='icon-download'></span></div></div>");$(group.get("div_id")).find("#load-group-btn").click(function(event){$(event.currentTarget).html("<span class='loader'>&nbsp;</span>");group.setRequestPath(group.get("timestamp"),self.temporalModel.adjustToNextBucket(group.get("timestamp")),self.eventModel.get("limit"),self.eventModel.get("histogram").resolution,self.eventModel.get("type"));group.set({old_items:group.get("items")},{silent:true});
group.fetch()})}},buildGroupItems:function(group,is_new){var dsp=is_new?group.get("displayed"):0;group.get(is_new?"items_new":"items").each(function(itm){itm=this.buildTemplate(itm);if(itm){this.initItem(itm,group);group.set({displayed:dsp+=1},{silent:true})}},this)},updateGroup:function(group){var tmp=[],i,len,items;var content=group.get("content");len=content.length;for(i=len;i--;)if((new Date(content[i].timestamp)).getTime()===group.get("timestamp").getTime())items=content[i].items;if(items.length>
0){len=group.get("items").length;for(i=len;i--;){var itm=items[i];if(itm){var itm_model=new SIVVIT.ItemModel(itm);itm_model.set({timestamp:new Date(itm.timestamp)});tmp.push(itm_model);group.get("old_items").add(itm_model)}}group.set({items:group.get("old_items"),items_new:new SIVVIT.ItemGroupCollection(tmp)},{silent:true});this.buildGroupItems(group,true);this.buildGroupFooter(group)}},displayEdit:function(){$(this.el).append('<div id="controls-container"><div id="checkbox"><input type="checkbox" id="group-select"></div><a id="del-all" class="link"><span class="icon-delete"></span>Delete</a><a id="apr-all" class="link"><span class="icon-check"></span>Approve</a></div>');
var self=this;$("#del-all").click(function(){var i=self.rendered.length;while(i--){var itm=self.rendered[i];if(itm.html.find("#itm-check").is(":checked"))self.deleteItem(itm)}});$("#apr-all").click(function(){var i=self.rendered.length;while(i--){var itm=self.rendered[i];var cb=itm.html.find("#itm-check");if(cb.is(":checked"))self.approveItem(itm,true);cb.attr("checked",false);itm.html.css("background-color","#FFFFFF")}$("#group-select").attr("checked",false)});$("#group-select").click(function(){var i=
self.rendered.length;var checked=$("#group-select").is(":checked");while(i--){var itm=self.rendered[i];itm.html.find("#itm-check").attr("checked",checked);itm.html.css("background-color",!checked?"#FFFFFF":"#FFFFCC")}})},checkFiltered:function(){if(!this.displayed){if($("#no-content").length<=0)$(this.el).append("<div id='no-content' class='notification'>No content in selected timespan.</div>")}else $("#no-content").remove()},initItem:function(itm,group){if(itm!==null){if(this.edit){itm.html.find("#content").prepend("<span class='item-edit'><span id='load-itm' class='loader'></span><span class='icon-delete' id='del-itm'></span><span class='icon-check' id='apr-itm'></span><div id='pending-flag'></div></span>");
itm.html.find("#content").prepend("<div id='checkbox'><input type='checkbox' id='itm-check'/></div>");itm.html.find("#del-itm").hide();itm.html.find("#apr-itm").hide();itm.html.find("#load-itm").hide();this.enableItem(itm);this.showHidePending(itm)}this.rendered.push(itm);$(group.get("div_id")).append(itm.html)}},enableItem:function(itm){var self=this;itm.html.find("#load-itm").fadeOut();itm.html.hover(function(event){itm.html.find("#del-itm").show();itm.html.find("#apr-itm").show()},function(event){itm.html.find("#del-itm").hide();
itm.html.find("#apr-itm").hide()});itm.html.click(function(event){var checked;switch(event.target.id){case "apr-itm":self.approveItem(itm);break;case "del-itm":self.deleteItem(itm);break;default:if(itm.html.find("#itm-check").length>0){checked=itm.html.find("#itm-check").is(":checked");itm.html.find("#itm-check").attr("checked",!checked);itm.html.css("background-color",checked?"#FFFFFF":"#FFFFCC")}}})},disableItem:function(itm){itm.html.unbind();itm.html.find("#del-itm").hide();itm.html.find("#apr-itm").hide();
itm.html.find("#load-itm").show()},deleteItem:function(itm){itm.html.fadeOut();this.model.remove(itm.model,{silent:true})},approveItem:function(itm,value){this.disableItem(itm);var self=this;if(value===undefined)value=itm.model.get("status")===1?0:1;else value=value===true?1:0;itm.model.set({status:value});itm.model.save({status:value},{error:function(){console.log("Error updating model");self.enableItem(itm);self.showHidePending(itm)},success:function(){self.showHidePending(itm);self.enableItem(itm);
console.log("Successfully saved")}})},showHidePending:function(itm){if(itm.model.get("status")===1){itm.html.find("#pending-flag").toggleClass("pending-notice",false);itm.html.find("#pending-flag").toggleClass("active-notice",true)}else{itm.html.find("#pending-flag").toggleClass("pending-notice",true);itm.html.find("#pending-flag").toggleClass("active-notice",false)}},getItemCount:function(group){return group.get("stats").total}});SIVVIT.MapView=Backbone.View.extend({el:"#map-container",render:function(name,
lon,lat){$(this.el).html('<img src="http://maps.googleapis.com/maps/api/staticmap?center='+lon+","+lat+'&zoom=10&size=280x130&sensor=false">')}});SIVVIT.HeaderView=Backbone.View.extend({timestamp:null,render:function(){$("#event-title").html(this.model.get("title"));$("#event-description").html(this.model.get("description"));$("#event-user").html("<span class='gray-text'>Created by</span> <span class='icon-user'></span><a href='#'>"+this.model.get("author")+"</a> <span class='gray-text'>on</span> "+
(new Date(this.model.get("startDate"))).toDateString());$("#map-label").html("<span class='icon-location'></span>"+this.model.get("location").name)},reset:function(date){var self=this;this.timestamp=date;this.update()},update:function(){if(this.model.get("status")>0)$("#timeline-label").html("<span class='icon-time'></span>Live, "+this.formatTime(new Date-this.timestamp));else $("#timeline-label").html("<span class='icon-time'></span>This event archived.")},formatTime:function(milliseconds){var seconds=
Math.floor(milliseconds/1E3);var minutes=Math.floor(milliseconds/6E4);var hours=Math.floor(milliseconds/36E5);var days=Math.floor(milliseconds/864E5);if(days>0)return"updated "+days+" days ago";if(hours>0)return"updated "+hours+" hrs ago";if(minutes>0)return"updated "+minutes+" min ago";if(seconds>0)return"updated "+seconds+" sec ago";return"updated just now"}})})(jQuery,SIVVIT);SIVVIT.EventModel=Backbone.Model.extend({defaults:{json:null,meta:1,limit:3,bucket_limit:5,bucket_page:1,type:"post",content_bounds:{min:null,max:null},id:null,title:null,author:null,description:null,keywords:[],content:[],location:{lon:null,lat:null,name:null},startDate:new Date,endDate:new Date,status:0,last_update:null,pending:0,stats:{total:0,posts:0,images:0,videos:0},histogram:{min:null,max:null,resolution:null,global:[],media:[],post:[]}},post_hash:{},media_hash:{},global_hash:{},fetch_interval:null,
initialize:function(){this.bind("change",function(){if(this.get("status")<1)this.stopLiveData();else this.startLiveData()},this)},fetch:function(options){this.stopLiveData();Backbone.Model.prototype.fetch.call(this,options)},set:function(attributes,options){if(attributes.hasOwnProperty("histogram")&&attributes.histogram!==undefined&&attributes.histogram!==null){if(this.get("histogram")!==undefined){attributes.histogram.max=Math.max(attributes.histogram.max,this.get("histogram").max);attributes.histogram.min=
Math.min(attributes.histogram.min,this.get("histogram").min)}if(attributes.histogram.post!==undefined)attributes.histogram.post=this.appendHistogram(this.post_hash,attributes.histogram.post);if(attributes.histogram.media!==undefined)attributes.histogram.media=this.appendHistogram(this.media_hash,attributes.histogram.media);if(attributes.histogram.global!==undefined)attributes.histogram.global=this.appendHistogram(this.global_hash,attributes.histogram.global)}Backbone.Model.prototype.set.call(this,
attributes,options);return this},appendHistogram:function(hash,value){var len=value.length;var result=[];for(var i=len;i--;)if(hash[value[i].timestamp])hash[value[i].timestamp].count=Number(hash[value[i].timestamp].count)+Number(value[i].count);else hash[value[i].timestamp]=value[i];for(var bucket in hash)result.push(hash[bucket]);return result},updateContentRange:function(date){if(this.attributes.content_bounds.min===null){this.attributes.content_bounds.min=new Date(this.get("endDate"));this.attributes.content_bounds.max=
new Date(this.get("startDate"))}this.attributes.content_bounds.min=Math.min(date,this.attributes.content_bounds.min);this.attributes.content_bounds.max=Math.max(date,this.attributes.content_bounds.max)},hasMoreContent:function(){if(this.get("content_bounds").min>new Date(this.get("startDate")))return true;else return false},setSinceRequestURL:function(){var path=this.attributes.json;if(this.attributes.meta!==null)path+="&meta="+this.attributes.meta;if(this.attributes.limit!==null)path+="&limit="+
this.attributes.limit;if(this.attributes.last_update!==null)path+="&since="+this.attributes.last_update;if(this.attributes.bucket_limit!==null)path+="&bucket_limit="+this.attributes.bucket_limit;if(this.attributes.bucket_page!==null)path+="&bucket_page="+this.attributes.bucket_page;if(this.attributes.type!==null)path+="&type[]="+this.attributes.type;if(this.attributes.histogram.resolution!==null)path+="&resolution="+this.attributes.histogram.resolution;else path+="&resolution=hour";this.url=path},
setRequestURL:function(){var path=this.attributes.json;if(this.attributes.meta!==null)path+="&meta=0";if(this.attributes.limit!==null)path+="&limit="+this.attributes.limit;if(this.attributes.bucket_limit!==null)path+="&bucket_limit="+this.attributes.bucket_limit;if(this.attributes.bucket_page!==null)path+="&bucket_page="+this.attributes.bucket_page;if(this.attributes.type!==null)path+="&type[]="+this.attributes.type;if(this.attributes.histogram.resolution!==null)path+="&resolution="+this.attributes.histogram.resolution;
this.url=path},setRequestType:function(type){switch(type){case "all":this.attributes.type="photo&type[]=media&type[]=post";break;case "media":this.attributes.type="media&type[]=photo";break;case "photo":this.attributes.type="photo";break;case "post":this.attributes.type="post";break}},loadMoreContent:function(){this.attributes.bucket_page=this.get("bucket_page")+1;this.setRequestURL();this.fetch()},startLiveData:function(){var self=this;this.stopLiveData();this.fetch_interval=setInterval(function(){self.fetch()},
1E4)},stopLiveData:function(){clearInterval(this.fetch_interval)}});SIVVIT.TemporalModel=Backbone.Model.extend({defaults:{startDate:new Date,endDate:new Date,startRange:null,endRange:null,min:null,max:null,histogram:null,histogramStartDate:null,histogramEndDate:null,resolution:null,type:null},set:function(attributes,options){if(attributes.hasOwnProperty("histogram")&&attributes.histogram!==undefined&&attributes.histogram!==null){this.bucket_hash={};this.set({histogramStartDate:null});this.set({histogramEndDate:null});var len=attributes.histogram.length;for(var i=
len;i--;){attributes.histogram[i].timestamp=new Date(attributes.histogram[i].timestamp);if(this.checkDateBounds(attributes.histogram[i].timestamp)===true){this.bucket_hash[attributes.histogram[i].timestamp]=attributes.histogram[i];if(!this.get("histogramStartDate")||!this.get("histogramEndDate")){this.set({histogramStartDate:attributes.histogram[i].timestamp});this.set({histogramEndDate:attributes.histogram[i].timestamp})}else{this.set({histogramStartDate:Math.min(attributes.histogram[i].timestamp,
this.get("histogramStartDate"))});this.set({histogramEndDate:Math.max(attributes.histogram[i].timestamp,this.get("histogramEndDate"))})}}else attributes.histogram.splice(i,1)}}Backbone.Model.prototype.set.call(this,attributes,options);return this},adjustResolution:function(date){switch(this.get("resolution")){case "day":return new Date(date.getFullYear(),date.getMonth(),date.getDate());case "hour":return new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours());case "minute":return new Date(date.getFullYear(),
date.getMonth(),date.getDate(),date.getHours(),date.getMinutes());case "second":return new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds())}},adjustToNextBucket:function(date,resolution){var new_date;resolution=resolution===undefined?this.get("resolution"):resolution;switch(resolution){case "day":new_date=this.adjustResolution(date);new_date.setDate(new_date.getDate()+1);return new_date;case "hour":new_date=this.adjustResolution(date);new_date.setHours(new_date.getHours()+
1);return new_date;case "minute":new_date=this.adjustResolution(date);new_date.setMinutes(new_date.getMinutes()+1);return new_date;case "second":new_date=this.adjustResolution(date);new_date.setSeconds(new_date.getSeconds()+1);return new_date}},getResolution:function(){switch(this.get("resolution")){case "day":return 864E5;case "hour":return 36E5;case "minute":return 6E4;case "second":return 1E3}},checkDateBounds:function(date){return date>=this.get("startDate")&&date<=this.get("endDate")?true:false}});SIVVIT.ItemModel=Backbone.Model.extend({defaults:{id:null,status:null,type:null,location:[],content:null,source:null,timestamp:"",rank:0,author:null,avatar:null},initialize:function(){this.url="http://sivvit.com/e/post/"+this.get("id")}});SIVVIT.ItemGroupModel=Backbone.Model.extend({defaults:{json:null,type:null,id:null,timestamp:null,items:null,items_new:null,div_id:null,displayed:0,stats:{total:0,post:0,media:0}},lock_stats:false,set:function(attributes,options){if(attributes.hasOwnProperty("stats"))if(!this.lock_stats)this.lock_stats=true;else delete attributes.stats;Backbone.Model.prototype.set.call(this,attributes,options);return this},setRequestPath:function(startDate,endDate,limit,resolution,type){var page=Math.round(this.get("displayed")/
limit)+1;this.url=this.get("json")+"&meta=0&fromDate="+startDate.getTime()/1E3+"&toDate="+endDate.getTime()/1E3+"&limit="+limit+"&page="+page+"&resolution="+resolution+"&type[]="+type}});SIVVIT.HistogramView=Backbone.View.extend({bars:[],slider:false,initialize:function(options){this.slider=options.slider;this.model=options.model;this.model.bind("change:histogram",this.render,this)},render:function(){this.drawHistogram();if(this.slider)this.drawSlider()},drawSlider:function(){self=this;$("#timeline-slider").slider({range:true,min:this.model.get("histogramStartDate"),max:this.model.get("histogramEndDate"),values:[this.model.get("startRange").getTime(),this.model.get("endRange").getTime()],
stop:function(event,ui){self.onSliderDragged(event,ui)}});this.updateTime()},onSliderDragged:function(event,ui){this.model.set({"startRange":new Date(ui.values[0])});this.model.set({"endRange":new Date(ui.values[1])});this.updateBars()},updateBars:function(){for(var i=this.bars.length;i--;)this.updateBarColor(this.bars[i]);this.updateTime()},updateTime:function(){$("#timeline-mintime").html(this.model.get("startRange").format());$("#timeline-maxtime").html(this.model.get("endRange").format())},updateBarColor:function(bar){if((new Date(bar.timestamp)).getTime()>=
this.model.get("startRange").getTime()&&(new Date(bar.timestamp)).getTime()<=this.model.get("endRange").getTime())bar.attr({fill:"#333333"});else bar.attr({fill:"#CCCCCC"})},drawHistogram:function(){if(this.model.get("histogram")){var adjusted_end_date=this.model.adjustToNextBucket(new Date(this.model.get("histogramEndDate"))).getTime();var lenTotal=Math.ceil((adjusted_end_date-this.model.get("histogramStartDate"))/this.model.getResolution());var len=this.model.get("histogram").length;var maxVal=
this.model.get("max");var minVal=this.model.get("min");var maxHeight=$(this.el).height();var maxWidth=$(this.el).width();var barW=$(this.el).width()/lenTotal;barW=barW<0.5?0.5:barW;var startTime=this.model.get("histogramStartDate");var endTime=adjusted_end_date;var histogram=Raphael($(this.el)[0],$(this.el).width(),$(this.el).height());for(var i=len;i--;){var frame=this.model.get("histogram")[i];var percentY=frame.count/maxVal*100;var percentX=(frame.timestamp.getTime()-startTime)/(endTime-startTime);
var barH=Math.round(percentY*maxHeight/100);var barX=Math.round(percentX*maxWidth);var barY=Math.round(maxHeight-barH);var bar=histogram.rect(barX,barY,barW,barH).attr({fill:"#333333","stroke-width":0});if(this.slider){bar.timestamp=frame.timestamp;this.updateBarColor(bar);this.bars.push(bar)}}}}});