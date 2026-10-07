// Matbu şablonlar için UYAP otomatik doldurma — saf fonksiyonlar (DOM yok).
// Yetki belgesi hariç: sayfada karşılığı olmayan alanlar (noter, baro, karar no)
// doldurulmaz, kullanıcı elle yazar. Avukat adı profile bırakılır (üzerine yazılmaz).
// Alan anahtarları paneldeki eleman id'leridir (örn. inceleme: `sorusturma`).

import { parseIcraBaslik, normalizeMudurluk, isAttorneyMatch, isBorclu } from './icraOtofill.js';

export { OTOFILL_KEY, OTOFILL_ISTEK_KEY } from './icraOtofill.js';
export { parseIcraBaslik, normalizeMudurluk, isAttorneyMatch, isBorclu };

function foldTr(s) {
  return String(s || '').toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

// SANIK / ŞÜPHELİ / SSÇ -> 'supheli', diğerleri -> 'musteki' (inceleme + cmk).
export function rolSupheliMi(roller) {
  const list = (Array.isArray(roller) ? roller : [roller]).map(foldTr);
  const mudafi = list.some(r =>
    r.includes('sanik') || r.includes('supheli') || r.includes('suruklenen') ||
    (r.includes('suc') && r.includes('cocuk')));
  return mudafi ? 'supheli' : 'musteki';
}

// 'davaci' / 'davali' geçiyorsa çevir, emin değilsen '' (elle seçilir).
export function rolDavaciMi(roller) {
  const list = (Array.isArray(roller) ? roller : [roller]).map(foldTr);
  if (list.some(r => r.includes('davaci'))) return 'davaci';
  if (list.some(r => r.includes('davali'))) return 'davali';
  return '';
}

// Başsavcılık alanı il/ilçe adı bekler ("YALOVA"); mahkeme metninden ilk kelime alınır.
export function sehirCikar(mahkeme) {
  const s = String(mahkeme || '').replace(/\s+/g, ' ').trim();
  return s ? s.split(' ')[0] : '';
}

function muvekkiller(taraflar, avukatAdi) {
  const list = taraflar || [];
  const eslesen = list.filter(t => isAttorneyMatch(avukatAdi, t.vekil || ''));
  return eslesen.length ? eslesen : [];
}

// header: { mahkeme, dosyaNo }, taraflar: [{ rol, adi, vekil }]
// Dönen nesne panel eleman id'leriyle anahtarlıdır; boşlar atılmaz, panel boşları atlar.
export function mapDavaOtofill(sablon, header, taraflar, avukatAdi) {
  const mahkeme = (header?.mahkeme || '').trim();
  const dosyaNo = (header?.dosyaNo || '').trim();
  const mvk = muvekkiller(taraflar, avukatAdi);
  const ilkMvk = mvk[0] || null;
  const roller = mvk.map(t => t.rol);

  switch (sablon) {
    case 'inceleme':
      return {
        bassavcilik: sehirCikar(mahkeme),
        sorusturma: dosyaNo,
        rol: roller.length ? rolSupheliMi(roller) : '',
        isim: ilkMvk ? ilkMvk.adi : ''
      };
    case 'cmk_kayit':
      return {
        cmkBassavcilik: sehirCikar(mahkeme),
        cmkSorusturmaNo: dosyaNo,
        cmkRol: roller.length ? rolSupheliMi(roller) : '',
        cmkTarafIsim: ilkMvk ? ilkMvk.adi : ''
      };
    case 'gerekceli_karar': {
      const r = roller.length ? rolDavaciMi(roller) : '';
      const out = { gkMahkemeAdi: mahkeme, gkEsasNo: dosyaNo, gkTarafAdi: ilkMvk ? ilkMvk.adi : '' };
      if (r) out.gkTarafRolu = r;
      return out;
    }
    case 'kesinlesme_talebi': {
      const r = roller.length ? rolDavaciMi(roller) : '';
      const out = { kesMahkemeAdi: mahkeme, kesEsasNo: dosyaNo, kesTarafAdi: ilkMvk ? ilkMvk.adi : '' };
      if (r) out.kesTarafRolu = r;
      return out;
    }
    default:
      return {};
  }
}
