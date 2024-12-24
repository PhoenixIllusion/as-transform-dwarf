
## What is DWARF 

### Intro

[DWARF](https://dwarfstd.org/) is a debugging data format that includes additional information about associated compiled code such as executables and libraries. It is structured into sections, and is included in the debuggable output of many compilers, such as LLVM.

Given the existing support for DWARF output in C/C++ compilers, Emscripten includes DWARF data when a binary is compiled with the `-g` flag.

Due to the fact that the debug data is stored along-side the binary, but is still distinct and self contained, it is possible to compile and store the DWARF data in a secondary file during compilation, and trivial to strip the data out of the binary at a later time by simply removing the debug related sections. 

All data below can be viewed on a compiled debuggable WASM module using the verbose output of `dwarfdump --all -v <file>.wasm`

### Sections

DWARF data distinct sections, which exist in a WASM module as their own marked Type 0 Custom Sections with unique names, each preceded by the string `.debug_` . Due to DWARF data being defined in it's own section format, the WASM file will also include DWARF section headers, self-contained inside the WASM Custom Section:

* Custom Section
	* name ".debug_line"
	*  Custom Data - binary block
	     * DWARF Section Header
	     * DWARF Section Data   

The first 5 sections listed below are some of the most fundamental sections. Although it may be possible to avoid the need to include some of these sections through inlining data, this is not a common practice.

#### Lines

The `.debug_line` (non-plural) section includes the equivalent of the V3 Source-Map data. DWARF Line sections include a section called "Line Code", which attempts to minify the logic of the SourceMap VQL, allowing in some cases a instruction to require only a single byte of data to indicate a line change.

Beyond marking instructions to single bytes of data, the "Line Code" is also required to indicate the concept of "sequences", which defines that a given instruction, if followed, will return execution.

In the case of the following:

```typescript
function add( a: uint32, b: uint32): uint32 {
  return a + b;
}
```

and the hypothetical structure:
```
function add ($a, $b) 
  // establish stack
  // copy $a to stack
  // copy $b to stack
  read $a
  read $b
  add $a + $b
  return
```

This function is considered a "sequence" of execution. Many Line Code hints help in decisions when a user has breakpointed a given line in the program, so that it knows if some instructions should be skipped over during a breakpoint to best fit the original source codes intentions.

Based on the "Line Code" data, this means that:
* prologue_end - The breakpoint should at least run the stack setup of the code, such that all local_stack values have been read. In the above, the first 3 lines would be skipped as prologue as users do not expect to step through the stack-generation process.
* epilogue_begin - If a function's compilation results in compiler generated cleanup process at the end, after the actual practical execution and true purpose has been fulfilled, it would be marked with `epilogue_begin` in the Line Code
* is_stmt - This indicates the indicated byte starts a sequence of instructions that may constitute a unified statement. If a user attempts to breakpoint this line in the debugger, the instruction should stop at this byte. In the above example, all instructions execute on the supplied line of "return a + 1", but you may wish to mark just the "return" as the breakpoint. More complex  instructions, such as `return a + foo(b)` may wish to treat this as two statements, and allow breakpointing to trigger at the instructions for both pre `foo` and pre `return`

This section is defined in a layout of:

1. Header - Includes the version of the  line program
	* Configuration
		* rules regarding op-code encoding
			* LINE_RANGE, LINE_BASE, OP_BASE
		* rules regarding defaults for is_stmt
	* List of Zero or more directories, outside of auto-included "default (compile directory)"
	* List of Files, with directory-of-file. Specifying Directory Zero is "default (compile directory)". Directory 1 is the first listed directory above, should any exist.

  2. Line Byte Code
    This code mirrors the V3 JSON data, under the assumption that each function will restart the same [ byte, file, line, column] pattern. Although marked as 'special_op_codes', one of the biggest features of encoding the source-map is this feature. Through using the above configuration header, any value over a certain number is instead treated as a command "add or subtract lines from previous value" and "add X to byte address"

     It tend to loop through all valid data from a source-map ind perform the following logic:
```
calculate delta of [byte, file, line, column]
if file !== 0:
  write command 'set file'
if column !== 0:
  write command 'set column'
if byte > special_op jumpable address
  write command 'add address'; byte = 0;
if line delta is out of range of special_op
  write command 'add line SLEB128'; line = 0;
** mark as Sequence End if needed
else
function special_op( byte: number, line: number) {
  return byte * LINE_RANGE + line - LINE_BASE + OP_BASE;
}
```

#### Info

The DWARF info section defines the conceptual layout of a compiled application.

These are defined as trees of nodes (Debug Information Entry, DIE), each DIE being a TAG, and each TAG having attributes and children. You may see these documented in the DWARF manual [DWARF4.pdf documents on page 8](https://dwarfstd.org/doc/DWARF4.pdf)

At the top level, it includes (exhaustively):
* Files - referred to as CU (compilation units)
	* Inside, a file contains
		* Global Variables
		* Functions
			* Parameters
			* Return
			* Local Variables
		* Types
			* Pointers
			* Constants
			* References
			* Structs
			* Primitives
		* Additional meta-data

These values are encode, one CU at a time, combined with any nested internal values. Each CU is assumed to be stand-alone, and should be fully comprehendible without needing to parse the subsequent CU, but you will need to read any referenced external sections (Abbrev, Ranges, Strings, possibly Types)

All data structure is defined by a "template" defined in the "Abbrev section", which includes the TAG, number of attributes, and if a 
The data of a given TAG is written in the pattern:

1. Abbrev code (entry index into Abbrev section)
2. Sequence of Values, as defined by Abbrev entry
3. Any children. If there are children, write the children and end with an Abbrev Code zero `0x00`

#### Abbrev

The Abbrev section consists solely of a sequence of "Templates", terminated by an Abbrev code zero, essentially a null-terminator.

These templates describe the actual Entries used in the Info section. They consist of an Entry Type (DW_TAG) , Entry Attributes (DW_AT), and Entry Attribute Form-factors (DW_FORM).

One such as the hypothetical combination of the following three entries.:

```
DW_TAG_structure_type
  DW_AT_name
	  DW_FORM_strp : "my_struct"
  DW_AT_byte_size:
	  DW_FORM_data1 : 4
  has_children: YES
DW_TAG_member:
	DW_AT_data_member_location
		DW_FORM_data1: 0
	DW_AT_name
		DW_FORM_strp: "a"
	DW_AT_type
		DW_FORM_ref4: address(defined type int)
DW_TAG_base_type
	DW_AT_name
		DW_FORM_strp : "int"
	DW_AT_encoding
		DW_FORM_data1
```
 I have filled out the actual values, but the Abbrev would consist only of the TAG, AT, and FORM. Values would be encoded in the `.debug_info` section above.

```
Abbrev:
[1] // Abbreviation Code
[DW_TAG_structure_type]
[YES] // has children
[DW_AT_name][DW_FORM_strp]
[DW_AT_byte_size][DW_FORM_data1]
[0,0] //terminate attribute list

[2] // Abbreviation Code
[DW_TAG_member]
[NO] // has children
[DW_AT_data_member_location][]
[DW_AT_name][DW_FORM_strp]
[DW_AT_type][DW_FORM_ref4]
[0,0] //terminate attribute list
...
[0] //terminate Abbrev
```

#### Ranges

The `.debug_ranges` section includes a list of 2 values, each indicating a "low" and "high" value, and terminating with two null values [0,0] for low and high. These ranges may be used in any Attribute that needs a range, such as what ranges of a given file are associated with a given CU. This allows for a breakpoint on a function to be associated with a given CU, even if all the functions have been optimized to be located at random locations within a file. This section is composed exclusively of these pairs of u32 values and a null terminating pair.

#### String

All references above to "strp" are offset index into this section, `.debug_str`. This section is composed exclusively of null terminated strings, with no header or footer.

#### Types

For cases with multiple CU, you may have compound and complex structures and unit types that may be referenced. In this case, but not for cases of primitives, it may be beneficial to add in a `.debug_types` section. A types section consist of a similar structure to a `.debug_info` type, and is built almost exactly the same way, but has the following structure.

* type_unit
	* defined type 1
	* defined type 2
	* defined type 3

```
.debug_abbrev:
DW_TAG_type_unit
  DW_AT_name
    DW_FORM_strp "my_module::my_struct"
  DW_AT_signature
    DW_FORM_data8 "8-byte-hash"
  has_children: YES

DW_TAG_base_type
  DW_AT_name
    DW_FORM_strp: "my_struct"
  DW_byte_length
    DW_FORM_data1: 4
```

In usage, the CU that wishes to use any of these types will still need to declare a local reference to a type, by declaring a `DW_TAG_imported_unit` DIE. Should more than one type be defined under the unit and need to be imported, it will also need a child DIE, `DW_TAG_imported_declaration`specifying the offset into the unit.

### DWARF Wasm Segments

Each DWARF section is encoded into it's own Custom Section, and is thus self contained and treated and validated independently by the DWARF debugging toolkit of the WASM runtime.

There is no required order for the specific sections per definition, but there is a commonly specified order that is used and would not hurt to follow. 

1. **.debug_abbrev**: Abbreviation table.
2. **.debug_info**: Compilation unit headers and DIEs.
3. **.debug_line**: Line number information.
4. **.debug_types**: Type information.
5. **.debug_ranges**: Address ranges.
6. **.debug_str**: Strings.