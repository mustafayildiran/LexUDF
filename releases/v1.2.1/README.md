# LexUDF — UYAP Dilekçe Asistanı

Chrome Web Store eklentisi. UYAP uyumlu `.udf` dilekçe ve belge taslakları
tarayıcıda, tamamen çevrimdışı (client-side) üretilir.

Kurmak için: [Chrome Web Store'da LexUDF](https://chromewebstore.google.com/detail/lexudf-%E2%80%94-uyap-dilek%C3%A7e-asi/hebinkkipghelmcnllhaoihonigdnhgb)

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

## Portal şablon indirici

UYAP Avukat Portal'daki dosya detay penceresini izleyen içerik betiği
(`portal/`): "Taraf Bilgileri" sekmesine LexUDF logolu bir indir düğmesi ekler,
mahkeme ve dosya bilgilerini sayfadan otomatik okuyup UDF taslağı indirir.
Arka plan, ek izin veya sunucu gerektirmez; UDF çekirdeği panel şablonlarıyla
aynı disiplinde üretilir.

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

## Kurulum

1. Yukarıdaki mağaza bağlantısından kurun — ek ayar gerekmez.
2. Test ve geliştirme için: `chrome://extensions` adresinde **Geliştirici modu**'nu
   açıp **Paketlenmemiş öğe yükle** ile bu klasörü seçin.

## Klasörler ne işe yarar

- `portal/` — UYAP Portal içerik betiği ve düğme stilleri.
- `js/` — yan panel uygulaması (şablonlar + ortak çekirdek).
- `releases/` — sürüm klasörleri (`v1.1.0`, `v1.1.1` …): her sürümün dosyaları,
  mağaza metinleri ve gönderilen paketi bir arada tutar.
- `docs/` — mimari, mağaza gönderim dosyası ve gizlilik politikası.
- `magaza-gorseller/` — mağaza ekran görüntüleri.
- `tests/`, `scripts/` — otomatik testler ve yayın araçları.

## Sürümlerde ne değişti

- Matbu şablonlardaki değişiklikler: `releases/DEĞİŞİKLİKLER-sablonlar.md`
- Şablon oluşturucudaki değişiklikler: `releases/DEĞİŞİKLİKLER-olusturucu.md`
- Bir sürümün yenilikleri: `releases/v1.1.1/magaza/surum-notlari.txt`
  (mağazaya yapıştırılan tam metin: aynı klasörde `magaza/aciklama.txt`)

## Geliştiriciler için

Yeni şablon ekleme adımları `docs/MIMARI.md`'de; komutlar: `npm test`,
`npm run release`. Mağaza gönderim ayrıntıları `docs/MAGAZA_ACIKLAMASI.md`'de.

## Lisans

MIT Lisansı — ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
Telif hakkı © 2026 Av. Mustafa Yıldıran.

## İletişim

Yeni şablon önerileri ve geri bildirim: av.mustafayildiran@gmail.com
