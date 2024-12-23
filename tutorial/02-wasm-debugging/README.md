
## WASM debugging

### Intro

Several runtimes now support some form of debugger support for WASM executions. With Chrome and the V8 engine used with NodeJS, this is available using the Chrome Debug tools. When debugging WASM in a browser instance, you may see the WASM module listed in the source along-side any javascript. Should additional debuggable support be available, then you will see any available source maps and files also hosted, similar to how you would see these files in a Javascript source-map. Should these sources be available, you will have the option of setting and debugging using breakpoints placed in the WASM module itself or in any of the associated source-maps. 

### Without any debug info

Should you not have any debug information available on a module, or not have any debug information available for specific functions or locations, you will only be able to view and set debug points in the WASM module itself. To view this, you may load up a WASM module in your preferred environment, with my own tutorial using Chrome, and selecting the WASM module from the source list. You should see a text form of the module displayed in a format called WAT, web-assembly-text. This will display something similar to the below of our 'minimum.wasm' file:

```wasm
(module $minimum.wasm
 (type $0 (func))
 (type $1 (func (param i32) (result i32)))
 (import "env" "memory" (memory $mimport$0 0))
 (import "env" "__indirect_function_table" (table $timport$0 0 funcref))
 (import "env" "__memory_base" (global $__memory_base i32))
 (import "env" "__table_base" (global $__table_base i32))
 (export "__wasm_call_ctors" (func $__wasm_call_ctors))
 (export "add" (func $add))
 (func $__wasm_call_ctors
 )
 (func $add (param $0 i32) (result i32)
  (i32.add
   (local.get $0)
   (i32.const 1)
  )
 )
```

 You may set breakpoints inside the function here, "add", and during execution view the details of the available parameters and values.

### With Source Maps

One of the next levels of debugging a WASM module is with included source-maps. This is the default available for AssemblyScript right now, and the main method supported for Binaryen generated modules constructed purely using the Binaryen code interface.

This method will use the sourceMappingUrl CustomSection to link to a JSON file that includes both the full source of the application as well as any wasm-code byte addresses to the original source code.

When loading the module up similar to the above "no debug" scenario, you will see a new folder available to browse as well that uses the Source Map files. Should you navigate into this folder, you may set breakpoints inside the source files themselves and allow debugging.

When a debugger loads the source-maps, it does not have any available typings for the methods or may not have names for local variables, so will only be able to use default and guessed typings. This means that passed in pointer addresses will be listed as "unsigned number", and there is no concept of signed and unsigned values for WASM as a whole.

The listed typings for a source-amp will show as `$varName { value: 123 }`

### With DWARF

When including the DWARF section data with a module, the actual local-machine paths will be baked into the WASM file. This could be a privacy or security concern should you share these debuggable files with others or the internet in general.

Once loaded up in the debugger, the machine will check the referenced folder and file-paths baked into the module and then check the local machine at those locations. Should it find files that exist on the local machine at those locations, they will show up in the debugging interface as source maps, reflecting the exact source that is on the machine.

The DWARF file will provide it's own copy of a mapping between code locations and the source, allowing you to set breakpoints in the original file locations. Once you enter in the module code, the Debugger will reference any documented details about the code and memory from the context of that breakpoint.

This allows for providing more contextual and relevant data, such as proper typing. You are able to view properly dereferenced pointers to data-types, structures, and classes. 
