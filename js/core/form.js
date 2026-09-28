// Şablonun `fields` tanımına göre formdan değerleri toplar (tek, genel bir toplayıcı).
// kind: 'text' (varsayılan: trim), 'select' (ham değer), 'checkbox' (true/false)
// upper: true ise Türkçe kurallarıyla BÜYÜK HARFE çevrilir.
export function collectFields(template) {
  const p = {};
  for (const f of template.fields) {
    const el = document.getElementById(f.id || f.key);
    if (!el) { p[f.key] = f.kind === 'checkbox' ? false : ''; continue; }
    if (f.kind === 'checkbox') {
      p[f.key] = el.checked;
    } else if (f.kind === 'select') {
      p[f.key] = el.value;
    } else {
      let v = el.value.trim();
      if (f.upper) v = v.toLocaleUpperCase('tr');
      p[f.key] = v;
    }
  }
  return p;
}

// Zorunlu olup boş bırakılmış alan anahtarlarını döndürür.
export function findMissing(template, payload) {
  return template.required.filter(k => !payload[k]);
}
