# ADR-005: Frontend Build ve Backend Publish Entegrasyonu

**Tarih:** 2026-09-02  
**Durum:** Kabul Edildi

## Karar
- Geliştirmede: `npm run dev` (Vite proxy ile :5173 → :5000)
- Production publish: dotnet publish öncesi BeforePublish MSBuild target ile `npm ci && npm run build` otomatik çalışır
- Web/dist → API/wwwroot kopyalanır (eski hash'li dosyalar silinir)
- wwwroot/assets/ içeriği sadece son build'den gelir
- Üretilmiş dist dosyaları kaynak kontrolüne alınmaz (.gitignore'da)
