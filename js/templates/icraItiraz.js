import { centered, row, aciklamalarBaslik, bodyText, signature } from '../core/blocks.js';

export default {
  id: 'icra_itiraz',
  groupId: 'groupIcraItiraz',

  fields: [
    { key: 'icraMudurlugu', upper: true },
    { key: 'icraEsasNo' },
    { key: 'borcluAdi' },
    { key: 'icraAvukat' }
  ],
  required: ['icraMudurlugu', 'icraEsasNo', 'borcluAdi', 'icraAvukat'],
  requiredMessage: 'Lütfen tüm alanları doldurun.',

  profileFill: { icraAvukat: 'adSoyad' },
  aciklamaDeps: [],

  fileName: (p, c) => `IcraItiraz_${c(p.icraMudurlugu)}_${c(p.icraEsasNo)}_${c(p.borcluAdi)}.udf`,

  // Üç paragraf; paragraflar arası boş satır (\n\n). Belgede her biri ayrı paragraf olarak yazılır.
  aciklama() {
    return [
      'Yukarıda esas numarası belirtilen icra dosyası kapsamında tarafıma ilamsız icra takibi başlatılmış ve ödeme emri gönderilmiştir. Yasal süresi içerisinde itirazlarımı sunuyorum.',
      'Alacaklı olduğunu iddia eden tarafça başlatılan işbu icra takibine ve ödeme emrine; takip konusu borcun tamamına, borcun tamamına ilişkin işlemiş ve işleyecek faizin tamamına, faiz oranına, faiz başlangıç tarihine, icra takip giderlerine, vekâlet ücretine ve ödeme emrinde yer alan veya yer almayan tüm asli ve fer’î alacak kalemlerine ayrı ayrı ve açıkça itiraz ediyorum.',
      'Yukarıda belirtilen hususların tamamına yasal süresi içerisinde açıkça itiraz ettiğimin kabulü ile icra takibinin durdurulmasına karar verilmesini vekâleten talep ederim.'
    ].join('\n\n');
  },

  build(doc, p, aciklama) {
    // Kullanıcı "İCRA MÜDÜRLÜĞÜ" ibaresini de yazdıysa tekrarlanmasın.
    // NOT: \b Türkçe harflerle (İ, Ü, Ğ) çalışmaz; bu yüzden boşluk/satır sınırı kullanılıyor.
    const temizMudurluk = p.icraMudurlugu.replace(/(^|\s)İCRA\s*MÜDÜRLÜĞÜ(?=\s|$)/g, '$1').trim();

    centered(doc, 'T.C.\n');
    centered(doc, temizMudurluk + ' İCRA MÜDÜRLÜĞÜNE\n\n');
    row(doc, 'ESAS NO\t\t: ', p.icraEsasNo);
    row(doc, 'BORÇLU\t\t: ', p.borcluAdi);
    row(doc, 'VEKİLİ\t\t: ', 'Av. ' + p.icraAvukat);
    row(doc, 'KONU\t\t: ', 'BORCA, FAİZE VE TÜM FERİLERE İTİRAZ HK.');
    aciklamalarBaslik(doc);
    // Metindeki her satır grubu ayrı paragraf (her biri 0,9 cm ilk satır girintili); son paragrafın sonunda ekstra boş satır.
    // Özelleştirme kutusunda kullanıcı Enter ile yeni paragraf açarsa o da ayrı paragraf olur.
    const paragraflar = aciklama.split(/\n+/).filter(t => t.trim());
    paragraflar.forEach((metin, i) => {
      bodyText(doc, metin + (i === paragraflar.length - 1 ? '\n\n' : '\n'));
    });

    signature(doc, p.icraAvukat);
  }
};
