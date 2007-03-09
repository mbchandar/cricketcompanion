/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */
 
var cricketMain = {
   
   EXT_GUID : "{06108483-1773-402e-a112-bfec19a73952}",
 
   PREF_PREFIX : "extensions.cricket.",
  
   firstRun : false,

   modifyCustomizeDone : false,   

   floatElementIds : ["cricket-match-note"],

   showSideBar: false,
   
   inCricketUIState : false,
   
   matchInfoWindow : null,
   
   lastSelectedSidebarTab : "cricketsb-tab-videos",
   
   startUp : function(){
     
     cricketMain.setOSSpecificCSS();

     cricketObserver.register();
     
     var contentArea = window.document.getElementById("appcontent");
     contentArea.addEventListener("DOMContentLoaded", cricketMain.onContentLoaded, false);

     var tabs = getBrowser().mTabContainer;
     //tabs.addEventListener("DOMNodeInserted", cricketMain.onTabNodeInserted, true);
     tabs.addEventListener("select", cricketMain.onTabSelect, true);
     
     cricketMain.setMatchNotificationPosition();
                    
     //modify default BrowserToolboxCustomizeDone function
     var customizeToolbars = document.getElementById("cmd_CustomizeToolbars");
     if(customizeToolbars) {
       var funcName = "cricketMain.modifyToolboxCustomizeDone();";
       var onCommand = customizeToolbars.getAttribute("oncommand");
       if(onCommand.indexOf(funcName) == -1) {
         onCommand = cricketComm.trimSpaces(onCommand);
         if(onCommand.charAt(onCommand.length-1) != ";")
           newOnCommand = onCommand + ";" + funcName;
         else
           newOnCommand = onCommand + funcName; 
         customizeToolbars.setAttribute("oncommand", newOnCommand);
       }  
     }
    
     //first run
     cricketMain.firstRun = cricketPref.getPref(cricketMain.PREF_PREFIX+"firstRun", "bool");
     if(!cricketMain.firstRun) {
       cricketPref.setPref(cricketMain.PREF_PREFIX+"firstRun", true, "bool");       
       setTimeout(function(){
         cricketMain.showButton(true);
       }, 500);
     }
     
     //set selected country image on UI
     var abbr;
     try{  abbr = cricketPref.getPref(cricketMain.PREF_PREFIX + "country", "char");}
     catch(e){ }     
     if(abbr){
       cricketTeam.setSelectedCountryTheme(abbr);
     }
     else{
       abbr = cricketTeam.getDefaultTheme();
       cricketPref.setPref(cricketMain.PREF_PREFIX + "country", abbr, "char");
       cricketTeam.setSelectedCountryTheme(abbr);
     }

     cricketMain.showOSSpecificTeamSelectElement();

     //setup the menu	
     var inCricket = cricketMain.checkCricketLoginStatus();
     if(inCricket) {
       if(!cricketMain.inCricketUIState)
         cricketObserver.notify(null, "cricket:cricket-loggedIn", "");      
     }
     else{
       if(cricketMain.inCricketUIState)
         cricketObserver.notify(null, "cricket:cricket-loggedOut", "");      
     }
    
     /**  stop getting the wc ddata anymore
     //start getting the WC server data
     cricketWCServerService.getAvailServerQueries();
     **/
     
     //only open side bar if there is only one window
     var winCounter = 0;
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                          .getService(Components.interfaces.nsIWindowMediator);                               
     var enumerator = wm.getEnumerator("navigator:browser");
     while(enumerator.hasMoreElements()) {
	enumerator.getNext();
	winCounter++;
     }     
     if(winCounter == 1){
        cricketMain.displaySideBarOnStartUp();
        setTimeout(function(){ cricketExtension.onUpdateCheck(cricketMain.EXT_GUID); }, 2000); 
     }
     
     //compare the last update time with current time every 10 mins
     setInterval(function(){
     	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
     		.getService(Components.interfaces.nsIWindowMediator);                               
     	var mrw = wm.getMostRecentWindow("navigator:browser");
     	if(mrw == window){
     	  cricketExtension.onUpdateCheck(cricketMain.EXT_GUID);
     	}}, 600000);  //10 mins
   },
   
   closeDown : function(){
     
     cricketObserver.unregister();     
   },
   

   /* toolbar button */      
   showButton : function(aBool){

     if(aBool)   
       this.addButton();
     else
       this.removeButton();
   },
   
   hasButton : function(aId){
   
     var toolbox = document.getElementById("navigator-toolbox");
     var toolboxDocument = toolbox.ownerDocument;
     var toolbar;
     for (var i = 0; i < toolbox.childNodes.length; ++i) {
       toolbar = toolbox.childNodes[i];
       if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable")=="true") {
    		
     	 if(toolbar.currentSet.indexOf(aId) != -1){

    	 return true;   
     	 }	
       }
     }
   
   return false;
   },
   
   addButton : function(){
     
     var buttonId = "cricket-tbbutton";
     
     if(this.hasButton(buttonId))
       return;
     
     var toolbar;
     var toolbox = document.getElementById("navigator-toolbox");
     var toolboxDocument = toolbox.ownerDocument;
     var hasButton = false;
     for (var i = 0; i < toolbox.childNodes.length; ++i) {
     
       toolbar = toolbox.childNodes[i];
       if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable") == "true"
       		&&  toolbar.id == "nav-bar") {
    					
    	 var newSet = "";
    	 var child = toolbar.firstChild;
    	 while (child) {
    		   	   
    	   if (!hasButton && child.id == "urlbar-container") {
    	      newSet += buttonId + ",";
    	      hasButton = true;
    	   }
    	   	   
	   newSet += child.id + ",";
    	   child = child.nextSibling;
    	 }
    		
    	 newSet = newSet.substring(0, newSet.length-1);
    	 toolbar.currentSet = newSet;
    		
    	 toolbar.setAttribute("currentset", newSet);
    	 toolboxDocument.persist(toolbar.id, "currentset");
    	 BrowserToolboxCustomizeDone(true);

    	break; 
       }
    }
   
   return;
   },

   removeButton : function(){
     
     var buttonId = "cricket-tbbutton";
     
     var toolbox = document.getElementById("navigator-toolbox");
     var toolboxDocument = toolbox.ownerDocument;
     var toolbar;
     for (var i = 0; i < toolbox.childNodes.length; ++i) {
       toolbar = toolbox.childNodes[i];
       if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable")=="true") {
    		
     	 if (toolbar.currentSet.indexOf(buttonId) != -1) {

    	   var foundButton = false;
    	   var newSet = "";
    	   var child = toolbar.firstChild;
    	   while (child) {
    		   	   
    	     if (child.id == buttonId)
    	        foundButton = true;
    	     else
	       newSet += child.id + ",";
    	     
    	     child = child.nextSibling;
    	   }
    		
    	   if (foundButton) {    	   
    	     
    	     newSet = newSet.substring(0, newSet.length-1);
    	     toolbar.currentSet = newSet;
    		
    	     toolbar.setAttribute("currentset", newSet);
    	     toolboxDocument.persist(toolbar.id, "currentset");
    	     BrowserToolboxCustomizeDone(true);
	 
	   break;
	   }
       	 }	
       }
     }
        
   return;
   },

   /* modify default toolbox customize done */
   modifyToolboxCustomizeDone : function() {
     
     if(this.modifyCustomizeDone)
       return;
     
     var toolbox = document.getElementById("navigator-toolbox"); 
     eval('toolbox.customizeDone ='+toolbox.customizeDone.toString().replace('window.focus();', 
     'cricketTeam.setItemsTranslucent();\
      window.focus();'));

     this.modifyCustomizeDone = true;
   },
   
   /* setup css for toolbar button on different OS */
   setOSSpecificCSS : function(){
     
     var platform = cricketComm.getPlatform();
     
     var isVersionTwo = (cricketComm.getAppVersionNum()).indexOf("2.") == 0;
     //XXX: remove toolbox css to fixed the theme problem
     if (isVersionTwo) { 
       if (platform == "mac" || platform == "nix") {
         this.removeToolboxCSS();
       }
     }  
     
     var docStyleSheets =  document.styleSheets;    
     if (platform == "mac" && !isVersionTwo) {
               
       for (var i = 0; i < docStyleSheets.length; i++) {
                  
         if (docStyleSheets[i].href=="chrome://cricket/skin/os.css")
           docStyleSheets[i].disabled = true;
         else if(docStyleSheets[i].href=="chrome://cricket/skin/os_mac.css")
           docStyleSheets[i].disabled = false;
       }   
     }
     else {
       
       for (var i = 0; i < docStyleSheets.length; i++) {
      
         if (docStyleSheets[i].href == "chrome://cricket/skin/os_mac.css")
           docStyleSheets[i].disabled = true;
           else if (docStyleSheets[i].href == "chrome://cricket/skin/os.css")
           docStyleSheets[i].disabled = false;
       }
     }         
   },
 
   removeToolboxCSS : function() {
    
     var removedToolboxRule = false;
     var removedToolbarRule = false;
     var removedToolbarMenubarRule = false;
     
     for (var i=0; i < document.styleSheets.length; i++) {
      
       if (document.styleSheets[i].href == "chrome://global/skin/toolbar.css") {
      
         var rules = document.styleSheets[i].cssRules;
         var rulesLen = rules.length;
         for (var j=0; j < rulesLen; j++) {
          
           var selectorText = rules[j].selectorText;
           if (!selectorText) {
             continue;
           }
          
           if (selectorText == "toolbox") {
             document.styleSheets[i].deleteRule(j);
             removedToolboxRule = true;
           break;
           }           
         }

         var rules = document.styleSheets[i].cssRules;
         var rulesLen = rules.length;
         for (var j=0; j < rulesLen; j++) {
          
           var selectorText = rules[j].selectorText;
           if (!selectorText) {
             continue;
           }
           
           if (selectorText == "toolbar") {
             document.styleSheets[i].deleteRule(j);
             removedToolbarRule = true;
           break;
           }         
         }

         var rules = document.styleSheets[i].cssRules;
         var rulesLen = rules.length;
         for (var j=0; j < rulesLen; j++) {
          
           var selectorText = rules[j].selectorText;
           if (!selectorText) {
             continue;
           }
           
           if (selectorText.indexOf('toolbar[type="menubar"]') !=-1) {
             if (rules[j].style.MozAppearance == "menubar") {
               document.styleSheets[i].deleteRule(j);
               removedToolbarMenubarRule = true;
             }

           break;
           }
         }
       

         if (removedToolboxRule) {
           document.styleSheets[i].insertRule("toolbox { -moz-appearance:none; }", 1);
         }
     
         if (removedToolbarRule) {
           document.styleSheets[i].insertRule("toolbar { -moz-appearance:none; min-width: 1px; min-height: 19px;}", 1);
         }
         
         if (removedToolbarMenubarRule) {
           document.styleSheets[i].insertRule("menubar { -moz-appearance:menubar; min-width: 1px; min-height: 19px;}", 1);
         }

       return;
       }    
     }
     
   },
   
   showOSSpecificTeamSelectElement : function() {
  
     var platform = cricketComm.getPlatform();
     var docStyleSheets =  document.styleSheets; 
     if (platform == "mac") {

       var btn = document.getElementById("cricket-tbb-flag-button");
       if(btn)
	   btn.setAttribute("hidden", true);
    
       var btn = document.getElementById("cricket-sbb-flag-button");
       if(btn)
          btn.removeAttribute("hidden");
     
     }
     else {

	var btn = document.getElementById("cricket-tbb-flag-button");
	if(btn)
	   btn.removeAttribute("hidden");
    
       var btn = document.getElementById("cricket-sbb-flag-button");
       if(btn)
          btn.setAttribute("hidden", true);
     }
     
   },
           
   /* team selection */
   onSelectCountryPref : function(event, ctry) {
      
     var target = event.target;
     cricketTeam.setCountrySelection(target, ctry);
     cricketPref.setPref(this.PREF_PREFIX+"country", ctry, "char");
   },
    
   onPopupShowingCountryPref : function(event){
     
     var target = event.target;
     var ctry = cricketPref.getPref(this.PREF_PREFIX+"country", "char");
     cricketTeam.setCountrySelection(target, ctry);
   },
    
   /* floating box */
   /*****
   onTabNodeInserted : function(event) {
   
     if (event.target == null || event.target.localName != "tab")
       return;
   },
   *****/
   
   onTabSelect : function(event) {
   
     if (event.target == null || event.target.localName != "tabs")
       return;
     
     var elt, newElt;
     var windowElt = document.getElementById("main-window");
     for(var i=0; i< cricketMain.floatElementIds.length; i++) {
     
       elt = document.getElementById(cricketMain.floatElementIds[i]);
       if(!elt)
         continue;
       
       newElt = elt.cloneNode(true);
       windowElt.removeChild(elt);
     
       if (newElt.hidden)
         newElt.hidden = true;
     
       windowElt.appendChild(newElt);
     }
   },
   
   toggleElementVisibility : function(aId){
   
     var elt = document.getElementById(aId);
     if(elt.getAttribute("hidden"))
       elt.removeAttribute("hidden");
     else
       elt.setAttribute("hidden", true);
   },

   setElementVisibility : function(aId, show){
     
     var elt = document.getElementById(aId);
     if(!elt)
       return;

     if(show)
       elt.removeAttribute("hidden");
     else
       elt.setAttribute("hidden", true);
   },
   
   setMatchNotificationPosition : function() {

     var pad = document.getElementById("cricket-match-note");   
     var statusbar = document.getElementById("status-bar");
     if (statusbar) {
       
       totalHeight = statusbar.boxObject.height;
       pad.style.bottom = (totalHeight - 1) + "px";

     return;  
     }
   },
   
   onContentLoaded : function(event){

     var doc = event.originalTarget;
     var href = doc.location.href;
          
     if(href.indexOf("cricket.com") == -1)
       return true;
       
     var inCricket = cricketMain.checkCricketLoginStatus();
     if(inCricket) {
     
       if(!cricketMain.inCricketUIState){

         //notify other window instances to update login status
         cricketObserver.notify(null, "cricket:cricket-loggedIn", "");      
       }

     }
     else{

       if(cricketMain.inCricketUIState){
       
         //notify other window instances to update login status
         cricketObserver.notify(null, "cricket:cricket-loggedOut", "");      
       }
     }
   
   return true;
   },
   
   checkCricketLoginStatus : function(){
     
     var domain  = ".cricket.com";
     var name    = "orkut_state";
     
     var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"]
        				.getService(Components.interfaces.nsICookieManager); 
     var iter = cookieManager.enumerator; 
     while (iter.hasMoreElements()){ 
      
        var cookie = iter.getNext(); 
        if (cookie instanceof Components.interfaces.nsICookie){ 
           if (cookie.host == domain && cookie.name == name){
                //dump(cookie.name+":"+cookie.value+"\n");
                return true;
           break;     
           }; 
        } 
     }
     
     return false;
   },
     
   displaySideBarOnStartUp: function(){
   
     var bool = cricketPref.getPref(cricketMain.PREF_PREFIX+"sidebar.startup", "bool");
     if(bool){
       this.showSideBar();
     }
   },
   
   showSideBar : function() {
   
     toggleSidebar("viewCricketSidebar", true);
   
   },
   
   loadRefLink : function (event, aRef, aMouseClick){

     var url = cricketLinks[aRef];
     if(!url)
       return;
       
     if(event.target.getAttribute("disabled") != true && event.target.getAttribute("disabled") != "true")
       this.loadLink(event, url, aMouseClick);
   },
   
   loadLink : function (event, url, aMouseClick) {
   
     var browser = document.getElementById("content");
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
}

var cricketTeam = {

  getDefaultTheme : function() {
    
     switch (navigator.language) {
      case "cs":	abbr = "cze"; break;
      case "en-GB":	abbr = "eng"; break;
      case "de":        abbr = "ger"; break;      
      case "fr":        abbr = "fra"; break;
      case "ko":	abbr = "kor"; break;
      case "pt-BR":     abbr = "bra"; break;
      case "it":        abbr = "ita"; break;
      case "ja":        abbr = "jpn"; break;
      case "ja-JP-mac": abbr = "jpn"; break;
      case "nl":	abbr = "ned"; break;
      case "pl":	abbr = "pol"; break; 
      case "es-ES":	abbr = "esp"; break; 
      case "sv-SE":	abbr = "swe"; break;
      default:          abbr = "default";
     }
   
  return abbr;
  },

  setCountrySelection : function(aElt, ctry){

    var menupopup = aElt;  
    if(menupopup) {    
          
      var menuitems = menupopup.getElementsByTagName("menuitem");
      var menuitem, id, index, itemCtry;
      for(var i = 0; i < menuitems.length; i++ ) {
        menuitem = menuitems[i];
        id = menuitem.id;
        index = id.lastIndexOf("-");
        itemCtry = id.substring(index+1);
        if(ctry == itemCtry)
          menuitem.setAttribute("checked", true);
        else  
          menuitem.setAttribute("checked", false);
      }
    }  
  },
  
  /* set the actually theme */  
  setSelectedCountryTheme : function(abbr) {

    var elts = document.getElementsByAttribute("class", "cricket-flag-image");
    for (var i=0; i < elts.length; i++)
       elts[i].src = "chrome://cricket/skin/flag-"+ abbr +".png";
    
    
    var bgRepeat = "no-repeat !important";
    var bgPosition = "top right !important";
    var bgColor = "transparent !important";


    var btn = document.getElementById("cricket-tbb-flag-button");
    if(btn)
      btn.style.listStyleImage="url('chrome://cricket/skin/flag-"+ abbr +".png')";
    
    var btn = document.getElementById("cricket-sbb-flag-button");
    if(btn)
      btn.style.listStyleImage="url('chrome://cricket/skin/mac-flag-"+ abbr +".gif')";
    
    //toolbars
    var mwindow = document.getElementById("main-window");
    mwindow.style.MozAppearance = "none !important";
    mwindow.style.backgroundImage = "url('chrome://cricket/skin/tbox-"+ abbr + ".jpg') !important";
    mwindow.style.backgroundRepeat = "no-repeat !important";
    mwindow.style.backgroundPosition = "top right !important"; 

    elts = document.getElementsByTagName("toolbar");
    for(var i=0; i < elts.length; i++) {
      elts[i].style.MozAppearance = "none !important";
      elts[i].style.backgroundImage = "none !important";
      elts[i].style.backgroundColor = "transparent !important";
    }

    var elt = document.getElementById("navigator-toolbox");
    if(elt) {
      elt.style.MozAppearance = "none !important";
      elt.style.backgroundColor = "transparent !important";
      elt.style.borderTop ="0px !important"
    } 

    //status-bar	 
    elts = document.getElementsByTagName("statusbarpanel");
    for(var i=0; i < elts.length; i++) {
      elts[i].style.MozAppearance = "none !important";
      elts[i].style.borderTop ="0px !important"
      elts[i].style.borderBottom ="0px !important"
    }

    elt = document.getElementById("status-bar");
    if(elt) {
      elt.style.MozAppearance = "none !important";
      elt.style.backgroundImage = "url('chrome://cricket/skin/stbar-"+ abbr + ".jpg') !important";      
      elt.style.backgroundRepeat = "no-repeat !important";
      elt.style.backgroundPosition = "top left !important"; 
      elt.style.backgroundColor = "transparent !important";
      elt.style.borderTop ="0px !important";
      elt.style.borderBottom ="0px !important";    
    }
    
    if(cricketComm.getPlatform() == "mac") {
      var tabbrowser = document.getElementById("content");
      var tabContainer = tabbrowser.mTabContainer;
      if(tabContainer) 
         tabContainer.style.background = "transparent !important";
      var tabStrip = tabbrowser.mStrip;
      if(tabStrip){
         tabStrip.style.MozAppearance = "none !important" 
      }
    }
    
    this.setItemsTranslucent(); 
  },
  
  setItemsTranslucent : function() {
  
    var urlbar = document.getElementById("urlbar");
    if (urlbar) {
       urlbar.style.opacity = "0.85";
    }
    
    var searchbar = document.getElementById("searchbar");
    if (searchbar) {
      searchbar.style.opacity = "0.85";
    }
  }  
}

var cricketObserver = {
  
  _topics : ["em-action-requested", "cricket:cricket-loggedIn", "cricket:cricket-loggedOut"],    

  _branch: null,

  _os : null,
  
  register : function() {
    
    this._os = Components.classes["@mozilla.org/observer-service;1"]
                                      .getService(Components.interfaces.nsIObserverService);
    for(var i = 0; i < this._topics.length; i++) 
      this._os.addObserver(this, this._topics[i], false);
      
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);
    this._branch = prefService.getBranch(cricketMain.PREF_PREFIX);
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    //this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this._branch.addObserver("", this, false);
      
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
    
    if(this._branch)
     this._branch.removeObserver("", this, false);

  },
  
  observe : function(aSubject, aTopic, aData){
  
     switch(aTopic){
        case "em-action-requested":

  	  //"item-installed",
	  //"item-upgraded",
	  //"item-uninstalled",
	  //"item-enabled",
	  //"item-disabled",
	  //"item-cancel-action",
	  
	  if(aData == "item-uninstalled"){

  	    var subject = aSubject.QueryInterface(Components.interfaces.nsIUpdateItem); 
  	    if(subject.id == cricketMain.EXT_GUID) {
	       dump("Say bye bye!\n");
	       //clear the preferences	  					
  	    }
  	  }
  	  else if(aData == "item-upgraded") {

  	    var subject = aSubject.QueryInterface(Components.interfaces.nsIUpdateItem); 
  	    if(subject.id == cricketMain.EXT_GUID) {

  	    }
  	  }
        break;
        case "cricket:cricket-loggedIn":
        
          cricketMain.inCricketUIState = true;
          document.getElementById("cricket-cricketFeatures").removeAttribute("disabled");
          document.getElementById("cricket-cricketLogin").setAttribute("disabled", true);
          
        break;
        case "cricket:cricket-loggedOut":
        
          cricketMain.inCricketUIState = false;
          document.getElementById("cricket-cricketFeatures").setAttribute("disabled", true);
          document.getElementById("cricket-cricketLogin").removeAttribute("disabled");
          
        break;
     }
     
    if(aTopic != "nsPref:changed") return;
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)
    switch (aData) {
      case "country": 

        var abbr;
        try{  abbr = cricketPref.getPref(cricketMain.PREF_PREFIX + "country", "char");}
        catch(e){ }
        if(abbr){
          cricketTeam.setSelectedCountryTheme(abbr);
        }
        else{
          abbr = cricketTeam.getDefaultTheme();
          cricketPref.setPref(cricketMain.PREF_PREFIX + "country", abbr, "char");       
          cricketTeam.setSelectedCountryTheme(abbr);
        }
       
      break;
      case "statusbar.showLiveMatches":
      
        var panel = document.getElementById("cricket-match-statusbarpanel");
        var mhlpanel = document.getElementById("cricket-matchhl-statusbarpanel");
        var bool = cricketPref.getPref(cricketMain.PREF_PREFIX+"statusbar.showLiveMatches", "bool");
        if(bool) {
          //only display if there is a live match 
          if(cricketWCServerService.hasLiveMatches()) {
            panel.removeAttribute("hidden");
          }  
          else {
	    cricketWCServerService.displayLastMatch(true);
          }  
        }  
        else{ 
          if(panel.getAttribute("hidden")) {
            //do nothing
          }
          else {
            cricketWCServerService.showMatchNote(false);
            panel.setAttribute("hidden", true);    
          }
	  
          if(mhlpanel.getAttribute("hidden")) {
            //do nothing
          }
          else {
	    cricketWCServerService.showLastMatchNote(false);
            cricketWCServerService.displayLastMatch(false);
          }

        }  
      break;
    }
     
  },
  
  notify : function(aSubject, aTopic, aData) {
  
     Components.classes["@mozilla.org/observer-service;1"]
		 .getService(Components.interfaces.nsIObserverService)
	      	         .notifyObservers(aSubject, aTopic, aData);      
  }
  
}

var cricketWCServerService = {
   
   _serverPath : "http://desktopservices.google.com/sports?query=",
   
   _queryItems : [],

   _liveMatchErrorRetry : 0,

   todayMatches : [],

   liveMatches : [],
   liveMatchesEventTracker :[],

   _displayedLiveMatch : false,
   lastMatch : { },
   lastMatchInfo : { starttime: 0, id: "" },
   
   futureMatches : [],
   
   _autoCloseNoteTimeoutId : 0,
   
   
   _stoppedFeedQueries : [],  //store team feed queries

   getAvailServerQueries : function(norepeatcall) {
   
     new cricketXMLHttpRequest(this._serverPath+"getAllTeams", this.getAvailServerQueriesReturn, this.getAvailServerQueriesError, { norepeatcall:norepeatcall }, this, true);
   },

   getAvailServerQueriesReturn : function(event) {

     dump("====> Return all available queries \n")
     
     var callObj = event.target._callObj;
     var extraParams = event.target._extraParams;
     
     var responseXML = event.target.responseXML;
     //var responseText = event.target.responseText;    
     
     var nodeName;
     try{
       nodeName = responseXML.documentElement.localName.toLowerCase();
     }
     catch(e){}
     
     if(!nodeName || nodeName != "toplevel") {
  
        dump("Server Querues Error (Incorrent tag) - back 15 mins later\n");
        setTimeout(function() { cricketWCServerService.getAvailServerQueries(); }, 900000);  // 15 minutes
     
     return;
     }
     
     if(nodeName == "toplevel") {

        var errors = responseXML.getElementsByTagName("error"); 
	if(errors.length > 0){ 

          var refreshrate = responseXML.documentElement.getAttribute("RefreshRate");
          if(!refreshrate || (refreshrate.length > 0 && isNaN(parseInt(refreshrate)) )) {
 	    refreshrate = 900000;
 	  }
 	  else {
 	    refreshrate = parseInt(refreshrate);   
 	  }

          dump("Server Querues Error (Error Tag) "+ parseInt(refreshrate/60000) + "\n");
          setTimeout(function() { cricketWCServerService.getAvailServerQueries(); }, refreshrate);
          
        return;
        }  
     }
     
     var item, inQueryList;
     var items =  responseXML.getElementsByTagName("item");
     for (var i=0; i < items.length; i++) {
         
       item = items[i];
         
       var childNode;
       var type = "", query = "";
       for (var j=0; j < item.childNodes.length; j++) {
           
         childNode = item.childNodes[j];         
         if (childNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE){
            if(childNode.nodeName == "type") {
              type = childNode.getAttribute("data");
            }  
	    else if(childNode.nodeName == "query") {
	      query = childNode.getAttribute("data");
	    }  
         }  
       }
       
       //if it is not in the list
       //add it and fire the getMatches function
       inQueryList = false;
       for (var k=0; k < callObj._queryItems.length; k++) {
               
         if (callObj._queryItems[k].type == type && 
           callObj._queryItems[k].query == query){                 
           inQueryList = true;                 
         break;  
         }
       } 
	  
       if (!inQueryList) {
          callObj._queryItems.push({type: type, query:query});
            
	  if (type == "team") {
      	     if (!extraParams.norepeatcall)
	       callObj.getMatches(type, query);
	  }   
       }  

     }
     
     if (!extraParams.norepeatcall)
       setTimeout(function() { cricketWCServerService.getAvailServerQueries(); }, 3600000);  // 1 hour
     else
       callObj.reloadAllMatches();
   },

   getAvailServerQueriesError : function(event) {
     
     dump("AvailServer Error \n");
     setTimeout(function(){ cricketWCServerService.getAvailServerQueries(); }, 900000);   // 15 minutes
   },
   
   /*** reload from sidebar***/
   reloadAllAvailServerQueries : function() {

     this.getAvailServerQueries(true);
   },
   
   reloadAllMatches : function() {
     
     var type, query;
     for (var i=0; i < this._queryItems.length; i++) {
        
       type = this._queryItems[i].type;   
       query = this._queryItems[i].query;
       if (type == "team")      
 	 this.getMatches(type, query);
     } 
   
   },
   
   /*** get -48+96 hours matches ***/
   getMatches : function(type, query, norepeatcall) {
     
     //always set the last refresh rate as 15 mins when we first call the feed
     new cricketXMLHttpRequest(this._serverPath+encodeURIComponent(query), this.getMatchesReturn, this.getMatchesError, { type:type, query: query, norepeatcall:norepeatcall, lastrefreshrate:900000 }, this, true);
   },

   /***** matches ****/
   getMatchesReturn : function(event) {

     var callObj = event.target._callObj;
     var extraParams = event.target._extraParams;
     
     dump(event.target._url+"\n");
     
     var responseXML = event.target.responseXML;
     //var responseText = event.target.responseText;    
     
     var nodeName;
     try{
       nodeName = responseXML.documentElement.localName.toLowerCase();
     }
     catch(e){}
     
     if(!nodeName || nodeName != "toplevel") {
     
       if(!extraParams.norepeatcall) {

         if(extraParams.lastrefreshrate) {
           dump("error(not found) - use last refresh rate " + parseInt(extraParams.lastrefreshrate/60000) + "\n");
         }
	 else {
	   dump("error(not found) - come back 15 mins later\n");
	   extraParams.lastrefreshrate = 900000;
	 }       
         setTimeout(function(extraParams){ new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(extraParams.query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, extraParams, cricketWCServerService, true); }, extraParams.lastrefreshrate, extraParams);
       }  
     
     return;
     }
     
     if(nodeName == "toplevel") {

        var errors = responseXML.getElementsByTagName("error"); 
	if(errors.length > 0){ 
	
          if(!extraParams.norepeatcall) {
          
            var refreshrate = responseXML.documentElement.getAttribute("RefreshRate");
            if(!refreshrate || (refreshrate.length > 0 && isNaN(parseInt(refreshrate)) )) {
 	      if(extraParams.lastrefreshrate){
                 dump("error(error data tag) - use last refresh rate" + parseInt(extraParams.lastrefreshrate/60000) + "\n");
 	      }
 	      else{
                 dump("error(error data tag) - come back 15 mins later\n");
 	         extraParams.lastrefreshrate = 900000;
 	      }
 	    }
 	    else{
 	      extraParams.lastrefreshrate = parseInt(refreshrate);
 	      dump("error(error data tag) - use refresh rate from feed " + parseInt(extraParams.lastrefreshrate/60000) + "\n");
 	    }
          
	    setTimeout(function(extraParams){ new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(extraParams.query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, extraParams, cricketWCServerService, true); }, extraParams.lastrefreshrate, extraParams);
	  }  
	
	return;
	}	
     }
		
     var refreshrate = responseXML.documentElement.getAttribute("RefreshRate");
     if(!refreshrate || (refreshrate.length > 0 && isNaN(parseInt(refreshrate)) )) {
        //should not get to here     
        if(extraParams.lastrefreshrate)
           refreshrate = extraParams.lastrefreshrate;
	else
	   refreshrate = 900000;
     }
     else {
       refreshrate = parseInt(refreshrate);
     }

     //set the last refresh rate
     extraParams.lastrefreshrate = refreshrate;
     
     var hasOnGoingMatch = false;
     var hasFutureMatch = false;
	
     //get the local time in UTC timezone
     var localTime = cricketComm.getUnixTimestamp();

     //get all the matches
     var lastGames = responseXML.getElementsByTagName("lastgame");
     var schedules = responseXML.getElementsByTagName("schedules");	
	
     var allGames = [lastGames, schedules];
		
     var startTime, sTime, children, child, fromTime, toTime, match, removed;
     
     //bug: ping only one feed team instead of two during a live game
     var mQuery;
     var stopCall = false;
     
     while(allGames.length > 0) { 
          
       games = allGames.pop();
       if (games.length) {
	    
  	 for (var i = 0; i < games.length; i++) {
    
           isTodaysMatch = true;

      	   children = games[i].childNodes
             
           startTime = games[i].getElementsByTagName("starttime");
           if(startTime.length == 0)
              continue;            

           //get all the matches -48+96 hours
           sTime = parseInt(startTime[0].getAttribute("int"))*1000;
            
           fromTime = localTime - 172800000;  //48hrs in the past
           toTime = localTime + 345600000;    //96hrs hours in the future

           //smaller than from time or bigger than to time, return
           if(fromTime > sTime || sTime > toTime) {
             isTodaysMatch = false;
           }

	   match = callObj.getGameInfoFromNode(children, extraParams);

	   //we need to do a check if it is already exist, updates it, otherwise push it in.
	   //therefore, we need to give it a ID and append a last update time to it
	   if (isTodaysMatch) {

	      var updated = false;
	      match.lastupdatetime = cricketComm.getUnixTimestamp();
	      for (var j=0; j < callObj.todayMatches.length; j++) {
	      	 
	     	if (callObj.todayMatches[j].id == match.id) {

		  //if the game finished and we know that it has finished already
		  if((callObj.todayMatches[j].gamestatus == 3 || callObj.todayMatches[j].gamestatus == 3) 
		  	&&  (match.gamestatus == 3 || match.gamestatus == 4)) {
		    
		    //bug fix - we do not normally update the array when the game has ended but that is for penallty goal purpose
		    callObj.todayMatches[j] = match;
		  }
		  else if(callObj.todayMatches[j].gamestatus == 1 && match.gamestatus == 2) {
   	            // displayGameStartEvent
		    callObj.todayMatches[j] = match;
		    if(match.timeplayed && (parseInt(match.timeplayed.charAt(0)) == 0 || match.timeplayed.charAt(0) == "0"))
		      callObj.displayLiveMatchEvent(match, "start", true);
		  }
		  else if(callObj.todayMatches[j].gamestatus == 2 && match.gamestatus == 12) {
		    
		    callObj.todayMatches[j] = match;
		    if(match.timeplayed && (parseInt(match.timeplayed.charAt(0)) == 4 || parseInt(match.timeplayed.charAt(0)) == 5)){
		      dump("match.timeplayed...."+match.timeplayed+"\n")
		      callObj.displayLiveMatchEvent(match, "firstHalfEnd", true);
		    }
		    
		  }
		  else if(callObj.todayMatches[j].gamestatus == 12 && match.gamestatus == 2) {
		     
		    callObj.todayMatches[j] = match;
		    if(match.timeplayed && (parseInt(match.timeplayed.charAt(0)) == 4 || parseInt(match.timeplayed.charAt(0)) == 5)) {
  	              dump("sh match.timeplayed...."+match.timeplayed+"\n")
  	              callObj.displayLiveMatchEvent(match, "secondHalfStart", true);
  	            }

		  }
		  else {
		    callObj.todayMatches[j] = match;
		  }
		  		  
		  updated = true;
		
		break;   
	        }
	      }
	        
	      if (!updated) {
	        
	        callObj.todayMatches.push(match);
	      }
	   }

	   if (match.gamestatus == 1 || match.gamestatus == 0) {
	     
	     hasFutureMatch = true;

	     //hold the future game
	     if(callObj.futureMatches.length == 0 || 
	     	(callObj.futureMatches.length > 0 && (callObj.futureMatches[0].starttime > match.starttime || callObj.futureMatches[0].starttime == match.starttime))) {
 	       
 	       if(callObj.futureMatches.length == 0)
 	          callObj.futureMatches.push(match);
 	       else {
 	         
 	         if(callObj.futureMatches[0].starttime > match.starttime) {
 	            callObj.futureMatches = [match];
 	         }
 	         else if(callObj.futureMatches[0].starttime == match.starttime) {
		    
		    //not in list, then push it in
		    var found = false;
		    for (var j = 0; j < callObj.futureMatches.length; j++) {
		       
		       if(callObj.futureMatches[j].id == match.id)
		         found = true;
		    }
		    
		    if(!found) {
   	              callObj.futureMatches.push(match);
		    }
 	         }
 	       }
 	         
 	       
	       if(callObj.liveMatches.length == 0)
	          setTimeout(function(){ cricketWCServerService.displayFutureMatch(); }, 7000); 
	       else
	          callObj.displayLastMatch(false);
	     }	     
	   }
	   else if (match.gamestatus == 2 || match.gamestatus == 12) {
	 
	     if(isTodaysMatch) {
	        callObj._liveMatchErrorRetry = 0;  //reset any error retry;
	        callObj.addLiveMatch(match);
	        hasOnGoingMatch = true;
	        
	        //stop one of team feeds during a live game
	        if(extraParams.type == "team") {
	          mQuery = callObj.getTeamFeedQueryString(match.teamtwo.id); 
	          if(mQuery && mQuery == extraParams.query) {
                    callObj._stoppedFeedQueries.push(extraParams);
	            stopCall = true;
	          }
	        }
	     }
	   }
	   else if(match.gamestatus == 3 || match.gamestatus == 4) {
	   
	     if(isTodaysMatch){
	        removed = callObj.removeLiveMatch(match);
  	      
  	        //update the last game
  	        if(removed){
  	          
  	          callObj._displayedLiveMatch = true;
  	          
  	          //restored stopped team feed after live game	
 	          if(extraParams.type == "team") {
	            mQuery = callObj.getTeamFeedQueryString(match.teamtwo.id); 
	            if (mQuery) {
	            
	              for (var k=0; k < callObj._stoppedFeedQueries.length; k++) {
	                
	                if(callObj._stoppedFeedQueries[k].query == mQuery) {
			  new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(callObj._stoppedFeedQueries[k].query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, callObj._stoppedFeedQueries[k], cricketWCServerService, true);
	  	          dump("_____restore_________end live match_________"+callObj._stoppedFeedQueries[k].query+"\n");
	                  callObj._stoppedFeedQueries.splice(k,1);
	  	        
	  	        break;  
	                } 
	              }
	            }
	          }	          
  	        }
  	        
  	        if(match.starttime > callObj.lastMatchInfo.starttime) {
  	           callObj.lastMatchInfo.starttime = match.starttime;
 		   callObj.lastMatchInfo.id = match.id;
 		   callObj.lastMatch = match;
  	        }
  	        
		//show last game if no live game is avaliable
	       if(callObj.liveMatches.length == 0) {
	          if(callObj._displayedLiveMatch)
	            callObj.displayLastMatch(true);
	          else
	            setTimeout(function(){ cricketWCServerService.displayFutureMatch(); }, 7000);
	       }
	       else {
	          callObj.displayLastMatch(false);
	       }
	       
	     }   
	   }
	 }
       }
     }//end while (allGames.length > 0)
     
     if(extraParams.norepeatcall) {

	dump("===>Call from sidebar\n");
	
       return;
     }
     
     if(stopCall) {
       
       dump("===>Stop this team feed: " + extraParams.query + "\n");
       
       return;
     }
     
     if (hasOnGoingMatch) {
	
	setTimeout(function(extraParams){ new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(extraParams.query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, extraParams, cricketWCServerService, true); }, refreshrate, extraParams);
	dump("_____refresh_________" + parseInt(refreshrate/60000) +"min_____live match_________\n");
     }
     else if (hasFutureMatch){
	   
  	setTimeout(function(extraParams){ new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(extraParams.query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, extraParams, cricketWCServerService, true); }, refreshrate, extraParams);
 	dump("_____refresh_________" + parseInt(refreshrate/60000) +"min_____futurn____\n");  	  
     }
     else {
     
  	setTimeout(function(extraParams){ new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(extraParams.query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, extraParams, cricketWCServerService, true); }, refreshrate, extraParams);
 	dump("_____refresh_________" + parseInt(refreshrate/60000) +"min____no more game____\n");  	       
     }
   },
   
   getTeamFeedQueryString : function(aId) {
   
     for (var i=0; i < cricketServerTeamNamesMap.length; i++) {   
        
       if(aId == cricketServerTeamNamesMap[i].id) {
        
       return cricketServerTeamNamesMap[i].query;
       }
     }
   
   return null;
   },
   
   getMatchesError : function(event) {

     var callObj = event.target._callObj;
     var extraParams = event.target._extraParams;     
     callObj.displayLiveMatchError(extraParams);
     if(extraParams.lastrefreshrate){
       dump("Get match error - use last refresh rate " + parseInt(extraParams.lastrefreshrate/60000) + "\n");
     }
     else{
       dump("get match error - come back 15 mins later\n");
       extraParams.lastrefreshrate = 900000;
     }
     setTimeout(function(extraParams){ new cricketXMLHttpRequest(cricketWCServerService._serverPath+encodeURIComponent(extraParams.query), cricketWCServerService.getMatchesReturn, cricketWCServerService.getMatchesError, extraParams, cricketWCServerService, true); }, extraParams.lastrefreshrate, extraParams);
   },
   
   /* display status error */
   displayLiveMatchErrorWhenInteract : function(){

     if(this._liveMatchErrorRetry > 0) {
     
       document.getElementById("cricket-match-stbar-error").removeAttribute("hidden");
       document.getElementById("cricket-match-stbar").setAttribute("hidden", true);
       this.showMatchNote(false);
       this._liveMatchErrorRetry = 0;
       
     return true;  
     }
   
   return false;
   },
   
   displayLiveMatchError : function(extraParams){

     if(this.hasLiveMatches()) {
     
       var liveMatchId, wcgametype, found;
       outer: for (var i = 0; i < this.liveMatches.length; i++) {
         
         liveMatchId = this.liveMatches[i];
         for (var j = 0; j < this.todayMatches.length; j++) {

           found = false;         
           if(liveMatchId == this.todayMatches[j].id) {
              
              found = true;

	      if(found){
	        if(this._liveMatchErrorRetry == 0) {
	          this._liveMatchErrorRetry = cricketComm.getUnixTimestamp();
	        }
	        
	        dump(this._liveMatchErrorRetry + "-------Live Match Error----------\n");
	        if((this._liveMatchErrorRetry + 180000) < cricketComm.getUnixTimestamp()) {
		  document.getElementById("cricket-match-stbar-error").removeAttribute("hidden");
		  document.getElementById("cricket-match-stbar").setAttribute("hidden", true);
		  this.showMatchNote(false);
		  this._liveMatchErrorRetry = 0;
		}
              break outer;
              }
           }//if 
           
         }//for  
         
       }//for
       
     }//if
   },   
           
   //get game info from a node
   getGameInfoFromNode : function(aNode, extraParams){
      
      var starttime = 0;
      var gamestatus = 0;
      var location = "";
      var teamone = {};
      var teamtwo = {};
      var info = [];
      var wcgametype = null;
      var timeplayed = "00";
      var mtimeplayed, mpos;
      var currentperiod = 0;
      
      var teamonetotal = 0;
      var teamtwototal = 0;
            
      for (var i = 0; i < aNode.length; i++) {
      	    
        child = aNode[i];
    	if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
         
    	  switch (child.nodeName) {
	    
	    case "starttime":
	      try{
	        starttime = parseInt(child.getAttribute("int"))*1000;	        
	      }
	      catch(e){ };
	    break;
	    case "gamestatus":

    	      /***
    	      UNKNOWN = 0,
    	      FUTURE = 1,      // Game is scheduled in the future.
    	      ONGOING = 2,     // Game is ongoing.
    	      OVER = 3,        // Game has finished within 24 hrs.
    	      PAST = 4,        // Game finished more than 24 hrs ago.
    	      POSTPONED = 5,   // Game has been postponed
    	      SUSPENDED = 6,   // Game has been suspended
    	      HALTED = 7,      // Game has been halted
    	      FORFEITED = 8,   // Game has been forfeited
    	      RESCHEDULED = 9, // Game has been reschedueld
    	      DELAYED = 10,    // Game has been delayed
    	      CANCELED = 11,   // Game has been canceled
    	      INTERMISSION = 12, // Game is in the intermission
	      ***/
		
	      try {
	         gamestatus = parseInt(child.getAttribute("int"));
	      } catch (e) { }
	      
            break;
            case "timeremaining":
              
              mtimeplayed = child.getAttribute("data");
              mpos = mtimeplayed.indexOf("+");
              if(mpos != -1) {
                timeplayed = mtimeplayed.substring(0, mpos);
              }
              else {
                timeplayed = mtimeplayed;
              }
              
              timeplayed = cricketComm.appendZeros(timeplayed, 2, "rtl");
              
            break;
	    case "scores":
	      
	      var team = {};
	      var alignment = "";
	      
	      var entities = child.getElementsByTagName("entity");
	      if(entities.length){
	        
	        var entity = entities[0];
	        var entityChild;
	        for (var j = 0; j < entity.childNodes.length; j++) {
	          
	          entityChild = entity.childNodes[j];
	          if (entityChild.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
	        
		     switch(entityChild.nodeName) {
		     
		       case "alignment":
		         team.alignment =  entityChild.getAttribute("data");     
		       break;
		       case "firstname":
		         var foundName = false;
		         team.name = entityChild.getAttribute("data");
		         for(var k=0; k < cricketServerTeamNamesMap.length; k++) {
            	           if(team.id == cricketServerTeamNamesMap[k].id) {
              		     team.abbr = cricketServerTeamNamesMap[k].teamAbbr;
              		     foundName = true;	
             		   break;
            		   } 
          		 }
          		 
          		 if(!foundName)
          		   team.abbr = "unknown";
		         
		       break;
		       case "id":
		         team.id = entityChild.getAttribute("data");
		       break;
		     }
		   
	          }
	        }  	        
	      }
	      
	      var totals = child.getElementsByTagName("total");
	      if (totals.length) {	          
	          team.total = totals[0].getAttribute("int");
	      }
	      
	      var positions = child.getElementsByTagName("position");
	      if (positions.length) {
	          team.position = positions[0].getAttribute("data");
 	      dump("team.position - " + team.position + "\n");	          
	      }
	      
	      team.subscores = [];
	      team.penaltyshootoutscore = "0";
	      var subscores = child.getElementsByTagName("subscores");
	      var subscoresChild;
	      var period, score;
	      for (var j=0; j < subscores.length; j++) {
	         
	        subscore = subscores[j];
	        period = "0", score = "0";
	        for (var k = 0; k < subscore.childNodes.length; k++) {
	          
	          subscoreChild = subscore.childNodes[k];
	          if (subscoreChild.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
	        
		     if(subscoreChild.nodeName == "period") {
		       period = subscoreChild.getAttribute("int");
		     }
		     else if(subscoreChild.nodeName == "score") {
		       score = subscoreChild.getAttribute("int");
		     }
	          }	          	        
	        }
	        
	        team.subscores.push({period: period, score: score});

		//penalty shootouts
		if (subscores.length > 3){
  	          if (parseInt(period) == 4) {
	            team.penaltyshootoutscore = score;	            
	          }  
	        }
	      }

	      if(team.alignment && team.alignment == "home")      
	        teamone = team;
	      else
	        teamtwo = team;
	      
      	    break;
      	    case "currentperiod":
      	      try{
	         currentperiod = child.getAttribute("int");
	       }
	       catch(e){ }
      	    break;
      	    case "eventlocation":
      	    
	      try {
	         location = child.getAttribute("data");
	      } catch (e) { }	        	   
      	    
      	    break;
            case "soccerspecific":
              
              var soccer;
              var soccerinfos = child.getElementsByTagName("soccerinfo");
              for (var j = 0; j< soccerinfos.length; j++) {
		  
	        soccer = {};
	        var soccerinfo = soccerinfos[j];
	        for (var k = 0; k < soccerinfo.childNodes.length; k++) {
	            
	          soccerinfoChild = soccerinfo.childNodes[k];
	          if (soccerinfoChild.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
	        
		    switch (soccerinfoChild.nodeName) {
		     
		      case "infotype":
		        soccer.infotype = soccerinfoChild.getAttribute("int");
		      break;
		      case "playerinfo":
          	  	
          	  	for (var m=0; m < soccerinfoChild.childNodes.length; m++) {
		          if (soccerinfoChild.childNodes[m].nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
          	  	    if (soccerinfoChild.childNodes[m].nodeName == "firstname") {
          	  	        soccer.firstname = soccerinfoChild.childNodes[m].getAttribute("data");
          	  	    }
          	  	    else if(soccerinfoChild.childNodes[m].nodeName == "lastname") {
          	  	        soccer.lastname =  soccerinfoChild.childNodes[m].getAttribute("data");	    
          	  	    }
          	  	  }
          	  	}
          	  	
		      break;
		      case "timeinfo":
		        soccer.timeinfo = soccerinfoChild.getAttribute("data");
		      break;
		      case "teaminfo":
		        soccer.teaminfo = soccerinfoChild.getAttribute("int");
		      break;
		    }   
	          }
	        }
				
		if(parseInt(soccer.infotype) == 3 && (!soccer.timeinfo || soccer.timeinfo.length == 0)) {
		    soccer.timeinfo = "999";  //penalty shoot out;
		}
	        
	        info.push(soccer);
	      }
		              
            break;
         }
       }
     }
     
     var match = {};
     match.starttime = starttime;
     match.gamestatus = gamestatus;
     match.location = location;
     match.teamone = teamone;
     match.teamtwo = teamtwo;
     match.timeplayed = timeplayed;
     match.soccerinfo = info;
     match.id = teamone.id + "." + teamtwo.id;
     match.currentperiod = currentperiod;

     if(starttime < (1151625600 * 1000)) {

        var wcgametypeone, wcgametypetwo;
        for(var i=0; i <cricketServerTeamNamesMap.length; i++ ) {	
     
       	  if(teamone.id == cricketServerTeamNamesMap[i].id) {
            wcgametypeone = cricketServerTeamNamesMap[i].wcgametype;
          break;
          } 
        } 

        for(var i=0; i <cricketServerTeamNamesMap.length; i++ ) {	
     
      	  if(teamtwo.id == cricketServerTeamNamesMap[i].id) {
            wcgametypetwo = cricketServerTeamNamesMap[i].wcgametype;
          break;
          } 
        } 
     
        if(wcgametypeone == wcgametypetwo)       
          match.wcgametype = wcgametypeone;
        else
          match.wcgametype = 8;
            
     } else if(((1151625600 * 1000) < starttime) && (starttime < (1151971200 * 1000))) { 
         //30 June 0:00 < start time < 4 July 0:00
         match.wcgametype = 9;
              
     } else if(((1151971200 * 1000) < starttime) && (starttime < (1152316800 * 1000))) { 
         //4 July 0:00 < start time < 8 July 0:00
         match.wcgametype = 11; 
                
     } else if(((1152316800 * 1000) < starttime) && (starttime < (1152403200 * 1000))) { 
         //8 July 0:00 < starttime < 9 July 0:00
         match.wcgametype = 10; 
             
     } else {
         match.wcgametype = 12;
     }

   return match;
   },
   
   /***** today matches end ****/  
   hasLiveMatches : function() {
   
     if(this.liveMatches.length > 0)
       return true;
     else
       return false;
   },
   
   addLiveMatch : function(match) {

     var matchId = match.id;  
     for (var i=0; i < this.liveMatches.length; i++) {       
       if (this.liveMatches[i] == matchId){
         this.displayLiveMatch(match, true);
         this.storeLiveMatchEvent(match, true);
       return;
       }   
     }
     
     //either a game just starts or 
     //browser is opened during a live game is playing
     this.liveMatches.push(matchId);
     this.displayLiveMatch(match, true);
     this.storeLiveMatchEvent(match, false);
     
     //remove the future game reference
     //as we only display it on browser start so we are not bother
     //to update it
     for (var i = 0; i < this.futureMatches.length; i++ ) {
       
       if(this.futureMatches[i].id == matchId) {
         this.futureMatches = [];
       break;  
       }
     }
   },
   
   removeLiveMatch : function(match) {
     
     var matchId = match.id;
     for (var i=0; i < this.liveMatches.length; i++) {       
       if (this.liveMatches[i] == matchId) {	 
	 this.liveMatches.splice(i,1);
	 this.displayLiveMatch(match, false);
	 this.displayLiveMatchEvent(match, "end", true);     
	 
       return true;	
       }  
     }
   
   return false;
   },
   
   //store the detail of soccer events and show it if necessary
   storeLiveMatchEvent : function(match, showEvent){
     
     //get the last event time and total event num
     var lastEventTime = 0;
     var totalEventNum = 0;
     for (var i=0; i< this.liveMatchesEventTracker.length; i++) {
       
       if (match.id == this.liveMatchesEventTracker[i].id) {
         lastEventTime = this.liveMatchesEventTracker[i].eventTime;
         totalEventNum = this.liveMatchesEventTracker[i].eventNum;
       break;  
       }
     }
     
     //get all the new events
     var newEvents = [];
     var newlastEventTime = lastEventTime;
     var timeInfo;
     if (match.soccerinfo.length != totalEventNum) {
       
       for (var i=0; i< match.soccerinfo.length; i++) {
         
         timeinfo = parseInt(match.soccerinfo[i].timeinfo);
         if (lastEventTime <= timeinfo) {
           newEvents.push(match.soccerinfo[i]);
         }
       
         if (newlastEventTime <= timeinfo) {
           newlastEventTime = timeinfo;
         }
       }
     }
     
     if(newEvents.length > 0) {
     
       var onRecord = false;
       for (var i=0; i< this.liveMatchesEventTracker.length; i++) {
       
         if(match.id == this.liveMatchesEventTracker[i].id) {
           this.liveMatchesEventTracker[i].eventTime = newlastEventTime;
           this.liveMatchesEventTracker[i].eventNum = match.soccerinfo.length;
	   onRecord = true;
         break;  
         }
       }
     
       if(!onRecord) {
         this.liveMatchesEventTracker.push({ id:match.id, eventTime:newlastEventTime, eventNum:match.soccerinfo.length });
       }
     
       if(showEvent) {
         
         //just display one event, it always display the last one in the feed.
         var mTimeInfo, mIndex;
         for (var i=0; i < newEvents.length; i++) {
 	    if(i==0) {
 	      mTimeInfo = parseInt(newEvents[0].timeinfo);
 	      mIndex = 0;
 	    }
 	    else {
 	      if(mTimeInfo <= parseInt(newEvents[i].timeinfo)) {
 	        mTimeInfo = parseInt(newEvents[i].timeinfo);
 	        mIndex = i;
 	      } 	    
 	    }
         }
         
         this.displayLiveMatchSoccerEvent(match, newEvents[mIndex], true);
       }
     }
   },
   
   /* status bar info */   
   displayLiveMatch : function(match, show, forceToShow) {

     //we should not display any error message here
     document.getElementById("cricket-match-stbar-error").setAttribute("hidden", true);
     document.getElementById("cricket-match-stbar").removeAttribute("hidden"); 
          
     var panel = document.getElementById("cricket-match-statusbarpanel");
     if(show) {
     
	if(panel.getAttribute("hidden") || forceToShow) {

           panel.setAttribute("matchId", match.id);
           
           var ctryBundle = document.getElementById("bundle_cricket_countries");
	   
           var teamname = document.getElementById("cricket-match-stbar-teamone-name");
           try{
           teamname.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr));
           }catch(e){}
           
           var teamname = document.getElementById("cricket-match-stbar-teamtwo-name");
           try{
           teamname.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr));
           }catch(e){}
           
           var imageOne = document.getElementById("cricket-match-stbar-flagone");
           imageOne.setAttribute("src", "chrome://cricket/skin/flag-" + match.teamone.abbr + ".png");
           var imageTwo = document.getElementById("cricket-match-stbar-flagtwo");
           imageTwo.setAttribute("src", "chrome://cricket/skin/flag-" + match.teamtwo.abbr + ".png");

           var teams = document.getElementById("cricket-match-stbar-teams");
           if( (match.teamone.subscores && match.teamone.subscores.length > 3) || (match.teamtwo.subscores && match.teamtwo.subscores.length > 3) )
             teams.setAttribute("value", match.teamone.total + "(" + match.teamone.penaltyshootoutscore + ")" + " - " + match.teamtwo.total + "(" + match.teamtwo.penaltyshootoutscore + ")");
           else 
             teams.setAttribute("value", match.teamone.total + " - " + match.teamtwo.total);
           
           var timeplayed = document.getElementById("cricket-match-stbar-timeplayed");
           timeplayed.setAttribute("value", "("+match.timeplayed+"')");
           timeplayed.setAttribute("style", "padding:0px; margin-left:0px;");

           //check the user preference to see whether user wants to display it
	   if(cricketPref.getPref(cricketMain.PREF_PREFIX+"statusbar.showLiveMatches", "bool")) {
               panel.removeAttribute("hidden");
           }
           
           //if live game, also hide the last match statusbar panel
           document.getElementById("cricket-matchhl-statusbarpanel").setAttribute("hidden", true);
       }
       else {
	  
	  var matchId = panel.getAttribute("matchId");
          if(match.id == matchId) {

            var timeplayed = document.getElementById("cricket-match-stbar-timeplayed");
            timeplayed.setAttribute("value", "("+match.timeplayed+"')");
	    timeplayed.setAttribute("style", "padding:0px; margin-left:0px;");
	    
	    //update score
            var teams = document.getElementById("cricket-match-stbar-teams");
            if( (match.teamone.subscores && match.teamone.subscores.length > 3) || (match.teamtwo.subscores && match.teamtwo.subscores.length > 3) )
              teams.setAttribute("value", match.teamone.total + "(" + match.teamone.penaltyshootoutscore + ")" + " - " + match.teamtwo.total + "(" + match.teamtwo.penaltyshootoutscore + ")");
            else
              teams.setAttribute("value", match.teamone.total + " - " + match.teamtwo.total);
          }          
       }

       if(this.liveMatches.length > 1)
          document.getElementById("cricket-match-stbar-switch").removeAttribute("hidden");
       else
          document.getElementById("cricket-match-stbar-switch").setAttribute("hidden", true);
     }
     else {
       
       if(this.liveMatches.length == 0) {
  	 panel.setAttribute("hidden", true);
  	 panel.removeAttribute("matchId");
       }
       else if(panel.getAttribute("matchId") == match.id) {
         //the one is displaying has been removed from the list already
         //but we still have match(es) in the list
         this.switchLiveMatch(match.id);
       }
       
       if(this.liveMatches.length <= 1)
  	 document.getElementById("cricket-match-stbar-switch").setAttribute("hidden", true);
     }
   },
   
   toggleLiveMatch : function (event) {
     
     var panel = document.getElementById("cricket-match-statusbarpanel");
     var matchId = panel.getAttribute("matchId");
     this.switchLiveMatch(matchId);
     
     var note = document.getElementById("cricket-match-note");
     if(!note.getAttribute("hidden"))
       this.rebuildMatchNote();
   },
      
   //display other live match
   switchLiveMatch : function (aMatchId) {

     //show other live match --> not equal to aMatchId
     var otherMatchId;
     for (var i=0; i < this.liveMatches.length ; i++) {
       
       if(i==0) otherMatchId = this.liveMatches[0];
       
       if (this.liveMatches[i] == aMatchId) {
	  if(i < (this.liveMatches.length-1)) {
	      otherMatchId = this.liveMatches[i+1];	  
	  break;
	  }
	  else if(i != 0){
	     otherMatchId =  this.liveMatches[0];
	  break;   
	  }
       }
     }
     
     if(otherMatchId) {
       for (var j=0; j < this.todayMatches.length; j++) {
	      	 
         if (this.todayMatches[j].id == otherMatchId) {
          this.displayLiveMatch(this.todayMatches[j], true, true);
         break;   
         }
       }  
     }	  
   },
  
   /* display future game */
   displayFutureMatch : function() {

     if(cricketWCServerService.futureMatches.length > 0 && cricketWCServerService.liveMatches.length == 0) {
   	cricketWCServerService.displayLastMatch(true);
     }
   },

   toggleFutureMatch : function (event) {
     
     var panel = document.getElementById("cricket-matchhl-statusbarpanel");
     var matchId = panel.getAttribute("matchId");
     this.switchFutureMatch(matchId);
     
     var note = document.getElementById("cricket-match-note");
     if(!note.getAttribute("hidden"))
       this.rebuildLastMatchNote();
   },
      
   //display other live match
   switchFutureMatch : function (aMatchId) {

     //show other live match --> not equal to aMatchId
     var otherMatchId;
     for (var i = 0; i < this.futureMatches.length ; i++) {
       if(i == 0) otherMatchId = this.futureMatches[0].id;
       
       if (this.futureMatches[i].id == aMatchId) {
       	  if(i < (this.futureMatches.length-1)) {
	     otherMatchId = this.futureMatches[i+1].id;
	  break;
	  }
	  else if(i != 0){
	     otherMatchId = this.futureMatches[0].id;
	  break;   
	  }
       }
     }

     if(otherMatchId) {
        var panel = document.getElementById("cricket-matchhl-statusbarpanel");
        panel.setAttribute("matchId", otherMatchId);     
	this.displayLastMatch(true)
     }	  
   },
  
   /* last match alert popup */
   displayLastMatch : function(aBool) {
     
     var panel = document.getElementById("cricket-matchhl-statusbarpanel");
     if(aBool) {

        if(cricketPref.getPref(cricketMain.PREF_PREFIX+"statusbar.showLiveMatches", "bool")) {

          if(this.todayMatches.length > 0 && panel.getAttribute("hidden"))
             panel.removeAttribute("hidden");              

          this.showLastMatchStatusbarItems(true);          
        }    
     }
     else
         panel.setAttribute("hidden", true); 
   },   

   toggleLastMatchNote : function() {
          
     var note = document.getElementById("cricket-match-note");
     var button = document.getElementById("cricket-match-stbar-note-button2");
     if(note.getAttribute("hidden"))
 	this.showLastMatchNote(true);
     else
        this.showLastMatchNote(false);
   },
   
   showLastMatchNote : function(aBool){   

     var note = document.getElementById("cricket-match-note");
     var button = document.getElementById("cricket-match-stbar-note-button2");
     if(aBool) {

       this.rebuildLastMatchNote();
       note.removeAttribute("hidden");
       button.setAttribute("dir", "down");

       //show the status panel as well 
       this.showLastMatchStatusbarItems(true);
     }
     else {
       note.setAttribute("hidden", true);
       button.setAttribute("dir", "up");     
     }
   },
   
   showLastMatchStatusbarItems : function(aBool){
   
     var teamOneName = document.getElementById("cricket-match-stbar-teamone-name2");
     var teamTwoName = document.getElementById("cricket-match-stbar-teamtwo-name2");
     var imageOne = document.getElementById("cricket-match-stbar-flagone2");
     var imageTwo = document.getElementById("cricket-match-stbar-flagtwo2");
     var teams = document.getElementById("cricket-match-stbar-teams2");
     var extraInfo = document.getElementById("cricket-match-stbar-extra-info2");
     var switch2 = document.getElementById("cricket-match-stbar-switch2");

     if (aBool) {

         var ctryBundle = document.getElementById("bundle_cricket_countries");
         var matchBundle = document.getElementById("bundle_cricket_match");
	 
	 var match;
	 if (this._displayedLiveMatch) {
	   match = this.getLastMatch();
	   extraInfo.setAttribute("value", "(" + matchBundle.getString("cricket.match.final.label") + ")");
	   switch2.setAttribute("hidden", true);
	 }
	 else {
	   //show the future game within the next 4 days or an old game
	   //display only when displayedLiveMatch = false and displays showLastMatchNote
	   var matches = this.getFutureMatches();
	   if(matches.length > 0) {
	    
	     //if already has one on panel, check whether it is in the list or not
	     var panel = document.getElementById("cricket-matchhl-statusbarpanel");
	     var matchId = panel.getAttribute("matchId");
	     var found = false;
	     for (var i = 0; i < matches.length; i++) {
 		if (matches[i].id == matchId) {
		   match = matches[i];
		   found = true
 		break;
 		}	     
	     }
	     
	     if(!found){
		match = matches[0];
		panel.setAttribute("matchId", match.id);
	     }	
	    
             var mdate = new Date(match.starttime); 	   
	     extraInfo.setAttribute("value", "(@" + cricketComm.appendZeros((mdate.getHours()).toString(), 2, "rtl") +  ":" + cricketComm.appendZeros((mdate.getMinutes()).toString(), 2) + ", " +matchBundle.getFormattedString("cricket.date." + cricketComm.months[mdate.getMonth()] + ".shortName", [cricketComm.appendZeros((mdate.getDate()).toString(), 2, "rtl")]) + ")");
	    
	     if(matches.length > 1)
	       switch2.removeAttribute("hidden");  
	     else
	       switch2.setAttribute("hidden", true);
	   }
	   else {
	     match = this.getLastMatch();
	     if(match)
	       extraInfo.setAttribute("value", "(" + matchBundle.getString("cricket.match.final.label") + ")");
	   }  
	 }
	 
	 if(match){
	   
	   try{
           teamOneName.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr));
           }catch(e){}
           try{
           teamTwoName.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr));
           }catch(e){}
           imageOne.setAttribute("src", "chrome://cricket/skin/flag-" + match.teamone.abbr + ".png");
           imageTwo.setAttribute("src", "chrome://cricket/skin/flag-" + match.teamtwo.abbr + ".png");
           if ((match.teamone.subscores && match.teamone.subscores.length > 3) || (match.teamtwo.subscores && match.teamtwo.subscores.length > 3))
             teams.setAttribute("value", match.teamone.total + "(" + match.teamone.penaltyshootoutscore + ")" + " - " + match.teamtwo.total + "(" + match.teamtwo.penaltyshootoutscore + ")");
           else
             teams.setAttribute("value", match.teamone.total + " - " + match.teamtwo.total);           

           teamOneName.removeAttribute("hidden");
           teamTwoName.removeAttribute("hidden");
           imageOne.removeAttribute("hidden");
           imageTwo.removeAttribute("hidden");
           teams.removeAttribute("hidden");
           extraInfo.removeAttribute("hidden");
         }  
     }
     else {
         teamOneName.setAttribute("hidden", true);
         teamTwoName.setAttribute("hidden", true);
         imageOne.setAttribute("hidden", true);
         imageTwo.setAttribute("hidden", true);       
         teams.setAttribute("hidden", true);
         extraInfo.setAttribute("hidden", true);         
     }    
   },
   
   rebuildLastMatchNote : function() {
          
     var match;
     if(this._displayedLiveMatch) {
       match = this.getLastMatch();  
       if (match)
         this.displayLiveMatchEvent(match, "end");     
     }
     else {
     
       var matches = this.getFutureMatches();
       if(matches.length > 0) {
         //get the id of which match is displaying
         var panel = document.getElementById("cricket-matchhl-statusbarpanel");
         var matchId = panel.getAttribute("matchId");
         for (var i = 0; i < matches.length; i++) {
            if(matchId == matches[i].id) {
              match = matches[i];
            break;  
            }         
         }
	 
	 if(match)
           this.displayLiveMatchEvent(match, "future");
       }
       else {
         match = this.getLastMatch();
         if(match)
           this.displayLiveMatchEvent(match, "end");     
       }
     }
   
   return match;
   },      

   getLastMatch : function() {
        
   return this.lastMatch;
   },  
   
   /* get future match */
   getFutureMatches : function() {

      var now = cricketComm.getUnixTimestamp();
      if(this.futureMatches.length > 0) {

        if(this.futureMatches[0].starttime < (now + 345600000)) { //4 days
          return this.futureMatches;
        }
      }
      
   return [];
   },  

   /* auto close alert popup */
   clearAutoCloseMatchNote : function() {
   
     clearTimeout(this._autoCloseNoteTimeoutId);
     this._autoCloseNoteTimeoutId = 0;
     
     dump("Clear auto close\n")
   
   },
   
   setAutoCloseMatchNote : function() {
     
     this._autoCloseNoteTimeoutId = setTimeout(function(){cricketWCServerService.showMatchNote(false); dump("Close the Popup now by timer\n") }, 15000); //15 sec
     
     dump("Set auto close\n")
   },
   
   
   /* match alert popup */
   toggleMatchNote : function() {
          
     var note = document.getElementById("cricket-match-note");
     var button = document.getElementById("cricket-match-stbar-note-button");
     if(note.getAttribute("hidden"))
 	this.showMatchNote(true, true);
     else
        this.showMatchNote(false);
   },
   
   showMatchNote : function(aBool, rebuild, systemCall){   

     var note = document.getElementById("cricket-match-note");
     var button = document.getElementById("cricket-match-stbar-note-button");
     if (aBool) {
     
       if (systemCall) {
         
         if (note.getAttribute("hidden") || this._autoCloseNoteTimeoutId != 0) {
         
           this.clearAutoCloseMatchNote();
           this.setAutoCloseMatchNote();
           //dump("system call.show..set\n");
         }
       }
       else {
          //dump("not system call.show..set\n");
	  this.clearAutoCloseMatchNote(); 
       }
     
       if (rebuild)
         this.rebuildMatchNote();
       note.removeAttribute("hidden");
       button.setAttribute("dir", "down");
     }
     else {
       //dump("hide....show..set\n");
       this.clearAutoCloseMatchNote(); 
     
       note.setAttribute("hidden", true);
       button.setAttribute("dir", "up");
     }
   },
   
   rebuildMatchNote : function() {
          
     //get the match Id from the panel 
     var panel = document.getElementById("cricket-match-statusbarpanel");
     var matchId = panel.getAttribute("matchId");

     var match = null;
     var soccerinfo = null;
     var timeinfo;
     var mLastEventTime = 0;
     for (var i=0; i < this.todayMatches.length; i++) {
	      	 
       if (this.todayMatches[i].id == matchId) {
	  
	 match = this.todayMatches[i];
         for (var j=0; j < match.soccerinfo.length; j++) {
         
           timeinfo = parseInt(match.soccerinfo[j].timeinfo);
           if(mLastEventTime <= timeinfo && parseInt(match.soccerinfo[j].infotype) <= 4) {
             mLastEventTime = timeinfo;
             soccerinfo = match.soccerinfo[j];
           }
         }

       break;   
       }
     }
     
     if(match){
       
       if(match.gamestatus == 12) {
         //intermission - we always display alert
         this.displayLiveMatchEvent(match, "firstHalfEnd");
       }
       else if(soccerinfo) {
         this.displayLiveMatchSoccerEvent(match, soccerinfo);
       }
       else {
         this.displayLiveMatchEvent(match, "progress");     
       }
     }  
   },   
   
   displayLiveMatchSoccerEvent : function(match, soccerinfo, systemCall) {

     if(!cricketPref.getPref(cricketMain.PREF_PREFIX+"statusbar.showLiveMatches", "bool"))
        return;
          
     var infotype = parseInt(soccerinfo.infotype);
     if(infotype > 4){
       return;
     }  

     var ctryBundle = document.getElementById("bundle_cricket_countries");
     var matchBundle = document.getElementById("bundle_cricket_match");
     
     var note = document.getElementById("cricket-match-note");
     if(parseInt(soccerinfo.teaminfo) == 0) {
        note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamone.abbr+".jpg') top right no-repeat #E6E5EA;";
     }
     else {
        note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamtwo.abbr+".jpg') top right no-repeat #E6E5EA;";
     }

     var icon = document.getElementById("cricket-match-note-icon");
     var event = document.getElementById("cricket-match-note-event");     
     if(cricketComm.getPlatform() == "mac") {
       event.style.paddingLeft = "3px";
     }
     
     switch (infotype) {

       case 0:
         icon.setAttribute("class", "cricket-match-red-card-32");
         event.setAttribute("value", matchBundle.getString("cricket.match.notification.redCard.label"));  
       break;
       case 1:
 	 icon.setAttribute("class", "cricket-match-yellow-card-32");
	 event.setAttribute("value", matchBundle.getString("cricket.match.notification.yellowCard.label"));         
       break;
       case 2:
	 icon.setAttribute("class", "cricket-match-goal-32");
         event.setAttribute("value", matchBundle.getString("cricket.match.notification.goalScored.label"));         
       break;
       case 3:
	 icon.setAttribute("class", "cricket-match-goal-on-penalty-32");
  	 event.setAttribute("value", matchBundle.getString("cricket.match.notification.goalOnPenalty.label"));         
       break;
       case 4:
	 icon.setAttribute("class", "cricket-match-own-goal-32");
	 event.setAttribute("value", matchBundle.getString("cricket.match.notification.ownGoal.label"));         
       break;
     }
     
     var mdate = new Date(match.starttime);    
     var d1 = document.getElementById("cricket-match-note-d1");
     d1.setAttribute("styleCode", "g");
     try{
     d1.setAttribute("value", matchBundle.getFormattedString("cricket.match.versus.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr), ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr)]));
     }catch(e){}
     /****
     //d1.setAttribute("value", matchBundle.getFormattedString("cricket.match.versus.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr), ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr)])
     //+ " (" + cricketWCServerService.getLocaleVenue(match.location) + ")");
     d1.setAttribute("value", "(" + cricketWCServerService.getLocaleVenue(match.location) + ")");
     *****/
     
     var soccerTeamAbbr;
     if(parseInt(soccerinfo.teaminfo) == 0)
        soccerTeamAbbr = match.teamone.abbr.toUpperCase();
     else
        soccerTeamAbbr =  match.teamtwo.abbr.toUpperCase();

     var d2 = document.getElementById("cricket-match-note-d2");
     d2.setAttribute("styleCode", "b");
     if( ((match.teamone.subscores && match.teamone.subscores.length > 3) || (match.teamtwo.subscores && match.teamtwo.subscores.length > 3)) && soccerinfo.timeinfo == "999")
       d2.setAttribute("value", soccerinfo.firstname + " " + soccerinfo.lastname + " (" + soccerTeamAbbr + ")");
     else  
       d2.setAttribute("value", matchBundle.getFormattedString("cricket.match.notification.playerAtMinutes.label", [soccerinfo.firstname + " " + soccerinfo.lastname + " (" + soccerTeamAbbr+ ")", cricketComm.appendZeros(soccerinfo.timeinfo, 2, "rtl")+"'"]));
     
     //in case, we showed the futurn game info before
     icon.removeAttribute("hidden");
     event.removeAttribute("styleCode");
     d2.removeAttribute("hidden");
     this.hideMatchDetailsBoxExpander(false);    
     
     this.buildMatchDetailsBox(match);
     this.disableMatchDetailsBoxExpander(false);     
     this.showMatchNote(true, false, systemCall);
     
     //ensure that it is displaying the correct status bar teams info
     if(systemCall) {
        var panel = document.getElementById("cricket-match-statusbarpanel");
        var matchId = panel.getAttribute("matchId");
        if (match.id != matchId)
           this.displayLiveMatch(match, true, true);
     }
   },

   displayLiveMatchEvent : function(match, type, systemCall) {
     
     //force - for show last game
     if(!cricketPref.getPref(cricketMain.PREF_PREFIX+"statusbar.showLiveMatches", "bool"))
       return;
            
     var ctryBundle = document.getElementById("bundle_cricket_countries");
     var matchBundle = document.getElementById("bundle_cricket_match");
     var matchExtraBundle = document.getElementById("bundle_cricket_match_extra");
     
     //we show timeone as they are home
     var note = document.getElementById("cricket-match-note");     
     var event = document.getElementById("cricket-match-note-event");
     if(cricketComm.getPlatform() == "mac") {
       event.style.paddingLeft = "3px";
     }     

     var icon = document.getElementById("cricket-match-note-icon");

     var mdate = new Date(match.starttime);        		
     var d1 = document.getElementById("cricket-match-note-d1");
     var d2 = document.getElementById("cricket-match-note-d2");

     //display he expander in case it is hidden
     if(type != "future") {    
       this.hideMatchDetailsBoxExpander(false);
       d2.removeAttribute("hidden");
       event.removeAttribute("styleCode");
       icon.removeAttribute("hidden");
     }  

     if(type == "start") {
     
       note.style.background = "url('chrome://cricket/skin/draw-header.jpg') top right no-repeat #FFFFFF;";
       event.setAttribute("value", matchExtraBundle.getString("cricket.match.notification.matchHasBegun.label"));  

       icon.setAttribute("class", "cricket-match-first-half-start-32");

       d1.setAttribute("styleCode", "b");
       try{
       d1.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr) +  " " + match.teamone.total + " - " + ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr) + " " + match.teamtwo.total);
       }catch(e){}
       
       d2.setAttribute("styleCode", "g");
       d2.setAttribute("value", "");
       /***
       d2.setAttribute("value", "(" + cricketWCServerService.getLocaleVenue(match.location) + ")");
       ***/

       this.showMatchDetailsBox(false);
       this.disableMatchDetailsBoxExpander(true);
     }
     else if(type == "firstHalfEnd" || type == "secondHalfStart") {
     
       var teamOneTotal = parseInt(match.teamone.total);
       var teamTwoTotal = parseInt(match.teamtwo.total)
       if(teamOneTotal == teamTwoTotal){
         //show a special image
         note.style.background = "url('chrome://cricket/skin/draw-header.jpg') top right no-repeat #FFFFFF;";
       }
       else if(teamOneTotal > teamTwoTotal){
         note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamone.abbr+".jpg') top right no-repeat #E6E5EA;";
       }
       else {
         note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamtwo.abbr+".jpg') top right no-repeat #E6E5EA;";     
       }
       
       if (type == "firstHalfEnd") {
         event.setAttribute("value", matchExtraBundle.getString("cricket.match.notification.halfTimeCalled.label"));  
         icon.setAttribute("class", "cricket-match-first-half-end-32");
       }
       else if(type == "secondHalfStart") {
         event.setAttribute("value", matchExtraBundle.getString("cricket.match.notification.secondHalfStarted.label"));         
         icon.setAttribute("class", "cricket-match-second-half-start-32");
       }
       
       d1.setAttribute("styleCode", "b");
       try{
       d1.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr) +  " " + match.teamone.total + " - " + ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr) + " " + match.teamtwo.total);
       }catch(e){}
       
       d2.setAttribute("styleCode", "g");
       d2.setAttribute("value", "");
       /***
       d2.setAttribute("value", "(" + cricketWCServerService.getLocaleVenue(match.location) + ")");
       ***/
       
       var itemNum = this.buildMatchDetailsBox(match);
       if(itemNum > 0) {
         this.disableMatchDetailsBoxExpander(false);
       }
       else {
         this.showMatchDetailsBox(false);       
	 this.disableMatchDetailsBoxExpander(true);  
       }
     }
     else if(type == "end") {

       var teamOneTotal = parseInt(match.teamone.total);
       var teamTwoTotal = parseInt(match.teamtwo.total);

       //penalty shoot out
       var teamOneShootOutTotal, teamTwoShootOutTotal;
       var penaltyGame = false;
       if ((match.teamone.subscores && match.teamone.subscores.length > 3) || 
       		(match.teamtwo.subscores && match.teamtwo.subscores.length > 3)) {
       	 teamOneShootOutTotal = parseInt(match.teamone.penaltyshootoutscore);
	 teamTwoShootOutTotal = parseInt(match.teamtwo.penaltyshootoutscore);
	 penaltyGame = true;
       }
       else {
         teamOneShootOutTotal = 0;
         teamTwoShootOutTotal = 0;
       }
       
       var finalTeamOneTotal = teamOneTotal + teamOneShootOutTotal;
       var finalTeamTwoTotal = teamTwoTotal + teamTwoShootOutTotal;
       
       /***
       if(match.teamone.position && (match.teamone.position == "win" || match.teamone.position == "loss" || match.teamone.position == "tie")) {
         
         dump("Use match teamone position - " + match.teamone.position+ "\n");
       
         if(match.teamone.position == "tie" && match.teamtwo.position == "tie"){
           //show a special image
           note.style.background = "url('chrome://cricket/skin/draw-header.jpg') top right no-repeat #FFFFFF;";
           event.setAttribute("value", matchBundle.getString("cricket.match.notification.finalScore.label"));  
         }
         else if(match.teamone.position == "win"){
           note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamone.abbr+".jpg') top right no-repeat #E6E5EA;";
           try{
           event.setAttribute("value", matchBundle.getFormattedString("cricket.match.notification.teamWins.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr)]));  
           }catch(e){}
         }
         else if(match.teamtwo.position == "win"){
           note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamtwo.abbr+".jpg') top right no-repeat #E6E5EA;";
           try{
           event.setAttribute("value", matchBundle.getFormattedString("cricket.match.notification.teamWins.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr)]));  
           }catch(e){}
         }
       }
       else {
       ***/
         //dump("Use scores to determin who wins \n");
         dump("final score " + finalTeamOneTotal +":" + finalTeamTwoTotal + "\n")
         if(finalTeamOneTotal == finalTeamTwoTotal){
           //show a special image
           note.style.background = "url('chrome://cricket/skin/draw-header.jpg') top right no-repeat #FFFFFF;";
           event.setAttribute("value", matchBundle.getString("cricket.match.notification.finalScore.label"));  
         }
         else if(finalTeamOneTotal > finalTeamTwoTotal){
           note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamone.abbr+".jpg') top right no-repeat #E6E5EA;";
           try{
           event.setAttribute("value", matchBundle.getFormattedString("cricket.match.notification.teamWins.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr)]));  
           }catch(e){}
         }
         else {
           note.style.background = "url('chrome://cricket/skin/tbox-"+match.teamtwo.abbr+".jpg') top right no-repeat #E6E5EA;";
           try{
           event.setAttribute("value", matchBundle.getFormattedString("cricket.match.notification.teamWins.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr)]));  
           }catch(e){}
         }
       
       /***
       }
       ***/

       icon.setAttribute("class", "cricket-match-second-half-end-32");

       d1.setAttribute("styleCode", "b");
       try{
       if(penaltyGame)
         d1.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr) + " " + match.teamone.total + "(" + match.teamone.penaltyshootoutscore + ")" + " - " + ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr) + " " + match.teamtwo.total + "(" + match.teamtwo.penaltyshootoutscore + ")");
       else
         d1.setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr) + " " + match.teamone.total + " - " + ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr) + " " + match.teamtwo.total);
       }catch(e){}
       
       d2.setAttribute("styleCode", "g");
       d2.setAttribute("value", "");
       /***
       d2.setAttribute("value", "(" + cricketWCServerService.getLocaleVenue(match.location) + ")");
       ***/
     
       var itemNum = this.buildMatchDetailsBox(match);
       if(itemNum > 0) {
         this.disableMatchDetailsBoxExpander(false);
       }
       else {
         this.showMatchDetailsBox(false);
	 this.disableMatchDetailsBoxExpander(true);  
       }
     }
     else if(type == "future") {
       
       note.style.background = "url('chrome://cricket/skin/draw-header.jpg') top right no-repeat #FFFFFF;";
       try{
       event.setAttribute("value", matchBundle.getFormattedString("cricket.match.versus.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr), ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr)]));  
       }catch(e){}
       event.setAttribute("styleCode", "s");
       icon.setAttribute("hidden", true);

       d1.setAttribute("styleCode", "b");
       d1.setAttribute("value", "(@" + cricketComm.appendZeros((mdate.getHours()).toString(), 2, "rtl") + ":" + cricketComm.appendZeros((mdate.getMinutes()).toString(), 2) + ", " +matchBundle.getFormattedString("cricket.date." + cricketComm.months[mdate.getMonth()] + ".shortName", [cricketComm.appendZeros((mdate.getDate()).toString(), 2, "rtl")]) + ")");

       this.showMatchDetailsBox(false);
       this.hideMatchDetailsBoxExpander(true);
       document.getElementById("cricket-match-note-d2").setAttribute("hidden", true);

     }
     else {
       note.style.background = "url('chrome://cricket/skin/draw-header.jpg') top right no-repeat #FFFFFF;";
       event.setAttribute("value", matchBundle.getString("cricket.match.notification.gameInProgress.label"));  

       icon.setAttribute("class", "cricket-match-in-progress-32");

       d1.setAttribute("styleCode", "g");
       try{
         d1.setAttribute("value", matchBundle.getFormattedString("cricket.match.versus.label", [ctryBundle.getString("cricket.worldcup.ctry."+match.teamone.abbr), ctryBundle.getString("cricket.worldcup.ctry."+match.teamtwo.abbr)]));
       }
       catch(e){}

       /***
       d1.setAttribute("value", "(" + cricketWCServerService.getLocaleVenue(match.location) + ")");
       ***/

       //hide the box and expander button
       d2.removeAttribute("styleCode");
       d2.setAttribute("value", matchBundle.getString("cricket.match.notification.noHistory.label"));
       d2.setAttribute("styleCode", "b");

       this.showMatchDetailsBox(false);
       this.disableMatchDetailsBoxExpander(true);
     }

     this.showMatchNote(true, false, systemCall);

     //ensure that it is displaying the correct status bar teams info in ongoing game
     if(systemCall && type != "end") {
        var panel = document.getElementById("cricket-match-statusbarpanel");
        var matchId = panel.getAttribute("matchId");
        if (match.id != matchId)
           this.displayLiveMatch(match, true, true);
     }     
   },
   
   /* history box */
   buildMatchDetailsBox : function(match) {

     var matchBundle = document.getElementById("bundle_cricket_match");
     
     var rowsElt = document.getElementById("cricket-match-note-details-rows");
     while (rowsElt.firstChild) {
       rowsElt.removeChild(rowsElt.firstChild);
     }

     var rowElt, hboxElt, mSoccerinfo, mCode, labelElt, imageElt;
     const kXULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";       
     for (var i=0; i< match.soccerinfo.length; i++) {
        
        mSoccerinfo = match.soccerinfo[i];
        rowElt = document.createElementNS(kXULNS, "row");
        rowElt.setAttribute("timeinfo", mSoccerinfo.timeinfo);
        rowElt.setAttribute("align", "center");
        
          labelElt = document.createElementNS(kXULNS, "label");
          if (mSoccerinfo.timeinfo == "999") {           
            labelElt.setAttribute("value", "");
          }
          else {
            labelElt.setAttribute("value", cricketComm.appendZeros(mSoccerinfo.timeinfo, 2, "rtl")+"'");          
          }
        rowElt.appendChild(labelElt);
        
        try{
          var mCode, sCode;
          switch(parseInt(mSoccerinfo.infotype)) {
   	    case 0:
      	     mCode = "red-card";
      	     sCode = "redCard";
    	    break;
    	    case 1:
    	     mCode = "yellow-card";
    	     sCode = "yellowCard";
    	    break;
    	    case 2:
    	     mCode = "goal";
    	     sCode = "goalScored";
     	    break;
    	    case 3:
      	     mCode = "goal-on-penalty";
	     sCode = "goalOnPenalty";      	     
    	    break;
    	    case 4:
    	     mCode = "own-goal";
	     sCode = "ownGoal";    	     
    	    break;
    	    default:
      	     mCode = "invalid";
	     sCode = "invalid";      	     
    	    break;
          }   

          imageElt = document.createElementNS(kXULNS, "image");
          imageElt.setAttribute("class", "cricket-match-"+mCode);
        rowElt.appendChild(imageElt);

          labelElt = document.createElementNS(kXULNS, "label");
          labelElt.setAttribute("value", matchBundle.getString("cricket.match."+ sCode + ".label")+",");
        rowElt.appendChild(labelElt);
        }
        catch(e){};

          labelElt = document.createElementNS(kXULNS, "label");
          if(parseInt(mSoccerinfo.teaminfo) == 0)
             labelElt.setAttribute("value", match.teamone.abbr.toUpperCase()+",");
          else
             labelElt.setAttribute("value", match.teamtwo.abbr.toUpperCase()+",");
        rowElt.appendChild(labelElt);
          
          labelElt = document.createElementNS(kXULNS, "label");
          labelElt.setAttribute("value", mSoccerinfo.lastname);
        rowElt.appendChild(labelElt);


        var added = false;
        if (mSoccerinfo.timeinfo == "999") {
           //penalty shoot off
          for (var j = 0; j < rowsElt.childNodes.length ; j++) {
          
            if (parseInt(mSoccerinfo.timeinfo) >= parseInt(rowsElt.childNodes[j].getAttribute("timeinfo"))){
              rowsElt.insertBefore(rowElt, rowsElt.childNodes[j])
              added = true;
            break;   
            }   
          }
        }
        else {
          for (var j = 0; j < rowsElt.childNodes.length ; j++) {
          
            if (parseInt(mSoccerinfo.timeinfo) >= parseInt(rowsElt.childNodes[j].getAttribute("timeinfo"))){
              rowsElt.insertBefore(rowElt, rowsElt.childNodes[j])
              added = true;
            break;   
            }   
          }
        }
        
        if (!added)
          rowsElt.appendChild(rowElt);        
     }
     
     /***
     while (rowsElt.childNodes.length < 4) {

        rowElt = document.createElementNS(kXULNS, "row");        
          labelElt = document.createElementNS(kXULNS, "label");
            labelElt.setAttribute("value", " ");
        rowElt.appendChild(labelElt);

     rowsElt.appendChild(rowElt);
     }
     ***/
     
     //apply the background to each row
     for (var j=0; j< rowsElt.childNodes.length; j++) {
       if ((j%2)==0){
         rowsElt.childNodes[j].setAttribute("class", "cricket-match-details-odd-row");
       } 
       else{
         rowsElt.childNodes[j].setAttribute("class", "cricket-match-details-even-row");
       }
     }
     
     
   return match.soccerinfo.length;  
   },
   
   expandMatchDetailsBox : function() {
      
     //user interacts with UI, so clear the timeout function
     this.clearAutoCloseMatchNote();
     
     var details = document.getElementById("cricket-match-note-details");
     if (details.getAttribute("hidden")) {	
	this.showMatchDetailsBox(true);
     }
     else {
	this.showMatchDetailsBox(false);
     }
   },

   showMatchDetailsBox : function(aBool) {
   
     var details = document.getElementById("cricket-match-note-details");
     var expander = document.getElementById("cricket-match-note-expander");
     if (aBool) {
	
       var elts = document.getElementsByAttribute("class", "cricket-match-note");
       for (var i=0; i<elts.length; i++) {
         elts[i].style.height = "240px";
       }
      
       details.removeAttribute("hidden");
       expander.setAttribute("class", "cricket-expander-down");
     }
     else {

       details.setAttribute("hidden", true);     
       expander.setAttribute("class", "cricket-expander-up");
       var elts = document.getElementsByAttribute("class", "cricket-match-note");
       for (var i=0; i<elts.length; i++) {
         elts[i].style.height = "140px";
       }
     }
   },

   disableMatchDetailsBoxExpander : function(aBool) {
   
     var expander = document.getElementById("cricket-match-note-expander");
     if(aBool){
       expander.setAttribute("disabled", true);
     }
     else {
       expander.removeAttribute("disabled");
     }
          
   },

   hideMatchDetailsBoxExpander : function(aBool) {

     var expander = document.getElementById("cricket-match-note-expander");
     if(aBool) {
       expander.setAttribute("hidden", true)
     }
     else {
       if(expander.getAttribute("hidden"))
         expander.removeAttribute("hidden");
     }
   },
      
   getQueries : function(type) {
     
     var items = [];
     for (var i=0; i < this._queryItems.length; i++) {
        if(type == this._queryItems[i].type){
          
          items.push(this._queryItems[i]);
        }  
     }

   return items;
   },
   
   getLocaleVenue : function(aString) {
     
     var matchBundle = document.getElementById("bundle_cricket_match");
     var foundLocation = false;
     var mlocation, hlocation;
     for(var i=0; i < cricketServerVenueMap.length; i++) {
         
       mlocation = aString.toLowerCase();
       hlocation = cricketServerVenueMap[i].name.toLowerCase();
       if(mlocation.indexOf(hlocation) > -1) {
         return matchBundle.getString("cricket.match.venue."+cricketServerVenueMap[i].abbr);
       }
     }
       
   return aString;
   }
}

var cricketExtension = {

  _extensionManager : null,
  
  onUpdateCheck : function(extId) { 

    var now = parseInt(new Date().getTime() / 1000);
    var lastUpdateTime = cricketPref.getPref(cricketMain.PREF_PREFIX+"extension-update-time", "int");
    //12 hours
    if((lastUpdateTime + 43200) > now) {
      dump("Compare next update time :" + (lastUpdateTime + 43200) + ":" + now + " => update later -----\n");
    return;
    }  
    
    dump("Go and get the update......\n");
    
    this._extensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
                                      .getService(Components.interfaces.nsIExtensionManager);
    var listener = new cricketUpdateCheckListener();
    var items = [this._extensionManager.getItemForID(extId)];
    this._extensionManager.update(items, items.length, false, listener);
  }
}


function cricketUpdateCheckListener() {
  this._addons = [];
}
cricketUpdateCheckListener.prototype = {

  _addons: [],
  
  onUpdateStarted: function() {

  },
  
  onUpdateEnded: function() {
  
   var now = parseInt(new Date().getTime() / 1000);   
   cricketPref.setPref(cricketMain.PREF_PREFIX+"extension-update-time", now, "int");   
   if(this._addons.length > 0) {

     var bundle = document.getElementById("bundle_cricket");
     const nsIPromptService = Components.interfaces.nsIPromptService;
     const nsPrompt_CONTRACTID = "@mozilla.org/embedcomp/prompt-service;1";
     var  promptService = Components.classes[nsPrompt_CONTRACTID].getService(nsIPromptService);
     var buttonPressed = promptService.confirmEx(window, bundle.getString("cricket.extension.update.dialogTitle"), bundle.getString("cricket.extension.update.dialogText"),
                          (promptService.BUTTON_TITLE_YES * promptService.BUTTON_POS_0) +
                          (promptService.BUTTON_TITLE_NO * promptService.BUTTON_POS_1),
                          null,
                          null,
                          null,
                          null, {value:0});
    if (buttonPressed == 0) {
       var extensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
                                             .getService(Components.interfaces.nsIExtensionManager);
       extensionManager.addDownloads(this._addons, this._addons.length, true);     
       BrowserOpenExtensions('extensions');
    }     
   }      
  },
  
  onAddonUpdateStarted: function(addon) {

  },
  
  onAddonUpdateEnded: function(addon, status) {

    const nsIAUCL = Components.interfaces.nsIAddonUpdateCheckListener;
    switch(status) {
      case nsIAUCL.STATUS_UPDATE:
        this._addons.push(addon);
        dump("status_update\n");
        break;
      case nsIAUCL.STATUS_FAILURE:
        dump("status_failure\n");
        break;
      case nsIAUCL.STATUS_DISABLED:
        dump("status_disabled\n");
        break;
    }  
  },
  
  QueryInterface: function(iid) {
    if (!iid.equals(Components.interfaces.nsIAddonUpdateCheckListener) &&
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

//init main
window.addEventListener("load", cricketMain.startUp, false);
window.addEventListener("unload", cricketMain.closeDown, false);


