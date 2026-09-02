# PSL Project Hub - Makul Varsayımlar ve Kararlar (Assumptions)

Bu belge, **PSL İç ve Dış Ticaret A.Ş. / Gallery Crystal** bünyesindeki yazılım projelerini tek merkezde toplamak için geliştirilen **PSL Project Hub** projesinde alınan makul teknik ve iş varsayımlarını listeler.

---

## 1. Veritabanı ve Nebim ERP Ayrımı
- **Varsayım:** Proje panosu ve URL envanteri, Nebim V3 üretim veritabanından tamamen bağımsız `PSLProjectHub` isimli müstakil bir SQL Server veritabanında barındırılmalıdır.
- **Gerekçe:** Nebim ERP üretim tablolarının bütünlüğü ve performansı riske atılmamalıdır. Project Hub yalnızca kendi veritabanında okuma/yazma yapar; Nebim üzerinde herhangi bir `INSERT`, `UPDATE` veya `DELETE` işlemi yapmaz.

## 2. Kimlik Doğrulama ve Yetkilendirme (Auth)
- **Varsayım:** Uygulama şirket içi özel erişimli olduğundan ASP.NET Core Identity altyapısı temel alınmıştır. 
- **Roller:**
  - `Admin`: Tüm projeleri, bağlantıları, teknik bileşenleri, entegrasyonları, ekran görüntülerini ve notları yönetebilir; URL import işlemini tetikleyebilir; proje doğrulama durumunu değiştirebilir.
  - `Viewer`: Salt-okunur yetkiye sahiptir. Projeleri, yönetici özetlerini, teknik detayları ve yetkisi dahilindeki proje bağlantılarını inceleyebilir ve bağlantıları açabilir. Yönetim butonları Viewer rolüne gizlenir.
- **Genişletilebilirlik:** Gelecekte şirket içi Active Directory (Windows Authentication) veya bulut tabanlı Microsoft Entra ID (Azure AD) SSO mekanizmalarına geçişi kolaylaştırmak amacıyla servis arayüzleri soyutlanmıştır.

## 3. URL Güvenliği ve Doğrulama
- **Varsayım:** Uygulama URL'leri tahmin edilerek veya rastgele üretilerek sisteme eklenmez.
- **Doğrulama Kriterleri:**
  - Yalnızca `http://` ve `https://` protokolleri geçerli kabul edilir.
  - `javascript:`, `data:`, `file:`, `vbscript:` ve benzeri saldırı/komut enjeksiyonu vektörleri engellenir.
  - Aynı proje altında aynı URL'nin mükerrer (duplicate) eklenmesi engellenir.
  - `target="_blank"` bağlantılarında `rel="noopener noreferrer"` kullanılır.
  - Dış/iç sunuculara rastgele HTTP isteği gönderilmez (SSRF riski tamamen önlenmiştir).
  - Admin formunda URL'nin hassas query string (token, şifre, api key vb.) içermemesi gerektiği konusunda kullanıcı uyarılır.

## 4. Masaüstü Proje Analizleri ve Eşleştirmeler
- **Varsayım:** Kullanıcı masaüstünde bulunan projeler (`EFaturaOtomasyon`, `inventory_emilio`, `project_Relocation`, `FISSLERSERVIS`, `Crystal_Family`) salt-okunur analiz edilmiştir.
- **Kişisel / Altyapı Projeleri:**
  - `my_prayer_app`: Şirket içi iş projesi olmadığı değerlendirilerek sisteme eklenmemiştir.
  - `Default Web Site`: İş projesi değil, IIS varsayılan altyapı sitesi olarak değerlendirilmiştir.
- **Doğrulama Bekliyor Statüsü:**
  - E-Fatura Otomasyonu'nun taslak açıklaması ("Kütahya şubesine ait e-irsaliyelerin Nebim ERP üzerinde faturalandırılmaya hazırlanmasını sağlayan sistemdir...") ve tespit edilen olası yerel/uzak URL'ler `Doğrulama Bekliyor` olarak işaretlenmiştir.
  - Gerçek şirket URL'leri seed koduna yazılmamış; `project-urls.example.json` şablonu oluşturulmuş ve gerçek `project-urls.json` dosyası `.gitignore` kapsamına alınmıştır.

## 5. UI/UX ve Tasarım Dili
- **Varsayım:** Şirketin resmi renk kodu veya SVG logosu bu aşamada verilmediğinden, sistem CSS değişkenleri (Design Tokens) üzerinden kolayca özelleştirilebilir, modern, kurumsal ve sade bir tasarım diliyle hazırlanmıştır.
- **Dil Tercihi:** Arayüz dili baştan sona **Türkçe**; kod tabanı, entity, tablo ve kolon isimleri ise uluslararası standartlara uygun olarak **İngilizce** kurgulanmıştır.

## 6. Yayınlama ve IIS Desteği
- **Varsayım:** Uygulama Windows Server ve IIS üzerinde tek bir sitede/app pool'da yayınlanmaya uygun olmalıdır.
- **Çözüm:** React SPA çıktısı (`dist`) ASP.NET Core API'sinin `wwwroot` dizinine taşınabilir ve `MapFallbackToFile("index.html")` ve `web.config` ile tek bir paket halinde IIS'e dağıtılabilir.
