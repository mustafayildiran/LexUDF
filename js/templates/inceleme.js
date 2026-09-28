import { centered, row, aciklamalarBaslik, bodyText } from '../core/blocks.js';

export default {
  id: 'inceleme',
  groupId: 'groupSorusturma',
  // Mağaza metinlerinde ve README'de görünen ad. popup.html'deki <option> metni
  // bu değerden senkronize edilir (bkz. scripts/sync-docs.mjs) — tek kaynak burasıdır.
  label: 'Soruşturma Dosyasını İnceleme Talebi (Portal)',
  aciklamaKisa: 'UYAP Avukat Portal üzerinden dosya inceleme yetkisi talebi (müdafi veya vekil).',

  // key: payload anahtarı, id: HTML elemanı (verilmezse key ile aynı)
  fields: [
    { key: 'bassavcilik', upper: true },
    { key: 'sorusturmaNo', id: 'sorusturma' },
    { key: 'rol', kind: 'select' },
    { key: 'isim' },
    { key: 'avukat' }
  ],
  required: ['bassavcilik', 'sorusturmaNo', 'isim', 'avukat'],
  requiredMessage: 'Lütfen tüm alanları doldurun.',

  // Avukat profili seçilince bu elemanlar doldurulur: { elemanId: profilAlani }
  profileFill: { avukat: 'adSoyad' },

  // Bu alanlar değişince (özelleştirme kutusu açıksa) açıklama metni yeniden üretilir
  aciklamaDeps: ['rol'],

  // Sayfa açılışında bir kez çağrılır
  init() {
    const rolSel = document.getElementById('rol');
    const isimLabel = document.getElementById('isimLabel');
    const avukatLabel = document.getElementById('avukatLabel');
    if (!rolSel) return;
    const sync = () => {
      if (rolSel.value === 'supheli') {
        isimLabel.textContent = 'Şüphelinin Adı Soyadı';
        avukatLabel.textContent = 'Müdafiin Adı Soyadı';
      } else {
        isimLabel.textContent = 'Müştekinin Adı Soyadı';
        avukatLabel.textContent = 'Vekilinin Adı Soyadı';
      }
    };
    rolSel.addEventListener('change', sync);
    sync();
  },

  fileName: (p, c) => `SorusturmaInceleme_${c(p.bassavcilik)}_${c(p.sorusturmaNo)}_${c(p.avukat)}.udf`,

  // "AÇIKLAMALAR" altındaki matbu metin — belge ve özelleştirme kutusu AYNI fonksiyonu kullanır
  aciklama(p) {
    const sifat = p.rol === 'supheli' ? 'müdafi olarak' : 'vekil olarak';
    return 'Başsavcılığınızın yukarıda numarası belirtilen soruşturma dosyasının, ' + sifat + ' UYAP Avukat Portal üzerinden tarafımızca incelenebilmesi ve dosya kapsamında bulunan belgelere erişim sağlanabilmesi için gerekli yetkilendirmenin yapılmasını vekâleten talep ederim.';
  },

  build(doc, p, aciklama) {
    const roleLabel = p.rol === 'supheli' ? 'ŞÜPHELİ' : 'MÜŞTEKİ';
    const repLabel = p.rol === 'supheli' ? 'MÜDAFİ' : 'VEKİLİ';

    centered(doc, 'T.C.\n');
    centered(doc, p.bassavcilik + ' CUMHURİYET BAŞSAVCILIĞINA\n');
    row(doc, 'SORUŞTURMA NO.\t: ', p.sorusturmaNo);
    row(doc, roleLabel + '\t\t: ', p.isim);
    row(doc, repLabel + '\t\t: ', p.avukat, { resolver: 'hvl-default' });

    doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
      { text: 'KONU\t\t:', attrs: { resolver: 'hvl-default', bold: 'true' } },
      { text: ' Avukatın Soruşturma Dosyasını İnceleme Talebi (Portal)\n', attrs: { resolver: 'hvl-default' } }
    ]);
    aciklamalarBaslik(doc);
    bodyText(doc, aciklama + '\n');

    // Bu şablonda imza bloğu diğerlerinden farklı (girintili, boş satırsız, e-imzalıdır yok)
    doc.addPara({ Alignment: '2', FirstLineIndent: '25.51181', LineSpacing: '0.5' }, [
      { text: 'Av. ', attrs: { resolver: 'hvl-default' } },
      { text: p.avukat + '\n', attrs: {} }
    ]);
  }
};
