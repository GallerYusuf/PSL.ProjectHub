# PSL & Gallery Crystal - Proje Analiz Raporu

Bu rapor, geliştirici çalışma ortamında bulunan projelerin salt-okunur olarak incelenmesi sonucu hazırlanmıştır. Hiçbir harici projede değişiklik yapılmamıştır.

> [!WARNING]
> Bu raporda yer alan adresler kod incelemesinde tespit edilen port ve değişkenlerden elde edilmiştir. **Hiçbir adres otomatik olarak canlı URL kabul edilmemiştir; tamamı "Doğrulama Bekliyor" statüsündedir.**

---

## 1. E-Fatura Otomasyonu (`EFaturaOtomasyon-main` & `muhasebe_live`)

- **Projenin Gerçek Amacı:** Galeri Kristal Kütahya Şubesi için PSLV3 veritabanı üzerinde iki temel akışı yönetir:
  1. Gelen e-faturaları bağlı e-irsaliyelerle eşleştirip faturalandırma (`trInvoiceHeader`, `trInvoiceLine`, `trCurrAccBook` vb.).
  2. Gelen e-irsaliyeleri (OKI) ürün barkoduna çözüp PSLV3'e `1-BP-2` alış siparişi ve `1-BP-6` irsaliye yazma.
- **Taslak Açıklama Durumu:** 
  - *"Kütahya şubesine ait e-irsaliyelerin Nebim ERP üzerinde faturalandırılmaya hazırlanmasını sağlayan sistemdir. Ürün kodu eşleştirme, mükerrer kayıt, miktar, fiyat ve KDV kontrolleri yaparak hatalı faturalaşma riskini azaltmayı hedefler."*
  - **Durum:** **Doğrulama Bekliyor**. Repo incelemesi, faturanın yanı sıra *Sipariş → İrsaliye* akışının ve otomatik `HostedService` job'larının da bulunduğunu göstermektedir.
- **Uygulama Türü:** .NET 8 ASP.NET Core Web API + Statik HTML/JS Yönetim Paneli (`wwwroot`).
- **Veritabanı:** SQL Server (`PSLV3` Nebim ERP veritabanı).
- **Entegrasyonlar:** Nebim ERP V3, SQL Audit Writer.
- **Teknolojiler:** C#, ASP.NET Core 8, Dapper, Cookie Authentication, Swagger.
- **Background Service:** `EInvoiceAutomationOrchestrator` ve günlük çalışan background job.
- **Hedef Kullanıcılar:** Muhasebe ve İrsaliye personeli, Sistem Yöneticisi (`Admin`).
- **Olası Yayın / Çalışma URL'leri (Doğrulama Bekliyor):**
  - Geliştirme: `http://localhost:5000` / Swagger: `/swagger`
  - Canlı Yayın Paketi: `c:\Users\yusufemredeniz\Desktop\muhasebe_live` dizininde IIS için derlenmiş hazır `web.config` ve ASP.NET Core publish dosyaları tespit edilmiştir. Gerçek IIS URL'si sistem yöneticisi tarafından doğrulanmalıdır.

---

## 2. Emilio Stok Sistemi (`inventory_emilio`)

- **Projenin Gerçek Amacı:** Emilio mağazası için Nebim SQL veritabanından ürün, fiyat, barkod, renk/beden ve mağaza/depo bazlı stok bilgilerini sorgulayarak web arayüzünde hızlıca sunmak.
- **Uygulama Türü:** Çok katmanlı web uygulaması (`Emilio.Web`, `Emilio.Api`, `Emilio.Contracts`).
- **Veritabanı:** SQL Server (Nebim ERP veritabanı).
- **Entegrasyonlar:** Nebim ERP (salt-okunur sorgular).
- **Teknolojiler:** ASP.NET Core MVC (.NET 8), Minimal API, Microsoft.Data.SqlClient, Razor Views, CSS.
- **Hedef Kullanıcılar:** Emilio mağaza satış danışmanları ve depo personeli.
- **Olası Çalışma URL'leri (Doğrulama Bekliyor):**
  - Web UI: `http://localhost:5228`
  - Backend API: `http://localhost:5215` / Swagger: `/swagger`

---

## 3. Crystal Family / Müşteri Platformu (`Crystal_Family`)

- **Projenin Gerçek Amacı:** Gallery Crystal mağazaları için müşteri kayıt, KVKK / Ticari Elektronik İleti (ETK) onay yönetimi ve müşterilere SMS bilgilendirmesi yapılması.
- **Alt Bileşenler:**
  1. `CustomerAPI`: .NET 8 Web API. Müşteri oluşturma, arama, lokasyon ve SMS sağlayıcı entegrasyonu.
  2. `CustomerAPI.Gateway`: API Gateway katmanı.
  3. `customer-sms-sender`: React SPA. SMS gönderim ve kampanya arayüzü.
  4. `gallery-crystal`: React SPA. Mağaza müşteri kayıt ekranı.
- **Veritabanı:** SQL Server (Müşteri tabloları ve Nebim cari eşleştirmeleri).
- **Entegrasyonlar:** NetGSM, İletim Merkezi, Vatan SMS, Lokasyon API.
- **Teknolojiler:** .NET 8, Entity Framework Core, React, TypeScript, Vite/CRA.
- **Olası Çalışma URL'leri (Doğrulama Bekliyor):**
  - Customer API: `https://localhost:7001`
  - Gallery Crystal Client: `http://localhost:3001`
  - SMS Gönderici Client: `http://localhost:3000`
  - Prod API Endpoint Reference: `https://cfamilyapi.gallerycrystal.com.tr` (gallery-crystal build scriptinde tespit edildi; canlı doğrulaması bekliyor).

---

## 4. Fissler Servis Destek Sistemi (`FISSLERSERVIS`)

- **Projenin Gerçek Amacı:** Gallery Crystal / PSL bünyesindeki yetkili bayilerin Nebim V3 ERP sistemine doğrudan servis destek talebi açmasını ve talep durumlarını takip etmesini sağlamak.
- **Uygulama Türü:** ASP.NET Core MVC Web + Backend Web API.
- **Veritabanı:** SQL Server (`ERPDatabase` / Nebim V3).
- **Entegrasyonlar:** Nebim V3 ERP, SMTP E-posta servisi, OTP SMS servisi.
- **Teknolojiler:** .NET 8, Dapper, JWT Token & Cookie Auth, BCrypt, Razor.
- **Hedef Kullanıcılar:** Yetkili Fissler bayileri ve servis operasyon ekibi.
- **Olası Çalışma URL'leri (Doğrulama Bekliyor):**
  - API Portu: `http://localhost:5050` / `5051`
  - Web Portu: IIS veya yerel ortamda belirlenen portlar.

---

## 5. Lokasyon / Taşıma Projesi (`project_Relocation`)

- **Projenin Gerçek Amacı:** Relocation Map - Kullanıcının hedef ülke, amaç ve tarihe göre kişiselleştirilmiş görev yol haritası oluşturmasını sağlayan proje.
- **Uygulama Türü:** Full-stack SPA (Backend API + React İstemci).
- **Veritabanı:** SQL Server (`RelocationMapDb`).
- **Teknolojiler:** ASP.NET Core 8 Web API, Entity Framework Core 8, JWT, React 19, Vite, Tailwind CSS 4, TanStack Query.
- **Olası Çalışma URL'leri (Doğrulama Bekliyor):**
  - API: `http://localhost:5114` / Swagger: `/swagger`
  - Web: `http://localhost:5173`

---

## 6. Diğer Projeler ve Altyapı Kayıtları

- **BT Destek Merkezi (`MvcBtDestekMerkeziServisi`):** PSL bilgi işlem birimine servis taleplerinin iletildiği iç portal.
- **B2B Platformu (`B2B_Project` / `B2B`):** Bayi ve kurumsal satış sipariş portalı.
- **Personel Platformu (`EmployeeAPI` / `employee-portal`):** İnsan kaynakları ve çalışan self-servis portalı.
- **Muhasebe Sistemi (`muhasebe_live`):** Canlı muhasebe otomasyon yayını.
- **`Default Web Site`:** Şirket iş projesi olarak kaydedilmemiştir; IIS varsayılan kök sitesidir.
- **`my_prayer_app`:** Şirket iş projesi olmadığı (kişisel proje olduğu) teyit edildiğinden Hub envanterine dahil edilmemiştir.
