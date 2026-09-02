# PSL Project Hub - Sistem Mimarisi

Bu belge, **PSL Project Hub** kurumsal web uygulamasının mimari katmanlarını, veri akışını ve teknik bileşenlerini detaylandırır.

---

## 1. Mimari Genel Bakış

PSL Project Hub, **Clean Architecture** prensiplerine uygun olarak gevşek bağlı (loosely-coupled) katmanlar halinde inşa edilmiştir.

```
                           +-------------------------------+
                           |      PSL.ProjectHub.Web       |
                           |   (React, TypeScript, Vite)   |
                           +---------------+---------------+
                                           | HTTP / REST
                                           v
                           +-------------------------------+
                           |      PSL.ProjectHub.Api       |
                           |  (ASP.NET Core 8 Controllers) |
                           +---------------+---------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
     +-------------------------------+             +-------------------------------+
     |   PSL.ProjectHub.Application  |             |  PSL.ProjectHub.Infrastructure|
     |    (DTOs, Services, Logic)    | <---------- |  (EF Core, Identity, Importer)|
     +---------------+---------------+             +---------------+---------------+
                     |                                             |
                     +---------------------+-----------------------+
                                           |
                                           v
                           +-------------------------------+
                           |      PSL.ProjectHub.Domain    |
                           |   (Entities, Enums, Models)   |
                           +---------------+---------------+
                                           |
                                           v
                           +-------------------------------+
                           |     SQL Server (PSLProjectHub)|
                           +-------------------------------+
```

---

## 2. Katman Detayları

### 2.1. `PSL.ProjectHub.Domain`
- Dış kütüphanelerden bağımsız, saf iş alanı (domain) katmanıdır.
- **Entities:** `Project`, `ProjectComponent`, `ProjectLink`, `ProjectScreenshot`, `Technology`, `ProjectIntegration`, `ProjectRelease`, `ProjectNote`.
- **Enums:** `ProjectStatus`, `LinkType`, `EnvironmentType`, `ComponentType`, `NoteType`, `TechnologyCategory`.

### 2.2. `PSL.ProjectHub.Application`
- İş mantığını, doğrulama kurallarını ve servis arayüzlerini (interfaces) barındırır.
- **DTOs:** API istek ve yanıt modelleri (Entity'lerin doğrudan dışarı açılmasını engeller).
- **Validators & Helper:** URL protokol kontrolü (`http://`, `https://`), çift kayıt denetimi.
- **Abstractions:** `IProjectService`, `IProjectLinkService`, `IUrlImportService`, `IAuthService`, ve `IRepositoryMetadataProvider`, `IApplicationHealthProvider`, `IDeploymentInfoProvider`.

### 2.3. `PSL.ProjectHub.Infrastructure`
- Veritabanı ve dış servis adaptörlerini içerir.
- **Entity Framework Core 8:** `AppDbContext`, SQL Server mapping, Fluent API ilişkileri, soft delete global query filter.
- **ASP.NET Core Identity:** Kullanıcı ve rol altyapısı (`ApplicationUser`, `ApplicationRole`).
- **DataSeeder:** Tekrar çalıştırılabilir (idempotent) başlangıç projeleri ve rol tohumlaması.
- **UrlImportService:** `project-urls.json` dosyasından veya API üzerinden mükerrer kayıt üretmeden URL içe aktarımı.
- **Extensibility Mock Providers:** Güvenli, SSRF riski taşımayan genişletilebilir mock durum sağlayıcıları.

### 2.4. `PSL.ProjectHub.Api`
- Dış dünyaya açılan HTTP REST API uç noktaları.
- **Controllers:** `ProjectsController`, `ProjectLinksController`, `DashboardController`, `AuthController`, `UrlImportController`.
- **Güvenlik & Auth:** JWT Bearer doğrulama, Role-based (`Admin`, `Viewer`) yetkilendirme.
- **Middleware:** ProblemDetails (RFC 7807) standardında global hata yönetimi, Structured Logging.
- **Single Deployable Unit:** React üretim derlemesini (`wwwroot`) tek bir ASP.NET Core uygulaması ve IIS Application Pool üzerinden sunabilme (`MapFallbackToFile("index.html")`).

### 2.5. `PSL.ProjectHub.Web`
- Kullanıcı dostu, modern, dinamik ve sade kurumsal SPA arayüzü.
- **Teknolojiler:** React 18/19, TypeScript, Vite, Vanilla CSS Design System, Lucide React ikonları.
- **Ekranlar:**
  - Ana Dashboard (KPI sayaçları, Hızlı Erişim butonları, son güncellemeler, kritik entegrasyonlar).
  - Projeler Listesi (Kart & Liste görünümü, filtreler, sıralama, durum rozetleri).
  - Proje Detay (Yönetici Özeti, Teknik Detaylar, Proje Bağlantıları, Sunum Modu).
  - Yönetim Paneli (Proje, bağlantı, teknoloji, bileşen, sürüm yönetimi ve URL import).
