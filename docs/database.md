# PSL Project Hub - Veritabanı Mimarisi

Bu belge, **PSL Project Hub** uygulaması için tasarlanan SQL Server veritabanı şemasını, tabloları, ilişkileri ve indeksleme kurallarını açıklar.

---

## 1. Veritabanı Genel Özellikleri

- **Veritabanı Adı:** `PSLProjectHub`
- **İlişkisel Veritabanı:** Microsoft SQL Server
- **ORM:** Entity Framework Core 8
- **Tarih Formatı:** Tüm tarih alanları UTC (`DateTime.UtcNow`) olarak saklanır.
- **Silme Stratejisi:** Projelerde ve bağlantılarda veri kaybını önlemek amacıyla **Soft Delete** (`IsArchived` / `IsActive=false`) ve global EF Core sorgu filtreleri kullanılır.

---

## 2. Tablo Şemaları ve Varlıklar

### 2.1. `Projects` (Projeler)
| Kolon | Veri Tipi | Kısıtlar / İndeks | Açıklama |
|---|---|---|---|
| `Id` | `uniqueidentifier` | Primary Key | Benzersiz proje kimliği |
| `Name` | `nvarchar(200)` | NOT NULL | Proje adı |
| `Slug` | `nvarchar(200)` | NOT NULL, UNIQUE Index | URL dostu benzersiz anahtar (örn: `musteri-platformu`) |
| `ShortDescription` | `nvarchar(500)` | NOT NULL | Proje kartında gösterilen kısa özet |
| `BusinessProblem` | `nvarchar(max)` | NULL | Projenin çözdüğü iş problemi |
| `BusinessSolution` | `nvarchar(max)` | NULL | Şirkete getirilen çözüm |
| `BusinessValue` | `nvarchar(max)` | NULL | Şirkete sağladığı stratejik/maddi değer |
| `Category` | `nvarchar(100)` | NOT NULL | Kategori (ERP, Satış, Lojistik, İK, vb.) |
| `Status` | `nvarchar(50)` | NOT NULL | `Development`, `Pilot`, `Live`, `Maintenance`, `Archived` |
| `IsVerified` | `bit` | NOT NULL, DEFAULT 0 | Proje bilgilerinin doğrulanıp doğrulanmadığı |
| `OwnerName` | `nvarchar(150)` | NULL | Proje sorumlusu kişi |
| `Department` | `nvarchar(150)` | NULL | İlgili şirket departmanı |
| `TargetUsers` | `nvarchar(250)` | NULL | Hedef kullanıcı kitlesi |
| `StartDate` | `datetime2` | NULL | Proje başlangıç tarihi |
| `LiveDate` | `datetime2` | NULL | Canlıya geçiş tarihi |
| `CurrentVersion` | `nvarchar(50)` | NULL | Güncel sürüm etiketi (örn: `v1.2.0`) |
| `CreatedAt` | `datetime2` | NOT NULL | Oluşturulma tarihi (UTC) |
| `UpdatedAt` | `datetime2` | NULL | Son güncelleme tarihi (UTC) |
| `IsArchived` | `bit` | NOT NULL, DEFAULT 0 | Arşivlenme/silinme bayrağı (Soft delete) |

### 2.2. `ProjectLinks` (Proje Bağlantıları)
| Kolon | Veri Tipi | Kısıtlar / İndeks | Açıklama |
|---|---|---|---|
| `Id` | `uniqueidentifier` | Primary Key | Benzersiz bağlantı kimliği |
| `ProjectId` | `uniqueidentifier` | NOT NULL, FK -> Projects | Bağlı olduğu proje |
| `ProjectComponentId` | `uniqueidentifier` | NULL, FK -> ProjectComponents | Opsiyonel bağlı bileşen |
| `Label` | `nvarchar(150)` | NOT NULL | Görünen ad (örn: "Canlı Web Portalı") |
| `Url` | `nvarchar(1000)` | NOT NULL | Bağlantı adresi (`http://` veya `https://`) |
| `LinkType` | `nvarchar(50)` | NOT NULL | `Production`, `Test`, `AdminPanel`, `Api`, `Swagger`, vb. |
| `Environment` | `nvarchar(50)` | NOT NULL | `Production`, `Test`, `Development`, `Internal`, `External` |
| `IsPrimary` | `bit` | NOT NULL, DEFAULT 0 | Proje kartındaki ana "Uygulamayı Aç" düğmesini belirler |
| `IsActive` | `bit` | NOT NULL, DEFAULT 1 | Aktiflik durumu (pasife alınanlar listelenmez) |
| `RequiresVpn` | `bit` | NOT NULL, DEFAULT 0 | İç ağ / VPN gereksinimi rozeti |
| `RequiresAuthentication` | `bit` | NOT NULL, DEFAULT 0 | Giriş / şifre gereksinimi rozeti |
| `OpenInNewTab` | `bit` | NOT NULL, DEFAULT 1 | Yeni sekmede açılıp açılmayacağı |
| `DisplayOrder` | `int` | NOT NULL, DEFAULT 0 | Gösterim sırası |
| `CreatedAt` | `datetime2` | NOT NULL | Oluşturulma tarihi (UTC) |
| `UpdatedAt` | `datetime2` | NULL | Güncellenme tarihi (UTC) |

> **İndeks:** `(ProjectId, Url)` üzerinde mükerrer kayıt eklenmesini engelleyen kontrol ve indeks tanımlanmıştır.

### 2.3. `ProjectComponents` (Teknik Bileşenler)
- `Id`, `ProjectId` (FK), `Name`, `ComponentType` (`API`, `Web`, `Gateway`, `Worker`, `WindowsService`, `ScheduledJob`), `Description`, `Environment`, `DisplayOrder`.

### 2.4. `Technologies` & `ProjectTechnologies` (Teknolojiler)
- `Technology`: `Id`, `Name`, `Category` (`Backend`, `Frontend`, `Database`, `Infrastructure`, `Integration`).
- `ProjectTechnologies`: Proje ile teknoloji arasındaki çoka-çok ilişki tablosu.

### 2.5. `ProjectIntegrations` (Entegrasyonlar)
- `Id`, `ProjectId` (FK), `Name`, `IntegrationType`, `Description`, `IsCritical`. (Örn: Nebim ERP, WMS, SMS, SMTP).

### 2.6. `ProjectReleases` (Sürümler)
- `Id`, `ProjectId` (FK), `Version`, `Title`, `Description`, `ReleaseDate`, `Environment`.

### 2.7. `ProjectNotes` (Geliştirme Notları)
- `Id`, `ProjectId` (FK), `Title`, `Content`, `NoteType` (`KnownIssue`, `DevelopmentNote`, `Decision`, `FuturePlan`), `CreatedAt`, `UpdatedAt`.

### 2.8. `ProjectScreenshots` (Ekran Görüntüleri)
- `Id`, `ProjectId` (FK), `FileName`, `FilePath`, `Caption`, `DisplayOrder`, `CreatedAt`.

### 2.9. ASP.NET Core Identity Tabloları
- `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, `AspNetUserClaims`, vb.
- Varsayılan roller: `Admin` ve `Viewer`.
