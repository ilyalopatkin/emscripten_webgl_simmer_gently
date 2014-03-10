CC=emcc
SOURCES:=$(wildcard *.cpp)
EXPORTS_FILE=makefile_exports.txt
LDFLAGS=-O2 --llvm-opts 2
OUTPUT=glcore.js

all: $(SOURCES) $(OUTPUT)

$(OUTPUT): $(SOURCES) 
	$(CC) $(SOURCES) --bind -s FULL_ES2=1 -s EXPORTED_FUNCTIONS=@$(EXPORTS_FILE) -std=c++11 $(LDFLAGS) -o $(OUTPUT)

clean:
	rm $(OUTPUT)
	rm $(OUTPUT).map