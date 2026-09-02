# PSL Project Hub — Ürün Güvenliği ve Mimari Denetim Raporu (Product Audit)

**Tarih:** 2 Eylül 2026  
**Sürüm:** v1.0.0 (Product Baseline)  
**Hedef Ortam:** Şirket İçi Kurumsal Özel Ağ / B2B Dağıtım  
**Durum:** Üretime Hazır (Production Ready)

---

## 1. Yönetici Özeti

PSL Project Hub, kurum içi geliştirilen ve kullanılan kurumsal yazılım envanterini tek bir operasyonel merkezden yönetmek, izlemek ve karar alıcılara sunmak amacıyla tasarlanmış bir B2B platformudur.

Bu çalışma kapsamında prototip/demo seviyesindeki kod tabanı; kritik güvenlik açıkları (P0), güvensiz veritabanı migrasyon mantıkları, sabit şifre sızıntıları ve yetersiz yetkilendirme modellerinden arındırılarak **satılabilir, sürdürülebilir ve güvenli bir ürün temeline** kavuşturulmuştur.

---

## 2. Tespit Edilen Güvenlik ve Mimari Açıklar & Düzeltmeler

| Risk Seviyesi | Başlık | Tespit Edilen Durum | Yapılan Düzeltme & Çözüm |
| :--- | :--- | :--- | :--- |
| **P0 (Kritik)** | **Sabit Şifre Sızıntısı** | `DataSeeder.cs` içerisinde kaynak koda gömülü `Viewer123!*` şifresi bulunmaktaydı. | Sabit şifreli otomatik kullanıcı üretimi tamamen kaldırıldı. Güvenli ilk kurulum akışı (`SetupController` & `SetupPage.tsx`) getirildi. |
| **P0 (Kritik)** | **Güvensiz Şema Hilesi** | `Program.cs` içerisinde `__EFMigrationsHistory` tablosuna ham SQL ile kayıt enjekte eden riskli bir blok vardı. | Ham SQL sorguları tamamen silindi. Yalnızca standart ve idempotent EF Core `MigrateAsync` yöntemi bırakıldı. Migrasyon hatasında uygulama kontrollü şekilde kapanır. |
| **P0 (Kritik)** | **Anonim Tohumlama Uç Noktası** | `POST /api/auth/seed` ucu yetkisiz herkes tarafından tetiklenebiliyordu. | Endpoint tamamen kaldırıldı. |
| **P0 (Kritik)** | **Demo Proje Kirliliği** | Tohumlama dosyasında 10 adet hayali/mock proje mevcuttu. | Tüm mock projeler kaldırıldı. Sisteme tek bir gerçek kurumsal proje (**E-Fatura Otomasyonu**) idempotent olarak bağlandı. |
| **P1 (Yüksek)** | **Fiziksel Sunucu Yolu Sızıntısı** | Ekran görüntüleri doğrudan web kök dizinine yazılıyor ve DB'de sunucu dosya yolları (`C:\...`) tutuluyordu. | Dosyalar web kökü dışına (`uploads/screenshots`) taşındı. DB'de sunucu yolu tutulması sonlandırıldı. Görseller `GET /api/screenshots/{id}/file` üzerinden yetkili olarak akıtılıyor. |
| **P1 (Yüksek)** | **Dosya Yükleme Güvenliği** | Yüklenen görseller yalnızca uzantı kontrolünden geçiyordu. | Gerçek dosya türünü doğrulayan dosya başlığı sihirli bayt (magic bytes) denetimi, dosya boyutu (5MB) ve proje başına adet (20) kotaları eklendi. |
| **P1 (Yüksek)** | **XSS & İstemci Güvenliği** | JWT token localStorage üzerinde saklanırken CSP koruması bulunmuyordu. | Strict Content Security Policy (CSP), X-Frame-Options (DENY), X-Content-Type-Options (nosniff) ve Permissions Policy başlıkları eklendi. |
| **P2 (Orta)** | **Eksik CRUD ve Silinemeyen Varlıklar** | Arşivlenen projeyi geri getirme (restore) ve bileşen/entegrasyon/sürüm/not varlıklarını düzenleme/silme uçları yoktu. | Eksik tüm CRUD operasyonları ve `POST /api/projects/{id}/restore` eklendi. |
| **P2 (Orta)** | **Denetim İzi (Audit Trail) Eksikliği** | Kimin hangi projede ne zaman değişiklik yaptığı izlenemiyordu. | `AuditLog` varlığı, veritabanı tablosu, servis katmanı ve `GET /api/projects/{id}/audit` uç noktası devreye alındı. |
| **P2 (Orta)** | **Monolitik Ön Yüz Bileşeni** | `ProjectDetailPage.tsx` 999 satırlık monolitik bir dosyadan oluşuyordu. | 5 bağımsız alt bileşene modüler hale getirildi (Header, DossierTab, TechnicalTab, LinkInventory, ScreenshotGallery). |

---

## 3. Sistemde Tanımlı Tek Üretim Projesi

Sistemde ilk tohumlama (veya sıfırdan kurulum) sonrasında yalnızca bir adet gerçek kurumsal proje yer almaktadır:

- **Proje Adı:** E-Fatura Otomasyonu
- **Kategori:** Finans & Muhasebe
- **Durum:** Canlı (Live)
- **Canlı Erişim Adresi:** `http://10.38.0.25:8065/`
- **Ağ Kapsamı:** Şirket İçi Özel Ağ (Internal Network)
- **Kimlik Doğrulama:** Gerekli (Active Directory / Kurumsal Kullanıcı)
- **Doğrulama Durumu:** Doğrulanmış (Verified)

---

## 4. Mimari Karar Kayıtları (ADR Dizini)

Tüm mimari tercihler `docs/adr/` altında dokümante edilmiştir:
- **ADR-001:** Kimlik Doğrulama Stratejisi (v1 JWT + LocalStorage + CSP; v2 HttpOnly Cookie)
- **ADR-002:** Tek Kiracılı (Single-Tenant) Kurumsal Dağıtım Modeli
- **ADR-003:** Ekran Görüntüsü Saklama ve Yetkili Akış Mimarisi
- **ADR-004:** Standart EF Core Migrasyon ve Veritabanı Yaşam Döngüsü
- **ADR-005:** MSBuild Ön Yüz Derleme ve Dağıtım Hattı Entegrasyonu
- **ADR-006:** Denetim İzi (Audit Logging) ve İşlem Tarihçesi Mimarisi
- **ADR-007:** Beyaz Etiketleme (White-Labeling) ve Kurumsal Markalama Stratejisi

---

## 5. Doğrulama ve Test Sonuçları

- **Arka Uç Testleri:** 49/49 Başarılı (%100 Geçiş)
  - Yaşam döngüsü ve slug benzersizliği
  - URL güvenlik kontrolleri ve erişim izinleri
  - Arşivleme ve arşivden geri yükleme (Restore)
  - Bileşen, Entegrasyon, Sürüm ve Not CRUD operasyonları
  - İlk kurulum (Setup) mantığı, çakışma (409 Conflict) ve şifre kuralları
  - Hesap kilitleme (Lockout 423) kontrolleri
- **Ön Yüz Testleri:** 15/15 Başarılı (%100 Geçiş)
  - Oturum sertleştirmesi ve token süre aşımı kontrolleri
  - URL güvenlik ve SSRF/Javascript protokol engelleme testleri
  - Sunum modu slayt akışı ve yönetici bilgi kartları
  - Proje kartı durum ve rozet render testleri
- **Üretim Derlemesi:** `dotnet publish -c Release` hatasız tamamlanmakta ve Vite ön yüz paketini otomatik olarak `publish/wwwroot` içerisine aktarmaktadır.