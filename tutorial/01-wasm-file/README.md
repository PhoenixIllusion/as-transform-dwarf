## What is a WASM file

### Intro

[Web assembly](https://webassembly.org/) <[wiki](https://en.wikipedia.org/wiki/WebAssembly)>, WASM, is a web technology now supported in modern browsers and various runtimes. By supplying a packaged binary files, the WASM module, to one of these runtimes such as through JavaScript in the browser, the runtime can compile the included WASM code and then expose the included WASM functions and variables to the originating runtime.

### Sections

A WASM file itself follows a very simple format, and is read in a little endian format. The WASM file starts with a for character magic header `0x00 0x61 0x73 0x6D`, equal to the null starting string `\0asm`. The next 4 bytes are the WASM file version in little endian u32 format, currently version 1.0, so `0x01 0x00 0x00 0x00`.

After the header, WASM files contain a sequence of Sections, defined as a chunk of data that starts with a u8 type identifier, a section size read in unsigned LEB128 format <[wiki](https://en.wikipedia.org/wiki/LEB128)>, abbreviated USLEB128 for unsigned or SLEB128 for signed, and then `[section size]` bytes of data.

The section IDs correspond to the following types:

   0. custom
   1. type
   2. import
   3. function
   4. table
   5. memory
   6. global
   7. export
   8. start
   9. element
   10. code
   11. data
   12. data-count
   13. tag
   14. strings

With this information, you can fully break any WASM module apart into its sections, requiring no knowledge of what any of these sections does. For purposes of this tutorial, we will only need to look into the sections `type 10: code` to identify where executable code exists in the module for debugging purposes. 

Should you wish to look more into full debugging of all sections, this may be documented in the extra sections of this tutorial at the end. Most sections follow a similar “chunked” container format as the module itself that allows full decomposition with no need to understand the inner data itself.

### Custom Sections

Custom sections, type zero, start with a ULEB128 name-length followed by a string name. These sections include extra data that is not required for running the WASM module itself, but are heavily used in our debugging work flow. Standard say that if a custom section is malformed internally but still can be read as a container, it should not stop the WASM file from executing, though it may lose the support of the extra features. Should we declare a section to be called “.debug_info” but fill it with random bytes, the file will still run but not be usable for any debugging.

Common custom section names
name - one of the more important sections, this gives the names of functions, globals, and 
external_debug_info - a url pointing to debug dwarf info
sourceMappingURL - a url pointing to a *.map json source map file that includes the original source as well as maps from the WASM code to original source column/row locations 
Dwarf locations, starting with a period and debug and underscore. The most commonly used are:
  * .debug_line
  * .debug_str
  * .debug_ranges
  * .debug_abbrev
  * .debug_info

### Modification

Due to the container format of a wasm file lacking any master file length and the format not requiring any checksums or interdependence between new sections, adding new sections requires only appending new binary blocks that fit the custom-section format to existing files. Removing sections is also trivially easy if you have parsed the sections already, only requiring creating a new file with magic number and version, then appending all desired sections.

For purposes of this tutorial, we will be modifying wasm modules by loading existing compiled modules and appending new Custom Sections to the end.