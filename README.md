# LexUDF — UYAP UDF Dilekçe Asistanı (v1.2.0)

LexUDF, avukatların UYAP sistemi için `.udf` uzantılı matbu dilekçe ve belgeleri tarayıcı üzerinde, harici hiçbir sunucuya ihtiyaç duymadan (tamamen client-side) hızlı ve hatasız biçimde üretmesini sağlayan bir Chrome Extension (Uzantı) aracıdır.

---

## 🚀 v1.2.0 Güncelleme Notları & Yenilikler

* **Matbu Açıklama Özelleştirme:** Kullanıcılar, her şablon için varsayılan olarak gelen "Açıklamalar" metnini dilerlerse tek tıkla açıp özelleştirebilecekleri dinamik bir düzenleme alanına kavuşturuldu.
* **Gelişmiş Dosya Adlandırma Standardı:** Soruşturma İnceleme Talepleri dahil tüm şablonlar; mahkeme/başsavcılık, esas/soruşturma numarası ve taraf bilgileriyle tam uyumlu, düzenli ve okunabilir dosya adlandırma formatına (`SorusturmaInceleme_...udf`, `YetkiBelgesi_...udf` vb.) geçirildi.
* **AES-GCM Güvenli Profil Saklama:** Avukat adı, baro sicil ve vergi bilgileri gibi hassas veriler artık tarayıcıda düz metin olarak değil; tarayıcının yerel **Web Crypto API (AES-GCM)** altyapısıyla şifrelenerek (`encrypted payload`) güvenle saklanmaktadır.
* **XML & CDATA Güvenliği:** Kullanıcı girdilerinde yer alabilecek özel karakterler (`&`, `<`, `>`, `"`, `'`) ve CDATA kırılma riskine karşı (`]]>`) güvenli escape mekanizmaları entegre edildi.

---

## 🛠️ Desteklenen Dilekçe ve Belge Şablonları

1. Soruşturma Dosyasını İnceleme Talebi (Portal)
2. Yetki Belgesi
3. CMK Zorunlu Müdafi / Vekil Kaydı Dilekçesi
4. İcra Borca ve Ferilerine İtiraz Dilekçesi
5. Gerekceli Karar ve Gider Avansı İadesi Talebi
6. Dosyanın Kesinleştirilmesi Talebi

---

## 🔒 Gizlilik ve Güvenlik Taahhüdü

* **Sıfır Sunucu İletişimi:** LexUDF, tamamen tarayıcınızın içinde çalışır. Girdiğiniz hiçbir hukuki veri, dosya numarası veya avukat profili harici bir sunucuya iletilmez.
* **Yerel Şifreleme:** Kaydedilen avukat profilleri yerel cihazınızda AES algoritması ile şifrelenerek korunur.
* **En Düşük Yetki İlkesi:** Yalnızca gerekli Chrome izinleri (`downloads`, `sidePanel`, `storage`) talep edilir.
