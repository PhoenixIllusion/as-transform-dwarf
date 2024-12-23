type ArrayBufferLike = {
  buffer: ArrayBuffer;
  byteLength: number;
  byteOffset: number;
  length: number;
} & ArrayLike<number>

export const encoder = new TextEncoder();

export interface Writer {
  writeU8(v: number): void;
  writeS8(v: number): void;
  writeU16(v: number): void;
  writeS16(v: number): void;
  writeU32(v: number): void;
  writeS32(v: number): void;
  writeU64(v: bigint): void;
  writeS64(v: bigint): void;
  writeF32(v: number): void;
  writeF64(v: number): void;
  writeULEB128(v: number): void;
  writeSLEB128(v: number): void;
  writeString(s: string): void;
  writeNullTermString(s: string): void;
  writeByteArray(b: ArrayLike<number>): void;
  writeBuffer(b: ArrayBufferLike): void;
  position(): number;
  seek(pos: number);
  toBuffer(): Uint8Array;
}

export function writeULEB128(value: number): number[] {
  const result: number[] = [];

  while (value > 0x7f) {
    result.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }

  result.push(value);
  return result;
}

export function writeSLEB128(value: number) {
  const result: number[] = [];

  while (true) {
    let byte = value & 0x7f;
    value >>= 7;

    if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
      result.push(byte);
      break;
    } else {
      byte |= 0x80;
      result.push(byte);
    }
  }

  return result;
}

type DataViewOp<T extends number|bigint> = (byteOffset: number, value:T, littlEndian?: boolean) => void;

export class BufferedWriter implements Writer {
  private _position = 0;

  private _buffer: Uint8Array;
  private _dataview: DataView;

  constructor(private initialBufferSize: number = 1024*1024) {
    this._buffer = new Uint8Array(this.initialBufferSize);
    this._dataview = new DataView(this._buffer.buffer);
  }
  writeU8(v: number): void {
    this._dataView_op(this._dataview.setUint8,v,1);
  }
  writeS8(v: number): void {
    this._dataView_op(this._dataview.setInt8,v,1);
  }
  writeU16(v: number): void {
    this._dataView_op(this._dataview.setUint16,v,2);
  }
  writeS16(v: number): void {
    this._dataView_op(this._dataview.setInt16,v,2);
  }
  writeU32(v: number): void {
    this._dataView_op(this._dataview.setUint32,v,4);
  }
  writeS32(v: number): void {
    this._dataView_op(this._dataview.setInt32,v,4);
  }
  writeU64(v: bigint): void {
    this._dataView_op(this._dataview.setBigUint64,v,8);
  }
  writeS64(v: bigint): void {
    this._dataView_op(this._dataview.setBigInt64,v,8);
  }
  writeF32(v: number): void {
    this._dataView_op(this._dataview.setFloat32,v,4);
  }
  writeF64(v: number): void {
    this._dataView_op(this._dataview.setFloat64,v,8);
  }
  writeULEB128(v: number): void {
    this.writeByteArray(writeULEB128(v))
  }
  writeSLEB128(v: number): void {
    this.writeByteArray(writeSLEB128(v))
  }
  writeString(s: string): void {
    this._buffer_copy(encoder.encode(s));
  }
  writeNullTermString(s: string): void {
    this.writeString(s+'\0');
  }
  writeByteArray(b: ArrayLike<number>): void {
    this._buffer_copy(new Uint8Array(b));
  }
  writeBuffer(b: ArrayBufferLike): void {
    this._buffer_copy(new Uint8Array(b.buffer, b.byteOffset, b.byteLength));
  }
  position(): number {
    return this._position;
  }
  seek(pos: number) {
    this._position = pos;
  }
  toBuffer(): Uint8Array {
    return new Uint8Array(this._buffer.slice(0, this._position));
  }

  private _growIfNeeded( newLen: number) {
    if(newLen > this._buffer.length) {
      const tmp = new Uint8Array(this.initialBufferSize + newLen);
      tmp.set(this._buffer, 0);
      this._buffer = tmp;
      this._dataview = new DataView(this._buffer.buffer);
    }
  }
  private _dataView_op<T extends number|bigint>(op: DataViewOp<T>, value: T, byteLength: number) {
    this._growIfNeeded(this._position + byteLength);
    op.bind(this._dataview)(this._position, value, true)
    this._position += byteLength;
  }
  private _buffer_copy(uint8: Uint8Array) {
    this._growIfNeeded(this._position + uint8.length);
    this._buffer.set(uint8, this._position);
    this._position += uint8.length;
  }
}