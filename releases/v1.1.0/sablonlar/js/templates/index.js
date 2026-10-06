// ŞABLON KAYIT DEFTERİ
// Yeni dilekçe türü eklemek için:
//   1) js/templates/ altına yeni bir şablon dosyası yaz (mevcutlardan birini kopyala)
//   2) Aşağıya import + listeye 1 satır ekle
//   3) popup.html'e formunu (<div id="groupXxx">) ve <option value="..."> satırını ekle
// Başka hiçbir dosyaya dokunmak gerekmez.
import inceleme from './inceleme.js';
import yetkiBelgesi from './yetkiBelgesi.js';
import cmkKayit from './cmkKayit.js';
import icraItiraz from './icraItiraz.js';
import gerekceliKarar from './gerekceliKarar.js';
import kesinlesme from './kesinlesme.js';

export const templates = [inceleme, yetkiBelgesi, cmkKayit, icraItiraz, gerekceliKarar, kesinlesme];

export function getTemplate(id) {
  return templates.find(t => t.id === id) || inceleme;
}
