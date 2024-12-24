
## WASM DWARF

This tutorial section is an attempt to document my findings with implementation of adding DWARF debugging information to an existing WASM module compiled using AssemblyScript.

The goal of this section is to explain the structure of a WASM module, the structure of a DWARF debugging section, what is required and supported by existing Chrome Developer tools to allow debugging, and how the transform process attempts to automate the process of taking a compiled AssemblyScript WASM module and transform it via adding extra debugging information.


### Table of Contents

  1. What is a WASM file
     1. Intro
     2. Sections
     3. Custom Sections
     4. Modification
    
  2. WASM debugging
     1. Intro
     2. Without any debug info 
     3. With Source Maps
     4. With DWARF
    
  3. What are source maps
     1. Intro
     2. Encoding
     3. Un-mapped Generated Code
     4. File lists 
     5. Mapping byte to source
    
  4. What is dwarf 
     1. Intro
     2. Sections
        + Lines
        + Info
        + Abbrev
        + Ranges
        + String
        + Types
     3. Dwarf Wasm Segments
    
  5. Step 1 - Hello World
     1. Intro
     2. How to construct lines
     3. Mapping SourceMap v3
     4. Building a Line Code
     5. Outputting sample
     6. Testing
	     1. Set breakpoint
	     2. Set incorrect breakpoint

  6. Step 2 - Calling a Function
     1. Intro
     2. Abbrev :
        1. How to build a CU
        2. How to build a Function
        3. How to build a string
        4. How to build a range
        5. How to build a type
     3. Using Abbrev
     4. Using Types
     5. Brief example
        1. const
        2. Ref
        3. Pointer
     6. Info :
     7. Outputting the blocks
     8. Testing
        1. With Abbrev types
        2. With Types
     9. Modifying 
        1. Change signed/unsigned

  7. Step 3 - creating more types - basic
        1. Intro
        2. Use previous sample
        3. Create range of basic AS types
        4. U8,S8,16,32,64
        5. String 
        6. Set on mem block, with pointers
        7. Set breakpoint
        8. Run sample
	        1. Show that all samples show correct type

  8. Step 4 - structs
        1. Intro
        2. Use previous example
        3. Create type that has all previous
        4. Run sample
        5. Show all data from single pointer
        6. Added functions
        7. Show calling method on struct
        8. Show accessing self

  9. Step 5- Global 
        1. Intro
        2. Create new simple example with function
        3. Create global DIE
        4. Show demo
        5. Accessing

  10. Local variables
        1. Intro
        2. Set named locals
        3. Demo
	        1. With
	        2. Without

  11. Loops and Blocks
        1. Intro
        2. For-loop
        3. Nested for-loop
        4. Multiple scoped blocks

  12. In lining
        1. How to mark function as inline
        2. How to trace back
        3. Demo of using simple inline and using break points 

  13. Doing an ASTransform Intro
        1. Gathering Functions
        2. Gathering Globals
        3. Gathering Types
        4. Deriving CUs

  14. Compiling all together
