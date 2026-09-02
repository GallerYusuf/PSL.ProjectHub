# PSL Project Hub — Ortam Değişkenleri ve Yapılandırma Referansı

PSL Project Hub, 12-Factor App prensiplerine uygun olarak ortam değişkenleri (Environment Variables) veya JSON dosyaları (`appsettings.json`, `appsettings.Production.json`) üzerinden yapılandırılabilir.

---

## 1. Temel Ortam Değişkenleri Tablosu

| Değişken Adı | JSON Karşılığı | Zorunlu mu? | Varsayılan Değer | Açıklama |
| :--- | :--- | :---: | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | - | Evet | `Production` | Çalışma ortamı (`Development`, `Staging`, `Production`). |
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings:DefaultConnection` | Evet | LocalDB | Microsoft SQL Server veritabanı bağlantı dizesi. |
| `Jwt__SecretKey` | `Jwt:SecretKey` | Evet | - | JWT imzalamada kullanılan en az 32 karakterlik gizli anahtar. |
| `Jwt__Issuer` | `Jwt:Issuer` | Evet | `PSL.ProjectHub` | JWT üreten servis kimliği. |
| `Jwt__Audience` | `Jwt:Audience` | Evet | `PSL.ProjectHub.Clients` | JWT tüketen istemci kimliği. |
| `Jwt__ExpiryHours` | `Jwt:ExpiryHours` | Hayır | `8` | Token geçerlilik süresi (saat). |
| `Storage__ScreenshotsPath` | `Storage:ScreenshotsPath` | Hayır | `{ContentRoot}/uploads/screenshots` | Ekran görüntülerinin saklanacağı web kök dışı fiziksel dizin. |
| `Storage__MaxScreenshotSizeBytes` | `Storage:MaxScreenshotSizeBytes` | Hayır | `5242880` (5 MB) | Tek bir görsel için izin verilen maksimum bayt boyutu. |
| `Storage__MaxScreenshotsPerProject` | `Storage:MaxScreenshotsPerProject` | Hayır | `20` | Bir projeye eklenebilecek maksimum ekran görüntüsü sayısı. |

---

## 2. Windows Sunucuda Ortam Değişkeni Tanımlama (PowerShell)

```powershell
# Sistem geneli ortam değişkeni ekleme (Yönetici yetkisi gerekir)
[System.Environment]::SetEnvironmentVariable(
    "ConnectionStrings__DefaultConnection",
    "Server=sql01.corp.local;Database=PSLProjectHub;User Id=appuser;Password=GucluParola123!;TrustServerCertificate=True;",
    "Machine"
)

[System.Environment]::SetEnvironmentVariable(
    "Jwt__SecretKey",
    "f8a3c8e9b2d147f6a5e4d3c2b1a09876543210abcdef1234567890abcdef",
    "Machine"
)
```

---

## 3. IIS Üzerinde Ortam Değişkeni Tanımlama (`web.config`)

```xml
<configuration>
  <system.webServer>
    <aspNetCore processPath="dotnet" arguments=".\PSL.ProjectHub.Api.dll" stdoutLogEnabled="false">
      <environmentVariables>
        <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
        <environmentVariable name="ConnectionStrings__DefaultConnection" value="Server=sql01;Database=PSLProjectHub;Trusted_Connection=True;TrustServerCertificate=True;" />
      </environmentVariables>
    </aspNetCore>
  </system.webServer>
</configuration>
```