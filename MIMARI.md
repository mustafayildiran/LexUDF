# LexUDF — Kod Mimarisi

```
manifest.json / background.js / popup.html   Eklenti iskeleti (popup.html <script type="module"> ile js/main.js'i yükler)
js/
  main.js                 Giriş noktası. Şablona özel HİÇBİR mantık içermez; kayıt defterine bağlanır.
                         Gizlilik penceresi ve indirme akışını yönetir.
  core/
    xml.js                content.xml üretimi (offset/uzunluk hesabı, XML kaçışları, footer)
    blocks.js             Ortak paragraf kalıpları (başlık, "ETİKET: değer" satırı, gövde metni, imza)
    builder.js            şablon + veri -> content.xml
    form.js               Formdan veri toplama (şablonun `fields` tanımına göre) + zorunlu alan kontrolü
    zip.js                CRC32 + minimal ZIP (UDF = içinde content.xml olan ZIP)
    profiles.js           Çoklu avukat profili (chrome.storage.local — veri yalnızca cihazda)
    placeholders.js       [Köşeli Alan] işaretçilerini form değerleriyle doldurur
    utils.js              Dosya adı temizleme ve parça uzunluğu sınırlama
  templates/
    index.js              ŞABLON KAYIT DEFTERİ
    inceleme.js, yetkiBelgesi.js, cmkKayit.js, icraItiraz.js, gerekceliKarar.js, kesinlesme.js
scripts/
  sync-docs.mjs           Şablon adlarını/sayılarını README, mağaza metni ve popup.html'e yazar
  build-store-zip.mjs     Mağaza paketini (lexudf-<sürüm>-store.zip) üretir ve temizliğini doğrular
  build-store-shots.mjs   Mağaza ekran görüntülerini (1280×800) Chrome headless ile üretir
  smoke-test.mjs          Yayın paketini (zip) açıp bütünlüğünü doğrular
tests/
  run.mjs                 Otomatik testler (npm test — Node 18+)
  golden.mjs, update-golden.mjs   Golden referans tanımı ve güncelleyici
  golden/                 UYAP-onaylı referans XML'ler
```

## Yeni dilekçe türü ekleme
1. `js/templates/` altındaki bir şablonu kopyalayıp yeni dosya yap (ör. `ihtarname.js`).
   Şablon şunları tanımlar: `id`, `groupId`, `label` (mağazada görünen ad), `aciklamaKisa`
   (tek cümlelik tanım), `fields`, `required`, `profileFill`, `aciklamaDeps`,
   `fileName()`, `aciklama()` (matbu metin — TEK KAYNAK), `build()` (belge yapısı) ve isteğe bağlı
   `placeholders` (metinde `[Alan Adı]` olarak yazılıp belgede formdaki değerle dolan alanlar;
   örnek: `yetkiBelgesi.js`).
2. `js/templates/index.js` içine 1 `import` + listeye 1 isim ekle.
3. `popup.html`: formun `<div id="groupXxx" style="display:none;">` bölümünü ve
   `<select id="dilekceTuru">` içine `<option value="ŞABLON_ID">` satırını ekle.
4. `node scripts/sync-docs.mjs` — şablon adı, açıklaması ve **sayıları** README'ye,
   mağaza metnine ve `popup.html` seçeneklerine yazar. Bu adım olmadan test kırmızıya döner;
   dokümanlara elle sayı yazmayın, senkronizasyon onu devralır.
5. `npm test` çalıştır. Test; HTML'de eksik eleman/option, eksik alan, tekrarlayan anahtar gibi
   hataları, "özelleştirme kutusundaki metin ≠ belge metni" sapmasını ve doküman senkronunu
   otomatik yakalar. Çıktıyı `tests/golden/` altındaki UYAP-onaylı referanslarla karşılaştırır;
   yeni şablon/varyant eklediysen çıktıyı UYAP'ta doğruladıktan SONRA
   `node tests/update-golden.mjs` ile referansları güncelleyip `npm test` ile doğrula.
6. Yayın öncesi: `npm run release` (senkron + test + paket + duman testi) ve
   `npm run shots` (mağaza görselleri).

## Sürüm numarası
Tek kaynak `manifest.json` → `version`. Mağaza gönderim dosyasındaki sürüm, paket adı
(`lexudf-<sürüm>-store.zip`) ve sürüm notları bu değerden türetilir
(`node scripts/sync-docs.mjs`).

## Yayın paketi
Chrome Web Store'a yüklenecek zip'e `tests/`, `scripts/`, `*.md`, `package.json`
ve `.gitattributes` KOYMAYIN; sadece `manifest.json`, `background.js`, `popup.html`, `js/`
ve ikonlar (`icon16/48/128.png`) gerekir. `node scripts/build-store-zip.mjs` bu listeyi
kendisi kurar ve sızıntı/eksik dosya denetimi yapar.
