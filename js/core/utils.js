const TR_MAP = { 'ç':'c', 'Ç':'C', 'ğ':'g', 'Ğ':'G', 'ı':'i', 'İ':'I', 'ö':'o', 'Ö':'O', 'ş':'s', 'Ş':'S', 'ü':'u', 'Ü':'U' };

// Dosya adı parçası için: Türkçe harfleri ASCII'ye çevirir, geri kalan her şeyi "_" yapar.
export function cleanPartForFilename(str) {
  if (!str) return '';
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, m => TR_MAP[m])
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
}

// Bir dosya adı parçasının azami uzunluğu. Üç parça + önek + uzantı toplamı
// Windows'un 260 karakterlik yol sınırının güvenli altında kalsın diye seçildi.
export const MAX_PART_LENGTH = 40;

// cleanPartForFilename'ın kısaltılmış hâli: uzun mahkeme/şirket adlarında
// indirmenin sessizce başarısız olmasını (yol sınırı) engeller.
export function shortPartForFilename(str) {
  const cleaned = cleanPartForFilename(str);
  return cleaned.length > MAX_PART_LENGTH ? cleaned.slice(0, MAX_PART_LENGTH).replace(/_+$/, '') : cleaned;
}
