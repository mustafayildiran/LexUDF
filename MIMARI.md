# LexUDF — Kod Mimarisi

```
manifest.json / background.js / popup.html   Eklenti iskeleti (popup.html <script type="module"> ile js/main.js'i yükler)
js/
  main.js                 Giriş noktası. Şablona özel HİÇBİR mantık içermez; kayıt defterine bağlanır.
  core/
    xml.js                content.xml üretimi (offset/uzunluk hesabı, XML kaçışları, footer)
    blocks.js             Ortak paragraf kalıpları (başlık, "ETİKET: değer" satırı, gövde metni, imza)
    builder.js            şablon + veri -> content.xml
    form.js               Formdan veri toplama (şablonun `fields` tanımına göre) + zorunlu alan kontrolü
    zip.js                CRC32 + minimal ZIP (UDF = içinde content.xml olan ZIP)
    profiles.js           Çoklu avukat profili (chrome.storage.local — veri yalnızca cihazda)
    placeholders.js       [Köşeli Alan] işaretçilerini form değerleriyle doldurur
    utils.js              Dosya adı temizleme
  templates/
    index.js              ŞABLON KAYIT DEFTERİ
    inceleme.js, yetkiBelgesi.js, cmkKayit.js, icraItiraz.js, gerekceliKarar.js, kesinlesme.js
tests/run.mjs             Otomatik testler (npm test — Node 18+, Chrome gerekmez)
```

## Yeni dilekçe türü ekleme
1. `js/templates/` altındaki bir şablonu kopyalayıp yeni dosya yap (ör. `ihtarname.js`).
   Şablon şunları tanımlar: `id`, `groupId`, `fields`, `required`, `profileFill`, `aciklamaDeps`,
   `fileName()`, `aciklama()` (matbu metin — TEK KAYNAK), `build()` (belge yapısı) ve isteğe bağlı
   `placeholders` (metinde `[Alan Adı]` olarak yazılıp belgede formdaki değerle dolan alanlar;
   örnek: `yetkiBelgesi.js`).
2. `js/templates/index.js` içine 1 `import` + listeye 1 isim ekle.
3. `popup.html`: formun `<div id="groupXxx" style="display:none;">` bölümünü ve
   `<select id="dilekceTuru">` içine `<option value="ŞABLON_ID">` satırını ekle.
4. `npm test` çalıştır. Test; HTML'de eksik eleman/option, eksik alan, tekrarlayan anahtar gibi
   hataları ve "özelleştirme kutusundaki metin ≠ belge metni" sapmasını otomatik yakalar.
   Bölüm 6, çıktıyı `tests/golden/` altındaki UYAP-onaylı referans XML'lerle karşılaştırır;
   yeni şablon/varyant eklediysen çıktıyı UYAP'ta doğruladıktan SONRA
   `node tests/update-golden.mjs` ile referansları güncelleyip `npm test` ile doğrula.

## Yayın paketi
Chrome Web Store'a yüklenecek zip'e `tests/`, `package.json` ve `MIMARI.md` KOYMAYIN;
sadece `manifest.json`, `background.js`, `popup.html`, `js/` ve ikonlar (`icon16/48/128.png`) gerekir.
