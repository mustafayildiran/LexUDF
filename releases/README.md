# Sürümler (güncelleme klasörleri)

Her klasör (`v1.1.0`, `v1.1.1`, ...) bir güncellemenin tamamıdır; klasörü
açan şunları görür:

- `BİLGİ.md` — kaynak, tarih, test ve mağaza durumu + geri dönüş komutu
- `sablonlar/` — matbu şablon anlığı (`js/templates` + `popup.html`)
- `olusturucu/` — şablon oluşturucu anlığı (`manifest.json` + `portal/`)
- `README.md` — o sürümdeki kök README anlığı
- `magaza/` — yapıştırılacak metinler: `aciklama.txt`, `kisa-aciklama.txt`,
  `surum-notlari.txt`, `gizlilik-politikasi.txt`
- `lexudf-<sürüm>-store.zip` — gönderilen paket (bayt-bayt kayıtlı)

Bileşen değişiklik notları kökte durur: `DEĞİŞİKLİKLER-sablonlar.md`,
`DEĞİŞİKLİKLER-olusturucu.md` ("matbu şablon ekle" işi şablonlar tarafındadır;
oluşturucu çalışırken dondurulur).

## Yeni güncelleme onaylanınca ("çok güzel gözüküyor")

1. `vX.Y.Z/` açılır: anlıklar etiketten/kaynaktan kopyalanır, mağaza metinleri
   üretilir, paket `npm run release` ile çıkarılıp klasöre konur.
2. `BİLGİ.md` (kaynak + paket SHA-256 dahil) ve `DEĞİŞİKLİKLER-*` doldurulur.
3. `npm test` yeşil görülür (bölüm 12 anlık-mağaza-paket bütünlüğünü denetler).
4. Commitlenir (push öncesi sorulur).

## Aksilikte geri dönüş ("oraya geri dönelim")

1. Hedef `BİLGİ.md`'deki geri dönüş komutu çalıştırılır (gerekirse tek sistem).
2. `node tests/run.mjs` yeşil görülür (kırmızıysa dönülecek nokta burası değildir).
3. Commitlenir (push öncesi sorulur).

Not: bu klasörler tek başına eklenti olarak yüklenmez; tam sürüm için
etikete/kaynağa dönülür (`git checkout vX.Y.Z`).
