/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */
 
const kXULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";       
const PREF_PREFIX = "extensions.cricket.";
var iframeSRC = ["http://cricket.balachandar.net/FFPopularVideos.aspx?d=ffsb", "http://cricket.balachandar.net/FFPopularCommunities.aspx?d=ffsb"];

var updateBoardInterval;

function startUp(){

  //register listener
  prefListener.register();

  //for content load
  registerProgressListener();

  if(!top.cricketMain.checkCricketLoginStatus()){
  
     var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogin");
     for(var i=0; i<elts.length; i++) {
        elts[i].removeAttribute("hidden");
     }

     var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogout");
     for(var i=0; i<elts.length; i++) {
       elts[i].setAttribute("hidden", true);
     }
  }
  else {
   
    var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogin");
    for(var i=0; i<elts.length; i++) {
     elts[i].setAttribute("hidden", true);	
    }

    var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogout");
    for(var i=0; i<elts.length; i++) {
     elts[i].removeAttribute("hidden");	
    }		
  }
      
  /** stop getting the data.
  scoreboard.loadBoard(); 
  updateBoardInterval = setInterval(scoreboard.updateBoard, 1000);  //let do it every 1 second
  
  cricketNewsFeed.request();
  **/

  //for content click
  document.getElementById("cricketsb-tpanel-videos").addEventListener("click", onClickEventHandler, false);
  document.getElementById("cricketsb-tpanel-communities").addEventListener("click", onClickEventHandler, false);
}

function closeDown() {
  
  /**
  clearInterval(updateBoardInterval);
  **/
  removeAllReloadIntervals();
  prefListener.unregister();
  try{
    document.getElementById("cricketsb-tpanel-videos").removeEventListener("click", onClickEventHandler, false);
    document.getElementById("cricketsb-tpanel-communities").removeEventListener("click", onClickEventHandler, false);  
  }
  catch(e){}
  
  unregisterProgressListener();
}

//special formatted anchor link
//e.g<a href="javascript(0)" cricket="1" value=""></a>
function onClickEventHandler(event){
  
  var target = event.target;
  if(target && target.getAttribute("cricket", "1")) {
    
    var url = target.getAttribute("value");
    if(url) {
      loadLink(event, url, false);
    }
  }
}

function formIframeSRC() {

   var lang = "en-US";
   var language = cricketComm.getLanguage();
   if (language == "es-ES") {
     lang = "es";
   }
   else {
     for (var i=0; i<cricketSiteLanguages.length; i++) {
        if (cricketSiteLanguages[i] == language) {
          lang = cricketSiteLanguages[i];
        break;  
        }  
     }
   }
   
   for(var i=0; i< iframeSRC.length; i++) {
     iframeSRC[i] = iframeSRC[i] + "&hl=" + lang + "&hc="
   }
}

/*** on tab selection ***/
var _reloadVideoTabInterval = 0;
var _reloadCommTabInterval =  0;
var _reloadInterval = 300000;  //5 mins

function onSelectTab(event) {
  
  //only load the iframe if it is empty
  var target = event.target;
  if(target) {
    switch(target.id) {      
      /*** disable the main tab
      case "cricketsb-tab-main":
        try{
         top.cricketMain.lastSelectedSidebarTab = target.id;
        }
        catch(e){ }

        removeAllReloadIntervals();
      
      break;
      ***/
      case "cricketsb-tab-videos":
        try{
         top.cricketMain.lastSelectedSidebarTab = target.id;
        }
        catch(e){ }
 	
 	var elt =  document.getElementById("cricketsb-tpanel-videos");
 	if(elt.contentWindow.location != "about:blank") {
          removeAllReloadIntervals();
          setReloadInterval("videos");
 	return;
 	}  
 	
        removeAllReloadIntervals();
        loadIframe("cricketsb-tpanel-videos", iframeSRC[0]);
        setReloadInterval("videos");
      break;    
      case "cricketsb-tab-communities":
        try{
         top.cricketMain.lastSelectedSidebarTab = target.id;
        }
        catch(e){ }
      
 	var elt =  document.getElementById("cricketsb-tpanel-communities");
 	if(elt.contentWindow.location != "about:blank") {
          removeAllReloadIntervals();      
          setReloadInterval("communities");
 	return;
 	}  

        removeAllReloadIntervals();      
        loadIframe("cricketsb-tpanel-communities", iframeSRC[1]);
        setReloadInterval("communities");
      break;    
    }
  }
}

function removeAllReloadIntervals() {

  clearInterval(_reloadVideoTabInterval);
  clearInterval(_reloadCommTabInterval);
  //dump("clear All intervals\n")
}

function setReloadInterval(type) {
  
  if (type == "videos") {
     _reloadVideoTabInterval = setInterval(function(){ loadIframe("cricketsb-tpanel-videos", iframeSRC[0]); dump("reload video"); }, _reloadInterval);
     //dump("set video interval\n")
  }
  else if(type == "communities") {
    _reloadCommTabInterval = setInterval(function(){ loadIframe("cricketsb-tpanel-communities", iframeSRC[1]); dump("reload communities"); }, _reloadInterval)
    //dump("set communities interval\n")
  }
}

function reloadIframe(aId){

  removeAllReloadIntervals()

  if(aId == "cricketsb-tpanel-videos"){
    loadIframe(aId, iframeSRC[0])
    setReloadInterval("videos");
  }
  else if(aId == "cricketsb-tpanel-communities") {
    loadIframe(aId, iframeSRC[1])
    setReloadInterval("communities");  
  }
}

function loadIframe(aId, aUrl){
  
  var iframe = document.getElementById(aId);
  iframe.loadURI(aUrl);
}

function setThrobberStatus(aId, busy) {

  var throbber, throbber2;
  if(aId == "video-throbber") {
    
    throbber = document.getElementById("video-throbber");
    throbber2 = document.getElementById("video-throbber2");
    if(busy) {
      throbber.setAttribute("busy", "true");
      throbber2.setAttribute("busy", "true");
    }  
    else {
      throbber.removeAttribute("busy");
      throbber2.removeAttribute("busy");
    }  

  }
  else if(aId == "communities-throbber") {

    throbber = document.getElementById("communities-throbber");
    throbber2 = document.getElementById("communities-throbber2");
    if(busy) {
      throbber.setAttribute("busy", "true");
      throbber2.setAttribute("busy", "true");
    }  
    else {
      throbber.removeAttribute("busy");
      throbber2.removeAttribute("busy");
    }  

  }
  else if(aId == "scoreboard-throbber") {
  
    throbber = document.getElementById("scoreboard-throbber");
    throbber2 = document.getElementById("scoreboard-throbber2");
    if(busy) {
      throbber.setAttribute("busy", "true");
      throbber2.setAttribute("busy", "true");
    }  
    else {
      throbber.removeAttribute("busy");
      throbber2.removeAttribute("busy");
    }      
  }
}

function loadRefLink (event, aRef, aMouseClick){

  var url = cricketLinks[aRef];
  if(!url)
    return;
       
  if(event.target.getAttribute("disabled") != true && event.target.getAttribute("disabled") != "true")
    loadLink(event, url, aMouseClick);
}

function loadLink(event, url, aMouseClick) {
   
  var browser = top.document.getElementById("content");
  if(aMouseClick){
    if(event.button == 1){
      var tab = browser.addTab(url);  
      browser.selectedTab = tab;
   	
      if(event.target.localName == "menuitem")
        event.target.parentNode.hidePopup();
    }
    else
      browser.loadURI(url);
  }
  else{
    
    if(!event){
      browser.loadURI(url);
        
    return;
    }
	        
    var shift = event.shiftKey;     
    var ctrl =  event.ctrlKey;
    var meta =  event.metaKey;
    if (event.button == 1 || ctrl || meta) {    
      var tab = browser.addTab(url);  
      browser.selectedTab = tab;
    }
    else if(shift)
      openDialog("chrome://browser/content/browser.xul", "_blank", "chrome,all,dialog=no", url);
    else
      browser.loadURI(url);
  }
     
return;  
}


function onHeaderImageClick(event) {
  
  if(event.target.localName == "tabbox") {
    loadRefLink(event, 'cricketHome');
  }
}

function openExtensionOptionsWindow(){

   window.openDialog("chrome://cricket/content/options.xul", "cricket-options-window", "modal,centerscreen,chrome,resizable=no");
}


/* listener */
var prefListener = {
  
  _topics : ["cricket:cricket-loggedIn", "cricket:cricket-loggedOut"],    

  _branch: null,

  _os : null,
  
  register : function() {

    this._os = Components.classes["@mozilla.org/observer-service;1"]
                                      .getService(Components.interfaces.nsIObserverService);
    for(var i = 0; i < this._topics.length; i++) 
      this._os.addObserver(this, this._topics[i], false);
  },
  
  unregister : function() {

    if(this._os) {
      
      for(var i = 0; i < this._topics.length; i++) {
        try{
          this._os.removeObserver(this, this._topics[i], false);
        }
        catch(e){}
      }
    }
  },
  
  observe : function(aSubject, aTopic, aData){

     switch(aTopic){
        case "cricket:cricket-loggedIn":
          
          var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogin");
	  for(var i=0; i<elts.length; i++) {
	    elts[i].setAttribute("hidden", true);	
	  }

          var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogout");
	  for(var i=0; i<elts.length; i++) {
	    elts[i].removeAttribute("hidden");	
	  }
		
        break;
        case "cricket:cricket-loggedOut":
        
          var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogin");
	  for(var i=0; i<elts.length; i++) {
	    elts[i].removeAttribute("hidden");
	  }

          var elts = document.getElementsByAttribute("class", "cricketsb-cricketlogout");
	  for(var i=0; i<elts.length; i++) {
	    elts[i].setAttribute("hidden", true);
	  }
          
        break;
     }

  }
}  

/* News feed */
var cricketNewsFeed = {

  useAggregator : true,
  
  request : function(norepeatcall) {

    var url;
    switch(navigator.language) {
      case "fr":
        url = "http://news.google.fr/news?hl=fr&ned=fr&q=coupe+du+monde+de+la+fifa+2006&ie=UTF-8&output=rss";   
      break;
      case "de":
        url = "http://news.google.de/news?hl=de&ned=de&ie=UTF-8&q=wm+2006&output=rss"
      break;
      case "it":
        url = "http://news.google.it/news?hl=it&ned=it&q=coppa+del+mondo+fifa+2006&ie=UTF-8&output=rss"
      break;
      case "es-ES":
        url = "http://news.google.es/news?hl=es&tab=wn&q=copa+mundial+2006&ie=UTF-8&output=rss";
      break;
      case "pt-BR":
        url = "http://news.google.pt/news?hl=pt-PT&ned=pt-PT_pt&ie=UTF-8&q=copa+do+mundo+2006&output=rss";
      break;
      case "ja":
      case "ja-JP-mac":
        url = "http://news.google.com/news?hl=ja&ned=us&ie=UTF-8&q=W%E6%9D%AF+-site:chosun.com+-site:joins.com+-site:donga.com+-site:innolife.net+-site:korea-np.co.jp+-site:worldtimes.co.jp&output=rss";
      break;
      case "zh-TW":
        url = "http://news.google.com.tw/news?hl=zh-TW&ned=tw&q=%E4%B8%96%E7%95%8C%E7%9B%83&ie=UTF-8&output=rss";
      break;	
      case "zh-CN":
        url = "http://news.google.com/news?hl=zh-CN&ned=cn&q=%E4%B8%96%E7%95%8C%E6%9D%AF&ie=UTF-8&output=rss";
      break;	
      case "cs":
      case "da":
      case "ko":
      case "ru":
      default:
        url = "http://news.google.com/news?hl=en&ned=&ie=UTF-8&q=World+Cup+2006&output=rss";
    }
    
    new cricketXMLHttpRequest(url, cricketNewsFeed.onRequestLoad, cricketNewsFeed.onRequestError, {targetId:"cricketsb-news", norepeatcall:norepeatcall }, cricketNewsFeed, true);    
  },

  onRequestLoad : function(event){
    dump("===> news reponses \n");
    //event.target.channel.originalURI.spec
    var callObj = event.target._callObj;
    var extraParams = event.target._extraParams;
    
    var responseXML = event.target.responseXML;
    var responseText = event.target.responseText;    

    var nodeName = responseXML.documentElement.localName.toLowerCase();
    switch(nodeName) {
      
      case "parsererror":
         callObj.displayError();
      break;
      case "feed":
         callObj.parseAtom(responseXML, extraParams);
      break;  
      case "rss":
      case "rdf":
         callObj.parseRSS(responseXML, extraParams);
      break;
      default:
         callObj.displayError();
      break;
    }
    
    if(!extraParams.norepeatcall)
       setTimeout(function(){ cricketNewsFeed.request(); }, 900000); //15 mins   
  },
   
  onRequestError : function(event) {

    var callObj = event.target._callObj;
    var extraParams = event.target._extraParams;
    
    callObj.displayError();
    if(!extraParams.norepeatcall)
      setTimeout(function(){ cricketNewsFeed.request(); }, 900000); //15 mins
  },

  displayError : function() {
  
    var elt = document.getElementById("cricketsb-news");
    var errorElt = document.getElementById("cricketsb-news-error");
    if(elt.childNodes.length == 0) {
    
      elt.setAttribute("hidden", true);
      errorElt.removeAttribute("hidden");
    }
  },

  parseAtom : function(xmlData, extraParams) {
     
    var items = [];
    var item, itemTitle, itemLink, linkHref, itemContent, itemPubDate;

    var aggItems = [];  
  
    var itemNodes = xmlData.getElementsByTagName("entry");
    for (var i = 0; i < itemNodes.length; i++) {
    
      item = {};
      itemTitle = "";  
      itemLink = "";
      itemContent = "";
      itemPubDate = "";
    
      var child;
      for (var j = 0; j < itemNodes[i].childNodes.length; j++) {
      
        child = itemNodes[i].childNodes[j];
        if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
         
          switch (child.nodeName) {
 	    case "title":
	      try {
	        itemTitle = cricketComm.htmlToUnicode(child.firstChild.nodeValue);
	      } catch (e) { }
	    break;
	    case "link":
	      try {
	       itemLink = child.getAttribute("href");
	      } catch (e) { }	  
	    break;
            case "content":
	      if (child.hasAttribute("type")) {
	
	        var type = child.getAttribute("type");
	        if (type == "xhtml" || type == "application/xhtml+xml") {
	  
	          var serializer = new XMLSerializer();
	          for(var k = 0; k <child.childNodes.length; k++ ){
	            itemContent += serializer.serializeToString(child.childNodes[k]);
	          }
   	        } 
   	        else {
	          try {
	            itemContent = child.firstChild.nodeValue;
	          }
	          catch (e) {}
	        }
	      } 
	      else {
	        try {
	    	   itemContent = child.firstChild.nodeValue;
	        }
	        catch (e) {}
	      }
             break;
             case "issued":
               try {
                 itemPubDate = child.firstChild.nodeValue;
               } catch (e) { }
             break;
          }
        }
      }   
    
      item.title = itemTitle;
      item.link = itemLink;
      if(itemLink != ""){
        items.push(item);
      }
        
      if(this.useAggregator){
        item.content = itemContent;
        item.issued = itemPubDate;
        aggItems.push(item);
      }
    }

    if(this.useAggregator){

      var feed = {title :"", link:"", description:""};
      var rootNode = xmlData.documentElement
      var childNode = rootNode.firstChild;
      while(childNode){
    
        if (childNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE){
          switch (childNode.nodeName) {
            case "title":
              try {
                feed.title = cricketComm.htmlToUnicode(childNode.firstChild.nodeValue);
              } catch (e) { }    	 
            break;
            case "link":
              try {
                feed.link = childNode.getAttribute("href"); 
              } catch (e) { }    	 
            break;
            case "tagline":
              try {
               feed.description = cricketComm.htmlToUnicode(childNode.firstChild.nodeValue);
              } catch (e) { }    	 
            break;
          }
        } 
    
        childNode = childNode.nextSibling
      } 
    
      if(extraParams && extraParams.targetId == "cricketsb-news")
        this.openFeedin(feed, aggItems);
    }  
  },


  parseRSS : function(xmlData, extraParams) {

    var rootNode = xmlData.documentElement;
    var childNode = rootNode.firstChild;
    while(childNode){
      childNode = childNode.nextSibling;
    }
  
    var items = [];
    var item, itemTitle, itemLink, itemContent, itemEnclosure, itemPubDate;

    var aggItems = [];

    var itemNodes = xmlData.getElementsByTagName("item");
    for (var i = 0; i < itemNodes.length; i++) {

      item = {};
      itemTitle = "";  
      itemLink = "";
      itemContent = "";
      itemEnclosure = "";
      itemPubDate = "";
    
      var child;
      for (var j = 0; j < itemNodes[i].childNodes.length; j++) {
      
        child = itemNodes[i].childNodes[j];
        if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
         
          switch (child.nodeName) {
 	    case "title":
	      try {
	        itemTitle = cricketComm.htmlToUnicode(child.firstChild.nodeValue);
	      } catch (e) { }
	    break;
	    case "link":
	      try {
	         itemLink = child.firstChild.nodeValue;
	      } catch (e) { }	  
	    break;
            case "content:encoded":
	    case "description":
	      try{	    
                itemContent = child.firstChild.nodeValue;	    
	      } catch(e){ }	    
            break;
            case "enclosure":
              itemEnclosure = { url:"" };
              if(child.hasAttribute("url")){
               itemEnclosure.url = child.getAttribute("url");
              }
            break;
            case "pubDate":
            case "dc:date":
              try {
                itemPubDate = child.firstChild.nodeValue;
              } catch (e) { }
            break;
          }
        }     
      }
    
      item.title = itemTitle;
      item.link = itemLink;
      if(itemLink != "")
        items.push(item);
        
      if(this.useAggregator){
        item.content = itemContent;
        item.enclosure = itemEnclosure;
        item.issued = itemPubDate;
        aggItems.push(item);
      }
    }
  
    if(this.useAggregator){

      var childNode;
      var rootNode = xmlData.documentElement;
      var child = rootNode.firstChild;
      while(child){
    
        if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE){
          if(child.nodeName == "channel"){
            childNode = child.firstChild;
            break;
          }
        }  
      	     
        child = child.nextSibling;
      }

      var feed = {title :"", link:"", description:""};   
      while(childNode){
      
        if (childNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE){
         switch (childNode.nodeName) {
          case "title":
            try {
              feed.title = cricketComm.htmlToUnicode(childNode.firstChild.nodeValue);
            } catch (e) { }    	 
          break;
          case "link":
            try {
              feed.link = childNode.firstChild.nodeValue; 
            } catch (e) { }    	 
          break;
          case "description":
            try {
             feed.description = cricketComm.htmlToUnicode(childNode.firstChild.nodeValue);
            } catch (e) { }    	 
          break;
         }
        } 
      
        childNode = childNode.nextSibling;
      }   
    
      //if(extraParams && extraParams.targetId == "cricketsb-tpanel-worldcup")
       this.openFeedin(feed, aggItems);
    }  
  },

  openFeedin : function(feedObj, itemsObj){
     
     var elt = document.getElementById("cricketsb-news");
     if(!elt)
       return;
       
     if(elt.getAttribute("hidden")) {
       elt.removeAttribute("hidden");
       var errorElt = document.getElementById("cricketsb-news-error");
       errorElt.setAttribute("hidden", true);
     }
     while(elt.firstChild){
       
       elt.removeChild(elt.firstChild);
     }
     
     var title;
     for (var i = 0; i < itemsObj.length; i++) {
	
       var hbox = document.createElementNS(kXULNS, "hbox");
       
         var item = document.createElementNS(kXULNS, "label");
         item.setAttribute("url", itemsObj[i].link);
         title = itemsObj[i].title;
         item.setAttribute("crop", "end");
         item.setAttribute("value", title);
         item.setAttribute("class", "cricketsb-feeditem-heading");
         item.setAttribute("tooltiptext", itemsObj[i].title);
         item.setAttribute("onclick", "loadLink(event, event.target.getAttribute('url'), false)");
          
       hbox.appendChild(item);
             
     elt.appendChild(item);     
     }
  }

}


var scoreboard = {

   _updatingTMUI : false,
   
   _secCounter : 0,

   _lastReloadClickTime : 0,
   
   loadBoard : function() {
   
     for(var i=0; i< top.cricketWCServerService.todayMatches.length; i++)
        scoreboard.showMatch(top.cricketWCServerService.todayMatches[i]);

     //if we do not get data in the first 5 seconds, we display error message
     var errorElt = document.getElementById("cricketsb-scoreboard-error");
     var elt = document.getElementById("cricketsb-scoreboard");
     var rows = document.getElementById("cricketsb-scoreboard-rows");
     if(scoreboard._secCounter >=5 && rows.childNodes.length == 0) {
        
        if(errorElt.getAttribute("hidden"))
          errorElt.removeAttribute("hidden");
        elt.setAttribute("hidden", true);
     }
     else {
        errorElt.setAttribute("hidden", true);
        if(elt.getAttribute("hidden"))
          elt.removeAttribute("hidden");
     }
   },

   updateBoard : function() {

     scoreboard.loadBoard();
     if(scoreboard._secCounter < 5){
       scoreboard._secCounter ++;
     }  
   },
   
   showMatch : function(match) {
     
     if(scoreboard._updatingTMUI) {
       setTimeout(function(match){ scoreboard.showMatch(match); }, 10, match);
       dump("come back to show match later\n")
     return;
     }
     
     scoreboard._updatingTMUI = true;
     
     var matchBundle = document.getElementById("bundle_cricket_match");
     var ctryBundle = document.getElementById("bundle_cricket_countries");
     var rows = document.getElementById("cricketsb-scoreboard-rows");
     var versusLb = rows.getAttribute("versus");
     
     //if we have this already and the lastupdateitme are the same, early return, 
     var nodeAlreadyExist = false;
     var matchTooltipText, foundLocation, mlocation, hlocation, mpos, venue;
     for(var i=0; i < rows.childNodes.length; i++) {
       
       if(rows.childNodes[i].localName == "row"){
         
         if(rows.childNodes[i].getAttribute("id") == match.id){
            
            nodeAlreadyExist = true;  //this will be used to determine whether we should add node or update node
            
            if(rows.childNodes[i].getAttribute("lastupdatetime") == match.lastupdatetime) {           

		scoreboard._updatingTMUI = false;
		
            return;
            }   
         }   
       }
     
     }
     
     //reload the throbber
     setThrobberStatus("scoreboard-throbber", true);
     setTimeout(function(){ setThrobberStatus("scoreboard-throbber", false); } , 2000);
     
     var row = document.createElementNS(kXULNS, "row");
     row.setAttribute("align", "center");
     row.setAttribute("starttime", match.starttime);		//for sorting the order
     row.setAttribute("gamestatus", match.gamestatus);		//mainly for ongoing game
     row.setAttribute("lastupdatetime", match.lastupdatetime);
     row.setAttribute("id", match.id);
     row.className = "scoreboard-grid-row";
     
     /****
     //venue
     if(match.location) {

       foundLocation = false;
       for(var j=0; j < cricketServerVenueMap.length; j++) {
         
         mlocation = match.location.toLowerCase();
         hlocation = cricketServerVenueMap[j].name.toLowerCase();
         if(mlocation.indexOf(hlocation) > -1) {
           venue = matchBundle.getString("cricket.match.venue."+cricketServerVenueMap[j].abbr);
           foundLocation = true;
         break;	        
         }
       }
       
       if(!foundLocation)
         venue = match.location;
     
       mpos = venue.indexOf(",");
       if(mpos != -1) 
         venue = venue.substring(0, mpos);
       
       matchTooltipText = ctryBundle.getString("cricket.worldcup.ctry." + match.teamone.abbr) + " " + versusLb +  " " + ctryBundle.getString("cricket.worldcup.ctry." + match.teamtwo.abbr) + ", " + venue;
     }
     else
     ****/
       try{
       matchTooltipText = ctryBundle.getString("cricket.worldcup.ctry." + match.teamone.abbr) + " " + versusLb +  " " + ctryBundle.getString("cricket.worldcup.ctry." + match.teamtwo.abbr);
       }
       catch(e) { }
     
       var hbox = document.createElementNS(kXULNS, "hbox");
       hbox.setAttribute("align", "center");
          var image = document.createElementNS(kXULNS, "image");
          image.setAttribute("src", "chrome://cricket/skin/flag-" + match.teamone.abbr + ".png");
          try {
            image.setAttribute("tooltiptext", matchTooltipText);
          }
          catch(e){}
       hbox.appendChild(image);
     row.appendChild(hbox);  

       var hbox = document.createElementNS(kXULNS, "hbox");
       hbox.setAttribute("align", "center");
       hbox.setAttribute("pack", "end");
          label = document.createElementNS(kXULNS, "label");
          var totalScore;
          switch(match.gamestatus){
            case 2: 
            case 3:
            case 4:
            case 6:
            case 7: 
            case 8:
            case 12:
              totalScore = match.teamone.total;           
            break;
            default :
              totalScore = " "; 
          }

          if( (match.teamone.subscores && match.teamone.subscores.length > 3) || (match.teamtwo.subscores && match.teamtwo.subscores.length > 3) )
            label.setAttribute("value", totalScore + "(" + match.teamone.penaltyshootoutscore + ")");
	  else
            label.setAttribute("value", totalScore);   
          if(match.gamestatus == 3 || match.gamestatus == 4)
            label.setAttribute("class", "scoreboard-score-label cricketsb-boldtext");
          else  
	    label.setAttribute("class", "scoreboard-score-label");          
       hbox.appendChild(label);
     row.appendChild(hbox);  

       label = document.createElementNS(kXULNS, "label");
       if(match.gamestatus == 1)
         label.setAttribute("value", "v");
       else
         label.setAttribute("value", "-");       
       if(match.gamestatus == 3 || match.gamestatus == 4)
	  label.setAttribute("class", "cricketsb-boldtext");
     row.appendChild(label);  

       var hbox = document.createElementNS(kXULNS, "hbox");
       hbox.setAttribute("align", "center");
       hbox.setAttribute("pack", "start");
          label = document.createElementNS(kXULNS, "label");
          switch(match.gamestatus){
            case 2: 
            case 3:
            case 4:
            case 6:
            case 7: 
            case 8:
            case 12:
              totalScore = match.teamtwo.total;           
            break;
            default :
              totalScore = "  "; 
          }

          if( (match.teamone.subscores && match.teamone.subscores.length > 3) || (match.teamtwo.subscores && match.teamtwo.subscores.length > 3) )
            label.setAttribute("value", totalScore + "(" + match.teamtwo.penaltyshootoutscore + ")");
	  else
            label.setAttribute("value", totalScore);   
          if(match.gamestatus == 3 || match.gamestatus == 4)
            label.setAttribute("class", "scoreboard-score-label cricketsb-boldtext");
          else  
	    label.setAttribute("class", "scoreboard-score-label");          
       hbox.appendChild(label);
     row.appendChild(hbox);      
       
       var hbox = document.createElementNS(kXULNS, "hbox");
       hbox.setAttribute("align", "center");
          image = document.createElementNS(kXULNS, "image");
          image.setAttribute("src", "chrome://cricket/skin/flag-" + match.teamtwo.abbr + ".png");
          try {
            image.setAttribute("tooltiptext", matchTooltipText);
          }
          catch(e){}          
       hbox.appendChild(image);
     row.appendChild(hbox);      

       label = document.createElementNS(kXULNS, "label");
       if(match.gamestatus == 2 || match.gamestatus == 12) {
         
         hbox =document.createElementNS(kXULNS, "hbox");
         hbox.setAttribute("align", "center");
         
           label.setAttribute("value",  matchBundle.getString("cricket.match.notification.gameInProgress.label") + " (" + match.timeplayed + "')  ");
           label.setAttribute("tooltiptext", matchTooltipText);
         hbox.appendChild(label);
       
           image = document.createElementNS(kXULNS, "image");
           image.setAttribute("class", "in-game");
           image.setAttribute("tooltiptext", matchTooltipText);
         hbox.appendChild(image);
         
         row.appendChild(hbox);
         
         row.setAttribute("onclick", "scoreboard.openInfoWindow('" + match.id + "');");
       }  
       else if(match.gamestatus == 3 || match.gamestatus == 4) {

         var mdate = new Date(match.starttime);     
	   label.setAttribute("value", ""+matchBundle.getString("cricket.match.final.label")+", " + matchBundle.getFormattedString("cricket.date." + cricketComm.months[mdate.getMonth()] + ".shortName", [cricketComm.appendZeros((mdate.getDate()).toString(), 2, "rtl")]));
	   label.setAttribute("tooltiptext", matchTooltipText);
         row.appendChild(label);

       //  image = document.createElementNS(kXULNS, "image");
       //  image.setAttribute("class", "ended-game");
	 row.setAttribute("onclick", "scoreboard.openInfoWindow('" + match.id + "');");
       
       //row.appendChild(image);
       }	 
       else if(match.gamestatus == 1) {

         //match time
         var mdate = new Date(match.starttime);    
         var label = document.createElementNS(kXULNS, "label");
         label.setAttribute("value", "@ "+cricketComm.appendZeros((mdate.getHours()).toString(), 2, "rtl") +  ":" + cricketComm.appendZeros((mdate.getMinutes()).toString(), 2)+", "+
         matchBundle.getFormattedString("cricket.date." + cricketComm.months[mdate.getMonth()] + ".shortName", [cricketComm.appendZeros((mdate.getDate()).toString(), 2, "rtl")]));
         label.setAttribute("tooltiptext", matchTooltipText);
       row.appendChild(label);
     
         //label = document.createElementNS(kXULNS, "label");
         //label.setAttribute("value", matchBundle.getFormattedString("cricket.date." + cricketComm.months[mdate.getMonth()] + ".shortName", [cricketComm.appendZeros((mdate.getDate()).toString(), 2, "rtl")]));         
       
       	 row.setAttribute("onclick", "scoreboard.openInfoWindow('" + match.id + "');");

       //row.appendChild(label);
       }
       else {
         label.setAttribute("value", "-");
         label.setAttribute("tooltiptext", matchTooltipText);
       row.appendChild(label)
       }  
     
     var added = false;
     if(nodeAlreadyExist) {
       
       var elts =  rows.getElementsByAttribute("id", match.id);
       if(elts.length) {
           var elt = elts[0];
           rows.insertBefore(row, elt);
           rows.removeChild(elt);
       }
     }
     else {
       
       for (var i=0; i < rows.childNodes.length; i++) {
         
         if (match.starttime <= parseInt(rows.childNodes[i].getAttribute("starttime"))) {
            rows.insertBefore(row, rows.childNodes[i]);
            added = true;
         break;   
         }   
       }
       
       if(!added) rows.appendChild(row);
     }  
     
     scoreboard._updatingTMUI = false;
   },
   
   openInfoWindow : function(aMatchId) {
     
     if(top.cricketMain.matchInfoWin)  {
       top.cricketMain.matchInfoWin = top.openDialog("chrome://cricket/content/match-info.xul", "match-info", "dialog=no,centerscreen,chrome,resizable=yes,dependent=yes", aMatchId);
       top.cricketMain.matchInfoWin.focus();
     }
     else {
       top.cricketMain.matchInfoWin = top.openDialog("chrome://cricket/content/match-info.xul", "match-info", "dialog=no,centerscreen,chrome,resizable=yes,dependent=yes", aMatchId);
     }
   },
   
   reloadScoreboard : function() {
     
     var currTime = cricketComm.getUnixTimestamp();
     if (currTime > (this._lastReloadClickTime + 600000)) { //ten minutes

       this._lastReloadClickTime = currTime;      
       /** stop getting the wc data
       top.cricketWCServerService.reloadAllAvailServerQueries();
       cricketNewsFeed.request(true);
       **/
     }

     setThrobberStatus("scoreboard-throbber", true);
     setTimeout(function(){ setThrobberStatus("scoreboard-throbber", false); } , 2000);
   }
}

var progressListener = {

    onLocationChange: function(aWebProgress, aRequest, aURI) {
    	return 0;
    },
    
    onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) { 
    	const nsIChannel = Components.interfaces.nsIChannel;
    	const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
       
       if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_START 
            && nsIWebProgressListener.STATE_IS_NETWORK){
                      
	if (aRequest) {
	
	  if(aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT){
	  
	    var throbber;
	    if (aWebProgress.DOMWindow == document.getElementById("cricketsb-tpanel-videos").contentWindow) {

             var channel;
             try {  channel = aRequest.QueryInterface(nsIChannel);  } catch(e) { };
             if (channel) {
               //var location = channel.URI;
               //dump("==In===>"+location.spec+"\n")
	     }
  	    
              setThrobberStatus("video-throbber", true);
	    }
	    else if(aWebProgress.DOMWindow == document.getElementById("cricketsb-tpanel-communities").contentWindow) {

             var channel;
             try {  channel = aRequest.QueryInterface(nsIChannel);  } catch(e) { };
             if (channel) {
               //var location = channel.URI;
               //dump("==In===>"+location.spec+"\n")
	     }


	     setThrobberStatus("communities-throbber", true);
	    }
	  }
	}  
       }

       if(aStateFlags & nsIWebProgressListener.STATE_STOP 
    	    && nsIWebProgressListener.STATE_IS_NETWORK) {

		 
	 if (aRequest) {
	   
	   if(aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT) {
	 
	    var throbber;
	    if (aWebProgress.DOMWindow == document.getElementById("cricketsb-tpanel-videos").contentWindow) {

             var channel;
             try {  channel = aRequest.QueryInterface(nsIChannel);  } catch(e) { };
             if (channel) {
               //var location = channel.originalURI;
               //dump("==Out===>"+location.spec+"\n")
	     }
	     setTimeout(function() {
	         setThrobberStatus("video-throbber", false); }, 1000);  
	    }
	    else if(aWebProgress.DOMWindow == document.getElementById("cricketsb-tpanel-communities").contentWindow) {

             var channel;
             try {  channel = aRequest.QueryInterface(nsIChannel);  } catch(e) { };
             if (channel) {
               //var location = channel.originalURI;
               //dump("==Out===>"+location.spec+"\n")
	     }
 	     	
	     setTimeout(function() {  
	     	setThrobberStatus("communities-throbber", false); }, 1000);
	    }
	   }
	 }	
       }

       return 0;     
    },
    
    onProgressChange: function(aWebProgress, aRequest,
                               aCurSelfProgress, aMaxSelfProgress,
                               aCurTotalProgress, aMaxTotalProgress) { 

	//dump(aCurSelfProgress+":"+aMaxSelfProgress+":"+aCurTotalProgress+":"+aMaxTotalProgress+"\n");
    	return 0; 
    },
    
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { 

    	return 0; 
    },
    
    onSecurityChange: function(aWebProgress, aRequest, aState) {     

    	return 0; 
    },
    
    onLinkIconAvailable: function() { 

    	return 0; 
    },
    
    QueryInterface: function(aIID) {
    	if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
	        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
    	    aIID.equals(Components.interfaces.nsISupports))
    		return this;
    	throw Components.results.NS_NOINTERFACE;
    }
}

function registerProgressListener() {
  
  document.getElementById("cricketsb-tpanel-videos").addProgressListener(progressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
  document.getElementById("cricketsb-tpanel-communities").addProgressListener(progressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
}

function unregisterProgressListener(){

  document.getElementById("cricketsb-tpanel-videos").removeProgressListener(progressListener);
  document.getElementById("cricketsb-tpanel-communities").removeProgressListener(progressListener);
}