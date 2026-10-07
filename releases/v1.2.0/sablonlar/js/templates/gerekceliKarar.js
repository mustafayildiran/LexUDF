import { centered, row, aciklamalarBaslik, bodyText, signature } from '../core/blocks.js';

export default {
  id: 'gerekceli_karar',
  groupId: 'groupGerekceliKarar',
  label: 'Gerekçeli Karar ve Gider Avansı Talebi',
  aciklamaKisa: 'Kararın gerekçesinin tebliğe çıkarılması ve artan gider avansının iadesi.',

  fields: [
    { key: 'gkMahkemeAdi', upper: true },
    { key: 'gkEsasNo' },
    { key: 'gkKararNo' },
    { key: 'gkTarafRolu', kind: 'select' },
    { key: 'gkTarafAdi' },
    { key: 'gkAvukatAdi' },
    { key: 'artanAvansIadesi', kind: 'checkbox' }
  ],
  required: ['gkMahkemeAdi', 'gkEsasNo', 'gkKararNo', 'gkTarafAdi', 'gkAvukatAdi'],
  requiredMessage: 'Lütfen tüm alanları doldurun.',

  profileFill: { gkAvukatAdi: 'adSoyad' },
  aciklamaDeps: ['artanAvansIadesi'],

  fileName: (p, c) => `GerekceliKararTalebi_${c(p.gkMahkemeAdi)}_${c(p.gkEsasNo)}_${c(p.gkKararNo)}.udf`,

  aciklama(p) {
    let metin = 'Mahkemenizin yukarıda esas numarası belirtilen dosyasında verilen kararın tebliğe çıkarılmasını';
    if (p.artanAvansIadesi) {
      metin += ' ve artan gider avansının tarafımıza iadesini';
    }
    return metin + ' vekâleten talep ederiz.';
  },

  build(doc, p, aciklama) {
    centered(doc, 'T.C.\n');
    centered(doc, p.gkMahkemeAdi + ' MAHKEMESİNE\n\n');
    row(doc, 'DOSYA NO\t\t: ', p.gkEsasNo + ' E., ' + p.gkKararNo + ' K.');
    row(doc, (p.gkTarafRolu === 'davaci' ? 'DAVACI' : 'DAVALI') + '\t\t: ', p.gkTarafAdi);
    row(doc, 'VEKİLİ\t\t: ', 'Av. ' + p.gkAvukatAdi);

    let konu = 'Gerekçeli kararın tebliğe çıkarılması';
    if (p.artanAvansIadesi) {
      konu += ' ve artan gider avansının iadesi';
    }
    row(doc, 'KONU\t\t: ', konu + ' talebidir.');
    aciklamalarBaslik(doc);
    bodyText(doc, aciklama + '\n\n');

    signature(doc, p.gkAvukatAdi);
  }
};
