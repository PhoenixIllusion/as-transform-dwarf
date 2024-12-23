import { BufferedReader, Reader } from '../util';

export class Buffer {
  constructor(public buffer: Uint8Array, public offset: number ) {}
  toReader(): Reader {
    return new BufferedReader(this.buffer);
  }
}

const sectionType = [
  'custom',   // 0
  'type',     // 1
  'import',   // 2
  'function', // 3
  'table',    // 4
  'memory',   // 5
  'global',   // 6
  'export',   // 7
  'start',    // 8
  'element',  // 9
  'code',     // 10
  'data',     // 11
  'data-count',     // 12,
  'tag',      // 13
  'strings'   // 14
];

export class WasmSection extends Buffer {
  type: string;
  constructor(public id: number, public reader: Reader) {
    const type = sectionType[id];
    const offset = reader.position() - 1;
    const sectionLength = reader.getULEB128();
    super(reader.getBuffer(sectionLength), offset);
    this.type = type;
  }
}

export class WasmCustomSection extends WasmSection {
  name: string;
  custom: Buffer;
  constructor(id: number, reader: Reader) {
    super(id, reader);
    this.readCustomDataHeader();
  }
  private readCustomDataHeader() {
    const reader = this.toReader();
    const nameSize = reader.getULEB128();
    this.name = reader.getString(nameSize);
    const customOffset = this.offset + reader.position();
    this.custom = new Buffer(this.buffer.slice(reader.position()), customOffset);
  }
}


export class WasmFile {
  version: number;
  sections: WasmSection[]
  constructor(reader: Reader) {
    const MAGIC = reader.getBuffer(4)
    if (!(MAGIC[0] === 0x0 && MAGIC[1] === 0x61 && MAGIC[2] === 0x73 && MAGIC[3] === 0x6d)) {
      throw new Error('Invalid wasm file, incorrect magic word, got ' + [...MAGIC.slice(0, 4)].map(x => x.toString(16)));
    }
    this.version = reader.getU32();
    const sections: WasmSection[] = [];
    while(reader.position() < reader.length) {
      const type = reader.getU8();
      if(type == 0) {
        sections.push(new WasmCustomSection(type, reader));
      } else {
        sections.push(new WasmSection(type, reader));
      }
    }
    this.sections = sections;
  }
}