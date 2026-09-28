import { centered, row, aciklamalarBaslik, bodyText, signature } from '../core/blocks.js';

export default {
  id: 'cmk_kayit',
  groupId: 'groupCmk',

  fields: [
    { key: 'cmkBassavcilik', upper: true },
    { key: 'cmkSorusturmaNo' },
    { key: 'cmkRol', kind: 'select' },
    { key: 'cmkTarafIsim' },
    { key: 'cmkAvukat' }
  ],
  required: ['cmkBassavcilik', 'cmkSorusturmaNo', 'cmkTarafIsim', 'cmkAvukat'],
  requiredMessage: 'Lütfen tüm alanları doldurun.',

  profileFill: { cmkAvukat: 'adSoyad' },
  aciklamaDeps: [],

  fileName: (p, c) => `CMK_Kayit_${c(p.cmkBassavcilik)}_${c(p.cmkSorusturmaNo)}_${c(p.cmkAvukat)}.udf`,

  aciklama() {
    return 'Başsavcılığınızın yukarıda soruşturma numarası belirtilen dosyasında, Ceza Muhakemesi Kanunu kapsamında görevlendirilmiş bulunmaktayım. Görevlendirmeye ilişkin işlemlerin yürütülmesi amacıyla dosyada vekil kaydımın yapılmasını vekâleten talep ederim.';
  },

  build(doc, p, aciklama) {
    const isMudafi = p.cmkRol === 'supheli';
    const tarafTitle = isMudafi ? 'ŞÜPHELİ' : 'MÜŞTEKİ';
    const avTitle = isMudafi ? 'MÜDAFİ' : 'VEKİLİ';

    centered(doc, 'T.C.\n');
    centered(doc, p.cmkBassavcilik + ' CUMHURİYET BAŞSAVCILIĞINA\n\n');
    row(doc, 'SORUŞTURMA NO\t: ', p.cmkSorusturmaNo);
    row(doc, tarafTitle + '\t\t: ', p.cmkTarafIsim);
    row(doc, avTitle + '\t\t: ', 'Av. ' + p.cmkAvukat);
    row(doc, 'KONU\t\t: ', 'CMK uyarınca zorunlu ' + (isMudafi ? 'müdafi' : 'vekil') + ' kaydımızın yapılması ve dosya erişim yetkisi verilmesi talebidir.');
    aciklamalarBaslik(doc);
    bodyText(doc, aciklama + '\n\n');

    signature(doc, p.cmkAvukat);
  }
};
