# ADR-007: White-Label Yapılandırması

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Karar
- Organizasyon adı, logo ve vurgu rengi Settings API üzerinden yapılandırılabilir
- AppSettings entity: OrganizationName, LogoPath, AccentColor, ProductName
- Frontend design token'ları CSS custom property olarak sunucu config'inden beslenir
- Sahte logo üretilmez; logo yüklenene kadar tipografik marka göstergesi kullanılır
- Lisans kontrolü: v1'de bulunmaz. Ticari dağıtım için entitlement sistemi v2 backlog'unda
