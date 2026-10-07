# Yapılacaklar

Mağaza paketine girmez (planlama dosyasıdır).

## Planlandı

### e-Duruşma talep metni şablon doldurma
- **Sayfa:** `https://avukat.uyap.gov.tr/durusma-sorgulama` — "e-Duruşma için talep gönder"
  düğmesinin açtığı modal (`div.dx-overlay-content.dx-popup-normal`, içinde
  `.edurusma-left` + `textarea.dx-texteditor-input[maxlength=500]` +
  `#onayla-durusma-sorgula` / `#kapat-durusma-sorgula`).
- **İstenen:** modal açılınca matbu şablon listesi gösterilsin; seçim yapılınca
  metin textarea'ya otomatik yazılsın (elden yazma kalkar).
- **Teknik notlar:**
  - DevExtreme textarea'ya yazarken `input`/`change` olayları tetiklenmeli
    (doğrulayıcı + `0/500 karakter` sayacı güncellensin).
  - `maxlength=500` — e-Duruşma metinleri kısa olmalı; mevcut şablonların
    `aciklama()` metinleri aşabilir, ayrı kısa metin seti gerekir (500 sınırı
    teste kilitlensin).
  - UDF üretilmez, metin doğrudan sayfaya yazılır — mevcut 6 şablondan farklı
    kategori; şablon kayıt defterine mi yoksa ayrı listeye mi gireceğine
    uygularken karar verilecek.
  - Yeni izin gerekmez (aynı host), veri toplanmaz.
- **Durum:** planlandı, başlanmadı.

## Bitti

- (yok — biten iş `releases/DEĞİŞİKLİKLER-*.md` dosyalarında izlenir)
