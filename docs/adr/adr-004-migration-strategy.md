# ADR-004: Veritabanı Migration Stratejisi

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Karar
- EF Core Code-First Migrations kullanılır
- Program.cs startup sırasında MigrateAsync() çalışır
- Ham SQL ile __EFMigrationsHistory manipülasyonu YAPILMAZ
- Migration hatası uygulamanın "hazır" duruma geçmesini engeller (exception rethrow)
- EnsureCreated() kullanılmaz
- Veri kaybı riski olan migration otomatik uygulanmaz — README migration notunda belirtilir
