# Değişiklik Günlüğü (Changelog)

Tüm önemli değişiklikler bu dosyada kronolojik olarak belgelenmektedir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygundur.

---

## [1.0.0] - 2026-09-02 (Product v1 Foundation)

Bu sürüm ile PSL Project Hub, prototip geliştirme aşamasından çıkarılarak satılabilir, güvenli ve sürdürülebilir bir kurumsal B2B yazılım ürünü temeline dönüştürülmüştür.

### Güvenlik (P0 & P1 Düzeltmeleri)
- **Sabit Şifre Temizliği:** `DataSeeder.cs` içerisindeki `Viewer123!*` sabit şifresi ve otomatik kullanıcı üretimi tamamen kaldırıldı.
- **Güvenli İlk Kurulum Akışı:** Sisteme ilk kurulum sihirbazı (`SetupController` ve `SetupPage.tsx`) eklendi. İlk yönetici kullanıcı tarafından tanımlanır ve işlem sonrası uç nokta kalıcı olarak kilitlenir (409 Conflict).
- **Güvensiz Şema Hilesinin Kaldırılması:** `Program.cs` içerisindeki `__EFMigrationsHistory` ham SQL manipülasyonu kaldırıldı; standart EF Core `MigrateAsync` getirildi. Migrasyon hatasında uygulama kontrollü sonlanır.
- **Anonim Endpoint Kaldırma:** Yetkisiz tetiklenebilen `POST /api/auth/seed` uç noktası silindi.
- **Güvenlik Başlıkları & CSP:** Strict Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` ve `Permissions-Policy` başlıklarını ekleyen `SecurityHeadersMiddleware` devreye alındı. `Server` ve `X-Powered-By` ifşa başlıkları kaldırıldı.
- **Ekran Görüntüsü Depolama Sertleştirmesi:** Dosyalar web kökü dışına taşındı. DB'den sunucu yolu sızıntısı engellendi. Yüklemede dosya sihirli bayt (magic bytes) denetimi, 5 MB ve 20 adet sınırı getirildi.

### Özellikler & Geliştirmeler
- **Tek Gerçek Proje (E-Fatura Otomasyonu):** Tüm demo/mock projeler kaldırıldı. Sisteme tek bir canlı üretim projesi (`http://10.38.0.25:8065/`, Şirket İçi Özel Ağ) bağlandı.
- **Proje Portföyü CRUD:** Projeleri arşivden geri yükleme (`POST /api/projects/{id}/restore`), bileşen, entegrasyon, sürüm ve notlar için güncelleme ve silme operasyonları eklendi.
- **Rol Tabanlı Erişim:** `Admin`, `Editor`, `Presenter`, `Viewer` rolleri tanımlandı. `Editor` rolü operasyonel güncellemeler yapabilir, `Presenter` sunum modunda konuşmacı notlarını görebilir hale getirildi.
- **Denetim İzi (Audit Logging):** `AuditLog` varlığı ve `GET /api/projects/{id}/audit` uç noktası ile projeler üzerindeki tüm kritik değişikliklerin tarihçesi kayıt altına alındı.
- **Modüler Ön Yüz:** 999 satırlık `ProjectDetailPage.tsx` bileşeni 5 bağımsız alt bileşene modülerize edildi.
- **Gelişmiş Sunum Modu:** `PresentationModal.tsx` çok slaytlı yönetici güvertesine dönüştürüldü. Tam ekran modu (F), klavye yön tuşları gezinimi, slayt sayacı ve konuşmacı notları (S) eklendi.
- **Otomatik Dağıtım Hattı:** `PSL.ProjectHub.Api.csproj` içerisine BeforePublish MSBuild hedefi entegre edildi. `dotnet publish` çalıştırıldığında Vite ön yüzü otomatik derlenip `wwwroot` altına yerleştirilir. GitHub Actions CI iş akışı tanımlandı.

### Test Kapsamı
- 49 adet xUnit arka uç entegrasyon ve birim testi eklendi (%100 geçiş).
- 15 adet Vitest ön yüz güvenlik ve bileşen testi eklendi (%100 geçiş).