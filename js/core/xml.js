// UDF (content.xml) üretiminin düşük seviyeli yardımcıları.
// Şablonlar bu dosyadaki createDocument() ile paragraf ekler; offset/uzunluk
// hesabı ve XML kaçışları burada tek yerde yapılır.

export function sanitizeXmlText(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
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
      const len = rawText.length;
      inner += '<content' + attrsToStr(r.attrs || {}) + ' startOffset="' + offset + '" length="' + len + '" />';
      fullText += rawText;
      offset += len;
    }
    bodyParas += '<paragraph' + attrsToStr(pAttrs) + '>' + inner + '</paragraph>';
  }

  function addEmptyLine(alignment = '3') {
    addPara({ Alignment: alignment, LineSpacing: '0.5' }, [{ text: '\n', attrs: {} }]);
  }

  function toXml() {
    let footerInner = '';
    const t1 = '5070 Sayılı Kanuna Göre Güvenli Elektronik İmza ile İmzalanmıştır.';
    footerInner += '<content size="8" foreground="-196608" startOffset="' + offset + '" length="' + t1.length + '" />';
    fullText += t1; offset += t1.length;
    const t2 = '\n';
    footerInner += '<content family="' + font + '" size="12" description="Gövde" startOffset="' + offset + '" length="' + t2.length + '" />';
    fullText += t2; offset += t2.length;
    fullText += '\n';

    return '<?xml version="1.0" encoding="UTF-8" ?> \n\n<template format_id="1.8" >\n' +
      '<content><![CDATA[' + fullText + ']]></content>' +
      '<properties><pageFormat mediaSizeName="1" leftMargin="42.525000000000006" rightMargin="42.525000000000006" topMargin="42.525000000000006" bottomMargin="42.525000000000006" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>\n' +
      '<elements resolver="hvl-default" >\n' + bodyParas +
      '<footer><paragraph Alignment="1">' + footerInner + '</paragraph></footer>\n</elements>\n' +
      '<styles><style name="default" description="Geçerli" family="' + font + '" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=' + font + ',name=' + font + ',style=plain,size=12]" /><style name="hvl-default" family="' + font + '" size="12" description="Gövde" /></styles>\n</template>\n';
  }

  return { addPara, addEmptyLine, toXml };
}
