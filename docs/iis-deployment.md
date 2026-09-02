# PSL Project Hub - IIS ve Windows Server Yayınlama Kılavuzu

Bu belge, **PSL Project Hub** kurumsal web uygulamasının Windows Server üzerindeki Internet Information Services (IIS) ortamına yayınlanması (deployment) adımlarını açıklar.

---

## 1. Sunucu Ön Koşulları

1. **İşletim Sistemi:** Windows Server 2016, 2019, 2022 veya Windows 10/11 Pro/Enterprise.
2. **IIS Rolleri ve Bileşenleri:**
   - Web Server (IIS)
   - IIS URL Rewrite Module 2.1 (SPA yönlendirmeleri için)
3. **.NET Hosting Bundle:**
   - **.NET 8.0 Hosting Bundle** (ASP.NET Core Module v2 - `AspNetCoreModuleV2`) sunucuda yüklü olmalıdır.
   - Yükleme sonrası komut satırından `iisreset` çalıştırılmalıdır.
4. **SQL Server Erişimi:**
   - Uygulama sunucusunun hedef SQL Server instance'ına (`PSLProjectHub` DB) TCP 1433 veya adlandırılmış örnek portundan erişebildiğinden emin olunmalıdır.

---

## 2. Tek Paket (Single Deployable Unit) Mantığı

PSL Project Hub, IIS üzerinde hem Backend API'yi hem de React SPA ön yüzünü **tek bir Web Sitesi / Tek Application Pool** altında sunacak şekilde tasarlanmıştır:
- React Vite üretim çıktısı (`dist`) doğrudan API projesinin `wwwroot/` dizinine taşınır.
- ASP.NET Core `UseStaticFiles()` ve `MapFallbackToFile("index.html")` kuralları ile tarayıcı isteklerini karşılar:
  - `/api/*` istekleri ASP.NET Core Controller'larına yönlenir.
  - Diğer sayfa URL'leri (`/projects`, `/admin`, vb.) React SPA `index.html` dosyasına düşer (HTML5 History API).

---

## 3. Derleme ve Yayınlama Adımları

Geliştirici veya CI/CD makinesinde:

```powershell
# 1. Frontend Üretim Çıktısını Oluşturun
cd src/PSL.ProjectHub.Web
npm install
npm run build

# 2. Üretim Dosyalarını API'nin wwwroot Klasörüne Kopyalayın
# (Windows PowerShell)
New-Item -ItemType Directory -Force -Path ..\PSL.ProjectHub.Api\wwwroot
Copy-Item -Recurse -Force dist\* ..\PSL.ProjectHub.Api\wwwroot\

# 3. .NET API Projesini Release Modunda Yayınlayın
cd ..\PSL.ProjectHub.Api
dotnet publish -c Release -o C:\inetpub\wwwroot\PSLProjectHub
```

---

## 4. `web.config` Yapılandırması

Uygulamanın kök dizininde yer alan `web.config` dosyası ASP.NET Core modülünü devreye alır:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\PSL.ProjectHub.Api.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
      <environmentVariables>
        <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
      </environmentVariables>
    </aspNetCore>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

---

## 5. IIS Site ve Application Pool Yapılandırması

1. **Application Pool Oluşturma:**
   - Ad: `PSLProjectHubPool`
   - .NET CLR Version: **No Managed Code** (Yönetilmeyen Kod)
   - Managed Pipeline Mode: **Integrated**
2. **Website Oluşturma:**
   - Site Adı: `PSLProjectHub`
   - Physical Path: `C:\inetpub\wwwroot\PSLProjectHub`
   - Application Pool: `PSLProjectHubPool`
   - Port / Binding: İlgili iç IP, port (ör. 80 / 443) ve hostname.
3. **Klasör Yetkileri:**
   - `IIS_IUSRS` ve `IIS AppPool\PSLProjectHubPool` kullanıcılarına yayın klasörü üzerinde **Okuma & Yürütme**, `logs` ve `uploads` klasörleri üzerinde ise **Yazma** izni verilmelidir.
