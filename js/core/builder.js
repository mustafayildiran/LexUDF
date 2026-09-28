import { createDocument } from './xml.js';
import { resolvePlaceholders } from './placeholders.js';

// Belgeye yazılacak "AÇIKLAMALAR" metni: özelleştirme açıksa kullanıcının metni, değilse şablonun matbu metni.
// Her iki durumda da [Alan] işaretçileri formdaki güncel değerlerle doldurulur.
export function resolveAciklama(template, payload) {
  const isOzel = payload.ozelToggle && payload.ozelMetin;
  const raw = isOzel ? payload.ozelMetin : template.aciklama(payload);
  return resolvePlaceholders(raw, template, payload);
}

// Şablon + payload -> content.xml metni.
export function buildXml(template, payload) {
  const doc = createDocument(payload.yaziTipi || 'Times New Roman');
  template.build(doc, payload, resolveAciklama(template, payload));
  return doc.toXml();
}
