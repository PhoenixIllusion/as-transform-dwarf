
## What are source maps

### Intro

When debugging WASM using source-maps, the WASM module will include a `sourceMappingUrl` section, which will point to a relative or absolute-path `*.map` file.

The `*.map` file used by Binaryen and Emscripten follows the same "V3 Source Map" specification as most Javascript and TypeScript debugging tools used on the web, and is defined at the official specification site [here](https://tc39.es/ecma426/)

Included with the `minimal.wasm` file is the associated `*.map` file

```json
{
  "version":3,
  "sources":[
    "/demo/PhoenixIllusion/minimum.c"
  ],
  "names":[],
  "mappings":"yKAGA,KACW,CAAT"
}
```

### Encoding

The main elements of interest to us are the "sources" and the "mappings" sections.

The "sources" includes a list of all files compiled into the project, and lists them in a specific sequence. We will need to note their respective index in this list for later.

The "mappings" section is the most significant element of the file, and encodes a list of data in base64 VLQ format <[wiki](https://en.wikipedia.org/wiki/Variable-length_quantity)>, separated by commas and semi-colon. Semi-colon denote the `row` in the resulting source, and commas in the mapping splitting the data into individual instructions.

Given WASM maps "columns" to bytes in the entire file, there is no concept of a "second row" of data, as that would indicate a second WASM-file worth of data, which is not supported.

This translates the above data into the following logic:

```
One source file:
  * index 0: minimum.c

Mapping:
  * single line (no semi-colon)
  * 3 instructions
    * yKAGA
    * KACW
    * CAAT
```
The listed instructions decode into the following format:
```
[byte, file, row, column ]
[ 169,    0,   3,       0]
[   5,    0,   1,      11]
[   1,    0,   0,      -9]
```
Each sequence is added to the previous instruction excluding the start of each new `mapping`  group (of which we only have one mapping, given no semicolon).

This translates to the following:
```c
0: #include <emscripten.h>
1: 
2: EMSCRIPTEN_KEEPALIVE
3: int add(int a) {
4:  return a + 1;
5: }
```

```wasm
 (func $add (param $0 i32) (result i32)
  (local.get $0)
  (i32.const 1)
  (i32.add)
 )
```

```
File 0: minimum.c
Startin at:
byte 169 - row 3, column 0
  cpp: int add(int a)
 wasm: (local.get $0)
byte 175 - row 4, column 11
  cpp: 1 (literal);
 wasm: (i32.const 1)
byte 176 - row 4, column 2
  cpp: return a + 1;
 wasm: (i32.add) (implied return)
``` 

By setting the  'setup' commands of `local.get` to be the source function declaration, breakpoint on the actual first line of the source function, `row 4`, will automatically have all locals retrieved and ready for inspection.

Given the translation of how a "return a + 1" statement converts, you can see why you may have a negative 'column' index used in the VLQ, as the right-side of the CPP code must be resolved `(a +1)` before it may finally call the `return` itself in the WASM source.

### Un-mapped Generated Code

In one edge case, you may have cases where code is called, but it has no actual location to reference in the original code. As of today in AssemblyScript, this is most common on property getter/setters. 

For Example, the following case has such a VLQ mapping

```typescript
@unmanaged
class HOLDER {
  a: i32;
  b: i32;
  next: HOLDER;
  foo(): f32 {
    return f32(this.a)
  }
}
function foo(i: u32): void {
  for(let a=0;a<10;a++) {
    let j = i + 2;
    {
      let j = i + 3;
      n += j;
    }
  }
}
```

```
(func HOLDER#foo (;3;) (param $this (;0;) i32) (result f32)
    local.get $this
    call $assembly/index/HOLDER#get:a
    f32.convert_i32_s
    return
)
(func foo (;5;) (param $i (;0;) i32)
    (local $a i32)
    (local $j i32)
    (local $j|3 i32)
    i32.const 0
    local.set $a
    loop $label0
      local.get $a
      i32.const 10
      i32.lt_s
      if
)
```

```
+PCMe,E,EAAJ,CAAP,I,YAOQ,EAAN,E,EAAQ
```
```
[255, 7, 15]
  // local.get $this
[257]
  // unmapped call to `HOLDER get a`
[259, 7, 11]
  // convert i32_s
[260, 7,  4]
  // return
[264]
  // unmapped call to `HOLDER get b`
[276, 14, 12]
  // const 0
[278, 14, 6]
  // local.set $a
TypeScript: for let a=0
[280]
  // unmapped loop $label0,
  TypeScript: for-loop context
[282, 14, 14]
  // local.get $a
  Typescript: for a < 10
```

### File lists

When using multiple files, you may have multiple `sources` declared. They will are not required to be declared in any specific or alphabetic order, and you may not even have all source files referenced if you did not enable a higher level of code optimization.

As a result, you may have something that looks more like this:
```json
[
  "~lib/rt/common.ts",
  "assembly/index.ts",
  "~lib/rt/stub.ts",
  "~lib/util/error.ts"
]
```

Some files may only reference typing or inlined constants, and as such do not have any code to declare in the mapping.

### Mapping byte to source

With the above logic, we can now produce a full byte to file and column/row notation. The supplied byte offsets in the SourceMap JSON are supplied as absolute file offsets in in the file. These can be used with the debugger to locate specific commands. In Chrome, the non-mapped WASM files will list the actual file-offset locations in the left column of the code, so converting from JSON-v3-Map offsets to hex can be used for absolute lookups.

When performing source-mapping with DWARF later, you will need to use a different offset, relative to the `code` section of the WASM module.