# LexUDF — UYAP Dilekçe Asistanı (v1.3.0)

LexUDF, avukatların UYAP sistemi için `.udf` uzantılı matbu dilekçe ve belgeleri
tarayıcı üzerinde, harici hiçbir sunucuya ihtiyaç duymadan (tamamen client-side)
hızlı ve hatasız biçimde üretmesini sağlayan bir Chrome eklentisidir.

## Desteklenen şablonlar (6)

- Soruşturma Dosyasını İnceleme Talebi (Portal)
- Yetki Belgesi
- CMK Zorunlu Müdafi / Vekil Kaydı Dilekçesi
- İcra Borca ve Ferilerine İtiraz Dilekçesi
- Gerekçeli Karar ve Gider Avansı Talebi
- Dosyanın Kesinleştirilmesi Talebi

## Özellikler

- **Çoklu avukat profili** — ofisteki her avukat için ayrı kimlik bilgisi, tek tıkla doldurma.
- **Özelleştirilebilir matbu metin** — "Açıklamalar" metni düzenlenebilir; formdaki `[köşeli alanlar]` belgede otomatik dolar.
- **Times New Roman / Cambria** yazı tipi seçeneği, UYAP uyumlu UDF çıktısı.
- **%100 gizlilik** — tüm veriler yalnızca cihazınızda (`chrome.storage.local`) saklanır, hiçbir sunucuya gönderilmez.

> ⚠️ Eklenti matbu bir taslak hazırlar. UDF dosyasını UYAP'a yüklemeden önce
> isim, dosya numarası ve mahkeme bilgilerini mutlaka gözden geçirin.

## Kurulum (geliştirici modu)

1. `chrome://extensions` adresini açın, "Geliştirici modu"nu etkinleştirin.
2. "Paketlenmemiş öğe yükle" ile bu klasörü seçin.
3. Araç çubuğundaki LexUDF simgesine tıklayın (yan panel açılır).

## Testler

```
npm test
```

40 golden referans (`tests/golden/`), UYAP tarafından kabul edilmiş 1.3.0 çıktılarının
dondurulmuş halidir. Yeni şablon ekleyince çıktıyı UYAP'ta doğrulayıp
`node tests/update-golden.mjs` ile referansları güncelleyin.
Mimari detaylar için `MIMARI.md`'ye bakın.

## Mağaza gönderimi

- Yayın paketi: `manifest.json`, `background.js`, `popup.html`, `js/`, ikonlar
  (`icon16/48/128.png`). `tests/`, `*.md`, `package.json` zip'e girmez.
- Mağaza metinleri: `MAGAZA_ACIKLAMASI.md`, gizlilik politikası: `GIZLILIK_POLITIKASI.md`.

## İletişim

Yeni şablon önerileri ve geri bildirim: av.mustafayildiran@gmail.com
