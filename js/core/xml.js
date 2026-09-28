// UDF (content.xml) üretiminin düşük seviyeli yardımcıları.
// Şablonlar bu dosyadaki createDocument() ile paragraf ekler; offset/uzunluk
// hesabı ve XML kaçışları burada tek yerde yapılır.

export function sanitizeXmlText(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

// UDF'nin startOffset/length alanları KOD NOKTASI sayar (bkz. golden testi).
// JS .length ise UTF-16 birimi sayar ve emoji gibi astral karakterlerde 2 sayar,
// bu da offset'lerin kaymasına yol açardı. Düzeltilmiş (birleşik) sayım.
export function textLength(s) {
  let n = 0;
  for (const _ of s) n++;
  return n;
}

export function escapeCdata(text) {
  return sanitizeXmlText(text).replace(/]]>/g, ']]]]><![CDATA[>');
}

export function escapeXmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function attrsToStr(a) {
  let s = '';
  for (const k in a) {
    s += ' ' + k + '="' + escapeXmlAttr(a[k]) + '"';
  }
  return s;
}

export function createDocument(font) {
  let offset = 0;
  let fullText = '';
  let bodyParas = '';

  function addPara(pAttrs, runs) {
    let inner = '';
    for (const r of runs) {
      const rawText = escapeCdata(r.text);
      const len = textLength(rawText);
      inner += '<content' + attrsToStr(r.attrs || {}) + ' startOffset="' + offset + '" length="' + len + '" />';
      fullText += rawText;
      offset += len;
    }
    bodyParas += '<paragraph' + attrsToStr(pAttrs) + '>' + inner + '</paragraph>';
  }

  function addEmptyLine(alignment = '3') {
    addPara({ Alignment: alignment, LineSpacing: '0.5' }, [{ text: '\n', attrs: {} }]);
  }

  // SAF FONKSİYON: belge durumunu (offset/fullText) değiştirmez.
  // Footer hesabı yerel kopyalar üzerinde yapılır; böylece toXml() kaç kez
  // çağrılırsa çağrılsın aynı XML'i döndürür (önceden footer iki kez eklenirdi).
  function toXml() {
    let off = offset;
    let text = fullText;
    let footerInner = '';
    // font bir <select> değeridir ama savunma amaçlı kaçırılır (aşağıdaki styles satırı).
    const safeFont = escapeXmlAttr(font);
    const t1 = '5070 Sayılı Kanuna Göre Güvenli Elektronik İmza ile İmzalanmıştır.';
    footerInner += '<content size="8" foreground="-196608" startOffset="' + off + '" length="' + textLength(t1) + '" />';
    text += t1; off += textLength(t1);
    const t2 = '\n';
    footerInner += '<content family="' + safeFont + '" size="12" description="Gövde" startOffset="' + off + '" length="' + textLength(t2) + '" />';
    text += t2; off += textLength(t2);
    text += '\n';

    return '<?xml version="1.0" encoding="UTF-8" ?> \n\n<template format_id="1.8" >\n' +
      '<content><![CDATA[' + text + ']]></content>' +
      '<properties><pageFormat mediaSizeName="1" leftMargin="42.525000000000006" rightMargin="42.525000000000006" topMargin="42.525000000000006" bottomMargin="42.525000000000006" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>\n' +
      '<elements resolver="hvl-default" >\n' + bodyParas +
      '<footer><paragraph Alignment="1">' + footerInner + '</paragraph></footer>\n</elements>\n' +
      '<styles><style name="default" description="Geçerli" family="' + safeFont + '" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=' + safeFont + ',name=' + safeFont + ',style=plain,size=12]" /><style name="hvl-default" family="' + safeFont + '" size="12" description="Gövde" /></styles>\n</template>\n';
  }

  return { addPara, addEmptyLine, toXml };
}
