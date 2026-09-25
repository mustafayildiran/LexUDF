# ⚖️ LexUDF — Dilekçe Asistanı

  LexUDF, avukatların UYAP sisteminde matbu evrak hazırlarken yaşadığı zaman kaybını saniyelere indiren, doğrudan tarayıcı üzerinden çalışan bir Chrome Extension (Google Chrome Eklentisi) motorudur.

---

🚀 1. Temel Mimari & Çalışma Şekli
  Mimari: Chrome Extension (Side Panel UI, Background Script, W3C CompressionStream deflate-raw tabanlı doğrudan tıkla-indir .zip/.udf motoru).
  Desteklenen Yazı Tipleri: Times New Roman, Cambria (Dinamik seçimli).
  Dosya Yönetimi: Türkçe karakter dönüşümü ve özel sembol temizleme fonksiyonu ile uyumlu otomatik dinamik dosya isimlendirme altyapısı.

---

🎯 2. Projenin Vizyonu
  Hukuk pratiğinde en çok zaman çalan unsurlardan biri, formatı ve içeriği standart olan matbu dilekçeleri her defasında sıfırdan düzenlemektir. **LexUDF**; rutin evrak hamallığını saniyelere indirerek avukatların değerli zamanlarını asıl hukuki analize ve dosyalarına ayırmasını sağlar.

---

📄 3. Mevcut Şablon Listesi

  3.1. Soruşturma Dosyası İnceleme Talebi
  Özellikler: Şüpheli/Müdafi ve Müşteki/Vekili dinamik modlu başsavcılık hitaplı başvuru formu.

  3.2. Yetki Belgesi
  Özellikler: 1136 sayılı Av.K. m.56 ve 4667 sayılı Kanun esaslı, tam özelleştirilmiş biçimlendirme ve kapsam metni blokları.

  3.3. CMK Zorunlu Müdafi / Vekil Kaydı Dilekçesi
  Özellikler: Baro görevlendirmeli, CMK 150. madde ve yönetmelik esaslı standart yasal gerekçe yapısı.

 3.4. Borca ve Ferilerine İtiraz Dilekçesi (İcra)
  Özellikler: İcra müdürlükleri için borca, faize ve ferilere açık ve tam itiraz metni.

 3.5. Gerekçeli Karar ve Gider Avansı Talebi (Yeni)
  Özellikler: Davacı/Davalı taraf seçimi, esas/karar numarası entegrasyonu ve isteğe bağlı açılıp kapatılabilen "Artan Gider Avansının İadesi" dinamik onay kutusu (checkbox) desteği.

 3.6. Dosyanın Kesinleştirilmesi Talebi (Yeni)
  Özellikler: Mahkeme kararlarının kesinleşme şerhinin düzenlenerek dosyaya eklenmesi için hazırlanan, sadeleştirilmiş ve taraflara tebliğ/yasal süre koşullarına dayalı özel matbu şablon.

---

## 🛠️ Kurulum ve Kullanım (Geliştirici Modu)

Depoyu yerel makinenizde test etmek veya Chrome'a manuel olarak kurmak için:

1. Bu depoyu ZIP olarak indirin veya bilgisayarınıza klonlayın.
2. Google Chrome tarayıcınızı açın ve adres çubuğuna **`chrome://extensions/`** yazın.
3. Sağ üst köşedeki **Geliştirici modu (Developer mode)** seçeneğini aktif hale getirin.
4. Sol üstteki **Paketlenmemiş öge yükle (Load unpacked)** butonuna tıklayın.
5. Proje klasörünü seçin. Eklentiniz tarayıcınızın yan panelinde (Side Panel) kullanıma hazır!

---

## 💡 İletişim ve Yeni Şablon İstekleri

Eklentinin kapsamını sürekli büyütüyor; meslektaşlarımızın günlük ihtiyaçlarına yönelik yeni matbu şablonlar ekliyoruz. Eklenmesini istediğiniz dilekçe türleri veya geri bildirimleriniz için ulaşabilirsiniz:

* **Geliştirici:** Av. Mustafa Yıldıran
* **E-posta:** [av.mustafayildiran@gmail.com](mailto:av.mustafayildiran@gmail.com)

---
<p align="center"><i>LexUDF — Zamanınızı hukuka saklayın.</i></p>
