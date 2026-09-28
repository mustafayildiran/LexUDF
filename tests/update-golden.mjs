// Çalıştır: node tests/update-golden.mjs   (Node 18+; tarayıcı/Chrome gerekmez)
// tests/golden/ altındaki referans XML'leri mevcut kodun çıktısıyla yeniden yazar.
// DİKKAT: Yalnızca çıktıyı UYAP'ta doğruladıktan SONRA çalıştırın — bu dosyalar
// "UYAP'ın kabul ettiği doğru çıktı"nın dondurulmuş halidir, körü körüne güncellemeyin.
import fs from 'node:fs';
import { getTemplate } from '../js/templates/index.js';
import { buildXml } from '../js/core/builder.js';
import { goldenCases } from './golden.mjs';

const dir = new URL('./golden/', import.meta.url);
fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir)) {
  if (f.endsWith('.xml')) fs.rmSync(new URL('./golden/' + f, import.meta.url));
}

const cases = goldenCases();
for (const c of cases) {
  fs.writeFileSync(
    new URL('./golden/' + c.name + '.xml', import.meta.url),
    buildXml(getTemplate(c.templateId), c.payload),
    'utf8'
  );
}
console.log(`${cases.length} golden dosya yazıldı: tests/golden/`);
