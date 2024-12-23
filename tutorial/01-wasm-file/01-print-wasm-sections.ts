import fs from 'fs/promises';
import { WasmCustomSection, WasmFile, WasmSection } from '../../src/wasm/wasm-file';
import { BufferedReader } from '../../src/util';

function formatAddress(offset: Number): string {
  const hex = '000'+offset.toString(16);
  return hex.substring(hex.length - 4);
}
function formatType(section: WasmSection): string {
  const sectionId = (''+section.id).padStart(2);
  return `[${sectionId}] ${section.type}`
}

const PATH = './tutorial/demo-wasm-files/minimum.wasm'
const FILE = await fs.readFile(PATH);

const reader = new BufferedReader(FILE);

const file = new WasmFile(reader);

console.log(`WASM version: ${file.version}`)
file.sections.forEach(section => {
  console.log(`0x${formatAddress(section.offset)}: Section ${formatType(section)}`)
  if(section instanceof WasmCustomSection) {
    console.log(`        Name: ${section.name}`)
  }
})
