# PSL Project Hub — İlk Kurulum ve Başlangıç Kılavuzu

Bu kılavuz, PSL Project Hub platformunun sıfırdan kurulumunu ve ilk yönetici hesabının güvenli bir şekilde tanımlanmasını adım adım açıklar.

---

## 1. Ön Koşullar

- **İşletim Sistemi:** Windows Server 2019/2022 veya Windows 10/11
- **Çalışma Zamanı:** .NET 8.0 ASP.NET Core Hosting Bundle (veya .NET 8 SDK)
- **Veritabanı:** Microsoft SQL Server 2019+ veya Azure SQL / LocalDB
- **Node.js:** Node 20+ (yalnızca kaynak koddan derleme yapılacaksa)
- **Ağ:** Port 80 / 443 veya intranet üzerinde belirlenen port (Örn: 5000 / 8080)

---

## 2. Kurulum Adımları

### Adım 1: Uygulama Paketini İndirme / Derleme
Kaynak koddan derleme yapmak için:
```bash
dotnet publish src/PSL.ProjectHub.Api/PSL.ProjectHub.Api.csproj -c Release -o C:\inetpub\PSLProjectHub
```
*Not: Bu komut ön yüzü otomatik derleyerek `wwwroot` altına yerleştirir.*

### Adım 2: Veritabanı Bağlantı Dizesi Yapılandırması
`appsettings.Production.json` (veya ortam değişkeni) içerisinde SQL Server bağlantısını tanımlayın:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver.corp.local;Database=PSLProjectHub;User Id=psl_app;Password=GucluParola123!;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "SecretKey": "EN_AZ_32_KARAKTERLI_COK_GUCLU_VE_GIZLI_BIR_JWT_ANAHTARI_BURAYA_GELMELIDIR",
    "Issuer": "PSL.ProjectHub",
    "Audience": "PSL.ProjectHub.Clients",
    "ExpiryHours": 8
  },
  "Storage": {
    "ScreenshotsPath": "C:\\ProgramData\\PSLProjectHub\\Uploads\\Screenshots",
    "MaxScreenshotSizeBytes": 5242880,
    "MaxScreenshotsPerProject": 20
  }
}
```

### Adım 3: Uygulamayı Başlatma ve Otomatik Şema
Uygulama ilk kez başlatıldığında:
1. EF Core migrasyonları (`InitialCreate` ve `AddAuditLogTable`) SQL Server'da otomatik olarak çalıştırılır ve tablolar oluşturulur.
2. Rol tablosuna `Admin`, `Editor`, `Presenter`, `Viewer` rolleri eklenir.
3. Tek üretim projesi olan **E-Fatura Otomasyonu** sisteme eklenir.
4. **Hiçbir varsayılan şifre veya kullanıcı otomatik olarak eklenmez.**

---

## 3. Web Arayüzünden İlk Kurulum Sihirbazı (First-Run Setup)

Uygulama tarayıcıda açıldığında (`http://sunucu-adresi:port/`):

1. Sistem veritabanında kullanıcı bulunmadığını tespit eder ve otomatik olarak **İlk Kurulum Ekranı**'na (`SetupPage`) yönlendirir.
2. Açılan ekranda şu bilgiler doldurulur:
   - **Organizasyon Adı:** Kurumunuzun unvanı (Örn: *PSL İç ve Dış Ticaret A.Ş.*)
   - **Yönetici Ad Soyad:** Sistem yöneticisinin adı
   - **Kullanıcı Adı:** Yönetici girişi için kullanıcı adı (Örn: `admin`)
   - **E-posta Adresi:** İletişim e-posta adresi
   - **Güçlü Şifre:** En az 8 karakter, büyük/küçük harf, rakam ve sembol içeren güçlü parola
3. **"Kurulumu Tamamla ve Başlat"** butonuna basıldığında:
   - Ana yönetici hesabı oluşturulur ve `Admin` rolü atanır.
   - Kurulum uç noktası kalıcı olarak kilitlenir (`POST /api/setup/initialize` bir daha çağrılamaz, 409 Conflict döner).
4. Kullanıcı otomatik olarak giriş ekranına yönlendirilir ve oluşturduğu bilgilerle sisteme giriş yapar.