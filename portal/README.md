# Portal Şablon İndirici (hazırlık dalı)

UYAP Avukat Portal'daki "Pencere Görünümü" modalını izleyip "Taraf Bilgileri"
sekmesinin içine LexUDF logo butonu ekler. Butona basınca mahkeme, dosya no,
taraflar ve avukat adı sayfadan otomatik okunur, UDF dilekçe taslağı indirilir
(CBS soruşturma dosyaları için kısaltılmış başlık + imza).

## Dosyalar

- `content-uyap-sablon.js` — modal izleme + UDF üretimi (tek dosya, sıfır bağımlılık)
- `content-uyap-sablon.css` — logo butonu ve tooltip stilleri

Kök `manifest.json` içindeki `content_scripts` girdisi bu dosyaları
`https://avukat.uyap.gov.tr/*` adreslerinde çalıştırır (`document_end`).
Arka plan, popup veya ek izin gerektirmez; `host_permissions` yoktur.

## Neden gömülü çekirdek?

MV3 `content_scripts` dosyaları ES modülü `import` edemez; bu yüzden UDF çekirdeği
(offset hesabı, paragraf kalıpları, ZIP, dosya adı) `js/core` ile birebir aynı
olacak şekilde bu dosyaya gömülüdür. Çekirdekte değişiklik yaparsanız iki tarafı
senkron tutun — `npm test` bölüm 11 ("Portal çekirdek paritesi") sapmayı yakalar.

## Doğrulama

```
node --check portal/content-uyap-sablon.js
npm test          # bölüm 11 portal paritesini de kapsar
npm run release   # senkron + test + mağaza paketi + duman testi
```

## Yayına alınmadan önce kalanlar

- Sürüm yükseltme (`manifest.json` → `1.1.0`) ve buna bağlı `MAGAZA_ACIKLAMASI.md`
  ile `GIZLILIK_POLITIKASI.md` içindeki sürüm ibareleri.
- Mağaza metinlerine portal özelliğini anlatan paragraf ve yeni ekran görüntüleri.
