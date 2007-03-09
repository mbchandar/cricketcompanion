/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */
 
var cricketPref = {

   setPref : function(aName, aValue, aType) {
     
     var pref = Components.classes["@mozilla.org/preferences-service;1"]
        			.getService(Components.interfaces.nsIPrefBranch);     
     try{
       if(aType == "bool")
         pref.setBoolPref(aName, aValue);
       else if(aType == "int")   
         pref.setIntPref(aName, aValue);
       else if(aType == "char")
         pref.setCharPref(aName, aValue);
     }
     catch(e){ };
   },
   
   getPref : function(aName, aType) {
     
     var pref = Components.classes["@mozilla.org/preferences-service;1"]
        			.getService(Components.interfaces.nsIPrefBranch);
     try{
       var result;
       if(aType == "bool")
         result = pref.getBoolPref(aName);
       else if(aType == "int")   
         result = pref.getIntPref(aName);
       else if(aType == "char")      
         result = pref.getCharPref(aName);

     return result;
     }
     catch(e){
       if(aType == "bool"){
         return false;
       }          
       else if(aType == "int"){
         return 0;
       }
       else if(aType == "char"){
         return null; 
       }
     }
   
   return null;
   }
}

var cricketComm = {
   
  /* Teams 
  AUS - Australia
  ENG - England

  */

   months : ["january", "february", "march", "april", "may", "june",
     		"july", "august", "september", "october", "november", "december"],
   
   getLanguage : function() {
   
   
   return navigator.language;
   },
   
   getPlatform : function(){

    var platform = new String(navigator.platform);
    platform = platform.toLowerCase()
    var str = "";
    if(platform.indexOf("mac") != -1) 
       str = "mac";
    else if(platform.indexOf("win") != -1)
       str = "win";
    else 
       str = "nix";

   return str; 
   },

   getAppVersionNum : function(){
     
     var num;
     if("@mozilla.org/xre/app-info;1" in Components.classes) {
     
       var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                        .getService(Components.interfaces.nsIXULAppInfo);
       num = appInfo.version;
     }
     else{
     
       var num = "";
       var pref = Components.classes["@mozilla.org/preferences-service;1"]
     			.getService(Components.interfaces.nsIPrefBranch);
       try{
          num = pref.getCharPref("general.useragent.vendorSub");
       }
       catch(e){}
     }	  
     
   return num;
   },
   
   getExtVersionNum : function() {

     var bundle = document.getElementById("bundle_cricket_brand");
     var num  = bundle.getString("cricket.extension.version");
   
   return num;
   },
   
   trimSpaces : function(aStr) {
   
   return aStr.replace(/^\s*|\s*$/g, "");
   },
   
   htmlToUnicode : function(aStr) {
   
     var formatConv = Components.classes["@mozilla.org/widget/htmlformatconverter;1"]
   				.createInstance(Components.interfaces.nsIFormatConverter);
     var supportStr = Components.classes["@mozilla.org/supports-string;1"]
   			.createInstance(Components.interfaces.nsISupportsString);
     supportStr.data = aStr;
     var toStr = { value: null };
     try {
       formatConv.convert("text/html", supportStr, supportStr.toString().length, "text/unicode", toStr, {});
       
       if(toStr.value) {
          toStr = toStr.value.QueryInterface(Components.interfaces.nsISupportsString);
       return toStr.toString();
       }
     } catch(e) { }
         
    return aStr;
   },
   
   
   /*** IO ***/
   getSpecialDir: function(aProp) {
        
       var dir = Components.classes['@mozilla.org/file/directory_service;1']
     			.getService(Components.interfaces.nsIProperties)
      				.get(aProp, Components.interfaces.nsILocalFile);
   return dir
   },
     
   getFilePath : function(aFile) {
       
     var ioService = Components.classes["@mozilla.org/network/io-service;1"]
     				.getService(Components.interfaces.nsIIOService);
     var filePath = ioService.newFileURI(aFile).spec;
   
   return filePath;
   },
   
   /*** time ***/
   //convert local time to UTC time in msec
   getUTCTime : function() {
  
     // convert to msec since Jan 1 1970
     var d = new Date();
     localTime = d.getTime();    
    
     //get the offset in msec
     localOffset = d.getTimezoneOffset() * 60000;

     utc = localTime + localOffset;
    
   return utc;
   },
  
   //in msec
   getUnixTimestamp : function() {
  
     var d = new Date();
     var localTime = d.getTime();    
  
   return localTime;
   },
  
   //convert time to local time in msec
   //param: utc time
   convertToLocalTime : function(aTime) {
     
     //dump("b4 convertsion:" + new Date(aTime).toString()+"\n");
     
     var d = new Date();  
     localOffset = d.getTimezoneOffset() * 60000;
    
     
     var endTime = parseInt(aTime) + localOffset

     //dump("AF convertsion:" + new Date(endTime).toString()+"\n");
     //dump("Offset:" + d.getTimezoneOffset()+"\n");

     
   return endTime;
   },
   
   appendZeros : function(aStr, aLen, aDir) {
     
     while(aStr.length < aLen){
        if(aDir == "rtl")
          aStr = "0" + aStr;
        else
          aStr = aStr + "0";
     }
   
   return aStr;
   }
   
}


function cricketXMLHttpRequest (url, callBack, callBackError, extraParams, callObj, isXML) {
  
  dump(url + "\n");
  
  if(url)
    this.sendRequest(url, callBack, callBackError, extraParams, callObj, isXML);
}

cricketXMLHttpRequest.prototype.sendRequest = function(url, callBack, callBackError, extraParams, callObj, isXML){
    
    try {    
      var httpReq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                                    .createInstance(Components.interfaces.nsIXMLHttpRequest);
      httpReq._callObj = callObj;
      httpReq._url = url;
      httpReq._extraParams = extraParams;
      httpReq.open("GET", url, true);
      if(isXML)
       httpReq.overrideMimeType("application/xml");
      httpReq.onload = callBack;
      httpReq.onerror = callBackError;
      httpReq.onreadystatechange = function() { 
        try{
          if(httpReq.readyState == 4) {
            if(httpReq.status == 200) {
              //OK
            }
            else {
             //Error
            }
          }
        } 
        catch(e){}  
      }
      httpReq.send(null);
    }
    catch(e) { }    
}

var cricketLinks = {

  //cricket web site links
  cricketHome: "http://www.cricket.com/",
  cricketLogout: "http://www.cricket.com/GLogin.aspx?cmd=logout",
  cricketLogin: "http://www.cricket.com/GLogin.aspx?d=ffsb",
  cricketSignup: "http://www.cricket.com/JoinCreate.aspx",
  cricketSearch: "http://www.cricket.com/FFSearch.aspx?d=ffsb",
  cricketVideoSearch: "http://www.cricket.com/VideoSearch.aspx",
  
  //standings
  standings: "http://news.bbc.co.uk/sport2/hi/football/world_cup_2006/schedule/group_a/default.stm"
}

//for scoreboard and live score
//need to map their team names to our abbr values
//as it is a bit different from what we use.
var cricketServerTeamNamesMap = [

   {teamAbbr: "ang", id: "o.fifa.com-t.680", query: "fifawc|angola|", wcgametype : 3 }, 
   {teamAbbr: "arg", id: "o.fifa.com-t.623", query: "fifawc|argentina|", wcgametype : 2 }, 
   {teamAbbr: "aus", id: "o.fifa.com-t.313", query: "fifawc|australia|", wcgametype : 5 }, 
   {teamAbbr: "bra", id: "o.fifa.com-t.550", query: "fifawc|brazil|", wcgametype : 5 }, 
   {teamAbbr: "civ", id: "o.fifa.com-t.717", query: "fifawc|ivory coast|", wcgametype : 2 }, 
   {teamAbbr: "crc", id: "o.fifa.com-t.591", query: "fifawc|costa rica|", wcgametype : 0 }, 
   {teamAbbr: "cro", id: "o.fifa.com-t.258", query: "fifawc|croatia|", wcgametype : 5 }, 
   {teamAbbr: "cze", id: "o.fifa.com-t.314", query: "fifawc|czech republic|", wcgametype : 4 }, 
   {teamAbbr: "ecu", id: "o.fifa.com-t.626", query: "fifawc|ecuador|", wcgametype : 0 }, 
   {teamAbbr: "eng", id: "o.fifa.com-t.200", query: "fifawc|england|", wcgametype : 1 }, 
   {teamAbbr: "fra", id: "o.fifa.com-t.248", query: "fifawc|france|", wcgametype : 6 }, 
   {teamAbbr: "ger", id: "o.fifa.com-t.268", query: "fifawc|germany|", wcgametype : 0 }, 
   {teamAbbr: "gha", id: "o.fifa.com-t.686", query: "fifawc|ghana|", wcgametype : 4 }, 
   {teamAbbr: "irn", id: "o.fifa.com-t.639", query: "fifawc|iran|", wcgametype : 3 }, 
   {teamAbbr: "ita", id: "o.fifa.com-t.259", query: "fifawc|italy|", wcgametype : 4 }, 
   {teamAbbr: "jpn", id: "o.fifa.com-t.641", query: "fifawc|japan|", wcgametype : 5 }, 
   {teamAbbr: "kor", id: "o.fifa.com-t.644", query: "fifawc|south korea|", wcgametype : 6 }, 
   {teamAbbr: "mex", id: "o.fifa.com-t.545", query: "fifawc|mexico|", wcgametype : 3 }, 
   {teamAbbr: "ned", id: "o.fifa.com-t.263", query: "fifawc|netherlands|", wcgametype : 2 }, 
   {teamAbbr: "par", id: "o.fifa.com-t.622", query: "fifawc|paraguay|", wcgametype : 1  }, 
   {teamAbbr: "pol", id: "o.fifa.com-t.247", query: "fifawc|poland|", wcgametype : 0 }, 
   {teamAbbr: "por", id: "o.fifa.com-t.265", query: "fifawc|portugal|", wcgametype : 3 }, 
   {teamAbbr: "ksa", id: "o.fifa.com-t.656", query: "fifawc|saudi arabia|", wcgametype : 7 }, 
   {teamAbbr: "scg", id: "o.fifa.com-t.482", query: "fifawc|serbia montenegro|", wcgametype : 2 }, 
   {teamAbbr: "esp", id: "o.fifa.com-t.249", query: "fifawc|spain|", wcgametype : 7 }, 
   {teamAbbr: "swe", id: "o.fifa.com-t.255", query: "fifawc|sweden|", wcgametype : 1 }, 
   {teamAbbr: "sui", id: "o.fifa.com-t.280", query: "fifawc|switzerland|", wcgametype : 6 }, 
   {teamAbbr: "tog", id: "o.fifa.com-t.694", query: "fifawc|togo|", wcgametype : 6 }, 
   {teamAbbr: "tri", id: "o.fifa.com-t.597", query: "fifawc|trinidad tobago|", wcgametype : 1 }, 
   {teamAbbr: "tun", id: "o.fifa.com-t.695", query: "fifawc|tunisia|", wcgametype : 7  }, 
   {teamAbbr: "ukr", id: "o.fifa.com-t.323", query: "fifawc|ukraine|", wcgametype : 7 }, 
   {teamAbbr: "usa", id: "o.fifa.com-t.592", query: "fifawc|united states|", wcgametype : 4 }
]

var cricketServerVenueMap = [

   { abbr: "allianzArena", name: "Allianz Arena" },
   { abbr: "aolArena", name: "AOL Arena" },
   { abbr: "aufSchalkeArena", name: "AufSchalke Arena" },
   { abbr: "awdArena", name: "AWD Arena" },
   { abbr: "commerzbankArena", name: "Commerzbank Arena" },
   { abbr: "frankenStadion", name: "Franken-Stadion" },
   { abbr: "fritzWalterStadion", name: "Fritz-Walter-Stadion" },
   { abbr: "gottliebDaimlerStadion", name: "Gottlieb-Daimler-Stadion" },
   { abbr: "olympiastadion", name: "Olympiastadion" },
   { abbr: "rheinEnergieStadion", name: "RheinEnergieStadion" },
   { abbr: "signalIdunaPark", name: "Signal Iduna Park" },
   { abbr: "zentralstadion", name: "Zentralstadion" }
]

var cricketSiteLanguages = ["en-US"];