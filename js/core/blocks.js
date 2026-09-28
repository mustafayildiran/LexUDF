// Şablonlar arasında tekrar eden UDF paragraf kalıpları.
// Her fonksiyon birebir aynı XML'i üretir; şablon dosyaları sadece "ne yazılacağını"
// söyler, "nasıl biçimlendirileceğini" burası bilir.

// Ortalı, kalın başlık (T.C., mahkeme/başsavcılık adı, belge başlığı)
export function centered(doc, text) {
  doc.addPara({ Alignment: '1', LineSpacing: '0.5' }, [{ text, attrs: { bold: 'true' } }]);
}

// "ETİKET\t: değer" satırı (etiket kalın)
export function row(doc, label, value, valueAttrs = {}) {
  doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
    { text: label, attrs: { bold: 'true' } },
    { text: value + '\n', attrs: valueAttrs }
  ]);
}

// Kalın + altı çizili bölüm başlığı
export function sectionTitle(doc, text) {
  doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
    { text, attrs: { bold: 'true', underline: 'true' } }
  ]);
}

export function aciklamalarBaslik(doc) {
  doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
    { text: 'AÇIKLAMALAR\t:\n', attrs: { bold: 'true' } }
  ]);
}

// İlk satır girintili gövde metni (25.51181 puan = 0,9 cm)
export function bodyText(doc, text) {
  doc.addPara({ Alignment: '3', FirstLineIndent: '25.51181', LineSpacing: '0.5' }, [
    { text, attrs: { resolver: 'hvl-default' } }
  ]);
}

// Sağa yaslı imza bloğu
export function signature(doc, avukat) {
  doc.addEmptyLine('2');
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: 'Av. ' + avukat + '\n', attrs: {} }]);
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: 'e-imzalıdır\n', attrs: {} }]);
}
