@echo creating JS files for ANTRL grammars
@echo   run this script from directory where grammars located

SET LIB_PATH=..\..\..\..\..\build\lib\antlr-3.3-complete.jar
SET OUTPUT_PATH=..\..\..\gen\parser

java -jar %LIB_PATH% -o %OUTPUT_PATH% MmirTemplate.g
java -jar %LIB_PATH% -o %OUTPUT_PATH% MmirScript.g
java -jar %LIB_PATH% -o %OUTPUT_PATH% MmirScriptContent.g
java -jar %LIB_PATH% -o %OUTPUT_PATH% ES3.g3
REM java -jar %LIB_PATH% -o %OUTPUT_PATH% MmirES3Walker.g3
