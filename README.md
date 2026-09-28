# LexUDF — UYAP Dilekçe Asistanı

Chrome Web Store eklentisi. UYAP uyumlu `.udf` dilekçe ve belge taslakları
tarayıcıda, tamamen çevrimdışı (client-side) üretilir.

## Desteklenen şablonlar

<!-- ŞABLON-LİSTESİ:BAŞ (scripts/sync-docs.mjs tarafından üretilir, elle düzenlemeyin) -->
| # | Şablon | Ne zaman kullanılır |
|---|--------|----------------------|
| 1 | Soruşturma Dosyasını İnceleme Talebi (Portal) | UYAP Avukat Portal üzerinden dosya inceleme yetkisi talebi (müdafi veya vekil). |
| 2 | Yetki Belgesi | Avukatlık ortaklığı veya tek avukattan diğerine, dosya kapsamında yetki devri. |
| 3 | CMK Zorunlu Müdafi / Vekil Kaydı Dilekçesi | Ceza Muhakemesi Kanunu uyarınca zorunlu müdafi veya vekil kaydının yapılması. |
| 4 | İcra Borca ve Ferilerine İtiraz Dilekçesi | Ödeme emrine, alacağın aslı, faizi ve ferilerine yasal süresinde itiraz. |
| 5 | Gerekçeli Karar ve Gider Avansı Talebi | Kararın gerekçesinin tebliğe çıkarılması ve artan gider avansının iadesi. |
| 6 | Dosyanın Kesinleştirilmesi Talebi | Uyuşmazlık kesinleşmediği için kesinleşme şerhinin düzenlenmesi. |
<!-- ŞABLON-LİSTESİ:BİT -->

## Özellikler

- **Çoklu avukat profili** — ad, baro sicil, vergi dairesi ve adres bilgileri cihazda
  saklanır; seçilen profil tüm formlara tek tıkla yazılır.
- **Düzenlenebilir matbu metin** — "AÇIKLAMALAR" bölümü düzenlenebilir. Metinde
  `[Mahkeme Adı]` gibi köşeli alanlar yazarsanız belge oluşturulurken formdaki güncel
  değerle otomatik dolar; tanınmayan bir alan yazarsanız uyarılırsınız.
- **Yazı tipi seçimi** — Times New Roman veya Cambria.
- **Akıllı dosya adlandırma** — her dosya, içerdiği bölge/mahkeme, esas numarası ve
  taraf bilgisiyle adlandırılır; parçalar uzunluk sınırlıdır.
- **%100 gizlilik** — hiçbir sunucu, hesap sistemi veya analitik kodu yoktur.
  Veriler yalnızca `chrome.storage.local` alanında, cihazınızda saklanır.

> ⚠️ Eklenti matbu bir taslak hazırlar. UDF dosyasını UYAP'a yüklemeden önce isim,
> dosya numarası ve mahkeme bilgilerini gözden geçirin. Eklenti hukuki görüş sunmaz.

## Kurulum (geliştirici modu)

1. `chrome://extensions` adresini açın, **Geliştirici modu**'nu etkinleştirin.
2. **Paketlenmemiş öğe yükle** ile bu klasörü seçin.
3. Araç çubuğundaki LexUDF simgesine tıklayın — yan panel açılır.

## Mimari

`js/main.js` şablona özel mantık içermez; her şey `js/templates/` kayıt defterine bağlıdır.

```
manifest.json / background.js / popup.html   Eklenti iskeleti
js/main.js                                   Giriş noktası (şablon bağlayıcı)
js/core/                                     xml · blocks · builder · form · zip · profiles · placeholders
js/templates/                                Şablonlar + kayıt defteri
scripts/                                     Doküman senkronu, mağaza paketi ve görseller
tests/                                       Testler ve golden referanslar
```

Ayrıntılar: [MIMARI.md](MIMARI.md)

## Geliştirme

```
npm run sync                      # şablon adı/sayısı değiştiyse dokümanları tazele
npm test                          # tüm testler
npm run release                   # senkron + test + mağaza paketi + paket duman testi
npm run shots                     # mağaza ekran görüntülerini üret (Chrome gerekir)
node tests/update-golden.mjs      # çıktıyı UYAP'ta doğruladıktan SONRA golden'ları güncelle
```

**Paket duman testi** (`scripts/smoke-test.mjs`): zip'i açıp içindeki `manifest.json`,
modül grafiği ve `popup.html`'i doğrular — eksik import, sızan test/doküman dosyası,
şablona uymayan form elemanı ya da beyanla çelişen izin varsa yayına hazır sayılmaz.

**Golden testler:** `tests/golden/` altındaki `GOLDEN_DOSYA_SAYISI` referans XML, UYAP
tarafından kabul edilmiş çıktının dondurulmuş halidir (şablon × rol × yazı tipi ×
normal/özel metin). `npm test` her değişiklikte bunlarla bayt-bayt karşılaştırır;
kabul edilmiş çıktı kayarsa test kırmızıya döner.

**Yeni şablon eklerken:** `MIMARI.md` içindeki adımları izleyin, `npm test`'i geçirin,
ardından `node scripts/sync-docs.mjs` çalıştırın — README, mağaza açıklaması ve
`popup.html` seçenekleri kendiliğinden güncellenir.

## Mağaza gönderimi

- **Paket:** `manifest.json`, `background.js`, `popup.html`, `js/`, `icon16/48/128.png`.
  `tests/`, `scripts/`, `*.md`, `package.json` ve `.gitattributes` zip'e **girmaz**.
- **Mağaza metinleri:** [MAGAZA_ACIKLAMASI.md](MAGAZA_ACIKLAMASI.md) — açıklama, izin
  gerekçeleri, Data Safety yanıtları, sürüm notları ve gönderim kontrol listesi.
- **Gizlilik politikası:** [GIZLILIK_POLITIKASI.md](GIZLILIK_POLITIKASI.md)
- **Ekran görüntüleri:** `magaza-gorseller/`
- **Paket doğrulaması:** `npm run release` çıktısı "Paket temiz" ve "duman testi geçti"
  demeden zip'i yüklemeyin.

## İletişim

Yeni şablon önerileri ve geri bildirim: av.mustafayildiran@gmail.com
