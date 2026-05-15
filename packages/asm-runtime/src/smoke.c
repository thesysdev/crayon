#include "openui_primitives.h"

#include <stdint.h>
#include <stdio.h>

static int expect_u64(const char *name, uint64_t actual, uint64_t expected) {
  if (actual == expected) {
    return 0;
  }

  fprintf(
    stderr,
    "%s failed: expected 0x%llx, got 0x%llx\n",
    name,
    (unsigned long long)expected,
    (unsigned long long)actual
  );
  return 1;
}

static int expect_i64(const char *name, int64_t actual, int64_t expected) {
  if (actual == expected) {
    return 0;
  }

  fprintf(
    stderr,
    "%s failed: expected %lld, got %lld\n",
    name,
    (long long)expected,
    (long long)actual
  );
  return 1;
}

int main(void) {
  const uint8_t openui[] = "openui";
  int failures = 0;

  failures += expect_u64("openui_strlen", openui_strlen((const char *)openui), 6);
  failures += expect_u64(
    "openui_fnv1a64",
    openui_fnv1a64(openui, 6),
    0x8a5f974a0acb0f67ULL
  );
  failures += expect_i64("openui_find_byte hit", openui_find_byte(openui, 6, 'u'), 4);
  failures += expect_i64("openui_find_byte miss", openui_find_byte(openui, 6, 'x'), -1);

  if (failures != 0) {
    return 1;
  }

  puts("openui asm runtime smoke test passed");
  return 0;
}
