import { centered, row, aciklamalarBaslik, bodyText, signature } from '../core/blocks.js';

export default {
  id: 'kesinlesme_talebi',
  groupId: 'groupKesinlesme',

  fields: [
    { key: 'kesMahkemeAdi', upper: true },
    { key: 'kesEsasNo' },
    { key: 'kesKararNo' },
    { key: 'kesTarafRolu', kind: 'select' },
    { key: 'kesTarafAdi' },
    { key: 'kesAvukatAdi' }
  ],
  required: ['kesMahkemeAdi', 'kesEsasNo', 'kesKararNo', 'kesTarafAdi', 'kesAvukatAdi'],
  requiredMessage: 'Lütfen tüm alanları doldurun.',

  profileFill: { kesAvukatAdi: 'adSoyad' },
  aciklamaDeps: [],

  fileName: (p, c) => `KesinlesmeTalebi_${c(p.kesMahkemeAdi)}_${c(p.kesEsasNo)}_${c(p.kesKararNo)}.udf`,

  aciklama() {
    return 'Mahkemenizce verilen kararın kesinleşmesine ilişkin şartların oluştuğu gözetilerek kesinleşme şerhinin düzenlenmesini vekâleten talep ederiz.';
  },

  build(doc, p, aciklama) {
    centered(doc, 'T.C.\n');
    centered(doc, p.kesMahkemeAdi + ' MAHKEMESİNE\n\n');
    row(doc, 'DOSYA NO\t\t: ', p.kesEsasNo + ' E., ' + p.kesKararNo + ' K.');
    row(doc, (p.kesTarafRolu === 'davaci' ? 'DAVACI' : 'DAVALI') + '\t\t: ', p.kesTarafAdi);
    row(doc, 'VEKİLİ\t\t: ', 'Av. ' + p.kesAvukatAdi);
    row(doc, 'KONU\t\t: ', 'Kararın kesinleştirilmesi ve şerh verilmesi talebidir.');
    aciklamalarBaslik(doc);
    bodyText(doc, aciklama + '\n\n');

    signature(doc, p.kesAvukatAdi);
  }
};
