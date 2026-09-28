// Çalıştır: node scripts/sync-docs.mjs
// Şablon listesini ve sayılarını TEK KAYNAKTAN (js/templates/*.js) dokümanlara yazar.
// Yeni şablon eklediğinizde veya adını değiştirdiğinizde burayı çalıştırın; README,
// mağaza açıklaması ve popup.html kendiliğinden güncellenir.
// Böylece "6 şablon" gibi sayılar hiçbir yerde elle tutulmaz.
import fs from 'node:fs';
import { templates } from '../js/templates/index.js';
import { goldenCases } from '../tests/golden.mjs';

const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const write = (p, s) => fs.writeFileSync(new URL(p, root), s, 'utf8');

const START = '<!-- ŞABLON-LİSTESİ:BAŞ (scripts/sync-docs.mjs tarafından üretilir, elle düzenlemeyin) -->';
const END = '<!-- ŞABLON-LİSTESİ:BİT -->';

const manifest = JSON.parse(read('manifest.json'));
const surum = manifest.version;
const n = templates.length;

// --- Üretilen bloklar (biçim: readme | magaza | popup) ---
const asReadmeTable = () => [
  '| # | Şablon | Ne zaman kullanılır |',
  '|---|--------|----------------------|',
  ...templates.map((t, i) => `| ${i + 1} | ${t.label} | ${t.aciklamaKisa} |`)
].join('\n');

const asStoreList = () => templates.map(t => `• ${t.label}\n  ${t.aciklamaKisa}`).join('\n');

const asPopupOptions = () => templates
  .map(t => `      <option value="${t.id}">${t.label}</option>`)
  .join('\n');

// Kısa açıklama: manifest.json'ın description alanı (Chrome'da 132 karakter sınırı)
const asShortDescription = () => manifest.description;

const SHORT_START = '<!-- KISA-ACIKLAMA:BAŞ (manifest.json description alanı) -->';
const SHORT_END = '<!-- KISA-ACIKLAMA:BİT -->';

// --- Bir dosyadaki işaretli bloğu güncelle ---
function replaceBlock(text, block, file, start = START, end = END) {
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i === -1 || j === -1) throw new Error(`${file}: işaretli blok bulunamadı (${start})`);
  if (j < i) throw new Error(`${file}: işaretler ters sırada`);
  return text.slice(0, i + start.length) + '\n' + block + '\n' + text.slice(j);
}

// 1) README.md
{
  const p = 'README.md';
  let t = read(p);
  t = replaceBlock(t, asReadmeTable(), p);
  // Sayıları da kaynakla eşle (elle yazılmış kalmasın).
  t = t.replace(/^DURUMLU_SABLON_SAYISI$/m, String(n));
  t = t.replace(/^GOLDEN_DOSYA_SAYISI$/m, String(goldenCases().length));
  write(p, t);
  console.log('✓ README.md güncellendi');
}

// 2) MAGAZA_ACIKLAMASI.md
{
  const p = 'MAGAZA_ACIKLAMASI.md';
  let t = read(p);
  t = replaceBlock(t, asStoreList(), p);
  t = t.replace(/^DURUMLU_SABLON_SAYISI$/m, String(n));
  t = t.replace(/SÜRÜM_NUMARASI/g, surum);
  t = replaceBlock(t, asShortDescription(), p, SHORT_START, SHORT_END);
  write(p, t);
  console.log('✓ MAGAZA_ACIKLAMASI.md güncellendi');
}

// 3) popup.html — <option> metinleri şablon adlarıyla eşleşsin
{
  const p = 'popup.html';
  let t = read(p);
  const before = t;
  for (const tpl of templates) {
    const re = new RegExp(`(<option value="${tpl.id}">)[^<]*(</option>)`);
    if (!re.test(t)) throw new Error(`popup.html: ${tpl.id} option'u yok`);
    t = t.replace(re, `$1${tpl.label}$2`);
  }
  if (t !== before) { write(p, t); console.log('✓ popup.html <option> metinleri güncellendi'); }
  else console.log('· popup.html zaten güncel');
}

console.log(`\n${n} şablon kaynak alındı. Kalabalık bilgiler (süreç/yol) dokümanlara gömüldü.`);
