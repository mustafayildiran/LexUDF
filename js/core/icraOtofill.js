// İcra otomatik doldurma — saf fonksiyonlar (DOM yok, Node'da test edilir).
// UYAP icra dosya sayfasındaki başlık + taraf satırlarını panel formu alanlarına çevirir.
// Kural: elle doldurma her zaman mümkün; bu modül sadece öneri değer üretir.

export const OTOFILL_KEY = 'lexudf.otofill';
export const OTOFILL_ISTEK_KEY = 'lexudf.otofill-istek';
export const OTOFILL_DURUM_KEY = 'lexudf.otofill-durum';

function normalizeTr(text) {
  if (!text) return '';
  return text
    .replace(/[\[\]]/g, '')
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function normalizeNameTokens(name) {
  return normalizeTr(name)
    .replace(/^av\.?\s+/, '')
    .replace(/\s+av\.?$/, '')
    .split(/[\s\-.]+/)
    .map(t => t.replace(/[^a-z]/g, ''))
    .filter(t => t.length > 1);
}

// Giriş yapan avukatla vekil hücresini karşılaştırır ([AD], "Av. Ad", "-" toleranslı).
// Soyad + en az bir ad tokeni tutmalı.
export function isAttorneyMatch(attorneyName, vekilText) {
  const aToks = normalizeNameTokens(attorneyName);
  const vToks = normalizeNameTokens(vekilText);
  if (aToks.length === 0 || vToks.length === 0) return false;
  const aSurname = aToks[aToks.length - 1];
  if (!vToks.includes(aSurname)) return false;
  const common = aToks.filter(t => vToks.includes(t));
  return common.length >= 2 || aToks.length === 1;
}

// "2026/123456 Konya 7. İcra Dairesi - İcra Dosyası" -> { icraEsasNo, mudurlukHam }
// Türkçe büyük harf (İ/I/ı/i) farkına dayanıklı: eşleşme toLocaleLowerCase('tr') üstünden.
// Türkçe büyük harf (İ/I/ı/i) farkına dayanıklı: eşleşme toLocaleLowerCase('tr') +
// ASCII katlama üstünden (uzunluk korunur, orijinal dilimleme güvenli).
function foldTr(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
}
export function parseIcraBaslik(metin) {
  if (!metin) return null;
  const s = String(metin).replace(/\s+/g, ' ').trim();
  const fl = foldTr(s);
  // 1) "2026/123456 Konya 7. İcra Dairesi - İcra Dosyası" (kart başlığı)
  let m = fl.match(/^(\d+\/\d+)\s+(.+?)\s*-\s*icra dosyasi\s*$/);
  if (m) {
    const sonek = ' - icra dosyasi';
    const idx = fl.lastIndexOf(sonek);
    if (idx < 0) return null;
    return { icraEsasNo: s.slice(0, m[1].length).trim(), mudurlukHam: s.slice(m[1].length, idx).trim() };
  }
  // 2) "Yalova İcra Dairesi 2026/12814" (pencere başlığı, soneksiz).
  // Dava başlıklarıyla karışmaması için "icra" ibaresi şart.
  m = fl.match(/^(.+)\s+(\d+\/\d+)\s*$/);
  if (m && /\bicra\s+(dairesi|mudurlugu)/.test(m[1])) {
    const idx = s.lastIndexOf(m[2]);
    if (idx < 0) return null;
    return { icraEsasNo: m[2], mudurlukHam: s.slice(0, idx).trim() };
  }
  return null;
}

// "Konya 7. İcra Dairesi" -> "Konya 7." ; "İSTANBUL 1." -> aynen.
// Şablon zaten sonuna " İCRA MÜDÜRLÜĞÜNE" eklediği için sonek burada temizlenir.
export function normalizeMudurluk(ham) {
  if (!ham) return '';
  const t = String(ham).trim();
  const fl = foldTr(t);
  const m = fl.match(/^(.*)\s+icra\s+(dairesi|mudurlugu)\s*\.?\s*$/);
  if (!m) return t;
  return t.slice(0, m[1].length).trim() || t;
}

export function isBorclu(rol) {
  return normalizeTr(rol).includes('borclu');
}

// satirlar: [{ rol, adi, vekil }], avukatAdi: giriş yapan avukat.
// Önce vekil eşleşen borçlular, yoksa tüm borçlular (kullanıcı eler).
export function mapIcraOtofill(baslikMetni, satirlar, avukatAdi) {
  const parsed = parseIcraBaslik(baslikMetni);
  const borclular = (satirlar || []).filter(s => s && isBorclu(s.rol) && (s.adi || '').trim());
  const eslesen = borclular.filter(s => isAttorneyMatch(avukatAdi, s.vekil || ''));
  const secilen = eslesen.length > 0 ? eslesen : borclular;
  return {
    icraMudurlugu: parsed ? normalizeMudurluk(parsed.mudurlukHam) : '',
    icraEsasNo: parsed ? parsed.icraEsasNo : '',
    borcluAdi: secilen.map(s => (s.adi || '').trim()).filter(Boolean).join(', ')
  };
}
