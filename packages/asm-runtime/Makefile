UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -Iinclude
DIST := dist
TEST_BIN := $(DIST)/openui-asm-smoke

ifeq ($(UNAME_S),Darwin)
  ifeq ($(UNAME_M),arm64)
    ASM_SRC := src/darwin-arm64/openui_primitives.s
  else
    $(error @openuidev/asm-runtime currently supports Darwin arm64 and Linux x86_64)
  endif
else ifeq ($(UNAME_S),Linux)
  ifeq ($(UNAME_M),x86_64)
    ASM_SRC := src/linux-x86_64/openui_primitives.s
  else
    $(error @openuidev/asm-runtime currently supports Darwin arm64 and Linux x86_64)
  endif
else
  $(error @openuidev/asm-runtime currently supports Darwin arm64 and Linux x86_64)
endif

.PHONY: all clean test

all: $(TEST_BIN)

$(DIST):
	mkdir -p $(DIST)

$(TEST_BIN): $(ASM_SRC) src/smoke.c include/openui_primitives.h | $(DIST)
	$(CC) $(CFLAGS) $(ASM_SRC) src/smoke.c -o $(TEST_BIN)

test: $(TEST_BIN)
	$(TEST_BIN)

clean:
	rm -rf $(DIST)
