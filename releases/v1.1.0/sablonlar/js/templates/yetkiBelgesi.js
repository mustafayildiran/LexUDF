import { centered, row, sectionTitle, bodyText, signature } from '../core/blocks.js';

export default {
  id: 'yetki_belgesi',
  groupId: 'groupYetkiBelgesi',
  label: 'Yetki Belgesi',
  aciklamaKisa: 'Avukatlık ortaklığı veya tek avukattan diğerine, dosya kapsamında yetki devri.',

  fields: [
    { key: 'yvAvukat' }, { key: 'yvBaro' }, { key: 'yvVergi' }, { key: 'yvAdres' },
    { key: 'ykAvukat' }, { key: 'ykBaro' }, { key: 'ykVergi' }, { key: 'ykAdres' },
    { key: 'vekilEden' }, { key: 'vekaletNoter' },
    { key: 'mahkemeAdi' }, { key: 'mahkemeEsas' }
  ],
  required: ['yvAvukat', 'ykAvukat', 'vekilEden', 'mahkemeAdi', 'mahkemeEsas'],
  requiredMessage: 'Lütfen zorunlu alanları doldurun.',

  profileFill: { yvAvukat: 'adSoyad', yvBaro: 'baro', yvVergi: 'vergi', yvAdres: 'adres' },
  // [Köşeli] alanlar formdan otomatik doldurulur (bkz. core/placeholders.js)
  placeholders: {
    'Mahkeme Adı': p => p.mahkemeAdi,
    'Mahkeme Esas No': p => p.mahkemeEsas
  },
  aciklamaDeps: [],

  fileName: (p, c) => `YetkiBelgesi_${c(p.mahkemeAdi)}_${c(p.mahkemeEsas)}_${c(p.ykAvukat)}.udf`,

  // İki paragraf da metnin doğal parçası: kullanıcı özelleştirme kutusunda hepsini düzenleyebilir/silebilir.
  aciklama() {
    const paragraf1 = 'Yalnızca [Mahkeme Adı] [Mahkeme Esas No] Esas sayılı dosyaya şamil olmak üzere duruşmalara katılmaya, dilekçe, beyan ve soru sunmaya, delil sunmaya ve tüm yargılama faaliyetlerini yürütmeye, kararın tebliğini talep etmeye ve tebliğ almaya tarafımca yetki verilmiştir. İşbu yetki, müvekkilin haklarını korumak amacıyla vekaletname kapsamındaki yetkilerim çerçevesinde devredilmiştir.';
    const paragraf2 = 'Bu yetki belgesi, 1136 sayılı Avukatlık Kanunu’nu değiştiren 4667 sayılı Kanun’un 36. maddesi ile 56. maddesine eklenen hüküm uyarınca, vekaletname yerine geçmek üzere, tarafımdan düzenlenmiştir.';
    return paragraf1 + '\n\n' + paragraf2;
  },

  build(doc, p, aciklama) {
    centered(doc, 'III\n');
    centered(doc, 'YETKİ BELGESİ\n');
    doc.addEmptyLine('1');

    sectionTitle(doc, 'YETKİ BELGESİ VEREN AVUKAT/AVUKATLIK ORTAKLIĞI\n');
    row(doc, 'AD VE SOYADI\t\t: ', 'Av. ' + p.yvAvukat);
    row(doc, 'BARO VE SİCİL NO\t\t: ', p.yvBaro);
    row(doc, 'VERGİ DAİRESİ VE SİCİL NO\t: ', p.yvVergi);
    row(doc, 'ADRES\t\t\t: ', p.yvAdres);
    doc.addEmptyLine('3');

    sectionTitle(doc, 'YETKİLİ KILINAN AVUKAT\n');
    row(doc, 'AD VE SOYADI\t\t: ', 'Av. ' + p.ykAvukat);
    row(doc, 'BARO VE SİCİL NO\t\t: ', p.ykBaro);
    row(doc, 'VERGİ DAİRESİ VE SİCİL NO\t: ', p.ykVergi);
    row(doc, 'ADRES\t\t\t: ', p.ykAdres);
    doc.addEmptyLine('3');

    sectionTitle(doc, 'VEKİL EDEN\n');
    row(doc, 'AD VE SOYADI\t\t: ', p.vekilEden);
    row(doc, 'DAYANAK BELGE\t\t: ', p.vekaletNoter);
    doc.addEmptyLine('3');

    sectionTitle(doc, 'YETKİ BELGESİNİN KAPSAMI\n');
    bodyText(doc, aciklama + '\n');

    signature(doc, p.yvAvukat);
  }
};
