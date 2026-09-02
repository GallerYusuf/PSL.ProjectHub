# PSL Project Hub

**PSL İç ve Dış Ticaret A.Ş. / Gallery Crystal** bünyesinde kullanılan ve geliştirilen tüm şirket içi yazılım projelerini, canlı ve test adreslerini, API uç noktalarını, teknik bileşenlerini ve geliştirme notlarını tek bir yaşayan merkezde toplayan kurumsal web uygulaması.

---

## 🚀 Temel Özellikler

- **Kurumsal Dashboard:** Toplam, canlı, pilot, geliştirilen, bakımdaki ve doğrulama bekleyen proje KPI sayaçları, hızlı erişim bağlantıları ve son güncellemeler.
- **Canlı URL ve Hızlı Erişim:** Proje kartlarındaki "Uygulamayı Aç" düğmesi ile doğrudan mevcut canlı sistemlere geçiş.
- **İç Ağ & VPN Koruma Göstergesi:** Şirket içi ağ veya VPN gerektiren adreslerde kullanıcıyı uyaran dinamik rozetler.
- **İki Aşamalı Detay Görünümü:**
  - **Yönetici Özeti:** Çözülen iş problemi, getirilen çözüm, şirkete sağlanan değer, hedef kullanıcılar ve zaman çizelgesi.
  - **Teknik Detaylar:** API, Worker, Gateway vb. teknik bileşenler, kullanılan teknolojiler, ERP/WMS/SMS entegrasyonları, sürüm geçmişi ve mimari kararlar.
- **Tam Ekran Sunum Modu:** Yönetim kurulu veya iş birimleri için temiz, sade ve etkileyici sunum ekranı.
- **Gelişmiş Filtreleme & Arama:** Kart ve liste görünümü, durum, kategori, sorumlu ve canlı URL filtreleri.
- **Güvenli URL Yönetimi:** Yalnızca `http://` ve `https://` protokolleri kabul edilir; `javascript:`, `data:`, `file:` vb. saldırı vektörleri engellenir; `rel="noopener noreferrer"` kullanılır; SSRF riski önlenmiştir.
- **Toplu URL İçe Aktarma:** `project-urls.json` dosyasından veya JSON metninden tekrarlanabilir (idempotent) içe aktarma; mükerrer link oluşturulmaz.
- **Rol Tabanlı Erişim:** ASP.NET Core Identity altyapısı ile `Admin` (tam yönetim ve ekleme) ve `Viewer` (salt-okunur izleme ve bağlantı açma).
- **Tek Paket IIS Yayını:** ASP.NET Core 8 Web API ve React SPA tek bir Application Pool altında Windows Server IIS'e dağıtılmaya hazır.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| **Backend API** | ASP.NET Core 8 Web API, C# |
| **Frontend** | React 18, TypeScript, Vite |
| **Veritabanı** | Microsoft SQL Server (`PSLProjectHub`) |
| **ORM** | Entity Framework Core 8 |
| **Kimlik Doğrulama** | ASP.NET Core Identity & JWT Bearer |
| **Stil & Tasarım** | Vanilla CSS Design System (Design Tokens, Glassmorphism, Dark Slate) |
| **İkonlar** | Lucide React |
| **API Dokümantasyonu** | Swagger / OpenAPI |
| **Backend Testleri** | xUnit (.NET 8) |
| **Frontend Testleri** | Vitest & React Testing Library |
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
│   ├── project-analysis.md        # Masaüstündeki şirket projelerinin analizi
│   ├── assumptions.md             # Alınan makul varsayımlar
│   └── future-integrations.md     # Genişletilebilirlik ve mock provider arayüzleri
├── src/
│   ├── PSL.ProjectHub.Domain/         # Varlıklar, Enums, Temel Modeller
│   ├── PSL.ProjectHub.Application/    # DTO'lar, Arayüzler, UrlValidator
│   ├── PSL.ProjectHub.Infrastructure/ # EF Core AppDbContext, Identity, Seeder, Importer
│   ├── PSL.ProjectHub.Api/            # REST API Controller'lar, JWT, web.config, Program.cs
│   └── PSL.ProjectHub.Web/            # React SPA, Vite, TypeScript, Tasarım Sistemi
└── tests/
    ├── PSL.ProjectHub.Api.Tests/      # xUnit backend testleri (31/31 Başarılı)
    └── PSL.ProjectHub.Web.Tests/      # Vitest frontend testleri
```

---

## ⚙️ Kurulum ve Geliştirme (Development)

### 1. Ön Koşullar
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) (npm ile)
- SQL Server (LocalDB, Express veya Kurumsal SQL Server)

### 2. Veritabanı Yapılandırması
`src/PSL.ProjectHub.Api/appsettings.json` dosyası içerisindeki bağlantı dizesini kontrol edin veya geliştirme ortamında `dotnet user-secrets` kullanın:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=PSLProjectHub;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
}
```

> **Önemli:** Uygulama Nebim ERP üretim veritabanına bağlanmaz; kendi `PSLProjectHub` veritabanını kullanır.

### 3. Backend'i Başlatma
```bash
# Bağımlılıkları geri yükleyin ve API'yi çalıştırın
dotnet restore
dotnet run --project src/PSL.ProjectHub.Api/PSL.ProjectHub.Api.csproj
```
API varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.
- **Swagger UI:** `http://localhost:5000/swagger`
- İlk çalıştırmada başlangıç rolleri (`Admin`, `Viewer`), kullanıcıları ve doğrulanmış şirket projeleri otomatik olarak tohumlanır (seeded).

### 4. Frontend'i Başlatma (Geliştirici Modu)
```bash
cd src/PSL.ProjectHub.Web
npm install
npm run dev
```
Arayüz `http://localhost:5173` adresinde açılacaktır. Vite, API isteklerini (`/api/*`) otomatik olarak arka plandaki ASP.NET Core servisine proxy eder.

---

## 🔑 Demo Kullanıcı Hesapları

Test ve inceleme için sistemde hazır tanımlı kullanıcılar:

| Rol | Kullanıcı Adı | Şifre | Yetkiler |
|---|---|---|---|
| **Admin** | `admin` | `Admin123!*` | Tam yönetim, proje/bağlantı ekleme, düzenleme, arşivleme, URL import |
| **Viewer** | `viewer` | `Viewer123!*` | Salt-okunur inceleme, bağlantıları açma, sunum modu |

Giriş ekranındaki hızlı demo düğmelerini kullanarak tek tıkla oturum açabilirsiniz.

---

## 🌐 URL İçe Aktarma (project-urls.json)

Gerçek şirket URL'leri repository'ye veya Git'e yazılmaz.
1. `project-urls.example.json` dosyasını kopyalayarak çözüm kök dizininde `project-urls.json` dosyasını oluşturun:
   ```bash
   copy project-urls.example.json project-urls.json
   ```
2. Gerçek iç ağ / canlı adreslerinizi bu dosyaya girin.
3. Yönetim panelindeki **"project-urls.json Dosyasından Aktar"** düğmesine tıklayın.
4. Sistem idempotent çalışır: Aynı dosya defalarca çalıştırılsa bile duplicate kayıt oluşturmaz, mevcut kayıtları günceller.

---

## 🧪 Testleri Çalıştırma

### Backend Testleri (xUnit)
```bash
dotnet test tests/PSL.ProjectHub.Api.Tests/PSL.ProjectHub.Api.Tests.csproj
```
*Tüm 31 test (Proje CRUD, Slug benzersizliği, Soft delete, URL güvenlik doğrulayıcı, Çift kayıt engelleme, Birincil link mantığı, Idempotent import) başarıyla çalışır.*

### Frontend Testleri (Vitest)
```bash
cd src/PSL.ProjectHub.Web
npm run test
```

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
