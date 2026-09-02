# ADR-006: Audit Log Yaklaşımı

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Karar
- v1: AuditLog entity (ProjectId, Action, OldValues, NewValues, UserId, Timestamp)
- Hassas alanlar (şifre, token, secret) audit log'a yazılmaz
- DB'de JSON olarak saklanan eski/yeni değerler
- Audit log okuma API'si: GET /api/projects/{id}/audit
- v2'de: ayrı servis veya merkezi log aggregator entegrasyonu planlanabilir
