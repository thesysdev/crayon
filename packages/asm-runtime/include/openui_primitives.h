#ifndef OPENUI_PRIMITIVES_H
#define OPENUI_PRIMITIVES_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

uint64_t openui_strlen(const char *value);
uint64_t openui_fnv1a64(const uint8_t *bytes, uint64_t length);
int64_t openui_find_byte(const uint8_t *bytes, uint64_t length, uint8_t needle);

#ifdef __cplusplus
}
#endif

#endif
