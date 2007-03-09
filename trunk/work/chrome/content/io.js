/*
 *  Cricket.com Companion - Powered by Firefox
 *
 *  Copyright (C) 2006  Mozilla Corporation.  All Rights Reserved.
 *
 */
 
var cricketFileIO ={
  
  fileoutputstreamCID : "@mozilla.org/network/file-output-stream;1",
  fileoutputstreamIID : Components.interfaces.nsIFileOutputStream,

  fileinputstreamCID : "@mozilla.org/network/file-input-stream;1",
  fileinputstreamIID : Components.interfaces.nsIFileInputStream,
  
  scriptinputstreamCID  : "@mozilla.org/scriptableinputstream;1",
  scriptinputstreamIID  : Components.interfaces.nsIScriptableInputStream,

  scriptuniconvCID   : "@mozilla.org/intl/scriptableunicodeconverter",
  scriptuniconvIID   : Components.interfaces.nsIScriptableUnicodeConverter,
  
  lineinputstreamIID : Components.interfaces.nsILineInputStream,
  
  dirserviceCID : "@mozilla.org/file/directory_service;1",
  propertiesIID : Components.interfaces.nsIProperties,
  localfileIID : Components.interfaces.nsILocalFile,
  
  ioserviceCID : "@mozilla.org/network/io-service;1",
  iioserviceIID : Components.interfaces.nsIIOService,
  fileprotocolhandlerIID : Components.interfaces.nsIFileProtocolHandler,

  
  writeFile : function(aFile, aString){

    var foStream = Components.classes[this.fileoutputstreamCID]
		.createInstance(this.fileoutputstreamIID);    
    aString = this.fromUnicode(aString, "UTF-8");
    foStream.init(aFile, 0x02 | 0x08 | 0x20, 0664, 0);
    foStream.write(aString, aString.length);
    foStream.close();
  },

  appendFile : function(aFile, aString){
  
    this.createFile(aFile);
    var foStream = Components.classes[this.fileoutputstreamCID]
		.createInstance(this.fileoutputstreamIID);
    foStream.init(aFile, 0x02 | 0x10, 0664, 0);
    foStream.write(aString, aString.length);
    foStream.close();    
  },

  readFile : function(aFile, multiLines){
    
    if(aFile.exists()){

      var fiStream = Components.classes[this.fileinputstreamCID]
                        .createInstance(this.fileinputstreamIID);
      fiStream.init(aFile, 0x01, 0444, 0);
      fiStream.QueryInterface(this.lineinputstreamIID);
	    
      var line = {};
      if(multiLines){

        var lines = [], hasmore, data;
        do {
          hasmore = fiStream.readLine(line);
          data = this.toUnicode(line.value, "UTF-8");
          lines.push(data);
        } while(hasmore);
	
        fiStream.close();
   	    
        if(lines.length>0)
          return lines;

      }	
      else{
        fiStream.readLine(line);
        data = this.toUnicode(line.value, "UTF-8");
      return data;	    
      }
    }

  return null;	 
  },

  deleteFile : function(aFile){

    if(aFile.exists()){       
      aFile.remove(true);
    }
  },
  
  createFile : function(aFile){
    
    try{
      if(!aFile.exists())
        aFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0664);
    
      return true; 
    }
    catch(e){  
      return false;
    }
  },
  
  createDir : function(aFile){
    
    try{
      if(!aFile.exists())
        aFile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0700);
      
      return true;
    }
    catch(e){
      return false;
    }
  },

  getDir : function(property_name){

    var dirService = Components.classes[this.dirserviceCID]
    	.getService(this.propertiesIID);		
    // See mozilla/xpcom/io/nsAppDirectoryServiceDefs.h for param[0]
    var profileDir = dirService.get(property_name, this.localfileIID);	
      
  return profileDir;
  },
  
  
  getOwnAreaDir : function(){
  
    var dir = this.getDir("ProfD");
    dir.append("OwnArea");
     
    this.createDir(dir);

  return dir;
  },

  getBackupsDir : function(){
  
    var dir = this.getOwnAreaDir();
    dir.append("backups");
     
    this.createDir(dir);

  return dir;
  },


  toUnicode   : function(data, charset) {
    try{
      var uConv = Components.classes[this.scriptuniconvCID]
			.createInstance(this.scriptuniconvIID);
      uConv.charset = charset;
      data = uConv.ConvertToUnicode(data);
    } 
    catch(e) { }
  return data;
  },

  fromUnicode : function(data, charset) {
    try {
      var uConv = Components.classes[this.scriptuniconvCID]
				.createInstance(this.scriptuniconvIID);
      uConv.charset = charset;
      data = uConv.ConvertFromUnicode(data);
      data += uConv.Finish();
    }
    catch(e) { }
  
  return data;
  },
  
  //e.g. file:///document...., http://
  getFileSystemPath : function (nsIFile){
    
    var ios = Components.classes[this.ioserviceCID]
                    .getService(this.iioserviceIID);
    var fileHandler = ios.getProtocolHandler("file")
                     .QueryInterface(this.fileprotocolhandlerIID);
    var path = fileHandler.getURLSpecFromFile(nsIFile);  
  
  return path;
  }
  
}  
