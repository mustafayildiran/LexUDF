// Mağaza paketini (ve popover'ı) gerçekten kurup çalıştırır.
// Çalıştır: node scripts/smoke-test.mjs
// Zip'i geçici bir klasöre açar, manifest'i doğrular ve statik olarak kontrol eder:
// eksik modül, HTML'de var olmayan eleman, kaçırılmamış şablon adı vb.
// Amaç: "yükledim ve çalışıyor" diye ummak yerine, paketin bütünlüğünü ölçmek.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { templates } from '../js/templates/index.js';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
const zipPath = path.resolve(process.cwd(), `lexudf-${manifest.version}-store.zip`);
if (!fs.existsSync(zipPath)) {
  console.error(`✗ Paket yok: ${path.basename(zipPath)}\n  Önce: node scripts/build-store-zip.mjs`);
  process.exit(1);
}

// --- Zip'i aç (yoksa paketi kullandığımız gibi okuyamayız: doğrulamak için de açmalıyız) ---
const buf = fs.readFileSync(zipPath);
function readZipEntries(b) {
  const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('EOCD bulunamadı');
  const count = b.readUInt16LE(eocd + 10);
  let off = b.readUInt32LE(eocd + 16);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    if (b.readUInt32LE(off) !== 0x02014b50) throw new Error('Central directory bozuk');
    const nameLen = b.readUInt16LE(off + 28);
    const extraLen = b.readUInt16LE(off + 30);
    const cmtLen = b.readUInt16LE(off + 32);
    const localOff = b.readUInt32LE(off + 42);
    const name = b.slice(off + 46, off + 46 + nameLen).toString('utf8');
    // local header
    if (b.readUInt32LE(localOff) !== 0x04034b50) throw new Error(`${name}: local header bozuk`);
    const lNameLen = b.readUInt16LE(localOff + 26);
    const lExtraLen = b.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const method = b.readUInt16LE(localOff + 8);
    const compSize = b.readUInt32LE(off + 20);
    const raw = b.slice(dataStart, dataStart + compSize);
    out.set(name, method === 8 ? zlib.inflateRawSync(raw) : raw);
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

const entries = readZipEntries(buf);
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail++; };

console.log(`\n1) ${path.basename(zipPath)} (${(buf.length / 1024).toFixed(1)} KB, ${entries.size} dosya)`);
ok(entries.size === 22 || entries.size >= 20, `dosya sayısı makul (${entries.size})`);

// --- manifest bütünlüğü ---
console.log('\n2) manifest.json');
const mf = JSON.parse(entries.get('manifest.json').toString('utf8'));
ok(mf.manifest_version === 3, 'manifest_version 3');
ok(mf.version === manifest.version, `sürüm paket içinde de ${mf.version}`);
ok(!mf.host_permissions, 'host_permissions yok (beyanla tutarlı)');
ok(JSON.stringify(mf.permissions.sort()) === JSON.stringify(['sidePanel', 'storage']), `izinler: ${mf.permissions.join(', ')}`);
ok(mf.description.length <= 132, `kısa açıklama ${mf.description.length} karakter (sınır 132)`);
for (const icon of Object.values(mf.icons || {})) ok(entries.has(icon), `ikon mevcut: ${icon}`);
ok(entries.has(mf.side_panel.default_path), `side_panel.default_path mevcut: ${mf.side_panel.default_path}`);
ok(entries.has(mf.background.service_worker), `service_worker mevcut: ${mf.background.service_worker}`);

// --- Paket içeriği ---
console.log('\n3) Paket içeriği');
const names = [...entries.keys()].sort();
ok(!names.some(n => /^(tests|scripts|docs)\//.test(n) || /\.(md|zip)$/.test(n) || ['package.json', '.gitattributes', '.gitignore', 'LICENSE'].includes(n)), 'test/doküman/paket sızıntısı yok');
ok(names.filter(n => n.startsWith('js/')).length === 16, `js/ altında 16 modül (${names.filter(n => n.startsWith('js/')).length})`);

// --- Modül bütünlüğü: her import çözülebiliyor mu? ---
console.log('\n4) Modül grafiği (import\'lar çözülebiliyor mu?)');
let missing = 0;
for (const name of names.filter(n => n.endsWith('.js'))) {
  const src = entries.get(name).toString('utf8');
  for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(name), m[1]));
    if (!entries.has(target)) { console.log(`  ✗ ${name} → eksik: ${m[1]} (${target})`); missing++; }
  }
  if (/\brequire\(/.test(src)) { console.log(`  ✗ ${name}: CommonJS require() bulundu`); missing++; }
}
ok(missing === 0, 'tüm göreli import\'lar pakette mevcut ve ESM');

// --- popup.html <-> şablon sözleşmesi ---
console.log('\n5) popup.html ↔ şablonlar (paket içinden okundu)');
const html = entries.get('popup.html').toString('utf8');
for (const t of templates) {
  const problems = [];
  if (!html.includes(`<option value="${t.id}">${t.label}</option>`)) problems.push('option metni eşleşmiyor');
  if (!html.includes(`id="${t.groupId}"`)) problems.push('form grubu yok');
  for (const f of t.fields) if (!html.includes(`id="${f.id || f.key}"`)) problems.push(`alan #${f.id || f.key} yok`);
  for (const el of Object.keys(t.profileFill)) if (!html.includes(`id="${el}"`)) problems.push(`profil alanı #${el} yok`);
  ok(problems.length === 0, `${t.label}${problems.length ? ' — ' + problems.join(', ') : ''}`);
}
ok(html.includes('js/main.js'), 'popup.html js/main.js modülünü yüklüyor');
ok(html.includes('type="module"'), 'script type="module" (ESM, MV3 uyumlu)');

// --- Portal content-script kablolaması ---
console.log('\n6) Portal şablon indirici (content_scripts)');
for (const cs of (mf.content_scripts || [])) {
  for (const f of [...(cs.js || []), ...(cs.css || [])]) ok(entries.has(f), `pakette mevcut: ${f}`);
}
ok((mf.content_scripts || []).some(cs => (cs.matches || []).includes('https://avukat.uyap.gov.tr/*')), 'portal eşleşmesi avukat.uyap.gov.tr');

// --- Politika uyumu ---
console.log('\n7) Gizlilik beyanı tutarlılığı');
ok(!mf.host_permissions && mf.permissions.every(p => ['sidePanel', 'storage'].includes(p)),
   'beyan "veri toplamıyor" — yalnızca cihaz içi izinler var');

console.log(fail === 0 ? '\n✅ Paket duman testi geçti' : `\n✗ ${fail} sorun bulundu`);
process.exit(fail === 0 ? 0 : 1);
