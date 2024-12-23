The associated demo will read the `minimum.wasm` files and print out the sections.

By looking at the section names and offsets, and comparing them to the hex of the file, you can read the associated data.

We can validate our output by checking the offset, checking the section type ID, and checking for custom sections if they consist next with a name-length and hex name.

```
Custom ".dylink.0" at 0x08
00000000  -- -- -- -- -- -- -- --  00 0f 08 64 79 6c 69 6e  |.asm.......dylin|
00000010  6b 2e 30 01 04 00 00 00  00 -- -- -- -- -- -- --  |k.0.........`..`|
```

``` 
Section "type" at 0x19
00000010  -- -- -- -- -- -- -- -- -- 01 09 02 60 00 00 60  |k.0.........`..`|
```

``` 
Section "import" at 0x24
00000020  -- -- -- -- 02 5a 04 03  65 6e 76 0d 5f 5f 6d 65  |.....Z..env.__me|
```

```
Section "funcion" at 0x80
00000080  03 03 02 00 01 07 1b 02  11 5f 5f 77 61 73 6d 5f  |.........__wasm_|
00000090  63 61 6c 6c 5f 63 74 6f  72 73 00 00 03 61 64 64  |call_ctors...add|
```

Full Output:
```
WASM version: 1
0x0008: Section [ 0] custom
        Name: dylink.0
0x0019: Section [ 1] type
0x0024: Section [ 2] import
0x0080: Section [ 3] function
0x0085: Section [ 7] export
0x00a2: Section [10] code
0x00b0: Section [ 0] custom
        Name: name
0x0101: Section [ 0] custom
        Name: sourceMappingURL
0x0125: Section [ 0] custom
        Name: .debug_abbrev
0x017d: Section [ 0] custom
        Name: .debug_info
0x01e5: Section [ 0] custom
        Name: .debug_str
0x0284: Section [ 0] custom
        Name: .debug_line
0x02e9: Section [ 0] custom
        Name: target_features
```

Initial HEX of minimum.wasm
```
00000000  00 61 73 6d 01 00 00 00  00 0f 08 64 79 6c 69 6e  |.asm.......dylin|
00000010  6b 2e 30 01 04 00 00 00  00 01 09 02 60 00 00 60  |k.0.........`..`|
00000020  01 7f 01 7f 02 5a 04 03  65 6e 76 0d 5f 5f 6d 65  |.....Z..env.__me|
00000030  6d 6f 72 79 5f 62 61 73  65 03 7f 00 03 65 6e 76  |mory_base....env|
00000040  0c 5f 5f 74 61 62 6c 65  5f 62 61 73 65 03 7f 00  |.__table_base...|
00000050  03 65 6e 76 06 6d 65 6d  6f 72 79 02 00 00 03 65  |.env.memory....e|
00000060  6e 76 19 5f 5f 69 6e 64  69 72 65 63 74 5f 66 75  |nv.__indirect_fu|
00000070  6e 63 74 69 6f 6e 5f 74  61 62 6c 65 01 70 00 00  |nction_table.p..|
00000080  03 03 02 00 01 07 1b 02  11 5f 5f 77 61 73 6d 5f  |.........__wasm_|
00000090  63 61 6c 6c 5f 63 74 6f  72 73 00 00 03 61 64 64  |call_ctors...add|
000000a0  00 01 0a 0c 02 02 00 0b  07 00 20 00 41 01 6a 0b  |.......... .A.j.|
000000b0  00 4f 04 6e 61 6d 65 00  0d 0c 6d 69 6e 69 6d 75  |.O.name...minimu|
000000c0  6d 2e 77 61 73 6d 01 19  02 00 11 5f 5f 77 61 73  |m.wasm.....__was|
000000d0  6d 5f 63 61 6c 6c 5f 63  74 6f 72 73 01 03 61 64  |m_call_ctors..ad|
000000e0  64 07 1e 02 00 0d 5f 5f  6d 65 6d 6f 72 79 5f 62  |d.....__memory_b|
000000f0  61 73 65 01 0c 5f 5f 74  61 62 6c 65 5f 62 61 73  |ase..__table_bas|
00000100  65 00 22 10 73 6f 75 72  63 65 4d 61 70 70 69 6e  |e.".sourceMappin|
00000110  67 55 52 4c 10 6d 69 6e  69 6d 75 6d 2e 77 61 73  |gURL.minimum.was|
00000120  6d 2e 6d 61 70 00 56 0d  2e 64 65 62 75 67 5f 61  |m.map.V..debug_a|
00000130  62 62 72 65 76 01 11 01  25 0e 13 05 03 0e 10 17  |bbrev...%.......|
00000140  1b 0e 11 01 12 06 00 00  02 2e 01 11 01 12 06 40  |...............@|
00000150  18 97 42 19 03 0e 3a 0b  3b 0b 27 19 49 13 3f 19  |..B...:.;.'.I.?.|
00000160  00 00 03 05 00 02 18 03  0e 3a 0b 3b 0b 49 13 00  |.........:.;.I..|
00000170  00 04 24 00 03 0e 3e 0b  0b 0b 00 00 00 00 66 0b  |..$...>.......f.|
00000180  2e 64 65 62 75 67 5f 69  6e 66 6f 56 00 00 00 04  |.debug_infoV....|
...
```