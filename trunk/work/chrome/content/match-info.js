/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */
 
const kXULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";       
var matchId;

function startUp() {
  
  matchId = window.arguments[0];
  if(matchId)
    loadHistory();
  
  var matchBundle = document.getElementById("bundle_cricket_match");
  document.getElementById("key-goal").setAttribute("value", matchBundle.getString("cricket.match.goalScored.label"));
  document.getElementById("key-goal-on-penalty").setAttribute("value", matchBundle.getString("cricket.match.goalOnPenalty.label"));
  document.getElementById("key-own-goal").setAttribute("value", matchBundle.getString("cricket.match.ownGoal.label"));
  document.getElementById("key-red-card").setAttribute("value", matchBundle.getString("cricket.match.redCard.label"));
  document.getElementById("key-yellow-card").setAttribute("value", matchBundle.getString("cricket.match.yellowCard.label")); 

  //sizeToContent();
}

function loadHistory() {
  
  if (opener && opener.cricketWCServerService) {    
    var matches = opener.cricketWCServerService.todayMatches;
    loadHistoryItems(matches);
  }
}

function loadHistoryItems(matches) {
   
   var ctryBundle = document.getElementById("bundle_cricket_countries");
   var matchBundle = document.getElementById("bundle_cricket_match");
   
   //reload the title
   
   var rows = document.getElementById("info-rows");
   var row, hbox, label, image;
   var mlocation, hlocation, venue, foundLocation;
   for (var i=0; i < matches.length; i++) {
        
     if (matches[i].id == matchId) {

      var win = document.getElementById("cricket-match-info-window");
      if(matches[i].gamestatus == 2 || matches[i].gamestatus == 12) {
      
        document.title = win.getAttribute("title2") + " - " + matchBundle.getString("cricket.match.notification.gameInProgress.label");
      }
      else if(matches[i].gamestatus == 3 || matches[i].gamestatus == 4) {

        document.title = win.getAttribute("title2") + " - " + matchBundle.getString("cricket.match.final.label");
      }
      
      /**** drop venue
       foundLocation = false;
       for(var j=0; j < cricketServerVenueMap.length; j++) {
         
         mlocation = matches[i].location.toLowerCase();
         hlocation = cricketServerVenueMap[j].name.toLowerCase();
         if(mlocation.indexOf(hlocation) > -1  ) {
           venue = matchBundle.getString("cricket.match.venue."+cricketServerVenueMap[j].abbr);
           foundLocation = true;
 	   break;	        
         }
       }
       
       if(!foundLocation) {
         venue = matches[i].location;
       }
       ****/
       
       var matchTypeElt = document.getElementById("match-type");
       /***
       if(venue) {
         matchTypeElt.setAttribute("value", matchBundle.getString("cricket.match.type." + getGameType(matches[i].wcgametype)) + " - " + venue);
       }
       else 
       ****/
       matchTypeElt.setAttribute("value", matchBundle.getString("cricket.match.type." + getGameType(matches[i].wcgametype)));
       
       var matchInfoElt = document.getElementById("match-info");
       var matchInfoAtElt = document.getElementById("match-info-at");
       var mdate = new Date(matches[i].starttime); 
       
       
       if(matches[i].gamestatus == 2 || matches[i].gamestatus == 12) {
         matchInfoElt.setAttribute("value", matchBundle.getString("cricket.match.notification.gameInProgress.label") + " (" + matches[i].timeplayed +"')");
         matchInfoElt.removeAttribute("weight");
         matchInfoAtElt.setAttribute("hidden", true);
       }
       else if(matches[i].gamestatus == 3 || matches[i].gamestatus == 4) {
         matchInfoElt.setAttribute("value", matchBundle.getString("cricket.match.final.label"));
         matchInfoElt.setAttribute("weight", "border");
         matchInfoAtElt.setAttribute("hidden", true);
       }
       else {
         matchInfoElt.setAttribute("value", cricketComm.appendZeros((mdate.getHours()).toString(), 2, "rtl") +  ":" + cricketComm.appendZeros((mdate.getMinutes()).toString(), 2) + ", " +matchBundle.getFormattedString("cricket.date." + cricketComm.months[mdate.getMonth()] + ".shortName", [cricketComm.appendZeros((mdate.getDate()).toString(), 2, "rtl")]));       
         matchInfoElt.removeAttribute("weight");
         matchInfoAtElt.removeAttribute("hidden");
       }
       
       var teamoneAbbr = matches[i].teamone.abbr;
       var teamtwoAbbr = matches[i].teamtwo.abbr;
       try{
       document.getElementById("teamone-name").setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry." + teamoneAbbr));
       }catch(e){}
       try{
       document.getElementById("teamtwo-name").setAttribute("value", ctryBundle.getString("cricket.worldcup.ctry." + teamtwoAbbr));
       }catch(e){}
       
       if( (matches[i].teamone.subscores && matches[i].teamone.subscores.length > 3) || (matches[i].teamtwo.subscores && matches[i].teamtwo.subscores.length > 3))
         document.getElementById("match-total-scores").setAttribute("value", matches[i].teamone.total + "(" + matches[i].teamone.penaltyshootoutscore + ")" + " - " + matches[i].teamtwo.total + "(" + matches[i].teamtwo.penaltyshootoutscore + ")");
       else
         document.getElementById("match-total-scores").setAttribute("value", matches[i].teamone.total + " - " + matches[i].teamtwo.total);       
       document.getElementById("teamone-flag").setAttribute("src", "chrome://cricket/skin/flag-"+ teamoneAbbr +".png");
       document.getElementById("teamtwo-flag").setAttribute("src", "chrome://cricket/skin/flag-"+ teamtwoAbbr +".png");
       
       if(matches[i].soccerinfo.length == rows.getElementsByTagName("row").length) {	//same number of entries, return;
	  setTimeout(loadHistory, 1000);  //get the data from main window every one second
       break;
       }

       var infoType;
       while(rows.firstChild)
         rows.removeChild(rows.firstChild);
      
       var soccerinfo = matches[i].soccerinfo;
       for (var j=0; j < soccerinfo.length; j++) {

         row = document.createElementNS(kXULNS, "row");
	    
         hbox = document.createElementNS(kXULNS, "hbox");
         hbox.setAttribute("align", "center");
         hbox.setAttribute("pack", "end");
         hbox.setAttribute("class", "left-column");
         if (soccerinfo[j].teaminfo == 0) {
           label = document.createElementNS(kXULNS, "label");
           label.setAttribute("value", soccerinfo[j].lastname);
         hbox.appendChild(label);
           infoType = getInfoType(parseInt(soccerinfo[j].infotype));
           image = document.createElementNS(kXULNS, "image");
           image.setAttribute("class", infoType);
         hbox.appendChild(image);
         }  
        row.appendChild(hbox);

        row.setAttribute("timeinfo", soccerinfo[j].timeinfo);
          hbox = document.createElementNS(kXULNS, "hbox");
          hbox.setAttribute("align", "center");
          hbox.setAttribute("class", "timeinfo-column");
  	    label = document.createElementNS(kXULNS, "label");
  	  if(soccerinfo[j].timeinfo == "999"){  
	    //penalty shoot outs
	    label.setAttribute("value", "");
	  }  
	  else
	    label.setAttribute("value", cricketComm.appendZeros(soccerinfo[j].timeinfo, 2, "rtl")+"'");	    
	  hbox.appendChild(label)  
        row.appendChild(hbox);
	    
        hbox = document.createElementNS(kXULNS, "hbox");
        hbox.setAttribute("align", "center");       
	hbox.setAttribute("pack", "start");
	hbox.setAttribute("class", "right-column");
        if (soccerinfo[j].teaminfo != 0) {
           infoType = getInfoType(parseInt(soccerinfo[j].infotype));
           image = document.createElementNS(kXULNS, "image");
           image.setAttribute("class", infoType);
	hbox.appendChild(image);   
	   label = document.createElementNS(kXULNS, "label");
	   label.setAttribute("value", soccerinfo[j].lastname);
	hbox.appendChild(label);
	}  
        row.appendChild(hbox);
          
        var added = false;
        if(soccerinfo[j].timeinfo == "999") {           
           //penalty shoot off
        }
        else {
          for (var k=0; k < rows.childNodes.length; k++) {
           
            if(rows.childNodes[k].localName == "row" && parseInt(rows.childNodes[k].getAttribute("timeinfo")) > parseInt(soccerinfo[j].timeinfo)) {
               
              rows.insertBefore(row, rows.childNodes[k]);
	      added = true;
  	   
  	   break;   
            }
          }
        }  
        
        if(!added)
          rows.appendChild(row);
      }

      //get the data from main window every one second
      setTimeout(loadHistory, 1000);  
             
     break;	        
     }
   }

   //add some empty rows to fill the screen
   while(rows.childNodes.length < 9) {
   
     row = document.createElementNS(kXULNS, "row");
        hbox = document.createElementNS(kXULNS, "hbox");
        hbox.setAttribute("pack", "end");
        hbox.setAttribute("class", "left-column");
     row.appendChild(hbox);
   
       hbox = document.createElementNS(kXULNS, "hbox");
       hbox.setAttribute("align", "center");
       hbox.setAttribute("class", "timeinfo-column");
       label = document.createElementNS(kXULNS, "label");
       label.setAttribute("value", "   ");
       label.setAttribute("class", "empty-row");
       hbox.appendChild(label)            
    row.appendChild(hbox);
   	    
       hbox = document.createElementNS(kXULNS, "hbox");
       hbox.setAttribute("pack", "start");
       hbox.setAttribute("class", "right-column");
    row.appendChild(hbox);
         
   rows.appendChild(row);
   }
         
   //apply the background to each row
   for (var j=0; j< rows.childNodes.length; j++) {
     if ((j%2)==0){
       rows.childNodes[j].setAttribute("class", "odd-row");
     } 
     else{
       rows.childNodes[j].setAttribute("class", "even-row");
     }
   }
         
}


function getInfoType(aNum) {
  
  var code;
  switch(aNum) {
    case 0:
      code = "red-card";
    break;
    case 1:
      code = "yellow-card";
    break;
    case 2:
      code = "goal";
    break;
    case 3:
      code = "goal-on-penalty";
    break;
    case 4:
      code = "own-goal";
    break;
    default:
      code = "invalid"
    break;
  }  

return code;
}

function getGameType(aNum) {
  
  var code;
  switch(aNum) {
    case 0:
      code = "groupa";
    break;
    case 1:
      code = "groupb";
    break;
    case 2:
      code = "groupc";
    break;
    case 3:
      code = "groupd";
    break;
    case 4:
      code = "groupe";
    break;
    case 5:
      code = "groupf";
    break;
    case 6:
      code = "groupg";
    break;
    case 7:
      code = "grouph";
    break;
    case 8:
      code = "round16";
    break;
    case 9:
      code = "quarterfinal";
    break;
    case 10:
      code = "thirdplace";
    break;
    case 11:
      code = "semifinal";
    break;
    case 12:
      code = "final";
    break;
    default:
      code = "invalid";
    break;  
  }  

return code;
}


function closeDown(){

  
}