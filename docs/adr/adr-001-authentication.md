# ADR-001: Authentication Yöntemi

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Bağlam

PSL Project Hub, React SPA + ASP.NET Core 8 backend, on-premise IIS üzerinde tek origin'den servis ediliyor.

## Değerlendirilen Seçenekler

### A: JWT Bearer Token + localStorage
- Avantaj: Mevcut implementasyonla uyumlu, stateless, düşük geçiş maliyeti
- Dezavantaj: localStorage XSS saldırısına karşı inherently açık; JS ile okunabilir

### B: HttpOnly Cookie (Secure / SameSite=Strict)
- Avantaj: XSS token'a erişemez; en güvenli seçenek
- Dezavantaj: On-premise HTTP ortamında Secure flag çakışması; CORS+credentials ayarı; tüm fetch çağrılarında credentials:include gerekir

## Karar

**v1 için Seçenek A (JWT + localStorage)** — aşağıdaki azaltma önlemleriyle:
1. Strict Content Security Policy (inline script yasak)
2. 8 saatlik token süresi
3. Otomatik 401 intercept ile token temizleme

Cookie auth v2'ye planlandı. On-premise HTTP + Secure flag uyumsuzluğu ve mevcut tüm fetch çağrılarının güncellenmesi gerektirdiğinden ertelendi.
