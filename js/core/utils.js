const TR_MAP = { 'ç':'c', 'Ç':'C', 'ğ':'g', 'Ğ':'G', 'ı':'i', 'İ':'I', 'ö':'o', 'Ö':'O', 'ş':'s', 'Ş':'S', 'ü':'u', 'Ü':'U' };

// Dosya adı parçası için: Türkçe harfleri ASCII'ye çevirir, geri kalan her şeyi "_" yapar.
export function cleanPartForFilename(str) {
  if (!str) return '';
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, m => TR_MAP[m])
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
}
