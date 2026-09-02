# PSL Project Hub

**PSL İç ve Dış Ticaret A.Ş. / Gallery Crystal** bünyesinde kullanılan ve geliştirilen tüm şirket içi yazılım projelerini, canlı ve test adreslerini, API uç noktalarını, teknik bileşenlerini, ekran görüntülerini ve mimari kararlarını tek bir yaşayan operasyon merkezinde toplayan kurumsal web uygulaması.

---

## 🚀 Temel Özellikler

- **Kurumsal Operasyon Merkezi Tasarımı:** Yüksek bilgi yoğunluğu, teknik editoryal estetik, tek satır metrik şeridi (Toplam, Canlı, Pilot, Geliştirme, Bakım, Doğrulama Bekleyen), net çizgiler ve WCAG kontrast uyumu.
- **Portföy İndeksi & Kompakt Kartlar:** Projeleri tam envanter tablosunda veya kart görünümünde listeleyebilme; durum, kategori ve canlı URL filtreleri; URL query parametreleriyle filtre senkronizasyonu.
- **Teknik Proje Dosyası (Dossier):**
  - **Yönetici Özeti:** Çözülen iş problemi, getirilen çözüm, şirkete sağlanan değer, sorumlu ve zaman çizelgesi.
  - **URL Envanteri:** Projenin tüm URL’leri (Canlı, Test, Admin, Swagger, Repository) ortam, ağ erişim türü (Genel, VPN, Kimlik Doğrulama) ve doğrulama durumuyla birlikte net bir tablo şeklinde.
  - **Ekran Görüntüleri Galerisi:** Çoklu ekran görüntüsü yükleme, kapak görseli seçebilme, sıralama ve tam ekran lightbox modalı.
- **Tam Ekran Sunum Modu (Executive Presentation Deck):** Klavye yön tuşlarıyla (Sağ/Sol) projeler arasında geçiş imkânı veren, yönetici ve paydaş sunumlarına özel minimalist slayt ekranı.
- **Güçlendirilmiş Kimlik Doğrulama & Yetkilendirme:**
  - JWT tabanlı kimlik doğrulama, token süre dolumu (expiration) kontrolü, sunucu doğrulamalı `/api/auth/me`.
  - Yetkisiz erişimler için 401 vs 403 Forbidden ayrımı.
  - Brute-force saldırılarına karşı login rate limiting ve 5 hatalı denemede 15 dakika hesap kilitleme (lockout) koruması.
  - Tüm dahili uç noktalarda zorunlu yetkilendirme (`[Authorize]`) ve veri değişiminde `Admin` rolü kısıtlaması.
- **Güvenli Dosya ve URL Yönetimi:**
  - Çok parçalı güvenli dosya yükleme (`IFormFile`), PNG/JPG/WEBP için magic bytes başlık doğrulaması.
  - URL import uç noktasında Dizin Değiştirme (Path Traversal - `../`) koruması.
  - Veritabanı seviyesinde `(ProjectId, Url)` mükerrerlik engeli ve 409 Conflict yönetimi.
  - Güvenli URL protokol doğrulaması (`http://` ve `https://`), `rel="noopener noreferrer"`.
  - Pasif bağlantıların normal kullanıcılardan filtrelenmesi.
- **Tek Paket IIS Yayını:** ASP.NET Core 8 Web API ve React SPA tek bir Application Pool altında Windows Server IIS'e dağıtılmaya hazır.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| **Backend API** | ASP.NET Core 8 Web API, C# |
| **Frontend** | React 18, TypeScript, Vite |
| **Veritabanı** | Microsoft SQL Server (`PSLProjectHub`) |
| **ORM** | Entity Framework Core 8 (Code-First & Migration tabanlı) |
| **Kimlik Doğrulama** | ASP.NET Core Identity & JWT Bearer |
| **Tasarım Sistemi** | Kurumsal Teknik Operasyon Merkezi CSS (Design Tokens, Petrol Mavisi `#0f4c81`) |
| **İkonlar** | Lucide React |
| **API Dokümantasyonu** | Swagger / OpenAPI |
| **Backend Testleri** | xUnit (.NET 8) — 40 Test |
| **Frontend Testleri** | Vitest & React Testing Library — 15 Test |
| **Yayın Hedefi** | Windows Server & IIS (AspNetCoreModuleV2) |

---

## 📁 Çözüm ve Klasör Yapısı

```
c:\Users\yusufemredeniz\Desktop\PSL.ProjectHub\
├── PSL.ProjectHub.sln
├── project-urls.example.json      # Örnek sahte adres şablonu
├── README.md                      # Bu dosya
├── docs/                          # Detaylı teknik dokümantasyon
│   ├── architecture.md            # Katmanlı mimari ve akış
│   ├── database.md                # SQL Server şeması, tablolar ve indeksler
│   ├── security.md                # Güvenlik, URL doğrulama ve yetkilendirme
│   ├── url-management.md          # Bağlantı türleri, birincil URL ve import mantığı
│   ├── iis-deployment.md          # Windows Server IIS kurulum ve yayın adımları
│   └── project-analysis.md        # Şirket projelerinin operasyonel analizi
├── src/
│   ├── PSL.ProjectHub.Domain/         # Varlıklar, Enums, Temel Modeller
│   ├── PSL.ProjectHub.Application/    # DTO'lar, Arayüzler, Validatörler
│   ├── PSL.ProjectHub.Infrastructure/ # EF Core AppDbContext, Identity, Seeder, Importer
│   ├── PSL.ProjectHub.Api/            # REST API Controller'lar, JWT, web.config, Program.cs
│   └── PSL.ProjectHub.Web/            # React SPA, Vite, TypeScript, Tasarım Sistemi
└── tests/
    └── PSL.ProjectHub.Api.Tests/      # xUnit backend testleri (40/40 Başarılı)
```

---

## ⚙️ Kurulum ve Geliştirme (Development)

### 1. Ön Koşullar
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) (npm ile)
- SQL Server (LocalDB, Express veya Kurumsal SQL Server)

### 2. Güvenli Yapılandırma ve İlk Yönetici Hesabı
Kaynak kodda hiçbir açık şifre saklanmaz. İlk sistem yöneticisi (Admin) parolası ve JWT Secret ortam değişkenleri veya `dotnet user-secrets` üzerinden tanımlanır:

```bash
# Geliştirme ortamı için user-secrets tanımlaması:
cd src/PSL.ProjectHub.Api
dotnet user-secrets set "Jwt:Secret" "SizinCokGuvenliVeEnAz32KarakterlikJwtAnahtariniz2026!"
dotnet user-secrets set "InitialAdmin:Password" "GuvenliAdminSifreniz123!*"
```

Veya sunucu ortamında ortam değişkenleri (Environment Variables) olarak:
```powershell
[System.Environment]::SetEnvironmentVariable('Jwt__Secret', 'GuvenliProductionSecret2026...', 'Machine')
[System.Environment]::SetEnvironmentVariable('PSL_INITIAL_ADMIN_PASSWORD', 'GuvenliAdminSifreniz123!*', 'Machine')
```

> **Güvenlik Notu:** Üretim ortamında `Jwt:Secret` tanımlanmamışsa veya 32 karakterden kısaysa uygulama güvenle başlamayı reddeder.

### 3. Backend'i Başlatma
```bash
# Bağımlılıkları geri yükleyin ve API'yi çalıştırın
dotnet restore PSL.ProjectHub.sln
dotnet run --project src/PSL.ProjectHub.Api/PSL.ProjectHub.Api.csproj
```
API varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.
- **Swagger UI:** `http://localhost:5000/swagger`
- İlk başlatmada veritabanı migration'ları (`MigrateAsync`) otomatik uygulanır.

### 4. Frontend'i Başlatma (Geliştirici Modu)
```bash
cd src/PSL.ProjectHub.Web
npm install
npm run dev
```
Arayüz `http://localhost:5173` adresinde açılacaktır.

---

## 🧪 Testleri Çalıştırma

### Backend Testleri (xUnit)
```bash
dotnet test PSL.ProjectHub.sln
```
*Tüm 40 test (Proje CRUD, Slug benzersizliği, Soft delete, URL güvenlik doğrulayıcı, Çift kayıt engelleme, Birincil link mantığı, Teknoloji güncelleme, Pasif link filtreleme, Path Traversal koruması, Magic byte dosya kontrolü) başarıyla çalışır.*

### Frontend Testleri (Vitest)
```bash
cd src/PSL.ProjectHub.Web
npm test -- --run
```
*Tüm 15 test (Kimlik doğrulama akışı, login zorunluluğu, 403 Forbidden yetkilendirme koruması, süresi dolan token temizleme, güvenli çıkış, sunum modu, proje kartı) başarıyla çalışır.*

---

## 🚢 Windows Server ve IIS Yayınlama (Single Bundle)

1. **Frontend Derlemesi:**
   ```powershell
   cd src/PSL.ProjectHub.Web
   npm run build
   ```
2. **Çıktıyı API wwwroot Dizini İçine Taşıyın:**
   ```powershell
   New-Item -ItemType Directory -Force -Path ..\PSL.ProjectHub.Api\wwwroot
   Copy-Item -Recurse -Force dist\* ..\PSL.ProjectHub.Api\wwwroot\
   ```
3. **API'yi Yayınlayın:**
   ```powershell
   cd ..\PSL.ProjectHub.Api
   dotnet publish -c Release -o C:\inetpub\wwwroot\PSLProjectHub
   ```
4. **IIS Yapılandırması:**
   - IIS üzerinde `PSLProjectHubPool` adında **No Managed Code** Application Pool oluşturun.
   - Web sitesini `C:\inetpub\wwwroot\PSLProjectHub` dizinine bağlayın.
   - `web.config` içerisindeki `AspNetCoreModuleV2` hem REST API'yi hem de React SPA'yı (`index.html` fallback) sorunsuz servis edecektir.
   - Ayrıntılı adımlar için [docs/iis-deployment.md](docs/iis-deployment.md) belgesini inceleyin.
