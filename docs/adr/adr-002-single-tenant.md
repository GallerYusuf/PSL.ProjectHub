# ADR-002: Tek Organizasyon / Tenant-Ready Mimari

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Bağlam
İlk ticari sürüm tek müşteri/tek organizasyon kurulumunu hedefliyor.

## Karar
- v1: Tek organizasyon, single-tenant. Kod tabanında OrganizationId veya TenantId sütunu yok.
- Multi-tenant gereksinimi oluşursa: her entity'e TenantId eklenebilecek şekilde DbContext global query filter deseni kullanılacak.
- Şimdilik sahte tenant soyutlaması oluşturulmadı; gerçek gereksinim geldiğinde temiz migration yapılacak.
