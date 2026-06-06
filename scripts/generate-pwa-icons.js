const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Brand color: #5D4AA8 (Iris purple)
const R = 0x5D, G = 0x4A, B = 0xA8;

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function generatePNG(size) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data: filter byte (0) + RGB pixels per row
  const rowSize = 1 + size * 3;
  const rawData = Buffer.allocUnsafe(size * rowSize);
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // filter none
    for (let x = 0; x < size; x++) {
      rawData[rowStart + 1 + x * 3] = R;
      rawData[rowStart + 1 + x * 3 + 1] = G;
      rawData[rowStart + 1 + x * 3 + 2] = B;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, '../apps/web/public');

fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), generatePNG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), generatePNG(512));

console.log('Generated icon-192x192.png and icon-512x512.png');
