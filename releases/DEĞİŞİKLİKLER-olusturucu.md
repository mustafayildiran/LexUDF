# Şablon Oluşturucu (Portal) — Değişiklikler

UYAP Portal'dan otomatik taslak üreten içerik betiği (`portal/`).
Çalıştığı sürece bu tarafa dokunulmaz (donduruldu).

## v1.2.1 (9 Ekim 2026)

- İçerik betiği hazır-listesi feneri (`lexudf.otofill-durum`): panel düğmeleri
  ilgili sekme görünürken açılır.

## v1.2.0 (7 Ekim 2026)

- İçerik betiği panel düğmesinden gelen tek seferlik okuma isteğini yanıtlar
  (sürekli izleme yok; indir akışıyla bağı yok). Tablo geç çizilirse 3 kez dener.
- UYAP başlığındaki "Mahkemesi"/"İcra Dairesi" sonekleri forma soneksiz yazılır
  (şablon ekini kendisi koyar, tekrar olmaz).

## v1.1.1 (6 Ekim 2026)

- Dosya-no kapısı geri alındı (bazı gerçek pencerelerde buton üretilmiyordu).
- CompressionStream yoksa sıkıştırmasız UDF yazımı (yedek).
- Taraf tablosu bulunamazsa tıklamada uyarı (sessiz kalma yok).

## v1.1.0 (5 Ekim 2026)

- İlk sürüm: UYAP Portal "Taraf Bilgileri" sekmesine LexUDF logo butonu,
  otomatik UDF taslağı, LexUDF dosya adı disiplini.
