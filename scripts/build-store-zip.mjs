// Yayın paketi (Chrome Web Store zip) üretir.
// Çalıştır: node scripts/build-store-zip.mjs
// Pakete yalnızca eklentinin çalışması için gereken dosyalar girer; testler,
// dokümanlar ve geliştirme araçları dışarıda kalır. Harici araç gerektirmez.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
const version = manifest.version;

const files = ['manifest.json', 'background.js', 'popup.html', 'icon16.png', 'icon48.png', 'icon128.png'];

function collectJs(dir, acc = []) {
  for (const entry of fs.readdirSync(new URL(dir, root), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) collectJs(rel, acc);
    else if (entry.name.endsWith('.js')) acc.push(rel);
  }
  return acc;
}
files.push(...collectJs('js'));

// Portal şablon indirici (UYAP Avukat Portal content-script + stili)
files.push('portal/content-uyap-sablon.js', 'portal/content-uyap-sablon.css');

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

// --- ZIP yaz (deflate, dost zaman damgaları: 1980-01-01) ---
const DOS_TIME = 0, DOS_DATE = 33; // 1980-01-01 00:00
const chunks = [];
let offset = 0;
const central = [];

for (const rel of files) {
  const name = rel.split(path.sep).join('/');
  const nameBytes = Buffer.from(name, 'utf8');
  const raw = fs.readFileSync(new URL(rel, root));
  const deflated = zlib.deflateRawSync(raw, { level: 9 });
  const crc = crc32(raw);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);   // UTF-8 dosya adı bayrağı
  local.writeUInt16LE(8, 8);       // deflate
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(deflated.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  local.writeUInt16LE(0, 28);
  chunks.push(local, nameBytes, deflated);

  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0x0800, 8);
  cd.writeUInt16LE(8, 10);
  cd.writeUInt16LE(DOS_TIME, 12);
  cd.writeUInt16LE(DOS_DATE, 14);
  cd.writeUInt32LE(crc, 16);
  cd.writeUInt32LE(deflated.length, 20);
  cd.writeUInt32LE(raw.length, 24);
  cd.writeUInt16LE(nameBytes.length, 28);
  // CD alanları (46 bayt): 30=extra+comment, 34=disk+internal attrs,
  // 38=external attrs (DOS), 42=local header offset. Son ikisi karıştırılırsa
  // okuyucu "overlapped entries" hatası verir.
  cd.writeUInt32LE(0, 30);
  cd.writeUInt32LE(0, 34);
  cd.writeUInt32LE(0, 38);
  cd.writeUInt32LE(offset, 42);
  central.push(Buffer.concat([cd, nameBytes]));

  offset += local.length + nameBytes.length + deflated.length;
}

const cdBuf = Buffer.concat(central);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(cdBuf.length, 12);
eocd.writeUInt32LE(offset, 16);

const outName = `lexudf-${version}-store.zip`;
const outPath = path.resolve(process.cwd(), outName);
fs.writeFileSync(outPath, Buffer.concat([...chunks, cdBuf, eocd]));

console.log(`✓ ${outName} oluşturuldu (${files.length} dosya, sürüm ${version}, ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
files.forEach(f => console.log('   ' + f.split(path.sep).join('/')));

// --- Paket doğrulaması (kendi ürettiğimiz listeyi denetle) ---
const yasak = files.filter(f => /^(tests|scripts)\//.test(f) || /\.(md|zip)$/.test(f)
  || /^(package\.json|\.gitattributes|\.gitignore)$/.test(f));
if (yasak.length) { console.error('\n✗ Pakete yolmaması gereken dosyalar sızdı:', yasak); process.exit(1); }

for (const gerekli of ['manifest.json', 'background.js', 'popup.html', 'js/main.js', 'js/templates/index.js', 'portal/content-uyap-sablon.js', 'portal/content-uyap-sablon.css', 'icon16.png', 'icon48.png', 'icon128.png'])
  if (!files.includes(gerekli)) { console.error('\n✗ Pakette eksik:', gerekli); process.exit(1); }

console.log('\n✓ Paket temiz: yalnızca çalışma dosyaları içeriyor.');
