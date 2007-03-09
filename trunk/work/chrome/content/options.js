/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */
 
var PREF_PREFIX = "extensions.cricket.";

function startUp(){
  
   if(cricketComm.getPlatform() != "win") {
      var dialog  = document.getElementById("cricketOptions")
      document.title = dialog.getAttribute("title2");
      var caption = document.getElementById("cricketOptionsCaption");
      caption.setAttribute("label", caption.getAttribute("label2"));
   }
   
   var bool = cricketPref.getPref(PREF_PREFIX+"sidebar.startup", "bool");
   if(bool)
     document.getElementById("showSidebarCheckbox").checked = true;
   else
     document.getElementById("showSidebarCheckbox").checked = false;

   var bool = cricketPref.getPref(PREF_PREFIX+"statusbar.showLiveMatches", "bool");
   if(bool)
     document.getElementById("showStatusbarMatchesUpdateCheckbox").checked = true;
   else
     document.getElementById("showStatusbarMatchesUpdateCheckbox").checked = false;
}

function onAccept(){
   
   var bool;
   if(document.getElementById("showSidebarCheckbox").checked)
     bool = true;
   else
     bool = false;
   
   cricketPref.setPref(PREF_PREFIX+"sidebar.startup", bool, "bool");
   
   if(document.getElementById("showStatusbarMatchesUpdateCheckbox").checked)
     bool = true;
   else
     bool = false;
   
   cricketPref.setPref(PREF_PREFIX+"statusbar.showLiveMatches", bool, "bool");   
}