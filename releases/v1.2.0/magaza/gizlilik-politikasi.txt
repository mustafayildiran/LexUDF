<!-- MAĞAZA GÖNDERİMİ İÇİNDİR — Chrome Web Store zip'ine KOYMAYIN. Gizlilik politikası URL'si alanına bu metni barındıran sayfanın adresini yazın. -->

# LexUDF — Gizlilik Politikası

**Sürüm 1.2.0** · Son güncelleme: 7 Ekim 2026

LexUDF ("eklenti"), UYAP uyumlu UDF dilekçe taslakları hazırlayan bir tarayıcı eklentisidir.
Gizliliğiniz bizim için esastır: **eklenti hiçbir verinizi toplamaz, kaydetmek üzere
hiçbir sunucuya göndermez ve üçüncü taraflarla paylaşmaz.**

## Toplanan veri

Eklenti, girdiğiniz hiçbir bilgiyi (avukat profilleri, müvekkil adları, dosya numaraları,
dilekçe içerikleri) kendi sunucusuna göndermez — çünkü bir sunucumuz yoktur. Tüm işlemler
tamamen tarayıcınızın içinde (istemci tarafında) gerçekleşir.

## Cihazda saklanan veri

Kaydettiğiniz avukat profilleri (ad soyad, baro/sicil, vergi dairesi, ofis adresi),
yalnızca sizin cihazınızda, tarayıcının `chrome.storage.local` alanında saklanır.
Bu verilere yalnızca siz erişebilirsiniz.

Hazırladığınız dilekçe form verileri (müvekkil adları, dosya numaraları, açıklama metinleri)
saklanmaz; bunlar yalnızca panel açıkken bellekte tutulur, belge oluşturulduktan sonra
kullanıcı tarayıcısını kapattığında silinir.

## Verilerin silinmesi

Kayıtlı profilleri tek tek "Profili Sil" düğmesiyle, tümünü ise eklentiyi kaldırarak
kalıcı olarak silebilirsiniz. Eklenti kaldırıldığında `chrome.storage.local` alanındaki
veriler de tarayıcı tarafından silinir.

## Hukuki dayanak

Avukatlık kanunu uyarınca avukata ait dosya ve müvekkil bilgileri gizlidir. Bu eklenti,
bu bilgilerin cihazınızdan çıkmasına hiçbir teknik yol sunmaz.

## İzinlerin kullanımı

- **sidePanel:** Dilekçe hazırlama panelini tarayıcının yan panelinde (`sidePanel`) göstermek için kullanılır.
- **storage:** Avukat profillerinizi yalnızca cihazınızda saklamak (`storage`) için kullanılır.

Eklenti; gezinti geçmişinize erişmez, uzaktaki hiçbir adresle iletişim kurmaz ve
analitik/izleme kodu içermez. Yalnızca UYAP Avukat Portal sayfalarında
(`avukat.uyap.gov.tr`) çalışan içerik betiği, açık dosyanın mahkeme ve taraf
bilgilerini sayfadan okuyup dilekçe taslağını cihazınızın içinde hazırlar;
okunan bu bilgiler de cihaz dışına çıkarılmaz.

## Üçüncü taraflar

Veri paylaşılan, veri işleyen veya analitik hizmeti veren üçüncü taraf bulunmamaktadır.

## Değişiklikler

Bu politikada yapılacak değişiklikler eklenti güncellemesiyle birlikte yayımlanır.

## İletişim

Gizlilikle ilgili sorularınız için: av.mustafayildiran@gmail.com
