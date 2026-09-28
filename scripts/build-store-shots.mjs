// Mağaza gönderimi için yeniden üretilebilir ekran görüntüleri.
// Çalıştır: node scripts/build-store-shots.mjs
// Gerçek eklenti dosyasını (popup.html) değiştirmeden, geçici bir kopyada seçim ve
// örnek verileri hazırlayıp Chrome'un headless moduyla 1280×800 PNG üretir.
// Gereken: Node 18+ ve Google Chrome kurulu.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
const outDir = path.resolve(process.cwd(), 'magaza-gorseller');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lexudf-shots-'));

// --- Chrome yolu ---
function findChrome() {
  const cands = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  throw new Error('Google Chrome bulunamadı. Görsel üretimi atlandı.');
}
const chrome = findChrome();

const GROUPS = ['groupSorusturma', 'groupYetkiBelgesi', 'groupCmk', 'groupIcraItiraz', 'groupGerekceliKarar', 'groupKesinlesme'];

// Ekran görüntüsü tanımları — örnek (kurgusal) verilerle doldurulur
const SHOTS = [
  {
    file: 'tanitim-1-sorusturma-inceleme.png',
    option: 'inceleme',
    fill: { bassavcilik: 'BURSA', sorusturma: '2024/999', isim: 'Cem Aydın', avukat: 'Ayşe Yılmaz' }
  },
  {
    file: 'tanitim-2-icra-itiraz.png',
    option: 'icra_itiraz',
    fill: { icraMudurlugu: 'İSTANBUL 1.', icraEsasNo: '2024/77 Esas', borcluAdi: 'Örnek Borçlu A.Ş.', icraAvukat: 'Ayşe Yılmaz' }
  },
  {
    file: 'tanitim-3-uyap-uyarisi.png',
    option: 'inceleme',
    openDetails: ['.uyap-warning'],
    fill: { bassavcilik: 'BURSA', sorusturma: '2024/999', isim: 'Cem Aydın', avukat: 'Ayşe Yılmaz' }
  }
];

// --- Geçici kopyaya js/ ağacını tara (module script'ler file:// üzerinden çalışsın) ---
fs.mkdirSync(path.join(tmp, 'js'), { recursive: true });
for (const d of ['core', 'templates']) {
  fs.cpSync(new URL(`js/${d}`, root), path.join(tmp, 'js', d), { recursive: true });
}
fs.copyFileSync(new URL('js/main.js', root), path.join(tmp, 'js', 'main.js'));

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

fs.mkdirSync(outDir, { recursive: true });
for (const s of SHOTS) {
  let h = read('popup.html');
  // hedef şablonu seçili yap
  h = h.replace(`<option value="${s.option}">`, `<option value="${s.option}" selected>`);
  // yalnızca hedef form grubu görünür olsun
  for (const g of GROUPS) {
    h = h.replace(
      new RegExp(`<div id="${g}"( style="display:none;")?>`),
      `<div id="${g}"${g === groupOf(s.option) ? '' : ' style="display:none;"'}>`
    );
  }
  // örnek verileri doldur
  for (const [id, val] of Object.entries(s.fill || {})) {
    h = h.replace(new RegExp(`(<input type="text" id="${id}")`), `$1 value="${val}"`);
  }
  // <details> öğelerini aç
  for (const sel of s.openDetails || []) {
    h = h.replace(new RegExp(`<details class="${esc(sel)}">`), `<details class="${sel}" open>`);
  }
  const tmpFile = path.join(tmp, s.file.replace(/\.png$/, '.html'));
  fs.writeFileSync(tmpFile, h, 'utf8');

  const out = path.join(outDir, s.file);
  execFileSync(chrome, [
    '--headless=new', '--hide-scrollbars', '--allow-file-access-from-files',
    '--virtual-time-budget=3000', '--window-size=1280,800',
    '--screenshot=' + out,
    'file:///' + tmpFile.split(path.sep).join('/')
  ], { stdio: 'ignore' });

  console.log('✓', s.file, `(${manifest.version}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
}

function groupOf(id) {
  return {
    inceleme: 'groupSorusturma',
    yetki_belgesi: 'groupYetkiBelgesi',
    cmk_kayit: 'groupCmk',
    icra_itiraz: 'groupIcraItiraz',
    gerekceli_karar: 'groupGerekceliKarar',
    kesinlesme_talebi: 'groupKesinlesme'
  }[id];
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + SHOTS.length + ' ekran görüntüsü hazır: magaza-gorseller/');
