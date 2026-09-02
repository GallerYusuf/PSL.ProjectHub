# PSL.ProjectHub.Web.Tests

Frontend birim ve entegrasyon testleri Vitest ve React Testing Library kullanılarak hazırlanmıştır.

Test dosyaları:
- `src/PSL.ProjectHub.Web/src/test/ProjectCard.test.tsx` (Proje kartı render, canlı URL düğmesi, VPN etiketi)
- `src/PSL.ProjectHub.Web/src/test/UrlSafety.test.ts` (URL protokol kontrolleri, tehlikeli şemaların reddi)
- `src/PSL.ProjectHub.Web/src/test/PresentationMode.test.tsx` (Sunum modu ve yönetici özeti testleri)

## Testleri Çalıştırma

```bash
cd ../../src/PSL.ProjectHub.Web
npm run test
```
