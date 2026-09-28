// Golden test vakaları — UYAP tarafından kabul edilmiş 1.3.0 çıktılarının dondurulmuş hali.
// Hem tests/update-golden.mjs (referans üretimi) hem tests/run.mjs (karşılaştırma) burayı kullanır,
// böylece iki scriptin ürettiği vakalar asla birbirinden sapmaz.
// Yeni şablon/varyant ekleyince: çıktıyı UYAP'ta doğruladıktan SONRA `node tests/update-golden.mjs`.

// run.mjs bölüm 1 ile AYNI örnek veri (değiştirirseniz golden'ları yeniden üretin).
export const goldenBase = {
  yvAvukat: 'Ayşe Yılmaz', yvBaro: 'İstanbul Barosu 12345', yvVergi: 'Kadıköy VD 111', yvAdres: 'Moda Cad. No:1',
  ykAvukat: 'Mehmet Öztürk', ykBaro: 'Ankara Barosu 999', ykVergi: 'Çankaya VD 222', ykAdres: 'Kızılay Sk. No:2',
  vekilEden: 'Şükrü Çelik', vekaletNoter: 'Kadıköy 5. Noterliği 01.02.2024 - 1234',
  mahkemeAdi: 'İstanbul 3. Asliye Ticaret Mahkemesi', mahkemeEsas: '2024/123',
  cmkBassavcilik: 'YALOVA', cmkSorusturmaNo: '2024/55', cmkTarafIsim: 'Ali Veli', cmkAvukat: 'Ayşe Yılmaz',
  icraMudurlugu: 'İSTANBUL 1.', icraEsasNo: '2024/77 Esas', borcluAdi: 'Ğüzel ışık A.Ş.', icraAvukat: 'Ayşe Yılmaz',
  gkMahkemeAdi: 'ANKARA 2. ASLİYE HUKUK', gkEsasNo: '2023/10', gkKararNo: '2024/20', gkTarafAdi: 'Fatma Şahin', gkAvukatAdi: 'Ayşe Yılmaz',
  kesMahkemeAdi: 'İZMİR 4. SULH HUKUK', kesEsasNo: '2022/5', kesKararNo: '2023/9', kesTarafAdi: 'Özgür Ünal', kesAvukatAdi: 'Ayşe Yılmaz',
  bassavcilik: 'BURSA', sorusturmaNo: '2024/999', isim: 'Cem Aydın', avukat: 'Ayşe Yılmaz'
};

export const goldenOzelMetin = 'Özel metin ]]> & <b> "tırnak"\nİkinci satır';

export const goldenVariants = {
  inceleme:          [{ rol: 'supheli' }, { rol: 'musteki' }],
  yetki_belgesi:     [{}],
  cmk_kayit:         [{ cmkRol: 'supheli' }, { cmkRol: 'musteki' }],
  icra_itiraz:       [{}],
  gerekceli_karar:   [{ gkTarafRolu: 'davaci', artanAvansIadesi: true }, { gkTarafRolu: 'davali', artanAvansIadesi: false }],
  kesinlesme_talebi: [{ kesTarafRolu: 'davaci' }, { kesTarafRolu: 'davali' }]
};

const slugExtra = extra => {
  const parts = Object.entries(extra).map(([k, v]) => `${k}-${v}`);
  return parts.length ? parts.join('_') : 'varsayilan';
};

// [{ name, templateId, payload }] — name, tests/golden/<name>.xml dosya adıdır.
export function goldenCases() {
  const cases = [];
  for (const [id, extras] of Object.entries(goldenVariants)) {
    for (const extra of extras) {
      for (const yaziTipi of ['Times New Roman', 'Cambria']) {
        for (const [ozelToggle, ozelMetin] of [[false, ''], [true, goldenOzelMetin]]) {
          const name = [id, slugExtra(extra), yaziTipi === 'Cambria' ? 'cambria' : 'times', ozelToggle ? 'ozel' : 'normal'].join('__');
          cases.push({
            name,
            templateId: id,
            payload: { ...goldenBase, ...extra, dilekceTuru: id, yaziTipi, ozelToggle, ozelMetin }
          });
        }
      }
    }
  }
  return cases;
}
