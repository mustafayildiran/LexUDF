# Sürümler (sabit noktalar)

İki sistem ayrı klasörde izlenir:

- `sablonlar/` — paneldeki matbu şablonlar (`js/templates/` + `popup.html`).
  "Matbu şablon ekle" işi buradadır (prosedür: `docs/MIMARI.md`).
- `olusturucu/` — portal şablon oluşturucu (`manifest.json` kablosu + `portal/`).
  Çalıştığı sürece bu tarafa dokunulmaz (donduruldu).

Her sistem klasöründe `DEĞİŞİKLİKLER.md` (her güncellemede ne değişti) ve
sürüm anlıkları (`vX.Y.Z/`: dosyalar + `BİLGİ.md` kaydı) durur.

## Yeni güncelleme onaylanınca ("çok güzel gözüküyor")

1. İlgili sistem klasörüne `vX.Y.Z/` açılır, dosyalar etiketten/kaynaktan kopyalanır.
2. `DEĞİŞİKLİKLER.md` ve `BİLGİ.md` doldurulur.
3. `npm test` yeşil görülür, commitlenir.

## Aksilikte geri dönüş ("oraya geri dönelim")

1. Hedef `BİLGİ.md`'deki geri dönüş komutu çalıştırılır (sadece ilgili sistem döner).
2. `node tests/run.mjs` yeşil görülür (kırmızıysa dönülecek nokta burası değildir).
3. Commitlenir (push öncesi sorulur).
4. `tests/run.mjs` bölüm 12, anlık bütünlüğü otomatik denetler.

Not: bu klasörler tek başına eklenti olarak yüklenmez; tam sürüm için
etikete/kaynağa dönülür (`git checkout vX.Y.Z`).
