# PSL Project Hub - Güvenlik Mimarisi ve İlkeleri

Bu belge, **PSL Project Hub** bünyesinde uygulanan kurumsal güvenlik standartlarını, yetkilendirme modellerini ve URL güvenliği mekanizmalarını açıklar.

---

## 1. Kimlik Doğrulama ve Yetkilendirme (Authentication & Authorization)

- **Kimlik Doğrulama Modeli:** ASP.NET Core Identity altyapısı üzerinde JWT (JSON Web Token) kimlik doğrulama mekanizması kullanılır.
- **Roller ve Yetkiler:**
  - **Admin:**
    - Proje oluşturma, düzenleme, arşivleme (soft-delete).
    - Projeye sınırsız bağlantı (URL) ekleme, düzenleme, aktif/pasif yapma, birincil bağlantı belirleme ve sıralama.
    - Teknik bileşen, teknoloji, entegrasyon, sürüm ve not ekleme/güncelleme.
    - Projeyi "Doğrulandı" (`IsVerified = true`) olarak işaretleme.
    - `project-urls.json` içe aktarımını tetikleme.
  - **Viewer:**
    - Projeleri, yönetici özetlerini ve teknik detayları görüntüleme.
    - Proje bağlantılarını güvenle açabilme.
    - Sunum modunu kullanabilme.
    - *Yönetimsel düğmeler (Ekle, Düzenle, Sil, Arşivle, İçe Aktar) Viewer rolünden gizlenir; API seviyesinde `[Authorize(Roles = "Admin")]` ile korunur.*

---

## 2. URL Güvenliği Standartları

Uygulamanın en kritik işlevlerinden biri şirket içi ve dışı URL'leri yönetmektir. Bu nedenle katı güvenlik ilkeleri uygulanır:

1. **İzin Verilen Protokoller:**
   - Yalnızca `http://` ve `https://` protokollerine izin verilir.
   - `javascript:`, `data:`, `file:`, `vbscript:` ve benzeri XSS / kod yürütme protokolleri regex ve `Uri` doğrulamasıyla reddedilir.
2. **Çift Katmanlı Doğrulama:**
   - URL doğrulaması hem frontend (form girişi sırasında anlık) hem de backend (`UrlValidator` sınıfı ile sunucu tarafında) yapılır.
3. **Tabnabbing ve Referrer Koruması:**
   - Yeni sekmede açılan (`target="_blank"`) tüm bağlantılarda zorunlu olarak `rel="noopener noreferrer"` özniteliği kullanılır.
4. **SSRF (Server-Side Request Forgery) Önlemi:**
   - Sistem kullanıcının veya adminin girdiği URL'lere arka plandan körlemesine HTTP isteği göndermez. Sağlık kontrolü (Health Check) MVP aşamasında mock/manual arayüzlerle yönetilir.
5. **Hassas Parametre Uyarısı:**
   - Admin bağlantı formunda, URL içerisinde `token`, `password`, `secret`, `apikey` veya `session` gibi hassas query string bulunmaması gerektiği açıkça uyarılır.
6. **İç Ağ ve VPN Etiketi:**
   - İç ağa bağlı ya da VPN gerektiren adreslerde kullanıcıya açıkça *"Şirket ağı veya VPN gerekebilir"* rozeti gösterilir.
7. **Pasif Bağlantılar:**
   - Kullanılmayan bağlantılar kalıcı olarak silinmek yerine `IsActive = false` yapılarak arşivlenir; son kullanıcılara gösterilmez.
8. **IFrame Engeli:**
   - Dış ve iç web sayfaları Project Hub içerisinde iframe olarak açılmaz; doğrudan güvenli yeni sekmede açılır.

---

## 3. Gizli Bilgi (Secret) Yönetimi

- Hiçbir veritabanı bağlantı dizesi (Connection String), JWT gizli anahtarı veya kullanıcı parolası kaynak koda ya da Git deposuna yazılmaz.
- Ortam bazlı `appsettings.Development.json` ve `appsettings.Production.json` kullanılır.
- Geliştirme ortamında `dotnet user-secrets` kullanılır; canlı ortamda ise ortam değişkenleri (Environment Variables) veya IIS Application Settings üzerinden beslenir.
- Gerçek şirket bağlantılarını içeren `project-urls.json` dosyası `.gitignore` ile korunur; sadece örnek şablon olan `project-urls.example.json` repoda saklanır.
