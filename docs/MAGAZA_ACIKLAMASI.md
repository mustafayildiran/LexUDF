<!-- MAĞAZA GÖNDERİMİ İÇİNDİR — Chrome Web Store zip'ine KOYMAYIN. -->

# Chrome Web Store — Gönderim Dosyası

Sürüm: **1.2.1** · Yüklenecek dosya: **`lexudf-1.2.1-store.zip`**

> Bu dosyadaki şablon listesi ve sayılar `scripts/sync-docs.mjs` tarafından
> `js/templates/` altındaki kaynaktan üretilir. Şablon ekleyip çıkarınca
> `node scripts/sync-docs.mjs` çalıştırın; elle güncellemeye gerek yoktur.

---

## 1. Kısa açıklama (132 karakter sınırı)

`manifest.json` içindeki `description` alanıyla birebir aynıdır:

```
<!-- KISA-ACIKLAMA:BAŞ (manifest.json description alanı) -->
UYAP uyumlu UDF dilekçeleri: matbu şablonlar, portalda tek tıkla taslak, çoklu avukat profili, cihaz içi çalışır.
<!-- KISA-ACIKLAMA:BİT -->
```

---

## 2. Ana açıklama (16 000 karakter sınırı)

Aşağıdaki metnin tamamını Dashboard → *Description* kutusuna yapıştırın.

```
LexUDF — UYAP Dilekçe Asistanı

Rutin dilekçe işlerinde zaman kaybetmeyin. LexUDF, UYAP'a yüklenebilir UDF dosyaları hazırlayan, tamamen tarayıcınızın içinde çalışan bir asistandır.

HAZIR MATBU ŞABLONLAR
<!-- ŞABLON-LİSTESİ:BAŞ (scripts/sync-docs.mjs tarafından üretilir, elle düzenlemeyin) -->
• Soruşturma Dosyasını İnceleme Talebi (Portal)
  UYAP Avukat Portal üzerinden dosya inceleme yetkisi talebi (müdafi veya vekil).
• Yetki Belgesi
  Avukatlık ortaklığı veya tek avukattan diğerine, dosya kapsamında yetki devri.
• CMK Zorunlu Müdafi / Vekil Kaydı Dilekçesi
  Ceza Muhakemesi Kanunu uyarınca zorunlu müdafi veya vekil kaydının yapılması.
• İcra Borca ve Ferilerine İtiraz Dilekçesi
  Ödeme emrine, alacağın aslı, faizi ve ferilerine yasal süresinde itiraz.
• Gerekçeli Karar ve Gider Avansı Talebi
  Kararın gerekçesinin tebliğe çıkarılması ve artan gider avansının iadesi.
• Dosyanın Kesinleştirilmesi Talebi
  Uyuşmazlık kesinleşmediği için kesinleşme şerhinin düzenlenmesi.
<!-- ŞABLON-LİSTESİ:BİT -->

ÖNE ÇIKAN ÖZELLİKLER
• Çoklu avukat profili — ofisteki her avukat için ad, baro sicil, vergi dairesi ve adres kaydedin; seçtiğinizde tüm formlar otomatik dolar.
• Düzenlenebilir matbu metin — "AÇIKLAMALAR" bölümünü kendinize göre düzenleyin. Metinde [Mahkeme Adı] gibi köşeli alanlar yazarsanız belge oluşturulurken formdaki güncel değerle otomatik doldurulur.
• Yazı tipi seçimi — Times New Roman veya Cambria.
• UYAP uyumlu çıktı — üretilen dosyalar UYAP Döküman Editörü'nde sorunsuz açılır.
• Akıllı dosya adlandırma — her dosya, içerdiği bölge/mahkeme, esas numarası ve taraf bilgisiyle adlandırılır.
• Portal şablon indirici — UYAP Avukat Portal'da açık dosyanın "Taraf Bilgileri" sekmesine eklenen düğmeyle dosya bilgileri otomatik dolar, UDF taslağı tek tıkla iner.

GİZLİLİK
Eklenti %100 çevrimdışıdır. Girdiğiniz avukat profilleri, müvekkil bilgileri ve dosya numaraları hiçbir sunucuya gönderilmez, üçüncü taraflarla paylaşılmaz. Tüm veriler yalnızca sizin cihazınızda saklanır. Eklentinin sunucusu, hesap sistemi veya analitik kodu yoktur.

ÖNEMLİ UYARI
Eklenti matbu bir taslak hazırlar. UDF dosyasını UYAP'a yüklemeden önce isim, dosya numarası ve mahkeme bilgilerini mutlaka gözden geçirin.

Bu eklenti hukuki danışmanlık hizmeti değildir ve hukuki görüş sunmaz; yalnızca belge taslağı hazırlar.

Geri bildirim ve yeni şablon önerileri: av.mustafayildiran@gmail.com
```

---

## 3. Kategori ve dil

- **Category:** Productivity
- **Language:** Turkish

---

## 4. İzin gerekçeleri

Dashboard → *Privacy practices* → *Permission justifications* alanlarına aynen yazın:

**sidePanel**
```
Dilekçe hazırlama arayüzünü tarayıcının yan panelinde göstermek için gereklidir. Eklentinin ana işlevi bu panel üzerinden sunulur.
```

**storage**
```
Kullanıcının kaydettiği avukat profillerini yalnızca kendi cihazında saklamak (chrome.storage.local) için gereklidir. Uzaktan veri gönderimi veya alma işlemi yapılmaz.
```

**Site erişimi gerekçesi** (içerik betiği — `host_permissions` bildirilmez, erişim `content_scripts` eşleşmesiyle sağlanır; inceleme ekibi sorarsa aşağıdaki metni aynen yapıştırın)

```
UYAP Avukat Portal'da (avukat.uyap.gov.tr) açık dosyanın mahkeme ve taraf bilgilerini okuyup UDF dilekçe taslağını kullanıcının cihazında hazırlar. Okunan bilgiler cihaz dışına gönderilmez; eklenti başka hiçbir sitede çalışmaz.
```

Not: Eklenti `host_permissions` istemiyor. Yalnızca UYAP Avukat Portal sayfalarında dosya bilgilerini cihaz içinde okuyan bir içerik betiği çalışır; gezinti geçmişine erişmez, dış adresle iletişim kurmaz.

---

## 5. Tek amaç açıklaması (Single purpose)

```
UYAP uyumlu UDF dilekçe ve belge taslakları hazırlamak.
```

---

## 6. Data Safety (Veri Güvenliği)

| Soru | Cevap |
|------|-------|
| Kullanıcı verisi topluyor musunuz? | **Hayır** |
| Toplanan veri türleri | Hiçbiri (tüm alanlar boş bırakılır) |
| Kullanım amacı | Yok — veri toplanmıyor |
| Verilerin paylaşılması | Paylaşılmıyor |
| Verilerin satışı | Satılmıyor |
| Şifreleme (transit / dinlenim) | Uygulanmıyor — veri cihazdan çıkmıyor |
| Veri silme talebi | "Profili Sil" düğmesi veya eklentiyi kaldırma ile kalıcı silinir |

Gerekçe: Veriler hiçbir zaman cihaz dışına çıkmadığı için Google'ın tanımına göre
"toplama" sayılmaz. Eklentinin hiçbir sunucusu yoktur.

---

## 7. Gizlilik politikası

`docs/GIZLILIK_POLITIKASI.md` içindeki metnin tamamı Dashboard'daki **Privacy policy**
alanına yapıştırılmalıdır. Mağaza genellikle erişilebilir bir **URL** ister: metni
GitHub Pages, kişisel siteniz veya Google Sites gibi bir yere aynen yayımlayıp o adresi girin.

---

## 8. Ekran görüntüleri

`magaza-gorseller/` klasöründen yükleyin (1280×800 veya üzeri). **Önerilen sıra:**

1. `Gerekçeli Karar Talebi_1280x800.jpg` — UYAP Döküman Editörü'nde açılmış gerçek UDF
   çıktısı + eklenti paneli. En güçlü kare: ürünün ne ürettiğini doğrudan gösterir.
2. `tanitim-1-sorusturma-inceleme.png` — doldurulmuş şablon formu.
3. `tanitim-3-uyap-uyarisi.png` — form, UYAP öncesi kontrol uyarısı ve indirme düğmesi.

**Ek (isteğe bağlı):** `tanitim-2-icra-itiraz.png` (ikinci şablon), `icon128.png` (simge).

Tüm görseller `npm run shots` ile yeniden üretilebilir ve örnek (kurgusal) verilerle
doldurulur — gerçek müvekkil bilgisi içermez.

---

## 9. Sürüm notları

Dashboard'da ayrı bir sürüm notu alanı yoktur; aşağıdaki notları ana
açıklamanın (bölüm 2) en başına ekleyip öyle yapıştırın.

```
LexUDF 1.2.1

• Matbu formlarda "Bilgileri otomatik doldur" düğmesi: açık UYAP dosyasından mahkeme, dosya/esas no ve taraf bilgileri forma aktarılır (yetki belgesi ve CMK kaydı hariç; eksikler elle tamamlanır).
• Doldur düğmesi yalnızca ilgili UYAP sekmesi açıkken aktif olur; yanlış sekmede basılamaz.
• Portal düğmesinin bazı dosya pencerelerinde görünmemesine yol açan başlık filtresi kaldırıldı.
• Sıkıştırma kullanılamazsa UDF sıkıştırmasız yazılır; indirme yarıda kesilmez.
• Taraf tablosu bulunamazsa düğme sessiz kalmak yerine uyarı gösterir.
```

```
LexUDF 1.1.0

• UYAP Avukat Portal entegrasyonu: dosya detay penceresindeki "Taraf Bilgileri" sekmesine eklenen LexUDF düğmesiyle mahkeme ve dosya bilgileri otomatik dolar, UDF taslağı tek tıkla iner.
• Hiçbir veri toplanmaz veya sunucuya gönderilmez; portal sayfasındaki bilgiler de cihaz dışına çıkmaz.
```

```
LexUDF 1.0.0

• UYAP uyumlu UDF dilekçe ve belge taslakları hazırlayan tamamen çevrimdışı eklenti.
• Çoklu avukat profili desteği.
• Düzenlenebilir matbu açıklama metni ve [köşeli alan] otomatik doldurma.
• UYAP Döküman Editörü'nde doğrulanmış çıktı.
• Hiçbir veri toplanmaz veya sunucuya gönderilmez.
```

---

## 10. Gönderim öncesi kontrol listesi

- [ ] `npm run release` çalıştırıldı: testlerin ve "Paket duman testi"nin geçtiği görüldü
- [ ] `lexudf-1.2.1-store.zip` yüklendi (içinde `tests/`, `scripts/`, `*.md`, `package.json` yok)
- [ ] Kısa açıklama yapıştırıldı (bölüm 1)
- [ ] Ana açıklama yapıştırıldı (bölüm 2)
- [ ] Kategori ve dil seçildi (bölüm 3)
- [ ] İzin gerekçeleri girildi (bölüm 4)
- [ ] Tek amaç açıklaması girildi (bölüm 5)
- [ ] Data Safety "Hayır" olarak dolduruldu (bölüm 6)
- [ ] Gizlilik politikası URL'si girildi (bölüm 7)
- [ ] En az 1 ekran görüntüsü yüklendi (bölüm 8)
- [ ] Sürüm notları ana açıklamanın başına eklendi (bölüm 9 → 2)
- [ ] Geliştirici / destek e-postası girildi
- [ ] Ülke ve iletişim bilgileri tamam
