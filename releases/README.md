# Sürümler (sabit noktalar)

Her klasör (`v1.1.0`, `v1.1.1`, ...) bir güncelleme anlığıdır:
`manifest.json` + `portal/` dosyaları ve `BİLGİ.md` kaydı.

## Yeni güncelleme onaylanınca ("çok güzel gözüküyor")

1. Bu klasöre `releases/vX.Y.Z/` açılır, dosyalar kopyalanır, `BİLGİ.md` doldurulur.
2. `npm test` yeşil görülür, commitlenir.
3. Etiket yayın onayı sonrası eklenir.

## Aksilikte geri dönüş ("oraya geri dönelim")

1. Hedef klasördeki `BİLGİ.md`'de yazan geri dönüş komutu çalıştırılır.
2. `node tests/run.mjs` yeşil görülür (kırmızıysa dönülecek nokta burası değildir).
3. Commitlenir (push öncesi sorulur).
4. `tests/run.mjs` bölüm 12, anlık bütünlüğü otomatik denetler
   (kayıtlı kaynaktaki dosyalarla klasördeki kopyaların birebir aynı olduğunu).

Not: bu klasörler tek başına eklenti olarak yüklenmez; tam sürüm için
etikete/kaynağa dönülür (`git checkout vX.Y.Z`).
