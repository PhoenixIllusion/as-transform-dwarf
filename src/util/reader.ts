
export const textDecoder = new TextDecoder();

export interface Reader {
  getU8(): number;
  getS8(): number;
  getU16(): number;
  getS16(): number;
  getU32(): number;
  getS32(): number;
  getU64(): bigint;
  getS64(): bigint;
  getF32(): number;
  getF64(): number
  getULEB128(): number;
  getSLEB128(): number;
  getString(len: number): string;
  getNullTermString(): string;
  getBuffer(len: number): Uint8Array;
  position(): number;
  seek(pos: number): void;
  readonly length: number;
}

type DataViewOp<T extends number|bigint> = (byteOffset: number, littlEndian?: boolean) => T;

export class BufferedReader implements Reader {
  public _position = 0;
  private _dataview: DataView;
  constructor(private _uint8: Uint8Array) {
    this._dataview = new DataView(_uint8.buffer);
  }
  getU8(): number {
        return this._dataView_op(this._dataview.getUint8,  1);;
  }
  getS8(): number {
        return this._dataView_op(this._dataview.getInt8,  1);;
  }
  getU16() {
        return this._dataView_op(this._dataview.getUint16,  2);
  }
  getS16() {
        return this._dataView_op(this._dataview.getInt16,  2);
  }
  getU32() {
        return this._dataView_op(this._dataview.getUint32,  4);
  }
  getS32() {
        return this._dataView_op(this._dataview.getInt32,  4);
  }
  getF32() {
        return this._dataView_op(this._dataview.getFloat32,  4);
  }
  getU64() {
    return this._dataView_op(this._dataview.getBigUint64, 8);
  }
  getS64() {
    return this._dataView_op(this._dataview.getBigInt64, 8);
  }
  getF64() {
    return this._dataView_op(this._dataview.getFloat64, 8);
  }

  seek(v: number) {
    this._position = v;
  }
  position(): number {
    return this._position;
  }
  get length(): number {
    return this._uint8.byteLength;
  }

  getULEB128() {
    let Value = 0;
    let Byte = 0;
    let Shift = 0;
    do {
      Byte = this.getU8();
      let Slice = Byte & 0x7F;
      Value |= Slice << Shift;
      Shift += 7;
    } while (Byte >= 0x80);
    return Value;
  }
  getSLEB128() {
    let Value = 0;
    let Byte = 0;
    let Shift = 0;
    do {
      Byte = this.getU8();
      let Slice = Byte & 0x7F;
      Value |= Slice << Shift;
      Shift += 7;
    } while (Byte >= 0x80);
    if (Shift < 64 && (Byte & 0x40))
      Value |= Number.MAX_SAFE_INTEGER << Shift;
    return Value;
  }

  getString(len: number): string {
    return textDecoder.decode(this._buffer_copy(len));
  }

  getNullTermString(): string {
    const i = this._uint8.indexOf(0, this._position);
    return textDecoder.decode(this._buffer_copy(i-this._position));
  }
  getBuffer(len: number): Uint8Array {
    return this._buffer_copy(len);
  }

  private _dataView_op<T extends number|bigint>(op: DataViewOp<T>, byteLength: number): T {
    const ret = op.bind(this._dataview)(this._position, true)
    this._position += byteLength;
    return ret;
  }
  private _buffer_copy(length: number): Uint8Array {
    const res = new Uint8Array(this._uint8.subarray(this._position, this._position + length));
    this._position += length;
    return res;
  }


}
export function lift_string(section: Uint8Array, offset: number): string | null {
  const i = section.indexOf(0, offset);
  if (i >= 0) {
    return textDecoder.decode(section.slice(offset, i));
  }
  return null;
}