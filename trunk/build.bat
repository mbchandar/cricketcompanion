del work/build/cricketcompanion.xpi
cd work/chrome
del cricket.jar
jar -cf cricket.jar content/ locale/ skin/
cd ..
cd ..
"c:\Program Files\7-Zip\7z.exe" a -tzip build/cricketcompanion.xpi chrome/cricket.jar defaults\* META-INF\* chrome.manifest install.rdf