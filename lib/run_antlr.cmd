@echo creating JS files in \bin without absolute path references
java -jar antlr-3.3-complete.jar -o ../bin ../MmirTemplate.g
java -jar antlr-3.3-complete.jar -o ../bin ../MmirScriptBlock.g
java -jar antlr-3.3-complete.jar -o ../bin ../MmirScriptStatement.g
java -jar antlr-3.3-complete.jar -o ../bin ../MmirScriptContent.g
java -jar antlr-3.3-complete.jar -o ../bin ../ES3.g3
