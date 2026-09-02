# PSL Project Hub - Gelecek Entegrasyonlar ve Genişletilebilirlik

Bu belge, **PSL Project Hub** mimarisinde gelecekte gerçek sistemlere (GitHub API, IIS WMI/Management, Nebim ERP, Otomatik Sağlık Kontrolü) bağlanacak genişletilebilir arayüzleri ve MVP mock yapısını açıklar.

---

## 1. Mimari İlke: SSRF ve Dış Bağımlılık İzolasyonu

MVP aşamasında:
- Kullanıcı veya admin tarafından girilen rastgele URL'lere backend üzerinden HTTP ping veya istek gönderilmez (Server-Side Request Forgery - SSRF riskini önlemek için).
- Canlı GitHub API token'ları, canlı Nebim bağlantıları veya IIS Application Pool COM/WMI erişimleri doğrudan üretim sistemlerine bağlanmamış; arayüzler (interface) üzerinden soyutlanmıştır.

---

## 2. Hazırlanan Genişletilebilirlik Arayüzleri

Aşağıdaki C# arayüzleri `PSL.ProjectHub.Application.Interfaces` içerisinde tanımlanmıştır:

### 2.1. `IRepositoryMetadataProvider`
İleride kurumsal GitHub veya GitLab sunucusu ile haberleşerek:
- Son commit tarihi ve mesajı
- Aktif varsayılan branch (`main` / `master`)
- Son release etiketi
- Açık issue ve pull request sayısı
bilgilerini çekecektir.

### 2.2. `IApplicationHealthProvider`
İleride güvenli bir ağ whitelist'i dahilinde:
- Uygulamanın HTTP 200 OK verip vermediğini
- Yanıt süresini (Latency ms)
- Son başarılı kontrol zamanını
ölçecektir. MVP'de güvenli simüle/manuel provider kullanılmaktadır.

### 2.3. `IDeploymentInfoProvider`
İleride Windows Server IIS yönetim servislerine bağlanarak:
- Son yayınlanma (deployment) zamanı
- IIS Application Pool durumu (`Started`, `Stopped`)
- Sunucudaki `web.config` veya versiyon dosyasını
okuyacaktır.

---

## 3. Gerçek Entegrasyona Geçiş Adımları

1. **GitHub Entegrasyonu:**
   - Şirket GitHub Organization'ı için read-only bir Personal Access Token (PAT) veya GitHub App oluşturulup Azure Key Vault veya Environment Variables üzerinden `GitHub__AccessToken` olarak verilir.
   - `GitHubRepositoryMetadataProvider` sınıfı yazılarak `IRepositoryMetadataProvider` implementasyonu DI (Dependency Injection) container'ında değiştirilir.
2. **IIS Yönetim Entegrasyonu:**
   - `Microsoft.Web.Administration` paketi kullanılarak yerel IIS sunucusunun Application Pool ve Site durumları sorgulanabilir.
3. **Active Directory / Entra ID:**
   - `Microsoft.Identity.Web` veya `Microsoft.AspNetCore.Authentication.Negotiate` paketiyle Windows Authentication veya Microsoft Entra ID SSO'ya geçiş yapılabilir.
