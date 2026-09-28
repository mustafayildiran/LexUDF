// [Köşeli Parantez] alanları: açıklama metninde formdan otomatik doldurulan yerleri işaretler.
// Kullanıcı metni düzenlerken bunları olduğu gibi bırakır; belge oluşurken güncel form değeriyle değişir.
// Şablon `placeholders: { 'Alan Adı': payload => değer }` ile hangi alanları sunduğunu tanımlar.

// Büyük/küçük harf, Türkçe karakter ve fazla boşluk farkını tolere eder:
// "[mahkeme adi]" ile "[Mahkeme Adı]" aynı alan sayılır.
function normalize(name) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
}

const TOKEN = /\[([^\[\]\n]+)\]/g;

// Tanınan [Alan] işaretçilerini payload'daki değerle değiştirir; tanınmayanları olduğu gibi bırakır.
export function resolvePlaceholders(text, template, payload) {
  const known = new Map(Object.entries(template.placeholders || {}).map(([k, fn]) => [normalize(k), fn]));
  return text.replace(TOKEN, (whole, name) => {
    const fn = known.get(normalize(name));
    return fn ? String(fn(payload) ?? '') : whole;
  });
}

// Çözümlemeden sonra metinde kalan [köşeli] ifadeler (tanınmayan/yanlış yazılmış alanlar).
export function findUnresolved(text) {
  return [...text.matchAll(TOKEN)].map(m => m[0]);
}

// Arayüzde gösterilecek "[Mahkeme Adı], [Mahkeme Esas No]" listesi
export function listPlaceholders(template) {
  return Object.keys(template.placeholders || {}).map(k => '[' + k + ']');
}
