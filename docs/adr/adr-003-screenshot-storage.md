# ADR-003: Ekran Görüntüsü Depolama

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Karar
- Dosyalar web root DIŞINDA saklanır (Storage:ScreenshotsPath config ile yapılandırılabilir)
- DB'de fiziksel sunucu yolu saklanmaz; sadece UUID bazlı dosya adı (FileName) tutulur
- Servis URL: GET /api/screenshots/{id}/file — yetkili kullanıcıya dosya stream edilir
- Dosya adları kullanıcı girdisinden oluşmaz (Guid.NewGuid() ile üretilir)
- Yedekleme: SQL yedeği + screenshots klasörü birlikte yedeklenir
