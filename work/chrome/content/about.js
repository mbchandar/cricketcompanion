/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */

function openURL(aUrl){

  if("@mozilla.org/xre/app-info;1" in Components.classes)      
     return;
  else{
     //for pre 1.5 version
     window.opener.openURL(aUrl)  
  }
}  