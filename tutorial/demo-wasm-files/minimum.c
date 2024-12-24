#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int add(int a) {
  return a + 1;
}