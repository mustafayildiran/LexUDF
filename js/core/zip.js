// Tek dosyalı, deflate-raw sıkıştırmalı minimal ZIP üretici (UDF = içinde content.xml olan ZIP).

function makeCrc32Table() {
  let c; const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) { c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)); }
    table[n] = c;
  }
  return table;
}
const crc32Table = makeCrc32Table();

export function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

export async function createZipBlob(filename, uncompressedData) {
  const encoder = new TextEncoder();
  const fileBytes = encoder.encode(uncompressedData);
  const fileCrc = crc32(fileBytes);
  const uncompressedSize = fileBytes.length;

  const stream = new Blob([fileBytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const compressedBuffer = await new Response(stream).arrayBuffer();
  const compressedBytes = new Uint8Array(compressedBuffer);
  const compressedSize = compressedBytes.length;

  const fileNameBytes = encoder.encode(filename);
  const fileNameLen = fileNameBytes.length;

  const localHeaderLen = 30 + fileNameLen;
  const cdHeaderLen = 46 + fileNameLen;
  const eocdLen = 22;

  const totalLen = localHeaderLen + compressedSize + cdHeaderLen + eocdLen;
  const zipBuffer = new Uint8Array(totalLen);
  const view = new DataView(zipBuffer.buffer);

  // Local file header
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 8, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, fileCrc, true);
  view.setUint32(18, compressedSize, true);
  view.setUint32(22, uncompressedSize, true);
  view.setUint16(26, fileNameLen, true);
  view.setUint16(28, 0, true);
  zipBuffer.set(fileNameBytes, 30);

  zipBuffer.set(compressedBytes, localHeaderLen);

  // Central directory
  const cdOffset = localHeaderLen + compressedSize;
  view.setUint32(cdOffset, 0x02014b50, true);
  view.setUint16(cdOffset + 4, 20, true);
  view.setUint16(cdOffset + 6, 20, true);
  view.setUint16(cdOffset + 8, 0, true);
  view.setUint16(cdOffset + 10, 8, true);
  view.setUint16(cdOffset + 12, 0, true);
  view.setUint16(cdOffset + 14, 0, true);
  view.setUint32(cdOffset + 16, fileCrc, true);
  view.setUint32(cdOffset + 20, compressedSize, true);
  view.setUint32(cdOffset + 24, uncompressedSize, true);
  view.setUint16(cdOffset + 28, fileNameLen, true);
  view.setUint16(cdOffset + 30, 0, true);
  view.setUint16(cdOffset + 32, 0, true);
  view.setUint16(cdOffset + 34, 0, true);
  view.setUint16(cdOffset + 36, 0, true);
  view.setUint32(cdOffset + 38, 0, true);
  // Local header offset: tek dosyalı arşivde local header her zaman 0'dadır.
  // (Eskiden buraya yanlışlıkla cdOffset yazılıyordu; UYAP/Java tabanlı sıkı
  // okuyucularda dosyanın bozuk görünmesine yol açabilirdi.)
  view.setUint32(cdOffset + 42, 0, true);
  zipBuffer.set(fileNameBytes, cdOffset + 46);

  // End of central directory
  const eocdOffset = cdOffset + cdHeaderLen;
  view.setUint32(eocdOffset, 0x06054b50, true);
  view.setUint16(eocdOffset + 4, 0, true);
  view.setUint16(eocdOffset + 6, 0, true);
  view.setUint16(eocdOffset + 8, 1, true);
  view.setUint16(eocdOffset + 10, 1, true);
  view.setUint32(eocdOffset + 12, cdHeaderLen, true);
  view.setUint32(eocdOffset + 16, cdOffset, true);
  view.setUint16(eocdOffset + 20, 0, true);

  return zipBuffer;
}
