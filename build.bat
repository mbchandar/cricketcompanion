del build/cricketcompanion.xpi
cd work/chrome
del cricket.jar
jar -cf cricket.jar content/ locale/ skin/
cd ..
"c:\Program Files\7-Zip\7z.exe" a -tzip cricketcompanion.xpi chrome/cricket.jar defaults\* META-INF\* chrome.manifest install.rdf
move cricketcompanion.xpi ../build/
cd ..