# Sürüm v1.1.1 — ONAYLI-HAZIR (kullanıcı onayı var, push + mağaza yüklemesi bekliyor)

- Kaynak: 337ff14 (yerel commit; etiket yayın onayı sonrası eklenecek)
- Tarih: 6 Ekim 2026
- Anlık dosyalar: manifest.json, portal/content-uyap-sablon.js, portal/content-uyap-sablon.css, portal/README.md
- İçerik: dosya-no kapısı geri alındı (eski enjeksiyon davranışı), CompressionStream yedeği (sıkıştırmasız yazım), bulunamayan taraf tablosunda uyarı
- Test: npm test 101 grup yeşil (6 Ekim 2026)
- Mağaza: lexudf-1.1.1-store.zip hazır (klasörde), Dashboard yüklemesi bekliyor
- Geri dönüş: `git checkout 337ff14 -- manifest.json portal/` ardından `node tests/run.mjs`

Not: bu klasör tek başına yüklenmez; tam sürüm için kaynağa dönülür.
Mağaza paketi bu ağaçtan deterministik üretilir (`npm run release`).
